export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Обо мне</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Навыки</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>React и React Hooks</li>
          <li>TypeScript</li>
          <li>Next.js и App Router</li>
          <li>Tailwind CSS</li>
          <li>Vite и современный JavaScript</li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Опыт работы</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Веб-разработчик (2023 — настоящее время)</h3>
            <p className="text-gray-600">
              Разработка SPA и многостраничных приложений на React и Next.js.
              Участие в проектах с использованием TypeScript и Tailwind CSS.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Стажёр фронтенд-разработчик (2022 — 2023)</h3>
            <p className="text-gray-600">
              Изучение основ React, работа с REST API, верстка по макетам.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
