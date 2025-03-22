import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema (retained from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Calendar Event Schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isAllDay: boolean("is_all_day").default(false),
  color: text("color").default("#6B4EFF"),
  isPinned: boolean("is_pinned").default(false),
  location: text("location"),
  type: text("type").default("fixed"), // "fixed" or "heap"
  dueDate: timestamp("due_date"), // For heap tasks with deadlines
  categoryId: integer("category_id"),
  metadata: jsonb("metadata"), // Additional custom data
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6B4EFF"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Calendar Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  defaultView: text("default_view").default("month"), // "month", "week", "day"
  defaultCategory: integer("default_category"),
  useAI: boolean("use_ai").default(true),
  theme: text("theme").default("dark"),
  jsonData: text("json_data"), // Entire calendar data as JSON for file-based storage
  lastUpdated: timestamp("last_updated"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
