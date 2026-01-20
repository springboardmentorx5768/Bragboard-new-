/**
 * Formats a date string or object into a human-readable "time ago" format.
 * @param {string|Date} date - The date to format.
 * @returns {string} - The formatted string (e.g., "just now", "5m ago", "2h ago").
 */
export const formatTimeAgo = (date) => {
    if (!date) return '';

    const now = new Date();
    let past = new Date(date);

    // If date is a string and doesn't have a timezone, assume UTC (common for Python/SQLAlchemy)
    if (typeof date === 'string' && !date.includes('Z') && !date.includes('+')) {
        past = new Date(date + 'Z');
    }

    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 0) return 'just now';
    if (diffInSeconds < 60) return 'just now';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return past.toLocaleDateString();
};

/**
 * Formats a date string or object into "hh:mm:ss am/pm" format.
 * @param {string|Date} date - The date to format.
 * @param {boolean} isLocal - Whether the date is already local (no need to append 'Z')
 * @returns {string} - The formatted string (e.g., "07:56:45 PM").
 */
export const formatRealTime = (date, isLocal = false) => {
    if (!date) return '';

    let d = new Date(date);
    if (!isLocal && typeof date === 'string' && !date.includes('Z') && !date.includes('+')) {
        d = new Date(date + 'Z');
    }

    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};
