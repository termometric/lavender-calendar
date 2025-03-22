import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useHeap() {
  const { toast } = useToast();
  
  // Fetch heap events
  const { data: heapEvents = [], isLoading: isLoadingHeap } = useQuery<any[]>({
    queryKey: ['/api/heap'],
    staleTime: 60000, // 1 minute
  });
  
  // Create new heap task
  const createHeapTaskMutation = useMutation({
    mutationFn: async (eventData: any) => {
      // Make sure we have default dates for heap tasks
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      const data = {
        ...eventData,
        type: 'heap',
        // Set default dates if not provided
        startDate: eventData.startDate instanceof Date ? eventData.startDate : 
                  (eventData.startDate ? new Date(eventData.startDate) : now),
        endDate: eventData.endDate instanceof Date ? eventData.endDate : 
                (eventData.endDate ? new Date(eventData.endDate) : oneHourFromNow),
        dueDate: eventData.dueDate ? 
                (eventData.dueDate instanceof Date ? eventData.dueDate : new Date(eventData.dueDate)) : 
                undefined
      };
      const res = await apiRequest('POST', '/api/events', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/heap'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Task created",
        description: "Your task has been added to the heap.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update heap task
  const updateHeapTaskMutation = useMutation({
    mutationFn: async ({ id, taskData }: { id: number, taskData: any }) => {
      // Format dates properly
      const formattedData = {
        ...taskData,
        startDate: taskData.startDate instanceof Date ? taskData.startDate : 
                   (taskData.startDate ? new Date(taskData.startDate) : new Date()),
        endDate: taskData.endDate instanceof Date ? taskData.endDate : 
                 (taskData.endDate ? new Date(taskData.endDate) : new Date(new Date().getTime() + 60 * 60 * 1000)),
        dueDate: taskData.dueDate ? 
                 (taskData.dueDate instanceof Date ? taskData.dueDate : new Date(taskData.dueDate)) : 
                 undefined
      };
      const res = await apiRequest('PUT', `/api/events/${id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/heap'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Task updated",
        description: "The task has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete heap task
  const deleteHeapTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/events/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/heap'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Convert heap task to calendar event
  const convertToEventMutation = useMutation({
    mutationFn: async ({ id, eventData }: { id: number, eventData: any }) => {
      // Format dates properly
      const data = {
        ...eventData,
        type: 'fixed',
        startDate: eventData.startDate instanceof Date ? eventData.startDate : 
                  (eventData.startDate ? new Date(eventData.startDate) : new Date()),
        endDate: eventData.endDate instanceof Date ? eventData.endDate : 
                (eventData.endDate ? new Date(eventData.endDate) : new Date(new Date().getTime() + 60 * 60 * 1000)),
        dueDate: eventData.dueDate ? 
                (eventData.dueDate instanceof Date ? eventData.dueDate : new Date(eventData.dueDate)) : 
                undefined
      };
      const res = await apiRequest('PUT', `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/heap'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Task converted",
        description: "The task has been converted to a calendar event.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to convert task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Process voice input
  const processVoiceInputMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/ai/process-voice', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to process voice input');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Create a heap task using the processed data
      const taskDetails = data.taskDetails;
      
      if (taskDetails && taskDetails.title) {
        createHeapTaskMutation.mutate({
          title: taskDetails.title,
          description: taskDetails.description || '',
          deadline: taskDetails.dueDate || null,
          priority: taskDetails.priority || 'medium',
        });
        
        toast({
          title: "Voice processed",
          description: `"${data.transcription.substring(0, 40)}${data.transcription.length > 40 ? '...' : ''}" was converted to a task.`,
        });
      } else {
        toast({
          title: "Voice processing issue",
          description: "Couldn't extract task information from your voice input. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Voice processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return {
    heapEvents,
    isLoadingHeap,
    createHeapTask: createHeapTaskMutation.mutate,
    updateHeapTask: updateHeapTaskMutation.mutate,
    deleteHeapTask: deleteHeapTaskMutation.mutate,
    convertToEvent: convertToEventMutation.mutate,
    addHeapTaskVoice: processVoiceInputMutation.mutate,
    isProcessingVoice: processVoiceInputMutation.isPending,
  };
}
