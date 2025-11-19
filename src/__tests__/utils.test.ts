import { TokenManager } from '../utils/auth';
import { formatDate, truncate, getInitials, getFirstLine, formatNumber, formatRelativeTime } from '../utils/formatting';

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

        it('should handle empty string', () => {
            expect(getInitials('')).toBe('');
        });

        it('should handle whitespace-only string', () => {
            expect(getInitials('   ')).toBe('');
        });
    });

    describe('getFirstLine', () => {
        it('should return first line from multiline text', () => {
            const text = 'First line\nSecond line\nThird line';
            expect(getFirstLine(text)).toBe('First line');
        });

        it('should return entire text if no newlines', () => {
            const text = 'Single line text';
            expect(getFirstLine(text)).toBe('Single line text');
        });

        it('should handle empty string', () => {
            expect(getFirstLine('')).toBe('');
        });

        it('should handle text starting with newline', () => {
            const text = '\nSecond line';
            expect(getFirstLine(text)).toBe('');
        });
    });

    describe('formatNumber', () => {
        it('should format numbers with thousand separators', () => {
            expect(formatNumber(1000)).toMatch(/1[,\s]000/);
            expect(formatNumber(1000000)).toMatch(/1[,\s]000[,\s]000/);
        });

        it('should handle small numbers', () => {
            expect(formatNumber(0)).toBe('0');
            expect(formatNumber(42)).toBe('42');
            expect(formatNumber(999)).toBe('999');
        });

        it('should handle negative numbers', () => {
            expect(formatNumber(-1000)).toMatch(/-1[,\s]000/);
        });
    });

    describe('formatRelativeTime', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return "just now" for recent times', () => {
            const now = new Date('2024-01-15T12:00:00Z');
            const recent = new Date('2024-01-15T11:59:30Z'); // 30 seconds ago
            expect(formatRelativeTime(recent)).toBe('just now');
        });

        it('should format minutes ago', () => {
            const minutesAgo = new Date('2024-01-15T11:30:00Z'); // 30 minutes ago
            expect(formatRelativeTime(minutesAgo)).toBe('30m ago');
        });

        it('should format hours ago', () => {
            const hoursAgo = new Date('2024-01-15T08:00:00Z'); // 4 hours ago
            expect(formatRelativeTime(hoursAgo)).toBe('4h ago');
        });

        it('should format days ago', () => {
            const daysAgo = new Date('2024-01-10T12:00:00Z'); // 5 days ago
            expect(formatRelativeTime(daysAgo)).toBe('5d ago');
        });

        it('should format weeks ago', () => {
            const weeksAgo = new Date('2024-01-01T12:00:00Z'); // 2 weeks ago
            expect(formatRelativeTime(weeksAgo)).toBe('2w ago');
        });

        it('should format months ago', () => {
            const monthsAgo = new Date('2023-11-15T12:00:00Z'); // 2 months ago
            expect(formatRelativeTime(monthsAgo)).toBe('2mo ago');
        });

        it('should format years ago', () => {
            const yearsAgo = new Date('2022-01-15T12:00:00Z'); // 2 years ago
            expect(formatRelativeTime(yearsAgo)).toBe('2y ago');
        });

        it('should handle null', () => {
            expect(formatRelativeTime(null)).toBe('');
        });

        it('should handle string dates', () => {
            const dateString = '2024-01-15T11:30:00Z'; // 30 minutes ago
            expect(formatRelativeTime(dateString)).toBe('30m ago');
        });

        it('should handle invalid dates', () => {
            expect(formatRelativeTime('invalid-date')).toBe('');
        });
    });
});
