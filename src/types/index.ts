export interface SkinScore {
  overall: number;
  hydration: number;
  texture: number;
  clarity: number;
  evenness: number;
  firmness: number;
  pores: number;
}

export interface SkinAnalysis {
  id: string;
  date: string;
  imageUri: string;
  scores: SkinScore;
  skinType: 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';
  concerns: string[];
  strengths: string[];
  insights: string;
  recommendations: Recommendation[];
  routine: RoutineStep[];
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  product?: ProductSuggestion;
}

export interface ProductSuggestion {
  name: string;
  brand: string;
  category: string;
  why: string;
  isTallowDermics?: boolean;
}

export interface RoutineStep {
  time: 'morning' | 'evening' | 'both';
  order: number;
  step: string;
  product: string;
  why: string;
  duration?: string;
}

export interface UserProfile {
  name: string;
  skinType: string;
  primaryConcerns: string[];
  goals: string[];
  lifestyle: {
    sleepHours: number;
    waterIntake: string;
    sunExposure: string;
    diet: string;
  };
  onboardingComplete: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ScanHistoryEntry {
  id: string;
  date: string;
  imageUri: string;
  overallScore: number;
  scores: SkinScore;
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'bad';
  note: string;
  tags: string[];
  scanId?: string; // linked scan if same day
}
