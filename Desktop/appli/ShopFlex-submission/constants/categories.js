export const CATEGORIES = [
  'electronics',
  'clothing',
  'home',
  'beauty',
  'sports',
  'books',
  'toys',
  'food',
  'other'
];

export const getCategoryLabel = (category) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
}; 