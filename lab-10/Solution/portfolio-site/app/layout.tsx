import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AlexanderDev | Портфолио и Блог',
  description: 'Личный сайт-портфолио Александра Целенко, посвященный разработке ПО',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
          <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="text-xl font-extrabold tracking-tight">
              <a href="/" className="hover:text-teal-400 transition-colors">AlexanderDev</a>
            </div>
            <ul className="flex space-x-6 text-sm font-semibold uppercase tracking-wider">
              <li><a href="/" className="hover:text-teal-400 transition-colors">Главная</a></li>
              <li><a href="/about" className="hover:text-teal-400 transition-colors">Обо мне</a></li>
              <li><a href="/blog" className="hover:text-teal-400 transition-colors">Блог</a></li>
              <li><a href="/projects" className="hover:text-teal-400 transition-colors">Проекты</a></li>
            </ul>
          </nav>
        </header>
        <main className="container mx-auto px-6 py-10 flex-grow">
          {children}
        </main>
        <footer className="bg-slate-950 text-slate-500 py-8 text-center text-sm border-t border-slate-900 mt-auto">
          <p>© {new Date().getFullYear()} AlexanderDev. Разработано на Next.js (App Router).</p>
        </footer>
      </body>
    </html>
  )
}
