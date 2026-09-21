/**
 * Empty stub module.
 *
 * Used by turbopack.resolveAlias in next.config.ts to satisfy Node-only
 * imports (like `fs`) that appear in browser-bundled third-party code
 * (e.g. @techstark/opencv-js).  The actual code paths that call `fs`
 * are guarded by runtime environment checks and never execute in the
 * browser — we just need the import to resolve without error.
 */
export default {}
