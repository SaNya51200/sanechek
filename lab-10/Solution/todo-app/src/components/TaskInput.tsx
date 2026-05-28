import React, { useState } from 'react';

interface TodoInputProps {
  onAddTask: (text: string) => void;
}

export function TaskInput({ onAddTask }: TodoInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onAddTask(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 mb-6">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Введите новую задачу..."
        className="flex-grow px-4 py-2.5 text-base border border-slate-200 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
      />
      <button
        onClick={handleSubmit}
        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-2xl transition-all shadow-sm active:scale-95"
      >
        Добавить
      </button>
    </div>
  );
}
