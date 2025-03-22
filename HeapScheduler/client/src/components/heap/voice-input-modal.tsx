import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHeap } from '@/hooks/use-heap';

interface VoiceInputModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VoiceInputModal({ open, onClose }: VoiceInputModalProps) {
  const { toast } = useToast();
  const { addHeapTaskVoice, isProcessingVoice } = useHeap();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  const startRecording = async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        processRecording();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please check your browser permissions.',
        variant: 'destructive',
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    }
  };
  
  const processRecording = async () => {
    if (chunksRef.current.length === 0) {
      toast({
        title: 'Error',
        description: 'No audio recorded.',
        variant: 'destructive',
      });
      return;
    }
    
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    
    try {
      // Create form data to send to server
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Process audio through API
      await addHeapTaskVoice(formData);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: 'Error',
        description: 'Failed to process voice input. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-secondary sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Input</DialogTitle>
          <DialogDescription className="text-subtle">
            Speak clearly to add a new task to your heap.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {isRecording ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                <StopCircle className="w-10 h-10 text-red-500" />
              </div>
              <div className="text-lg font-semibold">{formatTime(recordingTime)}</div>
              <p className="text-subtle text-sm">Recording...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-primary-foreground flex items-center justify-center hover:bg-accent/10 cursor-pointer transition-colors" onClick={startRecording}>
                <Mic className="w-10 h-10 text-accent" />
              </div>
              <p className="text-subtle text-sm">Click to start recording</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isProcessingVoice}>
            Cancel
          </Button>
          
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive">
              Stop Recording
            </Button>
          ) : isProcessingVoice ? (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}