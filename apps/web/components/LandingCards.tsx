'use client';

import { useRouter } from 'next/navigation';

const templates = [
  { id: 'blank', name: 'Blank HTML', desc: 'Start from scratch', icon: '&lt;/&gt;' },
  { id: 'api-docs', name: 'API Docs', desc: 'PDF Generator API template', icon: '[]' },
  { id: 'landing-page', name: 'Landing Page', desc: 'Marketing landing page', icon: '~~' },
  { id: 'email', name: 'Email Template', desc: 'Responsive email', icon: '@' },
];

export function LandingCards() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center h-full w-full p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Welcome to Klone</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a template to get started with your preview.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => router.push(`/preview/${t.id}`)}
              className="text-left p-5 rounded-xl bg-card border border-card-border hover:border-accent-hover/40 transition-colors"
            >
              <div className="text-xl mb-2">{t.icon}</div>
              <div className="font-medium text-sm text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
