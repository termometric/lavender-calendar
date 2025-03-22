import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Analysis function to suggest optimal scheduling for heap tasks
export async function suggestHeapScheduling(events: any[], heapTasks: any[]) {
  try {
    const prompt = `
    Analyze these calendar events and heap tasks to create an optimal scheduling plan.
    
    Current calendar events:
    ${JSON.stringify(events)}
    
    Heap tasks to schedule:
    ${JSON.stringify(heapTasks)}
    
    Create a scheduling plan that:
    1. Prioritizes tasks based on due dates and estimated durations
    2. Avoids conflicts with existing events
    3. Considers optimal time of day for different task types
    4. Leaves reasonable breaks between events
    5. Makes use of available time slots efficiently
    
    Return recommendations in this JSON format:
    {
      "recommendations": [
        {
          "taskId": number,
          "title": string,
          "suggestedStartDate": string (ISO datetime),
          "suggestedEndDate": string (ISO datetime),
          "priority": "high" | "medium" | "low",
          "reasoning": string
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI scheduling assistant that helps organize calendar events efficiently."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedContent = response.choices[0].message.content || "{}";
    return JSON.parse(parsedContent);
  } catch (error) {
    console.error("Error in AI scheduling suggestion:", error);
    throw new Error("Failed to generate AI scheduling suggestions");
  }
}

// Process screenshot to extract event information
export async function processScreenshot(base64Image: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that analyzes screenshots of calendar events and extracts structured data."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the event details from this image and return them in JSON format. Look for title, date, start time, end time, location, and any other relevant details."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedContent = response.choices[0].message.content || "{}";
    return JSON.parse(parsedContent);
  } catch (error) {
    console.error("Error in screenshot processing:", error);
    throw new Error("Failed to process screenshot");
  }
}

// Analyze voice input to extract task details
export async function processVoiceInput(audioBase64: string) {
  try {
    // First, transcribe the audio
    const buffer = Buffer.from(audioBase64, 'base64');
    
    // Create a temporary file path
    const tempFile = path.join(os.tmpdir(), `voice-input-${Date.now()}.webm`);
    
    // Write buffer to temp file
    fs.writeFileSync(tempFile, buffer);
    
    // Create a File object to pass to OpenAI
    const audioFile = fs.createReadStream(tempFile);
    
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });
    
    const transcribedText = transcriptionResponse.text;
    
    // Then analyze the transcribed text to extract task details
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that extracts structured task information from voice notes. Extract all relevant details and format them as JSON."
        },
        {
          role: "user",
          content: `Extract task details from this transcribed voice note: "${transcribedText}". 
          Return a JSON object with these fields:
          - title: the main task name
          - description: any additional details about the task
          - dueDate: any mentioned deadline or due date (in YYYY-MM-DD format, or null if not specified)
          - estimatedDuration: any mentioned duration in minutes, or your best guess based on the task description
          - priority: "high", "medium", or "low" based on urgency clues
          - location: any mentioned location, or null if not specified
          `
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedContent = response.choices[0].message.content || "{}";
    
    return {
      transcription: transcribedText,
      taskDetails: JSON.parse(parsedContent)
    };
  } catch (error) {
    console.error("Error in voice input processing:", error);
    throw new Error("Failed to process voice input");
  }
}

// Suggest deadline for a heap task when not provided
export async function suggestDeadline(taskTitle: string, taskDescription: string) {
  try {
    const prompt = `
    Based on this heap task, suggest an appropriate deadline. The task details are:
    
    Title: ${taskTitle}
    Description: ${taskDescription || "No description provided"}
    
    Analyze the task details and suggest:
    1. A reasonable deadline date (in YYYY-MM-DD format)
    2. The priority level ("high", "medium", or "low")
    3. The reasoning behind this deadline suggestion
    
    Return the suggestion in this JSON format:
    {
      "suggestedDueDate": string (YYYY-MM-DD),
      "priority": "high" | "medium" | "low",
      "reasoning": string
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI deadline assistant that helps suggest reasonable deadlines for tasks based on their content and nature."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsedContent = response.choices[0].message.content || "{}";
    return JSON.parse(parsedContent);
  } catch (error) {
    console.error("Error in deadline suggestion:", error);
    throw new Error("Failed to suggest deadline");
  }
}
