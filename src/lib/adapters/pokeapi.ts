import type { ApiAdapter } from '../types';

export const PokeApiAdapter: ApiAdapter = {
  id: 'pokeapi',
  name: 'PokéAPI (Pokémon)',
  subcategories: [
    { id: 'pokemon', name: 'Pokémon' },
    { id: 'ability', name: 'Abilities' },
    { id: 'move', name: 'Moves' },
    { id: 'item', name: 'Items' }
  ],
  async fetchItems(subcategoryId: string): Promise<string[]> {
    const response = await fetch(`https://pokeapi.co/api/v2/${subcategoryId}?limit=120`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from PokéAPI: Status ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.results)) {
      throw new Error("Unexpected response format from PokéAPI: missing 'results' array.");
    }
    return data.results
      .map((item: any) => item.name)
      .filter((name: any) => typeof name === 'string' && name.trim().length > 0);
  }
};
