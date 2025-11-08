export interface TranslateRequest {
  input_text: string;
  level: CEFRLevel;
}

export interface TranslateResponse {
  translation: string;
}

export enum CEFRLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
}