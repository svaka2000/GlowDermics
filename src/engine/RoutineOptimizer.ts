import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkinAnalysis, RoutineStep } from '../types';
import { EngineReport } from './SkinProgressEngine';

const SHELF_KEY = 'gd_product_shelf';

export interface ShelfProduct {
  name: string;
  brand: string;
  category: string;
  rating: number;
  notes: string;
}

export interface RankedProduct extends ShelfProduct {
  effectivenessScore: number;
  reason: string;
}

export interface SwapSuggestion {
  current: string;
  currentBrand: string;
  suggested: string;
  suggestedBrand: string;
  reason: string;
}

export interface GapItem {
  gap: string;
  recommendation: string;
  priority: 'high' | 'medium';
}

export interface OptimizedRoutine {
  morning: RoutineStep[];
  evening: RoutineStep[];
  productRankings: RankedProduct[];
  swapSuggestions: SwapSuggestion[];
  gapAnalysis: GapItem[];
}

export async function runRoutineOptimizer(
  latestAnalysis: SkinAnalysis,
  engineReport: EngineReport | null
): Promise<OptimizedRoutine> {
  const shelfRaw = await AsyncStorage.getItem(SHELF_KEY);
  const shelf: ShelfProduct[] = shelfRaw ? JSON.parse(shelfRaw) : [];

  const workingFactors = (engineReport?.whatWorking ?? []).map(w => w.factor.toLowerCase());
  const notWorkingFactors = (engineReport?.whatNotWorking ?? []).map(w => w.factor.toLowerCase());

  // ── Product rankings ──────────────────────────────────────────────────────
  const productRankings: RankedProduct[] = shelf.map(product => {
    let score = product.rating * 18; // 0–90 base from user rating
    const reasons: string[] = [];
    const productText = `${product.name} ${product.brand} ${product.category} ${product.notes}`.toLowerCase();
    const firstWord = (s: string) => s.split(' ')[0];

    workingFactors.forEach(factor => {
      if (productText.includes(firstWord(factor))) {
        score += 12;
        reasons.push('correlated with improvement');
      }
    });
    notWorkingFactors.forEach(factor => {
      if (productText.includes(firstWord(factor))) {
        score -= 18;
        reasons.push('may not be helping');
      }
    });

    // Boost if it addresses a high-priority recommendation from the scan
    latestAnalysis.recommendations.filter(r => r.priority === 'high').forEach(rec => {
      const catMatch = rec.category && product.category.toLowerCase().includes(rec.category.toLowerCase());
      const nameMatch = rec.product?.name.toLowerCase().includes(firstWord(product.name.toLowerCase()));
      if (catMatch || nameMatch) {
        score += 10;
        reasons.push(`addresses ${rec.category}`);
      }
    });

    return {
      ...product,
      effectivenessScore: Math.min(100, Math.max(0, Math.round(score))),
      reason: reasons.length > 0 ? reasons[0] : `Rated ${product.rating}/5 by you`,
    };
  }).sort((a, b) => b.effectivenessScore - a.effectivenessScore);

  // ── Optimised routine from latest scan ───────────────────────────────────
  // If a shelf product is in the same category as a routine step's product, prefer it
  const replaceIfBetter = (step: RoutineStep): RoutineStep => {
    if (!shelf.length) return step;
    const stepProductLower = step.product.toLowerCase();
    const match = productRankings.find(p =>
      p.effectivenessScore >= 70 &&
      p.category.toLowerCase().includes(step.step.toLowerCase().split(' ')[0]) &&
      !stepProductLower.includes(p.name.toLowerCase().split(' ')[0])
    );
    if (match) {
      return { ...step, product: `${match.name} (${match.brand}) — already on your shelf` };
    }
    return step;
  };

  const morning = latestAnalysis.routine
    .filter(s => s.time === 'morning' || s.time === 'both')
    .sort((a, b) => a.order - b.order)
    .map(replaceIfBetter);

  const evening = latestAnalysis.routine
    .filter(s => s.time === 'evening' || s.time === 'both')
    .sort((a, b) => a.order - b.order)
    .map(replaceIfBetter);

  // ── Swap suggestions ──────────────────────────────────────────────────────
  const swapSuggestions: SwapSuggestion[] = [];
  latestAnalysis.recommendations.forEach(rec => {
    if (!rec.product) return;
    const recNameLower = rec.product.name.toLowerCase();
    const shelfAlt = shelf.find(s =>
      s.category.toLowerCase().includes(rec.product!.category.toLowerCase()) &&
      !recNameLower.includes(s.name.toLowerCase().split(' ')[0]) &&
      s.rating >= 4
    );
    if (shelfAlt && swapSuggestions.length < 3) {
      swapSuggestions.push({
        current: rec.product.name,
        currentBrand: rec.product.brand,
        suggested: shelfAlt.name,
        suggestedBrand: shelfAlt.brand,
        reason: `Already on your shelf — rated ${shelfAlt.rating}/5`,
      });
    }
  });

  // ── Gap analysis ──────────────────────────────────────────────────────────
  const gapAnalysis: GapItem[] = [];
  latestAnalysis.recommendations
    .filter(r => r.priority === 'high' && r.product)
    .forEach(rec => {
      if (gapAnalysis.length >= 4) return;
      const recNameFirst = rec.product!.name.toLowerCase().split(' ')[0];
      const onShelf = shelf.some(s =>
        s.name.toLowerCase().includes(recNameFirst) ||
        s.category.toLowerCase().includes(rec.product!.category.toLowerCase())
      );
      if (!onShelf) {
        gapAnalysis.push({
          gap: rec.category,
          recommendation: `${rec.product!.name} (${rec.product!.brand}) — ${rec.product!.why}`,
          priority: rec.priority === 'low' ? 'medium' : rec.priority,
        });
      }
    });

  // If no shelf products at all, surface top 3 scan recommendations as gaps
  if (shelf.length === 0 && gapAnalysis.length === 0) {
    latestAnalysis.recommendations.slice(0, 3).forEach(rec => {
      if (rec.product) {
        gapAnalysis.push({
          gap: rec.category,
          recommendation: `${rec.product.name} (${rec.product.brand}) — ${rec.product.why}`,
          priority: rec.priority === 'low' ? 'medium' : rec.priority,
        });
      }
    });
  }

  return { morning, evening, productRankings, swapSuggestions, gapAnalysis };
}
