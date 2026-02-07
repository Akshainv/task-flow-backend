/**
 * Global Error Handler Middleware
 * Catches all errors and formats a professional response
 */
export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error to console for the developer
    console.error('ERROR 💥:', {
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method
    });

    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        // Only show stack trace in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
