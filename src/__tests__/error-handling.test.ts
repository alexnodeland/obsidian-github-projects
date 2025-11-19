import {
    GitHubError,
    NetworkError,
    AuthenticationError,
    displayError,
    withRetry
} from '../utils/error-handling';
import { Notice } from 'obsidian';

// Mock Obsidian Notice
jest.mock('obsidian', () => ({
    Notice: jest.fn()
}));

describe('GitHubError', () => {
    it('should create a GitHubError with message', () => {
        const error = new GitHubError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('GitHubError');
        expect(error.statusCode).toBeUndefined();
    });

    it('should create a GitHubError with status code', () => {
        const error = new GitHubError('Test error', 404);
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('GitHubError');
        expect(error.statusCode).toBe(404);
    });

    it('should be an instance of Error', () => {
        const error = new GitHubError('Test error');
        expect(error instanceof Error).toBe(true);
    });
});

describe('NetworkError', () => {
    it('should create a NetworkError with message', () => {
        const error = new NetworkError('Network failed');
        expect(error.message).toBe('Network failed');
        expect(error.name).toBe('NetworkError');
    });

    it('should be an instance of Error', () => {
        const error = new NetworkError('Network failed');
        expect(error instanceof Error).toBe(true);
    });
});

describe('AuthenticationError', () => {
    it('should create an AuthenticationError with message', () => {
        const error = new AuthenticationError('Auth failed');
        expect(error.message).toBe('Auth failed');
        expect(error.name).toBe('AuthenticationError');
    });

    it('should be an instance of Error', () => {
        const error = new AuthenticationError('Auth failed');
        expect(error instanceof Error).toBe(true);
    });
});

describe('displayError', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should display AuthenticationError with appropriate message', () => {
        const error = new AuthenticationError('Test auth error');
        displayError(error);

        expect(Notice).toHaveBeenCalledWith(
            'Authentication failed. Please check your GitHub token.',
            5000
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });

    it('should display NetworkError with appropriate message', () => {
        const error = new NetworkError('Test network error');
        displayError(error);

        expect(Notice).toHaveBeenCalledWith(
            'Network error. Please check your connection.',
            5000
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });

    it('should display GitHubError with 401 status code', () => {
        const error = new GitHubError('Unauthorized', 401);
        displayError(error);

        expect(Notice).toHaveBeenCalledWith(
            'Invalid GitHub token. Please update your token in settings.',
            5000
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });

    it('should display GitHubError with 403 status code', () => {
        const error = new GitHubError('Forbidden', 403);
        displayError(error);

        expect(Notice).toHaveBeenCalledWith(
            'Rate limit exceeded or insufficient permissions.',
            5000
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });

    it('should display GitHubError with 404 status code', () => {
        const error = new GitHubError('Not found', 404);
        displayError(error);

        expect(Notice).toHaveBeenCalledWith(
            'Resource not found. Check your organization name, project number, and access permissions.',
            5000
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });

    it('should display GitHubError with custom message for other status codes', () => {
        const error = new GitHubError('Custom error message', 500);
        displayError(error);

        expect(Notice).toHaveBeenCalledWith('Custom error message', 5000);
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });

    it('should display GitHubError without status code', () => {
        const error = new GitHubError('Generic GitHub error');
        displayError(error);

        expect(Notice).toHaveBeenCalledWith('Generic GitHub error', 5000);
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });

    it('should display generic Error with its message', () => {
        const error = new Error('Generic error');
        displayError(error);

        expect(Notice).toHaveBeenCalledWith('Generic error', 5000);
        expect(consoleErrorSpy).toHaveBeenCalledWith('GitHub Projects Plugin Error:', error);
    });
});

describe('withRetry', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return result on first successful attempt', async () => {
        const fn = jest.fn().mockResolvedValue('success');
        const promise = withRetry(fn, 3, 1000);

        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('Fail 1'))
            .mockRejectedValueOnce(new Error('Fail 2'))
            .mockResolvedValueOnce('success');

        const promise = withRetry(fn, 3, 1000);

        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
        const error = new Error('Persistent failure');
        const fn = jest.fn().mockRejectedValue(error);

        const promise = withRetry(fn, 3, 1000);

        // Use promise.catch to avoid unhandled rejection warnings
        const resultPromise = promise.catch(e => e);

        await jest.runAllTimersAsync();

        const result = await resultPromise;
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Persistent failure');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry on AuthenticationError', async () => {
        const error = new AuthenticationError('Auth failed');
        const fn = jest.fn().mockRejectedValue(error);

        const promise = withRetry(fn, 3, 1000);

        // Use promise.catch to avoid unhandled rejection warnings
        const resultPromise = promise.catch(e => e);

        await jest.runAllTimersAsync();

        const result = await resultPromise;
        expect(result).toBeInstanceOf(AuthenticationError);
        expect(result.message).toBe('Auth failed');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff between retries', async () => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('Fail 1'))
            .mockRejectedValueOnce(new Error('Fail 2'))
            .mockResolvedValueOnce('success');

        const promise = withRetry(fn, 3, 1000);

        // First attempt
        expect(fn).toHaveBeenCalledTimes(1);

        // Advance timers by 1000ms (1000 * 2^0)
        await jest.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(2);

        // Advance timers by 2000ms (1000 * 2^1)
        await jest.advanceTimersByTimeAsync(2000);
        expect(fn).toHaveBeenCalledTimes(3);

        await jest.runAllTimersAsync();
        const result = await promise;
        expect(result).toBe('success');
    });

    it('should work with default parameters', async () => {
        const fn = jest.fn().mockResolvedValue('success');
        const promise = withRetry(fn);

        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle single retry', async () => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('Fail'))
            .mockResolvedValueOnce('success');

        const promise = withRetry(fn, 2, 500);

        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw the last error when all retries fail', async () => {
        const errors = [
            new Error('Error 1'),
            new Error('Error 2'),
            new Error('Error 3')
        ];
        let callCount = 0;
        const fn = jest.fn().mockImplementation(() => {
            return Promise.reject(errors[callCount++]);
        });

        const promise = withRetry(fn, 3, 100);

        // Use promise.catch to avoid unhandled rejection warnings
        const resultPromise = promise.catch(e => e);

        await jest.runAllTimersAsync();

        const result = await resultPromise;
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Error 3');
        expect(fn).toHaveBeenCalledTimes(3);
    });
});
