import { TokenManager } from '../utils/auth';
import { formatDate, truncate, getInitials } from '../utils/formatting';

describe('TokenManager', () => {
    let tokenManager: TokenManager;

    beforeEach(() => {
        tokenManager = new TokenManager();
        localStorage.clear();
    });

    it('should store and retrieve token', () => {
        const token = 'ghp_test123456789';
        tokenManager.setToken(token);
        expect(tokenManager.getToken()).toBe(token);
    });

    it('should clear token', () => {
        tokenManager.setToken('ghp_test123456789');
        tokenManager.clearToken();
        expect(tokenManager.getToken()).toBeNull();
    });

    it('should check if token exists', () => {
        expect(tokenManager.hasToken()).toBe(false);
        tokenManager.setToken('ghp_test123456789');
        expect(tokenManager.hasToken()).toBe(true);
    });

    it('should validate token format', () => {
        expect(tokenManager.isValidTokenFormat('ghp_123456789012345678901234567890123456')).toBe(true); // 40 chars total
        expect(tokenManager.isValidTokenFormat('github_pat_test123')).toBe(true);
        expect(tokenManager.isValidTokenFormat('invalid')).toBe(false);
        expect(tokenManager.isValidTokenFormat('')).toBe(false);
    });
});

describe('Formatting utilities', () => {
    describe('formatDate', () => {
        it('should format today\'s date', () => {
            const today = new Date();
            expect(formatDate(today)).toBe('Today');
        });

        it('should format yesterday', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            expect(formatDate(yesterday)).toBe('Yesterday');
        });

        it('should format days ago', () => {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            expect(formatDate(threeDaysAgo)).toBe('3 days ago');
        });

        it('should format older dates', () => {
            const oldDate = new Date('2020-01-01');
            expect(formatDate(oldDate)).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
        });

        it('should handle null', () => {
            expect(formatDate(null)).toBe('');
        });

        it('should handle string dates', () => {
            const today = new Date().toISOString();
            expect(formatDate(today)).toBe('Today');
        });
    });

    describe('truncate', () => {
        it('should truncate long text', () => {
            const text = 'This is a very long text that should be truncated';
            expect(truncate(text, 20)).toBe('This is a very lo...');
        });

        it('should not truncate short text', () => {
            const text = 'Short';
            expect(truncate(text, 20)).toBe('Short');
        });

        it('should handle exact length', () => {
            const text = 'Exactly twenty chars';
            expect(truncate(text, 20)).toBe('Exactly twenty chars');
        });
    });

    describe('getInitials', () => {
        it('should get initials from name', () => {
            expect(getInitials('John Doe')).toBe('JD');
            expect(getInitials('Alice')).toBe('AL');
            expect(getInitials('Bob Smith Johnson')).toBe('BS');
        });
    });
});
