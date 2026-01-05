import API_BASE from "../config";

/**
 * Resolves the correct image URL based on whether it is a local path or a full URL.
 * @param {string} path - The image path from the backend.
 * @returns {string} - The fully qualified image URL.
 */
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
        return path;
    }
    // Handle double slashes if path already has leading slash and API_BASE ends with one (though config says no trailing slash usually)
    // API_BASE is usually "http://localhost:8000"
    // Path usually "/uploads/..."

    // Clean path to ensure one slash
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${API_BASE}${cleanPath}`;
};
