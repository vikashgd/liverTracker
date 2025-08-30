import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateSecurePassword,
  checkPasswordHistory,
  PASSWORD_REQUIREMENTS
} from '../password-utils';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000) + 'A1!';
      const hash = await hashPassword(longPassword);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const hash = await hashPassword('TestPassword123!');
      const isValid = await verifyPassword('', hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle invalid hash format', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid-hash';
      
      await expect(verifyPassword(password, invalidHash)).rejects.toThrow();
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongPassword123!';
      const result = validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.level).toBe('strong');
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThanOrEqual(80);
    });

    it('should reject weak password', () => {
      const weakPassword = 'weak';
      const result = validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.level).toBe('weak');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(60);
    });

    it('should validate medium strength password', () => {
      const mediumPassword = 'MediumPass123';
      const result = validatePasswordStrength(mediumPassword);
      
      expect(result.level).toBe('medium');
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.score).toBeLessThan(80);
    });

    it('should check minimum length requirement', () => {
      const shortPassword = 'Aa1!';
      const result = validatePasswordStrength(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
    });

    it('should check uppercase requirement', () => {
      const noUppercase = 'lowercase123!';
      const result = validatePasswordStrength(noUppercase);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should check lowercase requirement', () => {
      const noLowercase = 'UPPERCASE123!';
      const result = validatePasswordStrength(noLowercase);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should check number requirement', () => {
      const noNumber = 'NoNumbersHere!';
      const result = validatePasswordStrength(noNumber);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should check special character requirement', () => {
      const noSpecial = 'NoSpecialChars123';
      const result = validatePasswordStrength(noSpecial);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should detect common passwords', () => {
      const commonPassword = 'Password123!';
      const result = validatePasswordStrength(commonPassword);
      
      expect(result.errors).toContain('Password is too common');
    });

    it('should detect sequential characters', () => {
      const sequentialPassword = 'Abcd1234!';
      const result = validatePasswordStrength(sequentialPassword);
      
      expect(result.errors).toContain('Password contains sequential characters');
    });

    it('should detect repeated characters', () => {
      const repeatedPassword = 'Aaaa1111!';
      const result = validatePasswordStrength(repeatedPassword);
      
      expect(result.errors).toContain('Password contains too many repeated characters');
    });

    it('should handle empty password', () => {
      const result = validatePasswordStrength('');
      
      expect(result.isValid).toBe(false);
      expect(result.level).toBe('weak');
      expect(result.score).toBe(0);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password with default length', () => {
      const password = generateSecurePassword();
      
      expect(password.length).toBe(16);
      expect(validatePasswordStrength(password).isValid).toBe(true);
    });

    it('should generate password with custom length', () => {
      const customLength = 20;
      const password = generateSecurePassword(customLength);
      
      expect(password.length).toBe(customLength);
      expect(validatePasswordStrength(password).isValid).toBe(true);
    });

    it('should generate password with custom options', () => {
      const options = {
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false
      };
      const password = generateSecurePassword(12, options);
      
      expect(password.length).toBe(12);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[!@#$%^&*(),.?":{}|<>]/.test(password)).toBe(false);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });

    it('should handle minimum length constraint', () => {
      const password = generateSecurePassword(4);
      
      expect(password.length).toBeGreaterThanOrEqual(8); // Should enforce minimum
    });
  });

  describe('checkPasswordHistory', () => {
    const mockPasswordHistory = [
      '$2b$12$hash1',
      '$2b$12$hash2',
      '$2b$12$hash3'
    ];

    it('should detect password reuse', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const historyWithCurrentPassword = [...mockPasswordHistory, hash];
      
      const isReused = await checkPasswordHistory(password, historyWithCurrentPassword);
      
      expect(isReused).toBe(true);
    });

    it('should allow new password', async () => {
      const newPassword = 'NewPassword123!';
      
      const isReused = await checkPasswordHistory(newPassword, mockPasswordHistory);
      
      expect(isReused).toBe(false);
    });

    it('should handle empty history', async () => {
      const password = 'TestPassword123!';
      
      const isReused = await checkPasswordHistory(password, []);
      
      expect(isReused).toBe(false);
    });

    it('should handle invalid hashes in history', async () => {
      const password = 'TestPassword123!';
      const invalidHistory = ['invalid-hash-1', 'invalid-hash-2'];
      
      // Should not throw error, just return false for invalid hashes
      const isReused = await checkPasswordHistory(password, invalidHistory);
      
      expect(isReused).toBe(false);
    });
  });

  describe('Password Requirements Constants', () => {
    it('should have valid password requirements', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBeGreaterThan(0);
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBeDefined();
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBeDefined();
      expect(PASSWORD_REQUIREMENTS.requireNumbers).toBeDefined();
      expect(PASSWORD_REQUIREMENTS.requireSpecialChars).toBeDefined();
      expect(PASSWORD_REQUIREMENTS.maxLength).toBeGreaterThan(PASSWORD_REQUIREMENTS.minLength);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      const unicodePassword = 'Pässwörd123!';
      const result = validatePasswordStrength(unicodePassword);
      
      expect(result.isValid).toBe(true);
    });

    it('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(100) + 'a1!';
      const result = validatePasswordStrength(longPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.level).toBe('strong');
    });

    it('should handle passwords with only special characters', () => {
      const specialOnlyPassword = '!@#$%^&*()';
      const result = validatePasswordStrength(specialOnlyPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });
});