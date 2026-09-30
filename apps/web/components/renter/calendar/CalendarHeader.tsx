'use client';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { format } from 'date-fns';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface CalendarHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  viewMode: 'month' | 'week' | 'day';
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  onAddEvent: () => void;
}

export const CalendarHeader = ({
  currentDate,
  setCurrentDate,
  viewMode,
  setViewMode,
  onAddEvent,
}: CalendarHeaderProps) => {
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
      }
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <RenterPageHeader
      eyebrow="Schedule"
      icon={CalendarIcon}
      title="Calendar"
      description="Keep viewings, payments, inspections, and household events in one reliable schedule."
      actions={
        <Button variant="primary" className="gap-2" size="sm" onClick={onAddEvent}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add event
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-background/70 p-2.5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)} className="p-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold text-foreground min-w-[150px] text-center">
            {getTitle()}
          </span>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)} className="p-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>

        <div className="flex-1" />

        <div className="flex gap-1 rounded-xl bg-secondary p-1" aria-label="Calendar view">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('month')}
            className={`p-1.5 ${viewMode === 'month' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('week')}
            className={`p-1.5 ${viewMode === 'week' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('day')}
            className={`p-1.5 ${viewMode === 'day' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}
          >
            <CalendarIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </RenterPageHeader>
  );
};
