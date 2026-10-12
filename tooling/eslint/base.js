// The shared config plus a console rule for library code: warn on stray logs,
// keep warn/error for real diagnostics.
module.exports = [
  ...require('./index'),
  { rules: { 'no-console': ['warn', { allow: ['warn', 'error'] }] } },
];
