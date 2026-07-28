'use client';

import { Project } from '@/lib/types';

interface SidebarProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  activeProjectId?: string;
}

export function Sidebar({
  projects,
  onSelectProject,
  activeProjectId,
}: SidebarProps) {
  return (
    <div className="fixed top-0 left-0 w-[280px] h-screen flex flex-col z-20">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#22c55e] flex items-center justify-center">
            <span className="text-black font-bold text-sm">K</span>
          </div>
          <span className="text-base font-semibold text-white">Klone</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3">
        <div className="space-y-1">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeProjectId === project.id
                  ? 'bg-[#27272a] text-white'
                  : 'text-[#a1a1aa] hover:bg-[#1a1a1d] hover:text-[#e4e4e7]'
              }`}
            >
              <div className="font-medium truncate">{project.title || project.service_name}</div>
              <div className="text-xs text-[#71717a] mt-0.5 truncate">
                {project.service_name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
