/**
 * Medical Report Share Link Service
 * Handles secure creation, validation, and management of medical data sharing links
 */

import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { ShareType } from '../../generated/prisma/index';
import type {
  ShareLinkConfig,
  ShareLinkResult,
  ShareLinkValidation,
  ShareLinkData,
  AccessInfo
} from '../../types/medical-sharing';
import { ShareLinkError } from '../../types/medical-sharing';

export class ShareLinkService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly DEFAULT_EXPIRY_DAYS = 7;
  private static readonly MAX_EXPIRY_DAYS = 30;
  private static readonly SALT_ROUNDS = 12;

  /**
   * Generate a cryptographically secure token
   */
  private static generateSecureToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Hash a password for secure storage
   */
  private static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  private static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Calculate expiry date based on days from now
   */
  private static calculateExpiryDate(days: number): Date {
    const maxDays = Math.min(days, this.MAX_EXPIRY_DAYS);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + maxDays);
    return expiryDate;
  }

  /**
   * Generate a unique token that doesn't exist in the database
   */
  private static async generateUniqueToken(): Promise<string> {
    let token: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique token after maximum attempts');
      }
      
      token = this.generateSecureToken();
      
      const existing = await prisma.shareLink.findUnique({
        where: { token },
        select: { id: true }
      });
      
      if (!existing) {
        return token;
      }
      
      attempts++;
    } while (true);
  }

  /**
   * Create a new share link
   */
  static async createShareLink(userId: string, config: ShareLinkConfig): Promise<ShareLinkResult> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate unique token
      const token = await this.generateUniqueToken();

      // Calculate expiry date
      const expiryDays = Math.max(1, Math.min(config.expiryDays || this.DEFAULT_EXPIRY_DAYS, this.MAX_EXPIRY_DAYS));
      const expiresAt = this.calculateExpiryDate(expiryDays);

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (config.password) {
        hashedPassword = await this.hashPassword(config.password);
      }

      // Create share link in database
      const shareLink = await prisma.shareLink.create({
        data: {
          token,
          userId,
          shareType: config.shareType,
          title: config.title,
          description: config.description,
          reportIds: config.reportIds || [],
          includeProfile: config.includeProfile,
          includeDashboard: config.includeDashboard,
          includeScoring: config.includeScoring,
          includeAI: config.includeAI,
          includeFiles: config.includeFiles,
          expiresAt,
          maxViews: config.maxViews,
          password: hashedPassword,
          allowedEmails: config.allowedEmails || [],
        }
      });

      // Generate full URL - check for port 8080 first, then fallback to NEXTAUTH_URL
      const baseUrl = process.env.NEXTAUTH_URL?.includes('8080') 
        ? process.env.NEXTAUTH_URL 
        : process.env.NEXTAUTH_URL?.replace(':3000', ':8080') || 'http://localhost:8080';
      const shareUrl = `${baseUrl}/share/${token}`;

      return {
        id: shareLink.id,
        token: shareLink.token,
        url: shareUrl,
        expiresAt: shareLink.expiresAt,
      };

    } catch (error) {
      console.error('Error creating share link:', error);
      throw new Error('Failed to create share link');
    }
  }

  /**
   * Validate access to a share link
   */
  static async validateAccess(token: string, password?: string, email?: string): Promise<ShareLinkValidation> {
    try {
      // Find share link
      const shareLink = await prisma.shareLink.findUnique({
        where: { token },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      });

      if (!shareLink) {
        return {
          isValid: false,
          error: ShareLinkError.LINK_NOT_FOUND
        };
      }

      // Check if link is active
      if (!shareLink.isActive) {
        return {
          isValid: false,
          error: ShareLinkError.LINK_REVOKED
        };
      }

      // Check expiry
      if (new Date() > shareLink.expiresAt) {
        return {
          isValid: false,
          error: ShareLinkError.LINK_EXPIRED
        };
      }

      // Check view limit
      if (shareLink.maxViews && shareLink.currentViews >= shareLink.maxViews) {
        return {
          isValid: false,
          error: ShareLinkError.MAX_VIEWS_EXCEEDED
        };
      }

      // Check password if required
      if (shareLink.password) {
        if (!password) {
          return {
            isValid: false,
            requiresPassword: true
          };
        }

        const isPasswordValid = await this.verifyPassword(password, shareLink.password);
        if (!isPasswordValid) {
          return {
            isValid: false,
            error: ShareLinkError.INVALID_PASSWORD
          };
        }
      }

      // Check email restrictions
      if (shareLink.allowedEmails.length > 0 && email) {
        const isEmailAllowed = shareLink.allowedEmails.some(
          allowedEmail => allowedEmail.toLowerCase() === email.toLowerCase()
        );
        
        if (!isEmailAllowed) {
          return {
            isValid: false,
            error: ShareLinkError.EMAIL_NOT_AUTHORIZED
          };
        }
      }

      // Convert to ShareLinkData format
      const shareLinkData: ShareLinkData = {
        id: shareLink.id,
        token: shareLink.token,
        userId: shareLink.userId,
        shareType: shareLink.shareType,
        title: shareLink.title,
        description: shareLink.description ?? undefined,
        reportIds: shareLink.reportIds,
        includeProfile: shareLink.includeProfile,
        includeDashboard: shareLink.includeDashboard,
        includeScoring: shareLink.includeScoring,
        includeAI: shareLink.includeAI,
        includeFiles: shareLink.includeFiles,
        expiresAt: shareLink.expiresAt,
        maxViews: shareLink.maxViews ?? undefined,
        currentViews: shareLink.currentViews,
        allowedEmails: shareLink.allowedEmails ?? undefined,
        isActive: shareLink.isActive,
        createdAt: shareLink.createdAt,
        lastAccessedAt: shareLink.lastAccessedAt ?? undefined,
      };

      return {
        isValid: true,
        shareLink: shareLinkData
      };

    } catch (error) {
      console.error('Error validating share link access:', error);
      return {
        isValid: false,
        error: ShareLinkError.DATA_NOT_AVAILABLE
      };
    }
  }

  /**
   * Log access to a share link
   */
  static async logAccess(token: string, accessInfo: AccessInfo): Promise<void> {
    try {
      const shareLink = await prisma.shareLink.findUnique({
        where: { token },
        select: { id: true }
      });

      if (!shareLink) {
        throw new Error('Share link not found');
      }

      // Create access log
      await prisma.shareAccess.create({
        data: {
          shareLinkId: shareLink.id,
          ipAddress: accessInfo.ipAddress,
          userAgent: accessInfo.userAgent,
          accessedAt: accessInfo.timestamp,
          actionsPerformed: accessInfo.actionsPerformed || {}
        }
      });

      // Update share link with current access info
      await prisma.shareLink.update({
        where: { token },
        data: {
          currentViews: { increment: 1 },
          lastAccessedAt: accessInfo.timestamp
        }
      });

    } catch (error) {
      console.error('Error logging share link access:', error);
      // Don't throw error here as access logging shouldn't block the main flow
    }
  }

  /**
   * Get all share links for a user
   */
  static async getUserShareLinks(userId: string): Promise<ShareLinkData[]> {
    try {
      const shareLinks = await prisma.shareLink.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { accessLogs: true }
          }
        }
      });

      // Generate base URL - check for port 8080 first, then fallback to NEXTAUTH_URL
      const baseUrl = process.env.NEXTAUTH_URL?.includes('8080') 
        ? process.env.NEXTAUTH_URL 
        : process.env.NEXTAUTH_URL?.replace(':3000', ':8080') || 'http://localhost:8080';

      return shareLinks.map(shareLink => ({
        id: shareLink.id,
        token: shareLink.token,
        url: `${baseUrl}/share/${shareLink.token}`, // Add the full URL
        userId: shareLink.userId,
        shareType: shareLink.shareType,
        title: shareLink.title,
        description: shareLink.description ?? undefined,
        reportIds: shareLink.reportIds,
        includeProfile: shareLink.includeProfile,
        includeDashboard: shareLink.includeDashboard,
        includeScoring: shareLink.includeScoring,
        includeAI: shareLink.includeAI,
        includeFiles: shareLink.includeFiles,
        expiresAt: shareLink.expiresAt,
        maxViews: shareLink.maxViews ?? undefined,
        currentViews: shareLink.currentViews,
        allowedEmails: shareLink.allowedEmails ?? undefined,
        isActive: shareLink.isActive,
        createdAt: shareLink.createdAt,
        lastAccessedAt: shareLink.lastAccessedAt ?? undefined,
      }));

    } catch (error) {
      console.error('Error getting user share links:', error);
      throw new Error('Failed to retrieve share links');
    }
  }

  /**
   * Revoke a share link
   */
  static async revokeShareLink(userId: string, linkId: string): Promise<void> {
    try {
      const shareLink = await prisma.shareLink.findFirst({
        where: { 
          id: linkId,
          userId 
        },
        select: { id: true }
      });

      if (!shareLink) {
        throw new Error('Share link not found or access denied');
      }

      await prisma.shareLink.update({
        where: { id: linkId },
        data: { isActive: false }
      });

    } catch (error) {
      console.error('Error revoking share link:', error);
      throw new Error('Failed to revoke share link');
    }
  }

  /**
   * Extend expiry of a share link
   */
  static async extendExpiry(userId: string, linkId: string, additionalDays: number): Promise<void> {
    try {
      const shareLink = await prisma.shareLink.findFirst({
        where: { 
          id: linkId,
          userId 
        },
        select: { id: true, expiresAt: true }
      });

      if (!shareLink) {
        throw new Error('Share link not found or access denied');
      }

      // Calculate new expiry date
      const currentExpiry = shareLink.expiresAt;
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + Math.min(additionalDays, this.MAX_EXPIRY_DAYS));

      await prisma.shareLink.update({
        where: { id: linkId },
        data: { expiresAt: newExpiry }
      });

    } catch (error) {
      console.error('Error extending share link expiry:', error);
      throw new Error('Failed to extend share link expiry');
    }
  }

  /**
   * Get access logs for a share link
   */
  static async getAccessLogs(userId: string, linkId: string) {
    try {
      const shareLink = await prisma.shareLink.findFirst({
        where: { 
          id: linkId,
          userId 
        },
        select: { id: true }
      });

      if (!shareLink) {
        throw new Error('Share link not found or access denied');
      }

      const accessLogs = await prisma.shareAccess.findMany({
        where: { shareLinkId: linkId },
        orderBy: { accessedAt: 'desc' },
        take: 100 // Limit to last 100 access logs
      });

      return accessLogs;

    } catch (error) {
      console.error('Error getting access logs:', error);
      throw new Error('Failed to retrieve access logs');
    }
  }

  /**
   * Clean up expired share links (for maintenance)
   */
  static async cleanupExpiredLinks(): Promise<number> {
    try {
      const result = await prisma.shareLink.updateMany({
        where: {
          expiresAt: { lt: new Date() },
          isActive: true
        },
        data: { isActive: false }
      });

      return result.count;

    } catch (error) {
      console.error('Error cleaning up expired links:', error);
      return 0;
    }
  }
}

// Export utility functions for use in API routes
export const {
  createShareLink,
  validateAccess,
  logAccess,
  getUserShareLinks,
  revokeShareLink,
  extendExpiry,
  getAccessLogs,
  cleanupExpiredLinks
} = ShareLinkService;