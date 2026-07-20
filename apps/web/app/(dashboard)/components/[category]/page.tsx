import { notFound } from 'next/navigation';
import { CardGallery } from '@/components/cards/CardGallery';
import { getComponents } from '@/lib/data/gallery';

const labels: Record<string, string> = {
  all: 'All Components',
  ui: 'UI Components',
  marketing: 'Marketing Blocks',
  effects: 'Effects',
};

export default async function ComponentsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!(category in labels)) notFound();
  const items = getComponents(category);
  return (
    <CardGallery items={items} />
  );
}
