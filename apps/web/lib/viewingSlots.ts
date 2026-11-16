import { format } from 'date-fns';

export const VIEWING_MIN_HOUR = 7;
export const VIEWING_MAX_HOUR = 19;

export const viewingMinDate = () => format(new Date(), 'yyyy-MM-dd');
