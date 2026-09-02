import { Link } from 'react-router-dom';
import FaappLogo from './FaappLogo';

/**
 * Общий футер сайта — используется на лендинге и юридических страницах.
 * Полноширинная полоса под контентом (border-t), внутри контейнер max-w-6xl
 * с колонками: бренд, «Поддержка», «Правовая информация».
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr] text-sm">
          {/* Бренд */}
          <div>
            <div className="flex items-center gap-2.5">
              <FaappLogo size="md" />
              <span className="font-semibold text-app">faapp</span>
            </div>
          </div>

          {/* Поддержка */}
          <div>
            <h4 className="font-semibold text-app mb-3">Поддержка</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:support@faapp.ru" className="text-app-2 hover:text-app transition">
                  support@faapp.ru
                </a>
              </li>
              {/* Заглушка: раздел документации ещё не создан — см. TODO (5.1) */}
              <li>
                <a href="#" className="text-app-2 hover:text-app transition">
                  Документация
                </a>
              </li>
            </ul>
          </div>

          {/* Правовая информация */}
          <div>
            <h4 className="font-semibold text-app mb-3">Правовая информация</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/offer" className="text-app-2 hover:text-app transition">
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-app-2 hover:text-app transition">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/consent" className="text-app-2 hover:text-app transition">
                  Согласие на обработку ПД
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя строка */}
        <div className="mt-10 pt-6 border-t border-card text-center sm:text-left text-app-muted">
          © 2026 faapp
        </div>
      </div>
    </footer>
  );
}
