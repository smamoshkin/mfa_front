import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import GuidedTour from '../onboarding/GuidedTour';
import ThemeToggle from './ThemeToggle';
import FaappLogo from './FaappLogo';
import {
  BarChart3, LogOut, Menu, User, X, Package, Receipt, ListOrdered, LineChart,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const SIDEBAR_COLLAPSED_KEY = 'faapp-sidebar-collapsed';

/** Подпункты группы «Аналитика» */
const ANALYTICS_CHILDREN = [
  { to: '/analytics/rentability', label: 'Рентабельность', icon: BarChart3 },
  { to: '/analytics/abc', label: 'ABC-анализ', icon: ListOrdered },
  { to: '/analytics/dynamics', label: 'Динамика', icon: LineChart },
];

/**
 * Общий каркас приложения: глобальный collapsible sidebar (навигация всего
 * приложения, заменяет верхний navbar) + контент страницы. Подразделы
 * «Аналитики» — подпункты группы «Аналитика». Состояние свёрнутости
 * сохраняется в localStorage. На мобиле — overlay drawer по бургеру.
 */
export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const onAnalyticsRoute = location.pathname.startsWith('/analytics');
  const onProfileRoute = location.pathname.startsWith('/profile');

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!prev));
      return !prev;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Общий вид пункта меню; в свёрнутом состоянии — иконка по центру рельса
  const itemClass = (isActive: boolean, extra = '') =>
    `flex h-10 items-center rounded-lg text-sm font-medium transition ${extra} ${
      isActive
        ? 'bg-primary-soft text-primary'
        : 'text-app-2 hover:bg-hover hover:text-app'
    } ${isCollapsed ? 'w-11 justify-center' : 'w-full gap-3 px-3'}`;

  return (
    <div className="min-h-screen bg-app">
      {/* ============ Desktop: постоянный collapsible sidebar ============ */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-card bg-card transition-[width] duration-200 ease-out ${
          isCollapsed ? 'w-14' : 'w-60'
        }`}
        aria-label="Навигация приложения"
      >
        {/* Лого + кнопка сворачивания/разворачивания */}
        <div className="flex h-14 items-center border-b border-card px-2 flex-shrink-0">
          {isCollapsed ? (
            /* Свёрнуто: ячейка лого; при наведении лого исчезает и на его
               месте появляется кнопка «развернуть» */
            <div className="group relative h-10 w-10 flex-shrink-0" title="Развернуть меню">
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0">
                <FaappLogo />
              </div>
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Развернуть боковое меню"
                className="absolute inset-0 flex items-center justify-center rounded-lg text-app-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-hover hover:text-app"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/analytics/rentability" className="flex h-10 w-10 flex-shrink-0 items-center justify-center" title="FAAPP">
                <FaappLogo />
              </Link>
              <div className="flex min-w-0 flex-1 items-center justify-end pl-1">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Свернуть боковое меню"
                  title="Свернуть меню"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-app-2 transition hover:bg-hover hover:text-app"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Навигация. ВАЖНО: без overflow — иначе всплывающее меню
            свёрнутого режима обрежется по горизонтали */}
        <nav data-tour="nav" className="flex-1 p-1.5 space-y-4">
          {/* Группа «Аналитика» с подпунктами */}
          <div>
            {!isCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                Аналитика
              </p>
            )}
            <div className="space-y-1">
              {/* Строка группы: ведёт на обзор, подсвечена на любом подразделе.
                  В свёрнутом режиме — всплывающее меню подпунктов справа от рельса */}
              <div className="group/ana relative">
                <Link
                  to="/analytics/rentability"
                  title={isCollapsed ? 'Аналитика' : undefined}
                  className={itemClass(onAnalyticsRoute)}
                >
                  <BarChart3 className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">Обзор</span>}
                </Link>

                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full top-0 z-50 pl-2 opacity-0 transition-opacity duration-150 group-hover/ana:pointer-events-auto group-hover/ana:opacity-100">
                    <div className="w-48 rounded-xl border border-card bg-card shadow-xl p-1.5">
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                        Аналитика
                      </p>
                      {ANALYTICS_CHILDREN.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end
                          className={({ isActive }) =>
                            `flex h-9 items-center rounded-lg text-sm font-medium transition gap-3 px-3 ${
                              isActive
                                ? 'bg-primary-soft text-primary'
                                : 'text-app-2 hover:bg-hover hover:text-app'
                            }`
                          }
                        >
                          <child.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Подпункты — только в развёрнутом виде */}
              {!isCollapsed && (
                <div className="mt-1 space-y-1">
                  {ANALYTICS_CHILDREN.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end
                      title={child.label}
                      className={({ isActive }) =>
                        `flex h-10 items-center rounded-lg text-sm font-medium transition w-full gap-3 pl-9 pr-3 ${
                          isActive
                            ? 'bg-primary-soft text-primary'
                            : 'text-app-2 hover:bg-hover hover:text-app'
                        }`
                      }
                    >
                      <child.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Группа «Каталог» */}
          <div>
            {!isCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-app-muted">
                Каталог
              </p>
            )}
            <div className="space-y-1">
              <NavLink to="/products" title="Товары" className={({ isActive }) => itemClass(isActive)}>
                <Package className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Товары</span>}
              </NavLink>
              <NavLink to="/taxes" title="Налоговые ставки" className={({ isActive }) => itemClass(isActive)}>
                <Receipt className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Налоговые ставки</span>}
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Низ: тема, профиль, выход */}
        <div className="border-t border-card p-1.5 space-y-1 flex-shrink-0">
          <div className={`flex h-10 items-center ${isCollapsed ? 'w-11 justify-center' : 'w-full px-3'}`}>
            <ThemeToggle />
          </div>

          <NavLink
            to="/profile"
            data-tour="profile"
            title="Профиль"
            className={() => itemClass(onProfileRoute)}
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="whitespace-nowrap truncate">{user?.name || user?.email || 'Профиль'}</span>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            title="Выйти"
            className="flex h-10 items-center rounded-lg text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 w-full gap-3 px-3"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Выйти</span>}
          </button>
        </div>
      </aside>

      {/* ============ Mobile: верхняя мини-панель + overlay drawer ============ */}
      <div className="lg:hidden sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-card h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          aria-label="Открыть меню"
          className="p-2 text-app-2 hover:bg-hover rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/analytics/rentability" aria-label="FAAPP">
          <FaappLogo />
        </Link>
        <ThemeToggle />
      </div>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card border-r border-card flex flex-col" aria-label="Навигация приложения">
            <div className="flex h-14 items-center justify-between border-b border-card px-3">
              <FaappLogo />
              <button
                onClick={() => setIsMobileOpen(false)}
                aria-label="Закрыть меню"
                className="p-2 text-app-muted hover:text-app-2 hover:bg-hover rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Меню drawer — всегда развёрнутое; клик по пункту закрывает */}
            <div className="flex flex-col flex-1 min-h-0" onClick={() => setIsMobileOpen(false)}>
              <nav className="flex-1 overflow-y-auto p-2 space-y-4">
                <div>
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-app-muted">Аналитика</p>
                  <div className="space-y-1">
                    <MobileLink to="/analytics/rentability" label="Обзор" icon={<BarChart3 className="h-4 w-4 flex-shrink-0" />} />
                    <MobileLink to="/analytics/rentability" label="Рентабельность" icon={<BarChart3 className="h-4 w-4 flex-shrink-0" />} indent />
                    <MobileLink to="/analytics/abc" label="ABC-анализ" icon={<ListOrdered className="h-4 w-4 flex-shrink-0" />} indent />
                    <MobileLink to="/analytics/dynamics" label="Динамика" icon={<LineChart className="h-4 w-4 flex-shrink-0" />} indent />
                  </div>
                </div>
                <div>
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-app-muted">Каталог</p>
                  <div className="space-y-1">
                    <MobileLink to="/products" label="Товары" icon={<Package className="h-4 w-4 flex-shrink-0" />} />
                    <MobileLink to="/taxes" label="Налоговые ставки" icon={<Receipt className="h-4 w-4 flex-shrink-0" />} />
                  </div>
                </div>
              </nav>

              <div className="border-t border-card p-2 space-y-1">
                <MobileLink to="/profile" label={user?.name || user?.email || 'Профиль'} icon={(
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )} />
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  Выйти
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Контент: отступ слева под sidebar на десктопе */}
      <main className={`transition-[padding] duration-200 ease-out ${isCollapsed ? 'lg:pl-14' : 'lg:pl-60'}`}>
        <Outlet />
      </main>

      <GuidedTour />
    </div>
  );
}

function MobileLink({ to, label, icon, indent = false }: {
  to: string;
  label: string;
  icon: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex h-10 items-center rounded-lg text-sm font-medium transition ${
          isActive ? 'bg-primary-soft text-primary' : 'text-app-2 hover:bg-hover hover:text-app'
        } gap-3 ${indent ? 'pl-9 pr-3' : 'px-3'}`
      }
    >
      {icon}
      <span className="whitespace-nowrap truncate">{label}</span>
    </NavLink>
  );
}
