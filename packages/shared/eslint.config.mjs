import config from '@getrentos/eslint-config/base.js';

// No React in this package; name a version so the React rules don't go looking.
export default [...config, { settings: { react: { version: '19.2' } } }];
