/** "under a minute", "12 min", "2 h 5 min": how long someone has been inside, for a guard scanning the list. */
export const formatStay = (from: string, now: number) => {
  const minutes = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60_000));
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};
