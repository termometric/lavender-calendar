import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { getEventColor } from "@/lib/date-utils";
import { useEvents } from "@/hooks/use-events";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarGridProps {
  calendarDays: any[];
  getEventsForDate: (dateString: string) => any[];
  isLoading: boolean;
  view?: 'month' | 'week' | 'day';
}

export default function CalendarGrid({ 
  calendarDays, 
  getEventsForDate,
  isLoading,
  view = 'month'
}: CalendarGridProps) {
  const { openEventModal } = useEvents();
  const [timeIndicators, setTimeIndicators] = useState<Record<string, boolean>>({});
  
  // Set up current day time indicator
  useEffect(() => {
    const updateTimeIndicators = () => {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      
      // Create an object with today's date as key
      const indicators: Record<string, boolean> = {};
      indicators[todayString] = true;
      
      setTimeIndicators(indicators);
    };
    
    updateTimeIndicators();
    
    // Update the current day indicator every minute
    const interval = setInterval(updateTimeIndicators, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleDrop = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    try {
      // Get data from event being dragged
      const eventData = JSON.parse(e.dataTransfer.getData('text/plain'));
      console.log("Drop event data:", eventData);
      
      // Create start and end date for the dropped day
      const date = new Date(dateString);
      // Keep the original time if available
      let hours = 9;
      let minutes = 0;
      
      if (eventData.startDate) {
        const originalDate = new Date(eventData.startDate);
        hours = originalDate.getHours();
        minutes = originalDate.getMinutes();
      }
      
      // Set the hours from the original event
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Set end time one hour later
      const endDate = new Date(startDate);
      endDate.setHours(hours + 1, minutes, 0, 0);
      
      // Open event modal with pre-filled data
      openEventModal({
        ...eventData,
        startDate,
        endDate,
        type: 'fixed'
      });
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };
  
  const getTimeIndicatorStyle = () => {
    const now = new Date();
    const hourPercent = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
    return {
      top: `${hourPercent * 100}%`,
      left: '0',
      right: '0',
      height: '2px',
      background: 'red',
      position: 'absolute',
      zIndex: 10
    } as React.CSSProperties;
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-1 auto-rows-fr">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} className="min-h-[120px] bg-secondary/50 rounded-md" />
        ))}
      </div>
    );
  }
  
  // Filter days based on view
  let displayDays = [...calendarDays];
  
  if (view === 'week') {
    // Find the current week
    const today = new Date();
    const todayIndex = calendarDays.findIndex(day => 
      isSameDay(new Date(day.date), today)
    );
    
    // Calculate the first day of the week (Sunday)
    const startIndex = todayIndex - (todayIndex % 7);
    displayDays = calendarDays.slice(startIndex, startIndex + 7);
  } else if (view === 'day') {
    // Only show today
    const today = new Date();
    displayDays = calendarDays.filter(day => 
      isSameDay(new Date(day.date), today)
    );
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Days of week */}
      <div className={cn(
        "grid text-center mb-2", 
        view === 'day' ? "grid-cols-1" : "grid-cols-7"
      )}>
        {view !== 'day' && (
          <>
            <div className="text-subtle text-sm font-medium">Sun</div>
            <div className="text-subtle text-sm font-medium">Mon</div>
            <div className="text-subtle text-sm font-medium">Tue</div>
            <div className="text-subtle text-sm font-medium">Wed</div>
            <div className="text-subtle text-sm font-medium">Thu</div>
            <div className="text-subtle text-sm font-medium">Fri</div>
            <div className="text-subtle text-sm font-medium">Sat</div>
          </>
        )}
        {view === 'day' && (
          <div className="text-subtle text-sm font-medium">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        )}
      </div>
      
      {/* Calendar days */}
      <div className={cn(
        "grid gap-1 auto-rows-fr", 
        view === 'day' ? "grid-cols-1" : "grid-cols-7"
      )}>
        {displayDays.map((day) => {
          const dateEvents = getEventsForDate(day.dateString);
          const isCurrentDay = day.isToday;
          const showTimeIndicator = timeIndicators[day.dateString];
          
          return (
            <div
              key={day.dateString}
              className={cn(
                "calendar-day rounded-md p-2 min-h-[120px] relative",
                day.isCurrentMonth ? "bg-secondary" : "bg-secondary bg-opacity-30",
                isCurrentDay && "bg-[#6B4EFF] bg-opacity-10 border-2 border-[#6B4EFF]",
                view === 'day' && "min-h-[500px]" // Taller when in day view
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.dateString)}
              onClick={() => {
                // Create an event at this date when clicking empty space
                const date = new Date(day.dateString);
                const startDate = new Date(date.setHours(9, 0, 0));
                const endDate = new Date(date.setHours(10, 0, 0));
                
                openEventModal({
                  startDate,
                  endDate,
                  type: 'fixed'
                });
              }}
            >
              <span 
                className={cn(
                  "text-sm", 
                  !day.isCurrentMonth && "text-subtle",
                  isCurrentDay && "font-medium text-accent"
                )}
              >
                {format(day.date, 'd')}
              </span>
              
              {isCurrentDay && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-accent"></div>
              )}
              
              {showTimeIndicator && (
                <div style={getTimeIndicatorStyle()}></div>
              )}
              
              <div className="mt-2 space-y-1">
                {dateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "event-card text-xs p-1 rounded truncate",
                      getEventColor(event.color)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventModal(event);
                    }}
                  >
                    {format(new Date(event.startDate), 'h:mm a')} - {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
