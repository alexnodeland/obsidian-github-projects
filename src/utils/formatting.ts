/**
 * Formatting utilities for dates, text, etc.
 */

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return d.toLocaleDateString();
    }
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Extract first line from text
 */
export function getFirstLine(text: string): string {
    return text.split('\n')[0];
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
    return num.toLocaleString();
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) {
        // Single word - take first two characters
        return name.substring(0, 2).toUpperCase();
    }
    // Multiple words - take first character of first two words
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Format relative time (e.g., "2 hours ago", "5 minutes ago")
 */
export function formatRelativeTime(date: Date | string | null): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
        return 'just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks}w ago`;
    } else if (diffMonths < 12) {
        return `${diffMonths}mo ago`;
    } else {
        return `${diffYears}y ago`;
    }
}
