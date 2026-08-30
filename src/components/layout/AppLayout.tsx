import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import GuidedTour from '../onboarding/GuidedTour';
import ThemeToggle from './ThemeToggle';
import FaappLogo from './FaappLogo';
import { LogOut, Menu, User, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/analytics', label: 'Аналитика' },
  { to: '/products', label: 'Товары' },
  { to: '/taxes', label: 'Налоговые ставки' },
];

/**
 * Общий каркас приложения: хедер с навигацией + контент страницы.
 * Страницы больше не рисуют свой хедер — только содержимое <main>.
 */
export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-medium px-1 pb-1 border-b-2 transition ${
      isActive
        ? 'text-primary border-primary'
        : 'text-app-muted hover:text-app-2 hover:border-input border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="bg-card shadow-sm border-b border-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип + основная навигация */}
            <div className="flex items-center">
              <Link to="/analytics" className="flex items-center mr-8" title="FAAPP">
                <FaappLogo />
              </Link>

              <nav data-tour="nav" className="hidden md:flex space-x-8">
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} className={navLinkClass} end>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Пользователь */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <Link
                to="/profile"
                data-tour="profile"
                className="flex items-center space-x-2 p-2 hover:bg-hover rounded-lg transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-app-2 hidden sm:inline">
                  {user?.name || user?.email || 'Профиль'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                title="Выйти"
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Мобильное меню */}
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 text-app-muted hover:bg-hover rounded-lg transition"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Мобильная навигация */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-card bg-card px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg font-medium transition ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-app-2 hover:bg-hover'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <GuidedTour />
    </div>
  );
}
