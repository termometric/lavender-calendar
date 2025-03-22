import { useState } from "react";
import { useCalendar } from "@/hooks/use-calendar";
import { useEvents } from "@/hooks/use-events";
import { useAI } from "@/hooks/use-ai";
import CalendarHeader from "@/components/calendar/calendar-header";
import CalendarGrid from "@/components/calendar/calendar-grid";
import EventModal from "@/components/events/event-modal";
import ScreenshotModal from "@/components/events/screenshot-modal";
import AIRecommendationsModal from "@/components/ai/ai-recommendations-modal";

export default function Calendar() {
  const { 
    currentDate,
    calendarDays,
    isLoadingEvents,
    view,
    prevMonth,
    nextMonth,
    goToToday,
    changeView,
    getEventsForDate
  } = useCalendar();
  
  const {
    isEventModalOpen,
    closeEventModal,
    currentEvent,
    isScreenshotModalOpen,
    closeScreenshotModal
  } = useEvents();
  
  const { isRecommendationsModalOpen, closeRecommendationsModal } = useAI();
  
  return (
    <>
      <div className="flex flex-col h-full">
        <CalendarHeader
          currentDate={currentDate}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          goToToday={goToToday}
          view={view}
          changeView={changeView}
        />
        
        <CalendarGrid
          calendarDays={calendarDays}
          getEventsForDate={getEventsForDate}
          isLoading={isLoadingEvents}
          view={view}
        />
      </div>
      
      <EventModal
        open={isEventModalOpen}
        onClose={closeEventModal}
        event={currentEvent}
      />
      
      <ScreenshotModal
        open={isScreenshotModalOpen}
        onClose={closeScreenshotModal}
      />
      
      <AIRecommendationsModal
        open={isRecommendationsModalOpen}
        onClose={closeRecommendationsModal}
      />
    </>
  );
}
