'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>();

  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
  };

  return (
    <div className="flex w-full h-full">
      <Sidebar
        projects={projects}
        onSelectProject={handleSelectProject}
        activeProjectId={activeProjectId}
      />

      <div className="flex-1" />
    </div>
  );
}
