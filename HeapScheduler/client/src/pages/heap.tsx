import { useState } from "react";
import { useHeap } from "@/hooks/use-heap";
import { useEvents } from "@/hooks/use-events";
import HeapContainer from "@/components/heap/heap-container";
import EventModal from "@/components/events/event-modal";
import VoiceInputModal from "@/components/heap/voice-input-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Plus, Clock, Mic, ChevronDown } from "lucide-react";

export default function Heap() {
  const { heapEvents, isLoadingHeap } = useHeap();
  const { 
    isEventModalOpen, 
    closeEventModal, 
    currentEvent,
    openEventModal
  } = useEvents();
  
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  const openVoiceModal = () => setIsVoiceModalOpen(true);
  const closeVoiceModal = () => setIsVoiceModalOpen(false);
  
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center">
          <Clock className="mr-2 text-accent" />
          Heap Tasks
        </h1>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="p-3">
                <Plus className="h-5 w-5" />
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEventModal({
                type: 'heap',
                startDate: new Date(),
                endDate: new Date(new Date().setHours(new Date().getHours() + 1))
              })}>
                <Plus className="h-4 w-4 mr-2" />
                Type Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openVoiceModal}>
                <Mic className="h-4 w-4 mr-2" />
                Voice Input
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={() => openEventModal({
              type: 'heap',
              startDate: new Date(),
              endDate: new Date(new Date().setHours(new Date().getHours() + 1))
            })}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Task
          </Button>
        </div>
      </div>
      
      <div className="bg-secondary rounded-lg p-4 flex-1">
        <p className="text-subtle mb-4">
          Heap tasks are flexible items without a specific time slot. They'll be automatically scheduled by the AI assistant or can be manually pinned to your calendar.
        </p>
        
        <div className="flex-1 bg-[#222222] rounded-lg max-h-[calc(100vh-240px)] overflow-hidden">
          <HeapContainer events={heapEvents.map(event => ({...event, showAIButton: true})) as any[]} />
        </div>
      </div>
      
      <EventModal
        open={isEventModalOpen}
        onClose={closeEventModal}
        event={currentEvent}
      />
      
      <VoiceInputModal 
        open={isVoiceModalOpen}
        onClose={closeVoiceModal}
      />
    </div>
  );
}
