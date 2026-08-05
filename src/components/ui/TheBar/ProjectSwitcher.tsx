import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProjectItem } from './types';

interface ProjectSwitcherProps {
  projects: ProjectItem[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  compact?: boolean;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  compact = false,
}) => {
  const currentIndex = Math.max(
    0,
    projects.findIndex((p) => p.id === activeProjectId)
  );
  const currentProject = projects[currentIndex] || projects[0] || { id: 'default', name: 'DevSpace' };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + projects.length) % projects.length;
    onSelectProject(projects[prevIdx].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % projects.length;
    onSelectProject(projects[nextIdx].id);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-100 hover:text-cyan-300 transition-colors">
        <button
          onClick={handlePrev}
          className="p-0.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white cursor-pointer"
          title="Previous Project"
        >
          <ChevronLeft size={12} />
        </button>
        <span className="truncate max-w-[120px] text-[11px] tracking-tight">{currentProject.name}</span>
        <button
          onClick={handleNext}
          className="p-0.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white cursor-pointer"
          title="Next Project"
        >
          <ChevronRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-slate-300 font-semibold">
      <span className="text-slate-400">Project:</span>
      <button
        onClick={handlePrev}
        className="p-0.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white cursor-pointer"
        title="Previous Project"
      >
        <ChevronLeft size={11} />
      </button>
      <span className="text-cyan-300 font-bold tracking-tight">{currentProject.name}</span>
      <button
        onClick={handleNext}
        className="p-0.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white cursor-pointer"
        title="Next Project"
      >
        <ChevronRight size={11} />
      </button>
    </div>
  );
};
