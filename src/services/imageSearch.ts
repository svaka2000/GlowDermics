/**
 * Image search service
 * - Open Beauty Facts: real cosmetic product data + images (no auth)
 * - Open Food Facts: real food/nutrition data + images (no auth)
 * - Curated Unsplash CDN: lifestyle/skincare images by topic (no auth, public CDN)
 * - Pexels API: if EXPO_PUBLIC_PEXELS_API_KEY is set (optional)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const CACHE_PREFIX = 'gd_img_cache_v2_';

interface CacheEntry {
  data: any;
  timestamp: number;
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.data as T;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

export interface ImageResult {
  url: string;
  alt: string;
  thumb?: string;
  credit?: string;
}

export interface ProductResult {
  name: string;
  brand?: string;
  imageUrl?: string;
  ingredients?: string;
  quantity?: string;
}

export interface FoodResult {
  name: string;
  brand?: string;
  imageUrl?: string;
  calories?: number;
  nutriScore?: string;
}

// ─── Open Beauty Facts ─────────────────────────────────────────────────────

export async function searchBeautyProducts(query: string, count = 5): Promise<ProductResult[]> {
  const cacheKey = `beauty_${query}_${count}`;
  const cached = await getCached<ProductResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${count}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'GlowDermics/1.0' } });
    if (!res.ok) return [];
    const json = await res.json();

    const results: ProductResult[] = (json.products || [])
      .filter((p: any) => p.product_name)
      .slice(0, count)
      .map((p: any) => ({
        name: p.product_name || '',
        brand: p.brands || '',
        imageUrl: p.image_url || p.image_front_url || '',
        ingredients: p.ingredients_text || '',
        quantity: p.quantity || '',
      }));

    await setCache(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

// ─── Open Food Facts ────────────────────────────────────────────────────────

export async function searchFoodProducts(query: string, count = 5): Promise<FoodResult[]> {
  const cacheKey = `food_${query}_${count}`;
  const cached = await getCached<FoodResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${count}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'GlowDermics/1.0' } });
    if (!res.ok) return [];
    const json = await res.json();

    const results: FoodResult[] = (json.products || [])
      .filter((p: any) => p.product_name && p.image_url)
      .slice(0, count)
      .map((p: any) => ({
        name: p.product_name || '',
        brand: p.brands || '',
        imageUrl: p.image_url || p.image_front_url || '',
        calories: p.nutriments?.['energy-kcal_100g'] || undefined,
        nutriScore: p.nutrition_grades?.toUpperCase() || undefined,
      }));

    await setCache(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

// ─── Pexels API (optional — only if key is set) ─────────────────────────────

export async function searchPexels(query: string, count = 6): Promise<ImageResult[]> {
  const apiKey = process.env.EXPO_PUBLIC_PEXELS_API_KEY;
  if (!apiKey) return getCuratedImages(query, count);

  const cacheKey = `pexels_${query}_${count}`;
  const cached = await getCached<ImageResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (!res.ok) return getCuratedImages(query, count);
    const json = await res.json();

    const results: ImageResult[] = (json.photos || []).map((p: any) => ({
      url: p.src.large || p.src.medium,
      thumb: p.src.small,
      alt: p.alt || query,
      credit: `Photo by ${p.photographer} on Pexels`,
    }));

    await setCache(cacheKey, results);
    return results;
  } catch {
    return getCuratedImages(query, count);
  }
}

// ─── Curated Unsplash CDN images by topic ───────────────────────────────────
// These are stable Unsplash photo IDs, no API key needed — public CDN

const CURATED: Record<string, string[]> = {
  // Skincare
  skincare: [
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
    'https://images.unsplash.com/photo-1595348020949-87cdfbb44174?w=600',
    'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',
  ],
  moisturizer: [
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600',
  ],
  serum: [
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600',
  ],
  cleanser: [
    'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',
  ],
  sunscreen: [
    'https://images.unsplash.com/photo-1561144257-e32e8de56b0a?w=600',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
  ],
  // Ingredients
  vitamin_c: [
    'https://images.unsplash.com/photo-1582736317408-b3ad7fdfa56e?w=600',
    'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=600',
  ],
  retinol: [
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600',
  ],
  niacinamide: [
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
  ],
  tallow: [
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600',
    'https://images.unsplash.com/photo-1563252722-6434563a985d?w=600',
  ],
  // Foods for skin
  food: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600',
  ],
  salmon: [
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
  ],
  avocado: [
    'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600',
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600',
  ],
  berries: [
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600',
    'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600',
  ],
  green_tea: [
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
  ],
  nuts: [
    'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=600',
  ],
  // Lifestyle
  sleep: [
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600',
    'https://images.unsplash.com/photo-1586049127857-7f1f4eb7f4b1?w=600',
  ],
  yoga: [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
  ],
  water: [
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600',
    'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600',
  ],
  spa: [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600',
  ],
  face: [
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600',
    'https://images.unsplash.com/photo-1614256634715-3b55a49e11e7?w=600',
  ],
};

function getCuratedImages(query: string, count: number): ImageResult[] {
  const q = query.toLowerCase().replace(/\s+/g, '_');
  // Find best matching category
  const key = Object.keys(CURATED).find(k => q.includes(k) || k.includes(q.split('_')[0])) || 'skincare';
  const photos = CURATED[key] || CURATED.skincare;
  return photos.slice(0, count).map(url => ({
    url,
    alt: query,
    thumb: url.replace('w=600', 'w=200'),
  }));
}

export async function searchImages(query: string, count = 6): Promise<ImageResult[]> {
  return searchPexels(query, count);
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

export function getSkincareImage(topic: string): string {
  const q = topic.toLowerCase().replace(/\s+/g, '_');
  const key = Object.keys(CURATED).find(k => q.includes(k) || k.includes(q.split('_')[0])) || 'skincare';
  const photos = CURATED[key] || CURATED.skincare;
  return photos[Math.floor(Math.random() * photos.length)];
}

export function getFoodImage(topic: string): string {
  const q = topic.toLowerCase().replace(/\s+/g, '_');
  const key = Object.keys(CURATED).find(k => q.includes(k) || k.includes(q.split('_')[0])) || 'food';
  const photos = CURATED[key] || CURATED.food;
  return photos[Math.floor(Math.random() * photos.length)];
}
