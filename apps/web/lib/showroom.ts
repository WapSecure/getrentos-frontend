// On for everyone (product decision 2026-11-10). SHOWROOM_ENABLED=off brings back the old page
// without a rebuild, as a kill switch; read per render on the server.
export const showroomEnabled = () => process.env.SHOWROOM_ENABLED !== 'off';
