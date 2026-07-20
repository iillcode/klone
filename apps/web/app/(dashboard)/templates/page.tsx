import { CardGallery } from '@/components/cards/CardGallery';
import { getTemplates } from '@/lib/data/gallery';

export default function TemplatesPage() {
  const items = getTemplates();
  return (
    <CardGallery items={items} />
  );
}
