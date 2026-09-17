// Jest has no CSS transform configured (jest.config.cjs), and components
// now import their own .css files (Chat.css, Thinking.css, Flythrough.css,
// TravelOptions.css, ReducedMotionFallback.css) — Vite handles these
// natively, but Jest would otherwise try to parse CSS as JS and fail.
module.exports = {};
