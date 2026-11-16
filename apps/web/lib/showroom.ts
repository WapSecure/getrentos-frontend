// SHOWROOM_ENABLED=off is a kill switch back to the old page; read per render, so no rebuild.
export const showroomEnabled = () => process.env.SHOWROOM_ENABLED !== 'off';
