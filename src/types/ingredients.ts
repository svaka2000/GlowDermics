export interface FlaggedIngredient {
  name: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  commonlyFoundIn?: string;
}

export interface BeneficialIngredient {
  name: string;
  benefit: string;
}

export interface SkinCompatibility {
  skinType: string;
  compatible: boolean;
  note?: string;
}

export interface IngredientReport {
  safetyScore: number;
  verdict: 'Clean' | 'Mostly Clean' | 'Use Caution' | 'Avoid';
  summary: string;
  totalIngredients: number;
  naturalPercent: number;
  flagged: FlaggedIngredient[];
  beneficial: BeneficialIngredient[];
  skinCompatibility: SkinCompatibility[];
  tallowDermicsComparison: string;
}
