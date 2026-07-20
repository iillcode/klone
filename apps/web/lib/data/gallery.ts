import { components, themes, templates } from './components';
import type { GalleryItem } from '@/components/cards/types';

const fromComponent = (c: (typeof components)[number]): GalleryItem => ({
  id: c.id,
  name: c.name,
  description: c.description,
  previewImage: c.previewImage,
});

const fromTheme = (t: (typeof themes)[number]): GalleryItem => ({
  id: t.id,
  name: t.name,
  description: t.description,
  previewImage: t.previewImage,
});

const fromTemplate = (t: (typeof templates)[number]): GalleryItem => ({
  id: String(t.id),
  name: t.title,
  description: t.description,
  previewImage: t.image,
});

export function getComponents(category?: string): GalleryItem[] {
  const list =
    !category || category === 'all'
      ? components
      : components.filter((c) => c.category === category);
  return list.map(fromComponent);
}

export function getThemes(category?: string): GalleryItem[] {
  const list =
    !category || category === 'all'
      ? themes
      : themes.filter((t) => t.category === category);
  return list.map(fromTheme);
}

const templateKeywords: Record<string, string[]> = {
  landing: ['landing', 'storefront', 'website'],
  portfolio: ['portfolio', 'canvas', 'slides'],
  blog: ['blog'],
};

export function getTemplates(category?: string): GalleryItem[] {
  const list =
    !category || category === 'all'
      ? templates
      : templates.filter((t) =>
          templateKeywords[category]?.some((k) =>
            (t.title + ' ' + t.description).toLowerCase().includes(k)
          )
        );
  return list.map(fromTemplate);
}
