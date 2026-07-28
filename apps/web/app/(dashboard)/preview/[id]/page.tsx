'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Project } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { HtmlPreview, type HtmlPreviewHandle, type ElementInfo } from '@/components/HtmlPreview';
import { PreviewToolbar } from '@/components/PreviewToolbar';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [projects] = useState<Project[]>([]);
  const [selectedElements, setSelectedElements] = useState<ElementInfo[]>([]);
  const previewRef = useRef<HtmlPreviewHandle>(null);

  const handleElementSelect = useCallback((elements: ElementInfo[] | null) => {
    setSelectedElements(elements ?? []);
  }, []);

  const handleStyleUpdated = useCallback((property: string, value: string) => {
    setSelectedElements((prev) =>
      prev.map((el) => ({ ...el, styles: { ...el.styles, [property]: value } }))
    );
  }, []);

  const handleApplyStyle = useCallback((property: string, value: string) => {
    previewRef.current?.applyStyleMulti(property, value);
    setSelectedElements((prev) =>
      prev.map((el) => ({ ...el, styles: { ...el.styles, [property]: value } }))
    );
  }, []);

  const handleDelete = useCallback(() => {
    previewRef.current?.deleteMulti();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          previewRef.current?.undo();
        }
        if (e.key === 'y') {
          e.preventDefault();
          previewRef.current?.redo();
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          previewRef.current?.deleteMulti();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex w-full h-full">
      <Sidebar
        projects={projects}
        onSelectProject={() => {}}
        overlay
      />
      <div className="flex-1 h-full overflow-hidden relative bg-preview">
        <HtmlPreview
          ref={previewRef}
          onElementSelect={handleElementSelect}
          onStyleUpdated={handleStyleUpdated}
        />
        <PreviewToolbar
          selectedElements={selectedElements}
          onApplyStyle={handleApplyStyle}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
