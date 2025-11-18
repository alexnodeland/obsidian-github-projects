import { Notice } from 'obsidian';

/**
 * Error handling utilities
 */

export class GitHubError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'GitHubError';
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Display a user-friendly error message
 */
export function displayError(error: Error): void {
    let message = 'An error occurred';

    if (error instanceof AuthenticationError) {
        message = 'Authentication failed. Please check your GitHub token.';
    } else if (error instanceof NetworkError) {
        message = 'Network error. Please check your connection.';
    } else if (error instanceof GitHubError) {
        if (error.statusCode === 401) {
            message = 'Invalid GitHub token. Please update your token in settings.';
        } else if (error.statusCode === 403) {
            message = 'Rate limit exceeded or insufficient permissions.';
        } else if (error.statusCode === 404) {
            message = 'Project not found. Check your organization and project number.';
        } else {
            message = error.message;
        }
    } else {
        message = error.message;
    }

    new Notice(message, 5000);
    console.error('GitHub Projects Plugin Error:', error);
}

/**
 * Handle errors with retry logic
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on authentication errors
            if (error instanceof AuthenticationError) {
                throw error;
            }

            if (i < maxRetries - 1) {
                await sleep(delayMs * Math.pow(2, i)); // Exponential backoff
            }
        }
    }

    throw lastError;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
