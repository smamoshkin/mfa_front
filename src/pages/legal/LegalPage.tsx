import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../../components/layout/ThemeToggle';
import FaappLogo from '../../components/layout/FaappLogo';
import SiteFooter from '../../components/layout/SiteFooter';
import Markdown from '../../components/legal/Markdown';

interface LegalPageProps {
  /** Заголовок вкладки браузера */
  title: string;
  /** Подготовленный markdown-текст документа */
  source: string;
}

/**
 * Общий каркас юридических страниц (/privacy, /offer, /consent):
 * хедер в стиле лендинга + читаемая колонка текста + футер с перекрёстными ссылками.
 * Публичная страница — доступна и гостям, и залогиненным.
 */
export default function LegalPage({ title, source }: LegalPageProps) {
  useEffect(() => {
    document.title = `${title} — faapp`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen bg-app text-app">
      {/* ---------------- Хедер ---------------- */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="faapp — на главную">
            <FaappLogo size="lg" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/"
              className="flex items-center gap-1.5 px-4 py-2 text-app-2 hover:text-app font-medium rounded-xl hover:bg-hover transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">На главную</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------- Текст документа ---------------- */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Markdown source={source} />
      </main>

      {/* ---------------- Футер (общий с лендингом, полноширинный) ---------------- */}
      <SiteFooter />
    </div>
  );
}
