import type { ApiAdapter } from '../types';
import { FallbackAdapter } from './fallback';
import { StarTrekAdapter } from './stapi';
import { PokeApiAdapter } from './pokeapi';
import { RickAndMortyAdapter } from './rickandmorty';
import { HarryPotterAdapter } from './harrypotter';

export const adapters: ApiAdapter[] = [
  StarTrekAdapter,
  PokeApiAdapter,
  RickAndMortyAdapter,
  HarryPotterAdapter,
  FallbackAdapter
];

export function getAdapter(id: string): ApiAdapter {
  return adapters.find(a => a.id === id) || FallbackAdapter;
}
