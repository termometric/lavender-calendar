import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useAI() {
  const { toast } = useToast();
  const [isRecommendationsModalOpen, setIsRecommendationsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // Generate AI scheduling recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/schedule', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate recommendations');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations || []);
      setIsRecommendationsModalOpen(true);
      toast({
        title: "AI recommendations ready",
        description: "The AI has suggested optimal scheduling for your heap tasks.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate recommendations",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Apply all recommendations
  const applyAllRecommendationsMutation = useMutation({
    mutationFn: async (recommendations: any[]) => {
      const promises = recommendations.map(rec => 
        fetch(`/api/events/${rec.taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: rec.suggestedStartDate,
            endDate: rec.suggestedEndDate,
            type: 'fixed',
          }),
          credentials: 'include',
        })
      );
      
      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/heap'] });
      setIsRecommendationsModalOpen(false);
      toast({
        title: "Recommendations applied",
        description: "All AI recommendations have been applied to your calendar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply recommendations",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Apply single recommendation
  const applySingleRecommendationMutation = useMutation({
    mutationFn: async (recommendation: any) => {
      const res = await fetch(`/api/events/${recommendation.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: recommendation.suggestedStartDate,
          endDate: recommendation.suggestedEndDate,
          type: 'fixed',
        }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to apply recommendation');
      }
      
      return recommendation.taskId;
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/heap'] });
      
      // Update recommendations list
      setRecommendations(prev => prev.filter(rec => rec.taskId !== taskId));
      
      toast({
        title: "Recommendation applied",
        description: "The task has been scheduled in your calendar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to apply recommendation",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Open recommendations modal
  const openRecommendationsModal = () => {
    generateRecommendationsMutation.mutate();
  };
  
  // Close recommendations modal
  const closeRecommendationsModal = () => {
    setIsRecommendationsModalOpen(false);
  };
  
  return {
    isRecommendationsModalOpen,
    recommendations,
    isGeneratingRecommendations: generateRecommendationsMutation.isPending,
    isApplyingRecommendations: applyAllRecommendationsMutation.isPending,
    generateRecommendations: generateRecommendationsMutation.mutate,
    applyAllRecommendations: () => applyAllRecommendationsMutation.mutate(recommendations),
    applySingleRecommendation: applySingleRecommendationMutation.mutate,
    openRecommendationsModal,
    closeRecommendationsModal,
  };
}
