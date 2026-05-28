import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-indigo-200 mb-6">
        <svg className="w-32 h-32 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-5xl font-extrabold text-slate-800 mb-4">404 - Статья не найдена</h1>
      <p className="text-xl text-slate-500 mb-10 max-w-md mx-auto">
        Кажется, вы перешли по неверной ссылке, или данная статья была удалена.
      </p>
      <Link 
        href="/blog"
        className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
      >
        Вернуться в блог
      </Link>
    </div>
  )
}
