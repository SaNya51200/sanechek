import React from 'react';
import { ITask } from './types';
import { TaskItem } from './TaskItem';

interface TodoListProps {
  tasks: ITask[];
  onToggleStatus: (uid: string) => void;
  onRemove: (uid: string) => void;
}

export function TaskList({ tasks, onToggleStatus, onRemove }: TodoListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
        <p className="text-slate-500 text-lg font-medium">Нет текущих задач</p>
        <p className="text-slate-400 text-sm mt-1">Добавьте новую задачу выше, чтобы начать.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.uid}
          task={task}
          onToggleStatus={onToggleStatus}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
