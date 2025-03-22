import { useAI } from "@/hooks/use-ai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatTime } from "@/lib/date-utils";

interface AIRecommendationsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AIRecommendationsModal({
  open,
  onClose
}: AIRecommendationsModalProps) {
  const { 
    recommendations, 
    isGeneratingRecommendations,
    isApplyingRecommendations,
    applyAllRecommendations,
    applySingleRecommendation
  } = useAI();
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };
  
  const getColorClass = (taskId: number) => {
    // This is a simplified version - in a real app, you'd get the color from the event
    const colors = ['bg-red-500', 'bg-accent', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    return colors[taskId % colors.length];
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-secondary sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bot className="text-accent mr-2 h-5 w-5" />
            AI Scheduling Recommendations
          </DialogTitle>
        </DialogHeader>
        
        <p className="text-subtle mb-4">
          The AI assistant has analyzed your calendar and heap tasks, and suggests the following schedule:
        </p>
        
        {isGeneratingRecommendations ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
            <p className="text-subtle">Analyzing your calendar and tasks...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <p className="text-subtle">No recommendations available.</p>
            <p className="text-xs text-subtle mt-2">Try adding more tasks to your heap or click generate again.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {recommendations.map((rec) => (
              <div key={rec.taskId} className="bg-primary rounded-lg p-3 flex items-start">
                <div className={`w-2 h-2 rounded-full ${getColorClass(rec.taskId)} mt-1.5 mr-2 flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium">{rec.title}</h4>
                    <span className={`text-xs ${getPriorityClass(rec.priority)}`}>{rec.priority} priority</span>
                  </div>
                  <p className="text-xs text-subtle mt-1">
                    Scheduled for: <span className="text-white">
                      {formatDate(rec.suggestedStartDate)}, {formatTime(rec.suggestedStartDate)} - {formatTime(rec.suggestedEndDate)}
                    </span>
                  </p>
                  <p className="text-xs text-subtle">{rec.reasoning}</p>
                  
                  <div className="mt-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => applySingleRecommendation(rec)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Adjust
          </Button>
          <Button
            onClick={applyAllRecommendations}
            disabled={isApplyingRecommendations || recommendations.length === 0 || isGeneratingRecommendations}
          >
            {isApplyingRecommendations ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply All"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
