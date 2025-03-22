import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertCategorySchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { suggestHeapScheduling, processScreenshot, processVoiceInput, suggestDeadline } from "./openai";

// Define an extended Request type to include multer's file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Event routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      // Convert string dates to Date objects before validation
      const body = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined
      };
      
      const eventData = insertEventSchema.parse(body);
      const newEvent = await storage.createEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        console.error("Event creation error:", error);
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  });

  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Convert string dates to Date objects before validation
      const body = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined
      };
      
      const eventData = insertEventSchema.partial().parse(body);
      const updatedEvent = await storage.updateEvent(id, eventData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        console.error("Event update error:", error);
        res.status(500).json({ message: "Failed to update event" });
      }
    }
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEvent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Heap events
  app.get("/api/heap", async (req: Request, res: Response) => {
    try {
      const heapEvents = await storage.getHeapEvents();
      res.json(heapEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch heap events" });
    }
  });

  // Fixed events
  app.get("/api/fixed-events", async (req: Request, res: Response) => {
    try {
      const fixedEvents = await storage.getFixedEvents();
      res.json(fixedEvents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fixed events" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const updatedCategory = await storage.updateCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found or cannot be deleted" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req: Request, res: Response) => {
    try {
      const settingsData = insertSettingsSchema.partial().parse(req.body);
      const updatedSettings = await storage.updateSettings(settingsData);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  // Export/Import routes
  app.get("/api/export", async (req: Request, res: Response) => {
    try {
      const jsonData = await storage.exportToJson();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=calendar-data.json');
      res.send(jsonData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.post("/api/import", async (req: Request, res: Response) => {
    try {
      const { jsonData } = req.body;
      
      if (!jsonData) {
        return res.status(400).json({ message: "No JSON data provided" });
      }
      
      const success = await storage.importFromJson(jsonData);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid JSON data format" });
      }
      
      res.json({ message: "Data imported successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  // AI scheduling route
  app.post("/api/ai/schedule", async (req: Request, res: Response) => {
    try {
      console.log("🔄 Starting AI scheduling recommendation process");
      const fixedEvents = await storage.getFixedEvents();
      const heapEvents = await storage.getHeapEvents();
      
      console.log(`📅 Found ${fixedEvents.length} fixed events and ${heapEvents.length} heap events`);
      
      if (heapEvents.length === 0) {
        return res.json({ recommendations: [] });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        console.error("❌ Missing OpenAI API key");
        return res.status(500).json({ 
          message: "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable." 
        });
      }
      
      const recommendations = await suggestHeapScheduling(fixedEvents, heapEvents);
      console.log("✅ Successfully generated AI recommendations:", recommendations);
      res.json(recommendations);
    } catch (error) {
      console.error("❌ Error generating AI recommendations:", error);
      res.status(500).json({ 
        message: "Failed to generate AI scheduling recommendations",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Screenshot processing route
  app.post("/api/ai/process-screenshot", upload.single('screenshot'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No screenshot provided" });
      }
      
      console.log("📸 Processing screenshot");
      
      if (!process.env.OPENAI_API_KEY) {
        console.error("❌ Missing OpenAI API key for screenshot processing");
        return res.status(500).json({ 
          message: "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable." 
        });
      }
      
      const base64Image = req.file.buffer.toString('base64');
      const eventData = await processScreenshot(base64Image);
      
      console.log("✅ Successfully processed screenshot:", eventData);
      res.json(eventData);
    } catch (error) {
      console.error("❌ Error processing screenshot:", error);
      res.status(500).json({ 
        message: "Failed to process screenshot",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Voice input processing route
  app.post("/api/ai/process-voice", upload.single('audio'), async (req: MulterRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }
      
      console.log("🎤 Processing voice input");
      
      if (!process.env.OPENAI_API_KEY) {
        console.error("❌ Missing OpenAI API key for voice processing");
        return res.status(500).json({ 
          message: "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable." 
        });
      }
      
      const audioBase64 = req.file.buffer.toString('base64');
      const processedData = await processVoiceInput(audioBase64);
      
      console.log("✅ Successfully processed voice input:", 
        {transcription: processedData.transcription?.substring(0, 100) + "..." });
      
      res.json(processedData);
    } catch (error) {
      console.error("❌ Error processing voice input:", error);
      res.status(500).json({ 
        message: "Failed to process voice input",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Deadline suggestion route
  app.post("/api/ai/suggest-deadline", async (req: Request, res: Response) => {
    try {
      const { title, description } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Task title is required" });
      }
      
      const suggestionData = await suggestDeadline(title, description || "");
      res.json(suggestionData);
    } catch (error) {
      res.status(500).json({ message: "Failed to suggest deadline" });
    }
  });

  return httpServer;
}
