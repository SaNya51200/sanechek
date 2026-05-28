export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-12 py-10">
      <section className="space-y-6 max-w-3xl">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
          Создаю надежное и эффективное ПО
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Привет! Меня зовут Александр. Я занимаюсь проектированием, разработкой и сопровождением современных веб-приложений и сервисов.
        </p>
        <div className="pt-4">
          <a 
            href="/projects" 
            className="inline-block px-8 py-3.5 bg-teal-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Посмотреть проекты
          </a>
        </div>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100/80 hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-800">Backend API</h2>
          <p className="text-slate-600 text-sm leading-relaxed">Разработка серверной логики на FastAPI и Express.js с высокой скоростью обработки запросов.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100/80 hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-800">Базы данных</h2>
          <p className="text-slate-600 text-sm leading-relaxed">Работа с реляционными (PostgreSQL) и документо-ориентированными (MongoDB) СУБД, оптимизация индексов.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100/80 hover:shadow-md transition-shadow text-left">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-800">Контейнеризация и CI/CD</h2>
          <p className="text-slate-600 text-sm leading-relaxed">Автоматизация сборки и деплоя с Docker и GitHub Actions, обеспечение непрерывной интеграции.</p>
        </div>
      </section>
    </div>
  )
}
