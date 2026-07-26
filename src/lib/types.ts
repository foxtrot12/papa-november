export interface Subcategory {
  id: string;
  name: string;
}

export interface ApiAdapter {
  id: string;
  name: string;
  subcategories: Subcategory[];
  fetchItems(subcategoryId: string): Promise<string[]>;
}
