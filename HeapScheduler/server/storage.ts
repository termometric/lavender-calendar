import { 
  users, type User, type InsertUser, 
  events, type Event, type InsertEvent,
  categories, type Category, type InsertCategory,
  settings, type Settings, type InsertSettings
} from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'calendar.json');

// Ensure the data directory exists
try {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE_PATH)) {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify({
      events: [],
      categories: [
        { id: 1, name: 'Default', color: '#6B4EFF' }
      ],
      settings: {
        id: 1,
        defaultView: 'month',
        defaultCategory: 1,
        useAI: true,
        theme: 'dark',
        lastUpdated: new Date().toISOString()
      }
    }, null, 2));
  }
} catch (error) {
  console.error('Error initializing data directory:', error);
}

// Load data from JSON file
function loadData() {
  try {
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading data from file:', error);
    return { events: [], categories: [], settings: {} };
  }
}

// Save data to JSON file
function saveData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data to file:', error);
    return false;
  }
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event operations
  getAllEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getHeapEvents(): Promise<Event[]>;
  getFixedEvents(): Promise<Event[]>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings | undefined>;
  
  // File operations
  exportToJson(): Promise<string>;
  importFromJson(jsonData: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private categories: Map<number, Category>;
  private settings: Settings | undefined;
  currentUserId: number;
  currentEventId: number;
  currentCategoryId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.categories = new Map();
    this.currentUserId = 1;
    this.currentEventId = 1;
    this.currentCategoryId = 1;
    
    // Initialize with data from file
    this.loadFromFile();
  }

  private loadFromFile() {
    const data = loadData();
    
    // Load events
    if (data.events && Array.isArray(data.events)) {
      this.events.clear();
      let maxId = 0;
      data.events.forEach((event: Event) => {
        this.events.set(event.id, {
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          dueDate: event.dueDate ? new Date(event.dueDate) : undefined
        });
        maxId = Math.max(maxId, event.id);
      });
      this.currentEventId = maxId + 1;
    }
    
    // Load categories
    if (data.categories && Array.isArray(data.categories)) {
      this.categories.clear();
      let maxId = 0;
      data.categories.forEach((category: Category) => {
        this.categories.set(category.id, category);
        maxId = Math.max(maxId, category.id);
      });
      this.currentCategoryId = maxId + 1;
      
      // Ensure default category exists
      if (this.categories.size === 0) {
        const defaultCategory: Category = {
          id: 1,
          name: 'Default',
          color: '#6B4EFF'
        };
        this.categories.set(1, defaultCategory);
        this.currentCategoryId = 2;
      }
    }
    
    // Load settings
    if (data.settings) {
      this.settings = {
        ...data.settings,
        lastUpdated: data.settings.lastUpdated ? new Date(data.settings.lastUpdated) : new Date()
      };
    } else {
      this.settings = {
        id: 1,
        defaultView: 'month',
        defaultCategory: 1,
        useAI: true,
        theme: 'dark',
        lastUpdated: new Date()
      };
    }
  }

  private saveToFile() {
    const data = {
      events: Array.from(this.events.values()),
      categories: Array.from(this.categories.values()),
      settings: this.settings
    };
    
    return saveData(data);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    this.saveToFile();
    return event;
  }

  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent: Event = { ...event, ...eventUpdate };
    this.events.set(id, updatedEvent);
    this.saveToFile();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const deleted = this.events.delete(id);
    if (deleted) {
      this.saveToFile();
    }
    return deleted;
  }

  async getHeapEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.type === 'heap'
    );
  }

  async getFixedEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.type === 'fixed'
    );
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    this.saveToFile();
    return category;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = { ...category, ...categoryUpdate };
    this.categories.set(id, updatedCategory);
    this.saveToFile();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Don't delete if it's the only category
    if (this.categories.size <= 1) {
      return false;
    }
    
    const deleted = this.categories.delete(id);
    if (deleted) {
      this.saveToFile();
      
      // Update any events using this category to use the default category
      const defaultCategoryId = 1; // First category is default
      Array.from(this.events.values())
        .filter(event => event.categoryId === id)
        .forEach(event => {
          this.events.set(event.id, { ...event, categoryId: defaultCategoryId });
        });
    }
    return deleted;
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings | undefined> {
    if (!this.settings) {
      this.settings = {
        id: 1,
        ...settingsUpdate,
        lastUpdated: new Date()
      } as Settings;
    } else {
      this.settings = {
        ...this.settings,
        ...settingsUpdate,
        lastUpdated: new Date()
      };
    }
    
    this.saveToFile();
    return this.settings;
  }

  // File operations
  async exportToJson(): Promise<string> {
    const data = {
      events: Array.from(this.events.values()),
      categories: Array.from(this.categories.values()),
      settings: this.settings
    };
    
    return JSON.stringify(data, null, 2);
  }

  async importFromJson(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.events || !Array.isArray(data.events) || 
          !data.categories || !Array.isArray(data.categories) ||
          !data.settings) {
        return false;
      }
      
      // Clear existing data
      this.events.clear();
      this.categories.clear();
      
      // Import events
      let maxEventId = 0;
      data.events.forEach((event: Event) => {
        this.events.set(event.id, {
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          dueDate: event.dueDate ? new Date(event.dueDate) : undefined
        });
        maxEventId = Math.max(maxEventId, event.id);
      });
      this.currentEventId = maxEventId + 1;
      
      // Import categories
      let maxCategoryId = 0;
      data.categories.forEach((category: Category) => {
        this.categories.set(category.id, category);
        maxCategoryId = Math.max(maxCategoryId, category.id);
      });
      this.currentCategoryId = maxCategoryId + 1;
      
      // Import settings
      this.settings = {
        ...data.settings,
        lastUpdated: new Date()
      };
      
      // Save to file
      this.saveToFile();
      
      return true;
    } catch (error) {
      console.error('Error importing from JSON:', error);
      return false;
    }
  }
}

export const storage = new MemStorage();
