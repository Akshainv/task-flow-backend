/**
 * Pagination Utility
 * Reusable helper for adding pagination to MongoDB queries
 */

/**
 * Parse pagination params from request query
 * @param {Object} query - req.query object
 * @returns {Object} { page, limit, skip }
 */
export const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    // Set default limit to 10 as requested for standard pagination
    const limit = Math.min(1000, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Create pagination response object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total items in collection
 * @returns {Object} Pagination metadata
 */
export const getPaginationMeta = (page, limit, totalCount) => {
    return {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
    };
};
