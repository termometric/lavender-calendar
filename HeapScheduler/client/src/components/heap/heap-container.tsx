import { useState } from "react";
import HeapItem from "./heap-item";
import { useEvents } from "@/hooks/use-events";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HeapContainerProps {
  events: any[];
}

export default function HeapContainer({ events }: HeapContainerProps) {
  const { openEventModal } = useEvents();
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  
  const handleDragStart = (e: React.DragEvent, event: any) => {
    // Set the dragged data in the dataTransfer object
    try {
      console.log("Starting drag with event:", event);
      const eventData = JSON.stringify(event);
      e.dataTransfer.setData('text/plain', eventData);
      e.dataTransfer.effectAllowed = 'move';
      
      // Add a ghost image for drag preview
      const dragPreview = document.createElement('div');
      dragPreview.textContent = event.title;
      dragPreview.style.padding = '8px';
      dragPreview.style.background = '#2D2D2D';
      dragPreview.style.border = '1px solid #6B4EFF';
      dragPreview.style.borderRadius = '4px';
      dragPreview.style.color = 'white';
      dragPreview.style.position = 'absolute';
      dragPreview.style.top = '-1000px';
      document.body.appendChild(dragPreview);
      
      e.dataTransfer.setDragImage(dragPreview, 0, 0);
      
      // Set timeout to remove the element
      setTimeout(() => {
        document.body.removeChild(dragPreview);
      }, 0);
      
      setDraggedItem(event.id);
    } catch (error) {
      console.error("Error setting drag data:", error);
    }
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
  };
  
  const handleItemClick = (event: any) => {
    openEventModal(event);
  };
  
  return (
    <ScrollArea className="bg-[#222222] rounded-lg p-3 flex-1">
      {events.length === 0 ? (
        <div className="text-center py-8 text-subtle">
          <p>No tasks in heap</p>
          <p className="text-xs mt-2">Add tasks to your heap for flexible scheduling</p>
        </div>
      ) : (
        events.map((event) => (
          <HeapItem
            key={event.id}
            event={event}
            onClick={() => handleItemClick(event)}
            onDragStart={(e) => handleDragStart(e, event)}
            onDragEnd={handleDragEnd}
            isDragging={draggedItem === event.id}
            showAIButton={event.showAIButton}
          />
        ))
      )}
    </ScrollArea>
  );
}
