import React from 'react';

interface ProjectCardProps {
  title: string;
  description: string;
  stack: string[];
  linkUrl?: string;
  repoUrl?: string;
}

export default function ProjectCard({ 
  title, 
  description, 
  stack,
  linkUrl,
  repoUrl
}: ProjectCardProps) {
  return (
    <div className="flex flex-col bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
      <h3 className="text-xl font-bold mb-2 text-slate-800 tracking-tight">{title}</h3>
      <p className="text-slate-600 text-sm mb-5 leading-relaxed flex-grow">{description}</p>
      
      <div className="mb-6 flex flex-wrap gap-1.5">
        {stack.map((tech, i) => (
          <span 
            key={i} 
            className="px-2.5 py-0.5 bg-teal-50 text-teal-800 text-xs font-semibold rounded-lg"
          >
            {tech}
          </span>
        ))}
      </div>
      
      <div className="flex gap-3 border-t border-slate-100/80 pt-4 mt-auto">
        {linkUrl && (
          <a 
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-teal-600 text-white text-sm py-2 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-sm"
          >
            Демо
          </a>
        )}
        {repoUrl && (
          <a 
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-slate-900 text-white text-sm py-2 rounded-xl font-bold hover:bg-slate-950 transition-colors shadow-sm"
          >
            Репозиторий
          </a>
        )}
      </div>
    </div>
  )
}
