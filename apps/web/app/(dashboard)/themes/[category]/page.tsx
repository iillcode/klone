import { notFound } from 'next/navigation';
import { CardGallery } from '@/components/cards/CardGallery';
import { getThemes } from '@/lib/data/gallery';

const labels: Record<string, string> = {
  all: 'All Themes',
  dark: 'Dark',
  light: 'Light',
  colorful: 'Colorful',
};

export default async function ThemesCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!(category in labels)) notFound();
  const items = getThemes(category);
  return (
    <CardGallery items={items} />
  );
}
