'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { ThemeToggle } from '@/components/theme-toggle';

interface SidebarProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  activeProjectId?: string;
  overlay?: boolean;
}

export function Sidebar({
  projects,
  onSelectProject,
  activeProjectId,
  overlay,
}: SidebarProps) {
  const [sidebarHover, setSidebarHover] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#22c55e] flex items-center justify-center">
            <span className="text-black font-bold text-sm">K</span>
          </div>
          <span className="text-base font-semibold text-sidebar-foreground">Klone</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 scrollbar-none">
        <div className="space-y-1">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeProjectId === project.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <div className="font-medium truncate">{project.title || project.service_name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {project.service_name}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3">
        <ThemeToggle />
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed left-0 top-0 h-screen z-30">
        <div
          className="absolute left-0 top-0 w-2 h-full z-40"
          onMouseEnter={() => setSidebarHover(true)}
        />
        <div
          className={`w-[280px] h-screen bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out ${
            sidebarHover ? 'translate-x-0' : '-translate-x-full'
          }`}
          onMouseLeave={() => setSidebarHover(false)}
        >
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-[280px] h-screen flex flex-col z-20 bg-sidebar border-r border-sidebar-border">
      {sidebarContent}
    </div>
  );
}
