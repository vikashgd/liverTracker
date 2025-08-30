import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateResetToken,
  validateResetToken,
  createPasswordResetRequest,
  verifyResetToken,
  cleanupExpiredTokens,
  RESET_TOKEN_EXPIRY
} from '../password-reset-utils';

// Mock the database
const mockPrisma = {
  passwordReset: {
    create: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn()
  }
};

vi.mock('../db', () => ({
  prisma: mockPrisma
}));

describe('Password Reset Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateResetToken', () => {
    it('should generate a valid reset token', () => {
      const token = generateResetToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
      expect(token).toMatch(/^[a-f0-9]+$/); // Should be hex string
    });

    it('should generate different tokens each time', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens of consistent length', () => {
      const tokens = Array.from({ length: 10 }, () => generateResetToken());
      const lengths = tokens.map(token => token.length);
      
      expect(new Set(lengths).size).toBe(1); // All tokens should have same length
    });
  });

  describe('validateResetToken', () => {
    it('should validate token format correctly', () => {
      const validToken = generateResetToken();
      const isValid = validateResetToken(validToken);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid token formats', () => {
      const invalidTokens = [
        '',
        'short',
        'invalid-characters!',
        'UPPERCASE',
        '123',
        null,
        undefined
      ];

      invalidTokens.forEach(token => {
        expect(validateResetToken(token as any)).toBe(false);
      });
    });

    it('should reject tokens that are too short', () => {
      const shortToken = 'abc123';
      const isValid = validateResetToken(shortToken);
      
      expect(isValid).toBe(false);
    });

    it('should reject tokens that are too long', () => {
      const longToken = 'a'.repeat(200);
      const isValid = validateResetToken(longToken);
      
      expect(isValid).toBe(false);
    });
  });

  describe('createPasswordResetRequest', () => {
    const mockUserId = 'user-123';
    const mockEmail = 'test@example.com';

    beforeEach(() => {
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockResolvedValue({
        id: 'reset-123',
        userId: mockUserId,
        token: 'mock-token',
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY),
        createdAt: new Date()
      });
    });

    it('should create password reset request successfully', async () => {
      const result = await createPasswordResetRequest(mockUserId, mockEmail);
      
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      
      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId }
      });
      
      expect(mockPrisma.passwordReset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          token: expect.any(String),
          expiresAt: expect.any(Date)
        })
      });
    });

    it('should clean up existing reset requests before creating new one', async () => {
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 2 });
      
      await createPasswordResetRequest(mockUserId, mockEmail);
      
      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId }
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.passwordReset.create.mockRejectedValue(new Error('Database error'));
      
      await expect(createPasswordResetRequest(mockUserId, mockEmail))
        .rejects.toThrow('Database error');
    });

    it('should set correct expiration time', async () => {
      const beforeCreate = Date.now();
      const result = await createPasswordResetRequest(mockUserId, mockEmail);
      const afterCreate = Date.now();
      
      const expectedMinExpiry = beforeCreate + RESET_TOKEN_EXPIRY;
      const expectedMaxExpiry = afterCreate + RESET_TOKEN_EXPIRY;
      
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry);
    });
  });

  describe('verifyResetToken', () => {
    const mockToken = 'valid-reset-token';
    const mockUserId = 'user-123';

    it('should verify valid non-expired token', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      
      mockPrisma.passwordReset.findFirst.mockResolvedValue({
        id: 'reset-123',
        userId: mockUserId,
        token: mockToken,
        expiresAt: futureDate,
        createdAt: new Date()
      });

      const result = await verifyResetToken(mockToken);
      
      expect(result).toBeDefined();
      expect(result?.userId).toBe(mockUserId);
      expect(result?.token).toBe(mockToken);
      
      expect(mockPrisma.passwordReset.findFirst).toHaveBeenCalledWith({
        where: { token: mockToken }
      });
    });

    it('should reject expired token', async () => {
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago
      
      mockPrisma.passwordReset.findFirst.mockResolvedValue({
        id: 'reset-123',
        userId: mockUserId,
        token: mockToken,
        expiresAt: pastDate,
        createdAt: new Date()
      });

      const result = await verifyResetToken(mockToken);
      
      expect(result).toBeNull();
    });

    it('should reject non-existent token', async () => {
      mockPrisma.passwordReset.findFirst.mockResolvedValue(null);

      const result = await verifyResetToken('non-existent-token');
      
      expect(result).toBeNull();
    });

    it('should handle invalid token format', async () => {
      const result = await verifyResetToken('invalid-format!');
      
      expect(result).toBeNull();
      expect(mockPrisma.passwordReset.findFirst).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrisma.passwordReset.findFirst.mockRejectedValue(new Error('Database error'));
      
      await expect(verifyResetToken(mockToken)).rejects.toThrow('Database error');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 5 });
      
      const result = await cleanupExpiredTokens();
      
      expect(result).toBe(5);
      expect(mockPrisma.passwordReset.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      });
    });

    it('should handle no expired tokens', async () => {
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      
      const result = await cleanupExpiredTokens();
      
      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      mockPrisma.passwordReset.deleteMany.mockRejectedValue(new Error('Database error'));
      
      await expect(cleanupExpiredTokens()).rejects.toThrow('Database error');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full password reset flow', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      
      // Mock successful creation
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockResolvedValue({
        id: 'reset-123',
        userId,
        token: 'created-token',
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY),
        createdAt: new Date()
      });
      
      // Create reset request
      const resetRequest = await createPasswordResetRequest(userId, email);
      expect(resetRequest.token).toBeDefined();
      
      // Mock successful verification
      mockPrisma.passwordReset.findFirst.mockResolvedValue({
        id: 'reset-123',
        userId,
        token: resetRequest.token,
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY),
        createdAt: new Date()
      });
      
      // Verify the token
      const verification = await verifyResetToken(resetRequest.token);
      expect(verification).toBeDefined();
      expect(verification?.userId).toBe(userId);
    });

    it('should handle token expiry correctly', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      
      // Create token that will be expired
      const expiredDate = new Date(Date.now() - 1000);
      
      mockPrisma.passwordReset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordReset.create.mockResolvedValue({
        id: 'reset-123',
        userId,
        token: 'expired-token',
        expiresAt: expiredDate,
        createdAt: new Date()
      });
      
      const resetRequest = await createPasswordResetRequest(userId, email);
      
      // Mock finding expired token
      mockPrisma.passwordReset.findFirst.mockResolvedValue({
        id: 'reset-123',
        userId,
        token: resetRequest.token,
        expiresAt: expiredDate,
        createdAt: new Date()
      });
      
      const verification = await verifyResetToken(resetRequest.token);
      expect(verification).toBeNull();
    });
  });

  describe('Constants and Configuration', () => {
    it('should have reasonable token expiry time', () => {
      expect(RESET_TOKEN_EXPIRY).toBeGreaterThan(0);
      expect(RESET_TOKEN_EXPIRY).toBeLessThanOrEqual(24 * 60 * 60 * 1000); // Max 24 hours
      expect(RESET_TOKEN_EXPIRY).toBeGreaterThanOrEqual(15 * 60 * 1000); // Min 15 minutes
    });
  });

  describe('Security Tests', () => {
    it('should generate cryptographically secure tokens', () => {
      const tokens = Array.from({ length: 100 }, () => generateResetToken());
      
      // Check for uniqueness (very high probability with crypto random)
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
      
      // Check for proper entropy (no obvious patterns)
      tokens.forEach(token => {
        expect(token).not.toMatch(/^(.)\1+$/); // Not all same character
        expect(token).not.toMatch(/^(..)\1+$/); // Not repeating pairs
      });
    });

    it('should not accept tokens with SQL injection attempts', () => {
      const maliciousTokens = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
        "' UNION SELECT * FROM users --"
      ];

      maliciousTokens.forEach(token => {
        expect(validateResetToken(token)).toBe(false);
      });
    });
  });
});