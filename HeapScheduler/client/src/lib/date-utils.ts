import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, parseISO, isValid, formatISO } from 'date-fns';

// Get days for a month view calendar
export function getCalendarDays(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map(day => ({
    date: day,
    isCurrentMonth: isSameMonth(day, monthStart),
    isToday: isToday(day),
    dateString: format(day, 'yyyy-MM-dd')
  }));
}

// Format date for display
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMMM d, yyyy');
}

// Format time for display
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'h:mm a');
}

// Format month and year for calendar header
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

// Get next month
export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

// Get previous month
export function getPrevMonth(date: Date): Date {
  return addMonths(date, -1);
}

// Parse string to date with validation
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const parsedDate = parseISO(dateString);
  return isValid(parsedDate) ? parsedDate : null;
}

// Format date to ISO string for API
export function toISOString(date: Date): string {
  return formatISO(date);
}

// Get color for event based on category
export function getEventColor(color: string | undefined): string {
  if (!color) return 'bg-accent border-accent';
  
  // Convert color to tailwind class name
  // This function assumes the color is a hex code like #6B4EFF
  // You could extend this to handle different color formats
  const colorMap: Record<string, string> = {
    '#6B4EFF': 'bg-accent/20 border-accent',
    '#EF4444': 'bg-red-500/20 border-red-500',
    '#10B981': 'bg-green-500/20 border-green-500', 
    '#FBBF24': 'bg-yellow-500/20 border-yellow-500',
    '#8B5CF6': 'bg-purple-500/20 border-purple-500',
    '#3B82F6': 'bg-blue-500/20 border-blue-500',
  };
  
  return colorMap[color] || 'bg-accent/20 border-accent';
}

// Calculate event duration in minutes
export function getEventDuration(startDate: Date, endDate: Date): number {
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60);
}
