
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
