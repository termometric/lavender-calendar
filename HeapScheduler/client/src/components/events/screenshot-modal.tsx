import { useState, useRef } from "react";
import { useEvents } from "@/hooks/use-events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Bot } from "lucide-react";

interface ScreenshotModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ScreenshotModal({
  open,
  onClose
}: ScreenshotModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { processScreenshot, isPendingProcessScreenshot, processedImageData } = useEvents();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('screenshot', selectedFile);
      processScreenshot(formData);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-secondary sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Parse Screenshot to Event</DialogTitle>
        </DialogHeader>
        
        {!previewUrl ? (
          <div 
            className={`border-2 border-dashed ${isDragging ? 'border-accent' : 'border-gray-700'} rounded-lg p-8 text-center transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-subtle mb-2" />
              <p className="text-subtle mb-2">Drag and drop a screenshot here or click to upload</p>
              <p className="text-xs text-subtle mb-4">Supports PNG, JPG, WebP</p>
              <Button onClick={handleUploadClick}>
                Upload Screenshot
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Screenshot preview" 
                className="w-full h-auto rounded-md object-contain max-h-[300px]"
              />
              {isPendingProcessScreenshot && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              )}
            </div>
            
            {processedImageData && (
              <div className="bg-primary rounded-lg p-4">
                <div className="flex items-start">
                  <div className="bg-accent bg-opacity-20 p-2 rounded-md mr-3">
                    <Bot className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">AI Processing Result</h4>
                    <div className="text-xs text-subtle space-y-1">
                      <p>Detected: <span className="text-white">{processedImageData.title || "Unknown Event"}</span></p>
                      <p>Date: <span className="text-white">{processedImageData.date || "Not detected"}</span></p>
                      <p>Time: <span className="text-white">{processedImageData.time || "Not detected"}</span></p>
                      <p>Location: <span className="text-white">{processedImageData.location || "Not detected"}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {previewUrl && (
            <Button 
              disabled={isPendingProcessScreenshot || !selectedFile}
              onClick={handleSubmit}
            >
              {isPendingProcessScreenshot ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
