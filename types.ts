
export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
