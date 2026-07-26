import type { ApiAdapter } from '../types';

export const FALLBACK_ADJECTIVES = [
  "quantum", "cyber", "cosmic", "stellar", "hyper", "neon", "solar", "lunar",
  "shadow", "spectral", "velocity", "atomic", "plasma", "crypto", "nexus",
  "aurora", "vortex", "omega", "alpha", "infinite", "sonic", "phoenix",
  "titan", "nebula", "glitch", "magnetic", "kinetic", "static", "holographic",
  "obsidian", "emerald", "cobalt", "crimson", "amber", "phantom", "radiant"
];

export const FALLBACK_NOUNS = [
  "forge", "matrix", "vector", "horizon", "beacon", "odyssey", "pulsar",
  "anomaly", "prism", "sentinel", "vertex", "cipher", "bastion", "apex",
  "comet", "rift", "vanguard", "catalyst", "orbit", "specter", "paradox",
  "synergy", "entropy", "genesis", "pinnacle", "summit", "cortex", "cascade",
  "nexus", "nucleus", "haven", "spire", "zenith", "threshold", "legacy"
];

export const FallbackAdapter: ApiAdapter = {
  id: 'fallback',
  name: 'Local Backup (Offline)',
  subcategories: [
    { id: 'all', name: 'Mixed Adjectives & Nouns' },
    { id: 'adjectives', name: 'Adjectives Only' },
    { id: 'nouns', name: 'Nouns Only' }
  ],
  async fetchItems(subcategoryId: string): Promise<string[]> {
    if (subcategoryId === 'adjectives') {
      return FALLBACK_ADJECTIVES;
    }
    if (subcategoryId === 'nouns') {
      return FALLBACK_NOUNS;
    }
    return [...FALLBACK_ADJECTIVES, ...FALLBACK_NOUNS];
  }
};
