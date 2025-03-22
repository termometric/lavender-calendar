import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { insertEventSchema } from "@shared/schema";
import { useCalendar } from "@/hooks/use-calendar";
import { useHeap } from "@/hooks/use-heap";
import { useEvents } from "@/hooks/use-events";
import { parseDate } from "@/lib/date-utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event?: any;
}

export default function EventModal({
  open,
  onClose,
  event
}: EventModalProps) {
  const [eventType, setEventType] = useState<string>(event?.type || 'fixed');
  const { updateEvent, deleteEvent } = useCalendar();
  const { createHeapTask, updateHeapTask, deleteHeapTask, convertToEvent } = useHeap();
  const { createEvent, categories } = useEvents();
  
  // Extended schema with validation
  const formSchema = insertEventSchema.extend({
    title: z.string().min(1, { message: "Title is required" }),
    startDate: z.date(),
    endDate: z.date(),
    dueDate: z.date().optional(),
  });
  
  // Initialize form with default values or existing event data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      startDate: event?.startDate ? new Date(event.startDate) : new Date(),
      endDate: event?.endDate ? new Date(event.endDate) : new Date(new Date().setHours(new Date().getHours() + 1)),
      isAllDay: event?.isAllDay || false,
      color: event?.color || "#6B4EFF",
      isPinned: event?.isPinned || false,
      location: event?.location || "",
      type: event?.type || "fixed",
      dueDate: event?.dueDate ? new Date(event.dueDate) : undefined,
      categoryId: event?.categoryId || 1,
    },
  });
  
  // Update form when event prop changes
  useEffect(() => {
    if (event) {
      setEventType(event.type || 'fixed');
      form.reset({
        title: event.title || "",
        description: event.description || "",
        startDate: event.startDate ? new Date(event.startDate) : new Date(),
        endDate: event.endDate ? new Date(event.endDate) : new Date(new Date().setHours(new Date().getHours() + 1)),
        isAllDay: event.isAllDay || false,
        color: event.color || "#6B4EFF",
        isPinned: event.isPinned || false,
        location: event.location || "",
        type: event.type || "fixed",
        dueDate: event.dueDate ? new Date(event.dueDate) : undefined,
        categoryId: event.categoryId || 1,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(new Date().setHours(new Date().getHours() + 1)),
        isAllDay: false,
        color: "#6B4EFF",
        isPinned: false,
        location: "",
        type: "fixed",
        dueDate: undefined,
        categoryId: 1,
      });
    }
  }, [event, form]);
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (event?.id) {
      // Update existing event
      if (data.type === 'heap') {
        updateHeapTask({ id: event.id, taskData: data });
      } else if (event.type === 'heap' && data.type === 'fixed') {
        convertToEvent({ id: event.id, eventData: data });
      } else {
        updateEvent({ id: event.id, eventData: data });
      }
    } else {
      // Create new event
      if (data.type === 'heap') {
        createHeapTask(data);
      } else {
        createEvent(data);
      }
    }
    
    onClose();
  };
  
  // Handle delete
  const handleDelete = () => {
    if (event?.id) {
      if (event.type === 'heap') {
        deleteHeapTask(event.id);
      } else {
        deleteEvent(event.id);
      }
      onClose();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-secondary sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event?.id ? 'Edit Event' : 'Add Event'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-subtle">Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Event title" 
                      className="bg-primary border-gray-700"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel className="block text-sm font-medium text-subtle mb-1">Event Type</FormLabel>
              <RadioGroup 
                defaultValue={eventType}
                className="flex space-x-4"
                onValueChange={(value) => {
                  setEventType(value);
                  form.setValue('type', value as 'fixed' | 'heap');
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed">Fixed Event</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heap" id="heap" />
                  <Label htmlFor="heap">Heap Task</Label>
                </div>
              </RadioGroup>
            </div>
            
            {eventType === 'fixed' ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-subtle">Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          className="bg-primary border-gray-700"
                          value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => {
                            const date = parseDate(e.target.value);
                            if (date) field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-subtle">End Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          className="bg-primary border-gray-700"
                          value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => {
                            const date = parseDate(e.target.value);
                            if (date) field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-subtle">Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="bg-primary border-gray-700"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ''}
                        onChange={(e) => {
                          const date = parseDate(e.target.value);
                          if (date) field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-subtle">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details" 
                      className="bg-primary border-gray-700 h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-subtle">Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Add location" 
                      className="bg-primary border-gray-700"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-subtle">Color</FormLabel>
                  <div className="flex space-x-2">
                    {['#EF4444', '#3B82F6', '#10B981', '#FBBF24', '#8B5CF6', '#6B4EFF'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full ${color === field.value ? 'border-2 border-white' : 'border-2 border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="sm:justify-between">
              <div>
                {event?.id && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
