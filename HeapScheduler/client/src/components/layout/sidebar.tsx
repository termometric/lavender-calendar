import { Link, useLocation } from "wouter";
import { useHeap } from "@/hooks/use-heap";
import { useEvents } from "@/hooks/use-events";
import { useAI } from "@/hooks/use-ai";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import HeapContainer from "@/components/heap/heap-container";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar as CalendarIcon,
  Layers as StackIcon,
  Settings as SettingsIcon,
  ChevronRight as ChevronRightIcon
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { heapEvents, isLoadingHeap, createHeapTask } = useHeap();
  const { openEventModal } = useEvents();
  const { openRecommendationsModal, isGeneratingRecommendations } = useAI();
  
  const navItems = [
    { path: "/", icon: <CalendarIcon className="mr-3 h-4 w-4" />, label: "Calendar" },
    { path: "/heap", icon: <StackIcon className="mr-3 h-4 w-4" />, label: "Heap" },
    { path: "/settings", icon: <SettingsIcon className="mr-3 h-4 w-4" />, label: "Settings" },
  ];
  
  return (
    <aside className="w-64 border-r border-gray-800 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-semibold flex items-center">
          <span className="text-accent mr-2"><CalendarIcon /></span>
          Calendar Heap
        </h1>
      </div>
      
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex items-center px-3 py-2 rounded-md ${
              location === item.path
                ? "bg-accent bg-opacity-20 text-accent"
                : "text-subtle hover:text-white hover:bg-secondary transition-colors"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      
      <div className="mt-6 p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Heap</h2>
          <Button 
            variant="default" 
            className="bg-accent hover:bg-accent/90 text-white"
            size="sm"
            onClick={() => openEventModal({
              type: 'heap',
              startDate: new Date(),
              endDate: new Date(new Date().setHours(new Date().getHours() + 1))
            })}
          >
            + New Task
          </Button>
        </div>
        
        {isLoadingHeap ? (
          <div className="bg-heap rounded-lg p-3 flex-1 space-y-2">
            <Skeleton className="h-16 w-full bg-card/50" />
            <Skeleton className="h-16 w-full bg-card/50" />
            <Skeleton className="h-16 w-full bg-card/50" />
          </div>
        ) : (
          <HeapContainer events={heapEvents.slice(0, 3)} />
        )}
        
        <div className="mt-4 bg-secondary rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <div className="flex items-center text-accent text-xs">
              <StackIcon className="h-3 w-3 mr-1" />
              <span>Active</span>
            </div>
          </div>
          <Button 
            className="w-full mb-2"
            onClick={openRecommendationsModal}
            disabled={isGeneratingRecommendations || heapEvents.length === 0}
          >
            {isGeneratingRecommendations ? (
              <span className="flex items-center">
                <Skeleton className="h-4 w-4 rounded-full mr-2 bg-white/20" />
                Processing...
              </span>
            ) : (
              "Auto-Schedule Heap"
            )}
          </Button>
          <p className="text-xs text-subtle">
            {heapEvents.length} tasks ready to be scheduled in your calendar
          </p>
        </div>
      </div>
    </aside>
  );
}
