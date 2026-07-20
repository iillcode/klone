import { CardGallery } from '@/components/cards/CardGallery';
import { getComponents } from '@/lib/data/gallery';

export default function ComponentsPage() {
  const items = getComponents();
  return (
    <CardGallery items={items} />
  );
}
