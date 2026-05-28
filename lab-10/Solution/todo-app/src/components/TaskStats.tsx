import React from 'react';
import { ITask } from './types';

interface TodoStatsProps {
  tasks: ITask[];
}

export function TaskStats({ tasks }: TodoStatsProps) {
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="flex justify-between items-center mb-2">
        <p className="text-slate-600 font-medium">Завершено задач:</p>
        <p className="text-teal-600 font-bold">{completedCount} из {totalCount}</p>
      </div>
      
      {/* Прогресс выполнения */}
      <div className="w-full bg-slate-200 rounded-full h-3 mb-2 overflow-hidden">
        <div 
          className="bg-teal-600 h-3 rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-slate-500 text-right">{percentage}% готово</p>
    </div>
  );
}
