import ProjectCard from '../components/ProjectCard'

const projectList = [
  {
    title: 'Library Management API',
    description: 'Асинхронный RESTful API сервис для автоматизации библиотечного учета. Реализованы CRUD-операции, отслеживание аренды книг, сбор статистики.',
    stack: ['Python', 'FastAPI', 'Pydantic', 'Uvicorn'],
    repoUrl: 'https://github.com/tselenko/library-api'
  },
  {
    title: 'Task Manager Backend',
    description: 'Серверное решение для управления персональными задачами. Поддерживает гибкую фильтрацию, сортировку, полнотекстовый поиск и сбор аналитики.',
    stack: ['Node.js', 'Express', 'Joi Validation', 'REST API'],
    repoUrl: 'https://github.com/tselenko/task-manager-backend'
  },
  {
    title: 'PWA News Aggregator',
    description: 'Прогрессивное веб-приложение для агрегации новостей с поддержкой работы в офлайн-режиме посредством Service Workers и кэширования.',
    stack: ['JavaScript', 'HTML5', 'Tailwind CSS', 'Service Workers'],
    linkUrl: 'https://news-pwa-demo.example.com'
  }
];

export default function ProjectsPage() {
  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Мои Проекты</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Список разработанных веб-сервисов и приложений, демонстрирующих навыки проектирования архитектуры ПО.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectList.map((proj, index) => (
          <ProjectCard 
            key={index}
            title={proj.title}
            description={proj.description}
            stack={proj.stack}
            linkUrl={proj.linkUrl}
            repoUrl={proj.repoUrl}
          />
        ))}
      </div>
    </div>
  )
}
