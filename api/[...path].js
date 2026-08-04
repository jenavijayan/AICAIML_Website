import handler from './[[...path]].js';

// Vercel Functions reliably resolve [...path].js catch-all routes.
// Re-export the existing optional catch-all handler to preserve behavior.
export default handler;
