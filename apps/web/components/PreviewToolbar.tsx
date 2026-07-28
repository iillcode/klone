'use client';

import { type SVGProps } from 'react';
import { CopyIcon } from '@/components/icons';

function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function PaintIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072" />
    </svg>
  );
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

function AlignLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5" />
    </svg>
  );
}

function AlignCenterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3h7.5M8.25 12h4.5m-4.5 5.25h6" />
    </svg>
  );
}

function AlignRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3h-7.5M15.75 12H21m-11.25 5.25h7.5" />
    </svg>
  );
}

export interface ElementInfo {
  tag: string;
  classes: string;
  styles: Record<string, string>;
}

interface PreviewToolbarProps {
  selectedElement: ElementInfo | null;
  onApplyStyle: (property: string, value: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
}

function parseRgbToHex(color: string): string {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return '#000000';
  if (color.startsWith('#')) return color;
  const m = color.match(/(\d+)/g);
  if (m) {
    const r = parseInt(m[0]).toString(16).padStart(2, '0');
    const g = parseInt(m[1]).toString(16).padStart(2, '0');
    const b = parseInt(m[2]).toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }
  return '#000000';
}

function cssPx(val: string): number {
  return parseInt(val) || 0;
}

export function PreviewToolbar({
  selectedElement,
  onApplyStyle,
  onDelete,
  onEdit,
  onDownload,
  onCopy,
}: PreviewToolbarProps) {
  const s = selectedElement?.styles;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-sidebar border border-sidebar-border select-none">
      {selectedElement && s ? (
        <>
          <span className="px-1.5 py-0.5 rounded bg-[#27272a] text-[#a1a1aa] text-[11px] font-mono leading-none">
            &lt;{selectedElement.tag}&gt;
          </span>

          <div className="w-px h-5 bg-[#27272a]" />

          <div className="flex items-center gap-0.5" title="Text alignment">
            <button
              onClick={() => onApplyStyle('textAlign', 'start')}
              className={`w-6 h-6 rounded flex items-center justify-center text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-colors ${s.textAlign === 'start' ? 'bg-[#27272a] text-white' : ''}`}
            >
              <AlignLeftIcon />
            </button>
            <button
              onClick={() => onApplyStyle('textAlign', 'center')}
              className={`w-6 h-6 rounded flex items-center justify-center text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-colors ${s.textAlign === 'center' ? 'bg-[#27272a] text-white' : ''}`}
            >
              <AlignCenterIcon />
            </button>
            <button
              onClick={() => onApplyStyle('textAlign', 'end')}
              className={`w-6 h-6 rounded flex items-center justify-center text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-colors ${s.textAlign === 'end' ? 'bg-[#27272a] text-white' : ''}`}
            >
              <AlignRightIcon />
            </button>
          </div>

          <div className="w-px h-5 bg-[#27272a]" />

          <label className="flex items-center gap-1 text-[#a1a1aa] cursor-pointer" title="Text color">
            <input
              type="color"
              value={parseRgbToHex(s.color)}
              onChange={(e) => onApplyStyle('color', e.target.value)}
              className="w-5 h-5 p-0 rounded cursor-pointer border-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
            />
          </label>

          <label className="flex items-center gap-1 text-[#a1a1aa] cursor-pointer" title="Background color">
            <PaintIcon />
            <input
              type="color"
              value={parseRgbToHex(s.backgroundColor)}
              onChange={(e) => onApplyStyle('backgroundColor', e.target.value)}
              className="w-5 h-5 p-0 rounded cursor-pointer border-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
            />
          </label>

          <div className="w-px h-5 bg-[#27272a]" />

          <label className="flex items-center gap-1 text-[#a1a1aa] text-xs">
            <span>PX</span>
            <input
              type="number"
              value={cssPx(s.paddingTop)}
              onChange={(e) => onApplyStyle('padding', e.target.value + 'px')}
              className="w-12 px-1 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#e4e4e7] text-[11px] text-center [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
              min={0}
              title="Padding (all sides)"
            />
          </label>

          <label className="flex items-center gap-1 text-[#a1a1aa] text-xs">
            <span>MX</span>
            <input
              type="number"
              value={cssPx(s.marginTop)}
              onChange={(e) => onApplyStyle('margin', e.target.value + 'px')}
              className="w-12 px-1 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#e4e4e7] text-[11px] text-center [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
              title="Margin (all sides)"
            />
          </label>

          <label className="flex items-center gap-1 text-[#a1a1aa] text-xs">
            <span>W</span>
            <input
              type="number"
              value={cssPx(s.width) || ''}
              onChange={(e) => onApplyStyle('width', e.target.value + 'px')}
              className="w-14 px-1 py-0.5 rounded bg-[#18181b] border border-[#27272a] text-[#e4e4e7] text-[11px] text-center [appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
              title="Container width (px)"
              min={0}
            />
          </label>

          <div className="w-px h-5 bg-[#27272a]" />

          {onDelete ? (
            <button
              onClick={onDelete}
              className="flex items-center justify-center w-7 h-7 text-[#a1a1aa] hover:text-red-400 hover:bg-[#27272a] rounded-md transition-colors"
              title="Delete element"
            >
              <TrashIcon />
            </button>
          ) : null}
        </>
      ) : null}

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="flex items-center justify-center w-7 h-7 text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] rounded-md transition-colors"
        >
          <EditIcon />
        </button>
        <button
          onClick={onDownload}
          className="flex items-center justify-center w-7 h-7 text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] rounded-md transition-colors"
        >
          <DownloadIcon />
        </button>
        <button
          onClick={onCopy}
          className="flex items-center justify-center w-7 h-7 text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#27272a] rounded-md transition-colors"
        >
          <CopyIcon />
        </button>
      </div>
    </div>
  );
}