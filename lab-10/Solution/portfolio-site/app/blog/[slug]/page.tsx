import { notFound } from 'next/navigation';
import { articleList } from '../data';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// Данный метод используется в Next.js для генерации статических путей (SSG).
// Он собирает все возможные значения slug из нашего массива данных (или БД),
// и Next.js во время выполнения npm run build заранее генерирует HTML для каждой статьи.
// Это обеспечивает высокую скорость загрузки страниц и отличный SEO.
export async function generateStaticParams() {
  return articleList.map((article) => ({
    slug: article.slug,
  }));
}

export default function ArticlePage({
  params,
}: {
  params: { slug: string }
}) {
  const article = articleList.find(a => a.slug === params.slug);
  
  if (!article) {
    // Вызов notFound() перенаправит пользователя на страницу app/blog/[slug]/not-found.tsx
    notFound();
  }

  const formattedDate = format(parseISO(article.publishedAt), 'd MMMM yyyy', { locale: ru });

  return (
    <article className="max-w-3xl mx-auto py-10">
      <header className="mb-10 text-center">
        <div className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold mb-6">
          <time dateTime={article.publishedAt}>{formattedDate}</time>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          {article.title}
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Автор: {article.authorName}
        </p>
      </header>
      
      <div className="prose prose-lg prose-indigo mx-auto text-slate-700 whitespace-pre-wrap leading-relaxed">
        {article.content}
      </div>
      
      <div className="mt-16 pt-8 border-t border-slate-200 text-center">
        <Link 
          href="/blog"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Назад к статьям
        </Link>
      </div>
    </article>
  );
}
