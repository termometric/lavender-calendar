import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-events";
import { formatMonthYear } from "@/lib/date-utils";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Upload,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CalendarHeaderProps {
  currentDate: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
  view: 'month' | 'week' | 'day';
  changeView: (view: 'month' | 'week' | 'day') => void;
}

export default function CalendarHeader({
  currentDate,
  prevMonth,
  nextMonth,
  goToToday,
  view,
  changeView
}: CalendarHeaderProps) {
  const { openScreenshotModal } = useEvents();
  
  return (
    <header className="p-4 border-b border-gray-800 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">{formatMonthYear(currentDate)}</h2>
        <Button variant="link" className="text-sm text-subtle hover:text-white" onClick={goToToday}>
          Today
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex bg-secondary rounded-md">
          <Button 
            variant={view === 'month' ? 'accent' : 'ghost'} 
            className="px-3 py-1 text-sm font-medium"
            onClick={() => changeView('month')}
          >
            Month
          </Button>
          <Button 
            variant={view === 'week' ? 'accent' : 'ghost'} 
            className="px-3 py-1 text-sm font-medium"
            onClick={() => changeView('week')}
          >
            Week
          </Button>
          <Button 
            variant={view === 'day' ? 'accent' : 'ghost'} 
            className="px-3 py-1 text-sm font-medium"
            onClick={() => changeView('day')}
          >
            Day
          </Button>
        </div>
        
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={openScreenshotModal}>
          <Upload className="h-5 w-5" />
          <span className="sr-only">Upload screenshot</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Export Calendar</DropdownMenuItem>
            <DropdownMenuItem>Import Calendar</DropdownMenuItem>
            <DropdownMenuItem>Print</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
