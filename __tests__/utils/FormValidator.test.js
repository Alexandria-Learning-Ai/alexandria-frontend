import FormValidator from '../../utils/FormValidator';

describe('FormValidator', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co',
        'test+label@example.org',
      ];

      validEmails.forEach(email => {
        expect(FormValidator.validateEmail(email)).toBe(true);
      });
    });

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test @example.com',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        expect(FormValidator.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('validates passwords meeting minimum requirements', () => {
      const validPasswords = [
        'password123',
        'MyP@ssw0rd!',
        'SuperSecure2023',
      ];

      validPasswords.forEach(password => {
        expect(FormValidator.validatePassword(password).isValid).toBe(true);
      });
    });

    it('rejects passwords that are too short', () => {
      const shortPasswords = ['pass', '12345', 'abc'];

      shortPasswords.forEach(password => {
        const result = FormValidator.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters');
      });
    });

    it('provides helpful error messages', () => {
      const result = FormValidator.validatePassword('pass');

      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      expect(FormValidator.validateRequired('some text')).toBe(true);
      expect(FormValidator.validateRequired('123')).toBe(true);
      expect(FormValidator.validateRequired('   text   ')).toBe(true);
    });

    it('rejects empty or null values', () => {
      expect(FormValidator.validateRequired('')).toBe(false);
      expect(FormValidator.validateRequired('   ')).toBe(false);
      expect(FormValidator.validateRequired(null)).toBe(false);
      expect(FormValidator.validateRequired(undefined)).toBe(false);
    });
  });
});
