'use client';

import { useState } from 'react';
import type { GalleryItem } from './types';
import { PreviewCard } from './PreviewCard';
import { PreviewModal } from './PreviewModal';
import { SearchIcon } from '../icons';

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[4px] overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <SearchIcon />
      <p>No items found</p>
    </div>
  );
}

export function CardGallery({
  items,
}: {
  items: GalleryItem[];
}) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  return (
    <div className="max-w-7xl w-full">
      {items.length === 0 ? (
        <Empty />
      ) : (
        <Grid>
          {items.map((item) => (
            <PreviewCard key={item.id} item={item} onSelect={() => setSelected(item)} />
          ))}
        </Grid>
      )}
      {selected && <PreviewModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
