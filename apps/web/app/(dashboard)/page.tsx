'use client';

import { useState } from 'react';
import { Project } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { LandingCards } from '@/components/LandingCards';

export default function Home() {
  const [projects] = useState<Project[]>([]);
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
      <LandingCards />
    </div>
  );
}
