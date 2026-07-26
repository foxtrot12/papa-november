import type { ApiAdapter } from '../types';

export const HarryPotterAdapter: ApiAdapter = {
  id: 'harrypotter',
  name: 'Harry Potter API',
  subcategories: [
    { id: 'characters', name: 'All Characters' },
    { id: 'characters/students', name: 'Hogwarts Students' },
    { id: 'characters/staff', name: 'Hogwarts Staff' },
    { id: 'spells', name: 'Spells & Incantations' }
  ],
  async fetchItems(subcategoryId: string): Promise<string[]> {
    const response = await fetch(`https://hp-api.onrender.com/api/${subcategoryId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Harry Potter API: Status ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format from Harry Potter API: expected an array.");
    }
    return data
      .map((item: any) => item.name)
      .filter((name: any) => typeof name === 'string' && name.trim().length > 0);
  }
};
