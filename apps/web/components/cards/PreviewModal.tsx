'use client';

import { useEffect, useState } from 'react';
import type { GalleryItem } from './types';
import { CopyIcon, RefreshIcon, CloseIcon, ThemeIcon } from '../icons';
import { Dialog, DialogContent } from '@repo/ui/dialog';
import { Button } from '@/components/ui/button';

export function PreviewModal({ item, onClose }: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const [imgKey, setImgKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const copyImage = () => {
    navigator.clipboard?.writeText(item.previewImage);
  };

  const copyName = () => {
    navigator.clipboard?.writeText(item.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0"
        style={{ width: '75%', maxWidth: 'none' }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-white">
            <span className="text-zinc-400"><ThemeIcon /></span>
            <h2 className="truncate text-[16px] font-semibold">{item.name}</h2>
          </div>
          <div className="flex items-center gap-1 text-zinc-300">
            <Button variant="ghost" size="icon" onClick={copyImage} title="Copy image link">
              <CopyIcon />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setImgKey((k) => k + 1)} title="Refresh">
              <RefreshIcon />
            </Button>
            <Button variant="ghost" size="sm" onClick={copyName}>
              <CopyIcon />
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} title="Close">
              <CloseIcon />
            </Button>
          </div>
        </header>
        <section className="p-4">
          <div className="overflow-hidden rounded-xl bg-black/40">
            <img
              key={imgKey}
              src={item.previewImage}
              alt={item.name}
              className="block w-full max-h-[70vh] object-contain"
            />
          </div>
          {item.description && (
            <p className="mt-3 text-[13px] text-zinc-400">{item.description}</p>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
