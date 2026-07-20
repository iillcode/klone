import { notFound } from 'next/navigation';
import { CardGallery } from '@/components/cards/CardGallery';
import { getTemplates } from '@/lib/data/gallery';

const labels: Record<string, string> = {
  all: 'All Templates',
  landing: 'Landing',
  portfolio: 'Portfolio',
  blog: 'Blog',
};

export default async function TemplatesCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!(category in labels)) notFound();
  const items = getTemplates(category);
  return (
    <CardGallery items={items} />
  );
}
