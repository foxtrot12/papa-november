import type { ApiAdapter } from '../types';

export const StarTrekAdapter: ApiAdapter = {
  id: 'stapi',
  name: 'Star Trek API (STAPI)',
  subcategories: [
    { id: 'character', name: 'Characters' },
    { id: 'spacecraft', name: 'Spacecraft' },
    { id: 'conflict', name: 'Conflicts' },
    { id: 'series', name: 'Series' }
  ],
  async fetchItems(subcategoryId: string): Promise<string[]> {
    const response = await fetch(`https://stapi.co/api/v1/rest/${subcategoryId}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'pageSize=80'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Star Trek API: Status ${response.status}`);
    }

    const data = await response.json();
    
    // Map the subcategory to the plural property keys returned by the STAPI
    const keyMap: Record<string, string> = {
      character: 'characters',
      spacecraft: 'spacecrafts',
      conflict: 'conflicts',
      series: 'series'
    };

    const apiKey = keyMap[subcategoryId] || '';
    const list = data[apiKey];

    if (!Array.isArray(list)) {
      throw new Error(`Unexpected response format from STAPI: missing '${apiKey}' field.`);
    }

    return list
      .map((item: any) => item.name)
      .filter((name: any) => typeof name === 'string' && name.trim().length > 0);
  }
};
