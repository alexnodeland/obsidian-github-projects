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
