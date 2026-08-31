/** Mirrors the card-reader service's response schema (card-reader/src/card_reader/schemas). */

export interface ScannedContact {
  name: string | null;
  job_title: string | null;
  company: string | null;
  emails: string[];
  phones: string[];
  websites: string[];
  address: string | null;
  raw_text: string[];
}

export interface CardExtractionResult {
  success: boolean;
  contact: ScannedContact;
  confidence: number;
  message: string | null;
}

export type ScanStatus =
  | "requesting-camera"
  | "streaming"
  | "scanning"
  | "camera-blocked";
