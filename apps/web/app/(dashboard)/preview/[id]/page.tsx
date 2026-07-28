'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Project } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { HtmlPreview, type HtmlPreviewHandle, type ElementInfo, type MultiElementInfo } from '@/components/HtmlPreview';
import { PreviewToolbar } from '@/components/PreviewToolbar';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [projects] = useState<Project[]>([]);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [selectedElements, setSelectedElements] = useState<MultiElementInfo | null>(null);
  const [selectedCount, setSelectedCount] = useState(1);
  const previewRef = useRef<HtmlPreviewHandle>(null);

  const handleElementSelect = useCallback((info: ElementInfo | null) => {
    setSelectedElement(info);
    setSelectedElements(null);
    setSelectedCount(1);
  }, []);

  const handleMultiSelect = useCallback((info: MultiElementInfo | null) => {
    setSelectedElements(info);
    setSelectedElement(null);
    setSelectedCount(info?.count ?? 1);
  }, []);

  const handleStyleUpdated = useCallback((property: string, value: string) => {
    setSelectedElement((prev) => {
      if (!prev) return prev;
      return { ...prev, styles: { ...prev.styles, [property]: value } };
    });
  }, []);

  const handleApplyStyle = useCallback((property: string, value: string) => {
    previewRef.current?.applyStyle(property, value);
    setSelectedElement((prev) => {
      if (!prev) return prev;
      return { ...prev, styles: { ...prev.styles, [property]: value } };
    });
  }, []);

  const handleDelete = useCallback(() => {
    previewRef.current?.deleteElement();
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
          previewRef.current?.deleteElement();
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
          onMultiSelect={handleMultiSelect}
          onStyleUpdated={handleStyleUpdated}
        />
        <PreviewToolbar
          selectedElement={selectedElement}
          selectedCount={selectedCount}
          onApplyStyle={handleApplyStyle}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
