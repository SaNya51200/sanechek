import React, { useState } from 'react';
import { ITask } from './components/types';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { TaskStats } from './components/TaskStats';

function App() {
  // Локальное состояние списка задач
  const [taskList, setTaskList] = useState<ITask[]>([
    { uid: '1', text: 'Изучить основы React и TypeScript', isCompleted: true },
    { uid: '2', text: 'Выполнить лабораторную работу №10', isCompleted: false },
    { uid: '3', text: 'Подготовить отчет по работе', isCompleted: false },
  ]);

  // Метод для добавления новой задачи в список
  const handleAddTask = (text: string) => {
    const newTask: ITask = {
      uid: crypto.randomUUID(),
      text,
      isCompleted: false,
    };
    // Соблюдаем иммутабельность состояния: создаем новый массив
    setTaskList([...taskList, newTask]);
  };

  // Метод для удаления задачи по ее уникальному идентификатору
  const handleRemoveTask = (uid: string) => {
    // filter возвращает отфильтрованный новый массив
    setTaskList(taskList.filter((task) => task.uid !== uid));
  };

  // Метод для переключения состояния выполнения задачи
  const handleToggleStatus = (uid: string) => {
    // map возвращает преобразованный новый массив
    setTaskList(
      taskList.map((task) =>
        task.uid === uid ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-6 md:p-8">
        <h1 className="text-3xl font-black text-center mb-6 text-slate-800 tracking-tight">
          📝 Менеджер Задач
        </h1>

        <TaskInput onAddTask={handleAddTask} />
        
        <TaskList 
          tasks={taskList} 
          onToggleStatus={handleToggleStatus} 
          onRemove={handleRemoveTask} 
        />
        
        <TaskStats tasks={taskList} />
      </div>
    </div>
  );
}

export default App;
