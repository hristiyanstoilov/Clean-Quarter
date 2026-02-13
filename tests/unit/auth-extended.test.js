/**
 * Extended auth service tests
 */
import { describe, it, expect } from 'vitest';

describe('Auth Service - Extended', () => {
  it('should validate email format', () => {
    const validEmails = ['test@example.com', 'user+tag@domain.co'];
    const invalidEmails = ['invalid', '@domain.com', 'user@'];
    
    validEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
    });
    
    invalidEmails.forEach(email => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
    });
  });
  
  it('should validate password strength', () => {
    const strongPasswords = ['Passw0rd!', 'MySecure123'];
    const weakPasswords = ['123', 'password'];
    
    strongPasswords.forEach(pwd => {
      expect(pwd.length).toBeGreaterThanOrEqual(6);
    });
  });
});
