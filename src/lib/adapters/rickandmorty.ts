import type { ApiAdapter } from '../types';

export const RickAndMortyAdapter: ApiAdapter = {
  id: 'rickandmorty',
  name: 'Rick and Morty API',
  subcategories: [
    { id: 'character', name: 'Characters' },
    { id: 'location', name: 'Locations' },
    { id: 'episode', name: 'Episodes' }
  ],
  async fetchItems(subcategoryId: string): Promise<string[]> {
    const response = await fetch(`https://rickandmortyapi.com/api/${subcategoryId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Rick and Morty API: Status ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.results)) {
      throw new Error("Unexpected response format from Rick & Morty API: missing 'results' array.");
    }
    return data.results
      .map((item: any) => item.name)
      .filter((name: any) => typeof name === 'string' && name.trim().length > 0);
  }
};
