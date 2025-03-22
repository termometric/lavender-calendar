import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useEvents() {
  const { toast } = useToast();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  
  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Create new event
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      // Convert string dates to Date objects if they aren't already
      const formattedData = {
        ...eventData,
        startDate: eventData.startDate instanceof Date ? eventData.startDate : new Date(eventData.startDate),
        endDate: eventData.endDate instanceof Date ? eventData.endDate : new Date(eventData.endDate),
        dueDate: eventData.dueDate ? (eventData.dueDate instanceof Date ? eventData.dueDate : new Date(eventData.dueDate)) : undefined
      };
      const res = await apiRequest('POST', '/api/events', formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsEventModalOpen(false);
      setCurrentEvent(null);
      toast({
        title: "Event created",
        description: "Your event has been added to the calendar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Process screenshot
  const processScreenshotMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/ai/process-screenshot', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to process screenshot');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentEvent(data);
      setIsScreenshotModalOpen(false);
      setIsEventModalOpen(true);
      toast({
        title: "Screenshot processed",
        description: "Event details extracted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to process screenshot",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Open event modal
  const openEventModal = (event: any = null) => {
    setCurrentEvent(event);
    setIsEventModalOpen(true);
  };
  
  // Close event modal
  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setCurrentEvent(null);
  };
  
  // Open screenshot modal
  const openScreenshotModal = () => {
    setIsScreenshotModalOpen(true);
  };
  
  // Close screenshot modal
  const closeScreenshotModal = () => {
    setIsScreenshotModalOpen(false);
  };
  
  return {
    categories,
    isLoadingCategories,
    isEventModalOpen,
    isScreenshotModalOpen,
    currentEvent,
    createEvent: createEventMutation.mutate,
    isPendingCreateEvent: createEventMutation.isPending,
    processScreenshot: processScreenshotMutation.mutate,
    isPendingProcessScreenshot: processScreenshotMutation.isPending,
    processedImageData: processScreenshotMutation.data,
    openEventModal,
    closeEventModal,
    openScreenshotModal,
    closeScreenshotModal,
  };
}
