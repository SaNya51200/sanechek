import React from 'react';
import { ITask } from './types';

interface TodoItemProps {
  task: ITask;
  onToggleStatus: (uid: string) => void;
  onRemove: (uid: string) => void;
}

export function TaskItem({ task, onToggleStatus, onRemove }: TodoItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:shadow transition-all group">
      <div className="flex items-center gap-3 flex-grow">
        <label className="inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={task.isCompleted}
            onChange={() => onToggleStatus(task.uid)}
            className="peer sr-only"
          />
          <div className="w-6.5 h-6.5 border-2 border-slate-300 rounded-lg peer-checked:bg-teal-600 peer-checked:border-teal-600 transition-all flex items-center justify-center">
            {task.isCompleted && (
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
        <span className={`text-base font-normal transition-all duration-300 ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.text}
        </span>
      </div>
      <button
        onClick={() => onRemove(task.uid)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
        aria-label="Удалить задачу"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
