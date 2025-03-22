import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { getCalendarDays, getPrevMonth, getNextMonth } from '@/lib/date-utils';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@shared/schema';

export function useCalendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
  // Fetch calendar events
  const { data: events = [], isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch settings
  const { data: settings } = useQuery<{
    id: number;
    defaultView: 'month' | 'week' | 'day';
    defaultCategory: number;
  }>({
    queryKey: ['/api/settings'],
  });
  
  // Set view based on settings
  useEffect(() => {
    if (settings?.defaultView) {
      setView(settings.defaultView);
    }
  }, [settings]);
  
  // Update calendar days when current date changes
  useEffect(() => {
    setCalendarDays(getCalendarDays(currentDate));
  }, [currentDate]);
  
  // Settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const res = await apiRequest('PUT', '/api/settings', settingsData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error) => {
      console.error("Failed to update settings:", error);
    }
  });
  
  // Event mutations
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }: { id: number, eventData: any }) => {
      // Format dates properly
      const formattedData = {
        ...eventData,
        startDate: eventData.startDate instanceof Date ? eventData.startDate : 
                   (eventData.startDate ? new Date(eventData.startDate) : new Date()),
        endDate: eventData.endDate instanceof Date ? eventData.endDate : 
                 (eventData.endDate ? new Date(eventData.endDate) : new Date(new Date().getTime() + 60 * 60 * 1000)),
        dueDate: eventData.dueDate ? 
                 (eventData.dueDate instanceof Date ? eventData.dueDate : new Date(eventData.dueDate)) : 
                 undefined
      };
      const res = await apiRequest('PUT', `/api/events/${id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event updated",
        description: "The event has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/events/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Calendar navigation functions
  const prevMonth = () => {
    setCurrentDate(getPrevMonth(currentDate));
  };
  
  const nextMonth = () => {
    setCurrentDate(getNextMonth(currentDate));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Change view
  const changeView = (newView: 'month' | 'week' | 'day') => {
    setView(newView);
    // Save the view preference in settings
    updateSettingsMutation.mutate({
      defaultView: newView
    });
  };

  // Get events for a specific date
  const getEventsForDate = (dateString: string) => {
    return (events as Event[]).filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventStartDate = new Date(
        eventStart.getFullYear(), 
        eventStart.getMonth(), 
        eventStart.getDate()
      ).toISOString().split('T')[0];
      
      return eventStartDate === dateString && event.type === 'fixed';
    });
  };
  
  return {
    currentDate,
    calendarDays,
    events,
    isLoadingEvents,
    settings,
    view,
    prevMonth,
    nextMonth,
    goToToday,
    changeView,
    getEventsForDate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
  };
}
