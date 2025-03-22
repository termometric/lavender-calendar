import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAI } from "@/hooks/use-ai";

interface HeapItemProps {
  event: any;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  showAIButton?: boolean;
}

export default function HeapItem({ 
  event, 
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
  showAIButton = false
}: HeapItemProps) {
  const { openRecommendationsModal } = useAI();
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      '#6B4EFF': 'bg-accent',
      '#EF4444': 'bg-red-500',
      '#10B981': 'bg-green-500', 
      '#FBBF24': 'bg-yellow-500',
      '#8B5CF6': 'bg-purple-500',
      '#3B82F6': 'bg-blue-500',
    };
    
    return colorMap[color] || 'bg-accent';
  };
  
  // Prevent propagation to onClick of parent div
  const handleAIButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openRecommendationsModal();
  };
  
  return (
    <div 
      className={cn(
        "heap-event bg-card hover:bg-card-hover p-3 rounded-md mb-2 shadow-event flex items-start",
        isDragging && "opacity-50"
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-testid="heap-item"
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${getColorClass(event.color)} mt-1.5 mr-2 flex-shrink-0`} />
      <div className="flex-1">
        <h3 className="text-sm font-medium">{event.title}</h3>
        {event.dueDate && (
          <div className="flex items-center mt-1 text-xs text-subtle">
            <Clock className="h-3 w-3 mr-1" />
            <span>Due: {format(new Date(event.dueDate), 'MMM d')}</span>
          </div>
        )}
        
        {showAIButton && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs w-full bg-secondary/50 hover:bg-secondary"
              onClick={handleAIButtonClick}
            >
              <Sparkles className="h-3 w-3 mr-1 text-accent" />
              Schedule with AI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
