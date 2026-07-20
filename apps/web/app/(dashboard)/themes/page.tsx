import { CardGallery } from '@/components/cards/CardGallery';
import { getThemes } from '@/lib/data/gallery';

export default function ThemesPage() {
  const items = getThemes();
  return (
    <CardGallery items={items} />
  );
}
