export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-4">
      <h1 className="text-4xl font-extrabold mb-8 text-slate-800 tracking-tight">Обо мне</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Технические навыки
          </h2>
          <ul className="space-y-3">
            {[
              'Backend-разработка: Python (FastAPI), Node.js (Express)',
              'Работа с СУБД: PostgreSQL, MongoDB, SQLite',
              'DevOps & Deploy: Docker, Docker Compose, CI/CD (GitHub Actions)',
              'Frontend-стек: React, Next.js, Tailwind CSS',
              'Безопасность и анализ кода: SAST (Bandit), SCA (npm audit)',
              'Интеграция с ИИ (GigaChat API) и облачными БД (Airtable)'
            ].map((skill, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-2.5 shrink-0"></div>
                <span className="text-slate-700 font-medium text-sm leading-relaxed">{skill}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
            <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Опыт и проекты
          </h2>
          <div className="space-y-6">
            <div className="border-l-4 border-teal-200 pl-4 py-1">
              <h3 className="text-lg font-bold text-slate-800">Fullstack Разработчик</h3>
              <p className="text-sm text-teal-600 font-semibold mb-2">ООО "АйТи-Вектор" • 2025 - Настоящее время</p>
              <p className="text-slate-600 text-sm leading-relaxed">Разработка веб-сервисов и API для внутренней автоматизации процессов. Поддержка и доработка микросервисной архитектуры.</p>
            </div>
            <div className="border-l-4 border-teal-200 pl-4 py-1">
              <h3 className="text-lg font-bold text-slate-800">Младший разработчик</h3>
              <p className="text-sm text-teal-600 font-semibold mb-2">Проекты под ключ • 2024 - 2025</p>
              <p className="text-slate-600 text-sm leading-relaxed">Создание веб-решений на заказ, разработка парсеров данных и скриптов импорта/экспорта в облачные хранилища.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
