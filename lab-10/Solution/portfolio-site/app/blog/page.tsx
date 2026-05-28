import Link from 'next/link';
import { articleList } from './data';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function BlogList() {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-4xl font-extrabold mb-10 text-slate-800 border-b pb-4">Журнал разработчика</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articleList.map((article) => {
          const formattedDate = format(parseISO(article.publishedAt), 'd MMMM yyyy', { locale: ru });
          
          return (
            <article key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all flex flex-col overflow-hidden group">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-center mb-4 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                  <time dateTime={article.publishedAt}>{formattedDate}</time>
                </div>
                <h2 className="text-2xl font-bold mb-3 text-slate-800 group-hover:text-indigo-600 transition-colors">
                  <Link href={`/blog/${article.slug}`}>
                    <span className="absolute inset-0"></span>
                    {article.title}
                  </Link>
                </h2>
                <p className="text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {article.summary}
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                <span className="font-medium">{article.authorName}</span>
                <span className="text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center">
                  Читать <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  );
}
