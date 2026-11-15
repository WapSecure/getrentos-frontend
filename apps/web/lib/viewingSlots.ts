import { format } from 'date-fns';

/** Viewings happen in daylight: the time picker offers 7:00 to 18:30. */
export const VIEWING_MIN_HOUR = 7;
export const VIEWING_MAX_HOUR = 19;

/** Today in the viewer's own calendar, so a viewing can never be booked for a day that has passed. */
export const viewingMinDate = () => format(new Date(), 'yyyy-MM-dd');
