
export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type VideoAspectRatio = "16:9" | "9:16";

// Types for Grounding Sources (Google Search and Maps)
export interface ReviewSnippet {
  publisher: string;
  text: string;
  author: string;
}

export interface MapsPlace {
  title: string;
  uri: string;
  placeAnswerSources?: {
    reviewSnippets: ReviewSnippet[];
  };
}

export interface MapsChunk {
  maps: MapsPlace;
}

export interface WebChunk {
  web: {
    uri: string;
    title: string;
  };
}

export type GroundingChunk = WebChunk | MapsChunk;

export interface MapsSearchResponse {
  text: string;
  sources: GroundingChunk[];
}

export interface GroundingSearchResponse {
  text: string;
  sources: GroundingChunk[];
}

// Type for places with coordinates for map display
export interface PlaceWithCoords {
  title: string;
  latitude: number;
  longitude: number;
}

// Types for Chat History
export interface ChatSession {
  id: string; // UUID
  deviceId: string;
  title: string;
  timestamp: number; // Unix timestamp
}

export interface HistoryMessage {
  id?: number; // Auto-incrementing primary key
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

// Types for structured image analysis
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  name: string;
  boundingBox: BoundingBox;
}

export interface ImageAnalysisResponse {
  description: string;
  detectedObjects: DetectedObject[];
}