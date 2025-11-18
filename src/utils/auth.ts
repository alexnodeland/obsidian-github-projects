/**
 * Token management utilities for GitHub authentication
 */

export class TokenManager {
    private readonly TOKEN_KEY = 'github-projects-token';

    /**
     * Get the stored GitHub token from localStorage
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Store a GitHub token in localStorage
     */
    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    /**
     * Remove the stored token
     */
    clearToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    /**
     * Check if a token exists
     */
    hasToken(): boolean {
        return this.getToken() !== null;
    }

    /**
     * Validate token format (basic check)
     */
    isValidTokenFormat(token: string): boolean {
        // GitHub personal access tokens start with ghp_, gho_, ghu_, or ghs_
        // Fine-grained tokens start with github_pat_
        const patterns = [
            /^ghp_[a-zA-Z0-9]{36}$/,  // Classic PAT
            /^gho_[a-zA-Z0-9]{36}$/,  // OAuth token
            /^ghu_[a-zA-Z0-9]{36}$/,  // User token
            /^ghs_[a-zA-Z0-9]{36}$/,  // Server token
            /^github_pat_[a-zA-Z0-9_]+$/  // Fine-grained PAT
        ];

        return patterns.some(pattern => pattern.test(token));
    }
}
