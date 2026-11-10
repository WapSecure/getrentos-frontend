// Server-only and read per render, so the showroom can be switched on or off without a rebuild.
export const showroomEnabled = () => process.env.SHOWROOM_ENABLED === 'on';
