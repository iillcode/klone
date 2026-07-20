'use client';

import type { GalleryItem } from './types';
import { Card } from '@repo/ui/card';

export function PreviewCard({ item, onSelect }: {
  item: GalleryItem;
  onSelect: () => void;
}) {
  return (
    <Card
      className="group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden !rounded-none !ring-0 border-b border-r border-white/10 p-3 !pt-3 !bg-[#0d0d0f]"
      onClick={onSelect}
    >
      <img
        src={item.previewImage}
        alt={item.name}
        loading="lazy"
        className="block h-full w-full object-cover !rounded-none"
      />
      <div className="absolute inset-x-0 bottom-0 z-10 flex h-[18%] items-center justify-center !bg-[#0d0d0f] px-3 py-1 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
        <span className="truncate text-center text-[15px] font-medium text-white">{item.name}</span>
      </div>
    </Card>
  );
}
