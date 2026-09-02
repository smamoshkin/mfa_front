import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Calculator, Boxes, FileSpreadsheet, FileDown, RefreshCw,
  LayoutDashboard, KeyRound, Database, ShieldCheck, ArrowRight, Menu, X,
} from 'lucide-react';
import AuthCard from '../components/auth/AuthCard';
import ThemeToggle from '../components/layout/ThemeToggle';
import FaappLogo from '../components/layout/FaappLogo';
import SiteFooter from '../components/layout/SiteFooter';
import { useAuthStore } from '../store/authStore';

// ---------------------------------------------------------------------------
// Данные секций
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Calculator,
    title: 'Рентабельность до копейки',
    text: 'Все удержания WB, логистика, хранение, приёмка и налоги учитываются в марже каждого товара.',
  },
  {
    icon: Boxes,
    title: 'ABC-анализ и оборачиваемость',
    text: 'Видно, какие товары зарабатывают, а какие замораживают деньги на складе.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Себестоимость из Excel',
    text: 'Загрузите таблицу с себестоимостями — с историей изменений дат, прямо из вашего файла.',
  },
  {
    icon: FileDown,
    title: 'Экспорт в Excel с формулами',
    text: 'Отчёты с «живыми» формулами — пересчитывайте и дополняйте у себя.',
  },
  {
    icon: RefreshCw,
    title: 'Автоматическая синхронизация',
    text: 'faapp сам еженедельно подтягивает отчёты и остатки из Wildberries.',
  },
  {
    icon: LayoutDashboard,
    title: 'Все товары — один дашборд',
    text: 'Продажи, маржа и оборачиваемость по каждому SKU на одном экране.',
  },
];

const STEPS = [
  {
    icon: KeyRound,
    title: 'Добавьте API-ключ WB',
    text: 'Зарегистрируйтесь и укажите ключ статистики Wildberries — он нужен только для чтения ваших отчётов.',
  },
  {
    icon: Database,
    title: 'faapp загрузит историю',
    text: 'Все продажи, комиссии и остатки подтянутся автоматически — с начала 2025 года.',
  },
  {
    icon: BarChart3,
    title: 'Смотрите рентабельность',
    text: 'Маржа, ABC-категории и оборачиваемость по каждому товару. Никаких ручных табличек.',
  },
];

const FAQ = [
  {
    q: 'Это безопасно — давать доступ к API-ключу?',
    a: 'Да. Ключ используется только для чтения ваших финансовых отчётов из официального API Wildberries. Мы ничего не публикуем и не изменяем. Ключ можно отозвать в любой момент в личном кабинете WB.',
  },
  {
    q: 'Что нужно для начала работы?',
    a: 'Зарегистрироваться по email и добавить ключ статистики из личного кабинета Wildberries (Настройки → Доступ к API). Дальше всё автоматически.',
  },
  {
    q: 'Откуда берутся данные?',
    a: 'Напрямую из официального API Wildberries: финансовые отчёты поставщика и остатки на складах. Никаких парсеров и «серых» источников.',
  },
  {
    q: 'Сколько это стоит?',
    a: 'Сейчас faapp бесплатен на полном функционале. Платные тарифы появятся позже — следите за новостями.',
  },
  {
    q: 'Как удалить свои данные?',
    a: 'Напишите на support@faapp.ru — удалим аккаунт и все связанные данные.',
  },
];

const PLANS = [
  {
    name: 'Старт',
    price: '0 ₽',
    period: 'навсегда',
    highlight: true,
    soon: false,
    features: ['Полная аналитика рентабельности', 'ABC и оборачиваемость', 'Импорт себестоимости из Excel', 'Экспорт отчётов', 'Автосинк с WB'],
    cta: 'Начать бесплатно',
  },
  {
    name: 'Продвинутый',
    price: '—',
    period: 'скоро',
    highlight: false,
    soon: true,
    features: ['Всё из «Старта»', 'Несколько магазинов', 'Прогнозы и планы закупок', 'Приоритетная поддержка'],
    cta: 'Скоро',
  },
  {
    name: 'Бизнес',
    price: '—',
    period: 'скоро',
    highlight: false,
    soon: true,
    features: ['Всё из «Продвинутого»', 'Командный доступ', 'Белые отчёты для инвесторов', 'Интеграции'],
    cta: 'Скоро',
  },
];

// ---------------------------------------------------------------------------
// Компонент
// ---------------------------------------------------------------------------

export default function Landing() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Успешный вход из шторки → в приложение
  useEffect(() => {
    if (token) navigate('/analytics');
  }, [token, navigate]);

  // Блокировка скролла при открытой шторке
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const openAuth = (mode: 'login' | 'register') => {
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  // Порядок пунктов = порядок секций на странице
  const NAV = [
    { href: '#how', label: 'Как работает' },
    { href: '#features', label: 'Возможности' },
    { href: '#pricing', label: 'Тарифы' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen bg-app text-app">
      {/* ---------------- Хедер ---------------- */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5" aria-label="faapp">
            <FaappLogo size="lg" />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}
                 className="text-app-2 hover:text-app font-medium transition">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => openAuth('login')}
              className="hidden sm:block px-4 py-2 text-app-2 hover:text-app font-medium rounded-xl hover:bg-hover transition"
            >
              Войти
            </button>
            <button
              onClick={() => openAuth('register')}
              className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:opacity-90 transition"
            >
              Начать бесплатно
            </button>
            <button
              className="md:hidden p-2 hover:bg-hover rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-card bg-card px-4 py-3 space-y-1">
            {NAV.map((item) => (
              <a key={item.href} href={item.href}
                 onClick={() => setMobileMenuOpen(false)}
                 className="block py-2.5 px-3 rounded-lg text-app-2 hover:text-app hover:bg-hover font-medium">
                {item.label}
              </a>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); openAuth('login'); }}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-app-2 hover:text-app hover:bg-hover font-medium"
            >
              Войти
            </button>
          </nav>
        )}
      </header>

      {/* ---------------- Hero ---------------- */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft/70 via-transparent to-transparent dark:from-primary/10" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-soft dark:bg-primary/15 text-primary rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              Для продавцов Wildberries
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
              Финансы вашего магазина на WB —{' '}
              <span className="text-primary">под контролем</span>
            </h1>
            <p className="text-lg text-app-2 mb-8 leading-relaxed">
              faapp сам загружает отчёты Wildberries и считает рентабельность
              каждого товара: маржу, комиссии, хранение, налоги и
              оборачиваемость — без ручных табличек.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => openAuth('register')}
                className="px-7 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition flex items-center gap-2"
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#how"
                 className="px-7 py-3.5 border border-input text-app-2 font-semibold rounded-xl hover:bg-hover transition">
                Как это работает
              </a>
            </div>
            <p className="text-sm text-app-muted mt-4">
              Бесплатно · Без карты · 3 минуты на подключение
            </p>
          </div>

          {/* CSS-мок дашборда */}
          <div className="hidden md:block">
            <div className="bg-card rounded-2xl shadow-2xl border border-card p-6 rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-sand" />
                  <div className="w-2.5 h-2.5 rounded-full bg-mint" />
                </div>
                <span className="text-xs text-app-muted">faapp · Аналитика</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-primary-soft dark:bg-primary/15 rounded-xl p-3">
                  <div className="text-xs text-app-2 mb-1">Рентабельность</div>
                  <div className="text-xl font-bold text-primary">24,8%</div>
                </div>
                <div className="bg-card-2 rounded-xl p-3">
                  <div className="text-xs text-app-2 mb-1">Маржа</div>
                  <div className="text-xl font-bold text-app">312 тыс. ₽</div>
                </div>
                <div className="bg-mint/40 dark:bg-mint/10 rounded-xl p-3">
                  <div className="text-xs text-app-2 mb-1">Оборачиваемость</div>
                  <div className="text-xl font-bold text-ink dark:text-mint">32 дня</div>
                </div>
              </div>
              {/* Мини-график */}
              <div className="bg-card-2 rounded-xl p-4">
                <div className="text-xs text-app-2 mb-3">Выручка по месяцам</div>
                <div className="flex items-end gap-2 h-28">
                  {[35, 48, 42, 60, 55, 72, 68, 85, 78, 95].map((h, i) => (
                    <div key={i}
                         className="flex-1 rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
                         style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              {/* Строка товаров */}
              <div className="mt-4 space-y-2">
                {[
                  ['Платье трикотажное', 'A', 'bg-mint/60 dark:bg-mint/15 text-ink dark:text-mint'],
                  ['Джемпер оверсайз', 'B', 'bg-sand/70 dark:bg-sand/15 text-sand-ink dark:text-sand'],
                  ['Шапка с помпоном', 'C', 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'],
                ].map(([name, cat, cls]) => (
                  <div key={name} className="flex items-center justify-between bg-card-2 rounded-lg px-3 py-2">
                    <span className="text-xs text-app-2 truncate">{name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Как это работает ---------------- */}
      <section id="how" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Как это работает</h2>
          <p className="text-app-2">Три шага — и рентабельность каждого товара у вас на экране</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="bg-card border border-card rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-6 w-8 h-8 bg-gradient-to-br from-primary to-primary-dark text-white rounded-lg flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div className="w-12 h-12 bg-primary-soft dark:bg-primary/15 rounded-xl flex items-center justify-center mb-4 mt-2">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-app-2 text-sm leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Возможности ---------------- */}
      <section id="features" className="bg-card/50 border-y border-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Возможности</h2>
            <p className="text-app-2">Всё, что нужно для управления юнит-экономикой магазина</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-card rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-11 h-11 bg-primary-soft dark:bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-app-2 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Тарифы ---------------- */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Тарифы</h2>
          <p className="text-app-2">Начните бесплатно — платите, когда вырастете</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div key={plan.name}
                 className={`rounded-2xl p-7 border flex flex-col ${
                   plan.highlight
                     ? 'border-primary bg-gradient-to-b from-primary-soft/60 to-card dark:from-primary/10 shadow-xl md:-translate-y-2'
                     : 'border-card bg-card opacity-80'
                 }`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                {plan.soon && (
                  <span className="text-xs px-2 py-1 bg-sand/70 dark:bg-sand/15 text-sand-ink dark:text-sand rounded-full font-medium">
                    скоро
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-app-muted text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-app-2">
                    <div className="w-5 h-5 rounded-full bg-mint/50 dark:bg-mint/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-ink dark:text-mint" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !plan.soon && openAuth('register')}
                disabled={plan.soon}
                className={`w-full py-3 font-semibold rounded-xl transition ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 shadow-lg'
                    : 'border border-input text-app-muted cursor-not-allowed'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="bg-card/50 border-t border-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Частые вопросы</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-card border border-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium hover:bg-hover transition"
                >
                  {item.q}
                  <span className={`text-app-muted transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-app-2 text-sm leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Узнайте реальную рентабельность своего магазина
          </h2>
          <p className="text-white/80 mb-6">Бесплатно, за 3 минуты, без карты</p>
          <button
            onClick={() => openAuth('register')}
            className="px-8 py-3.5 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition"
          >
            Начать бесплатно
          </button>
        </div>
      </div>

      {/* ---------------- Футер (общий с юрстраницами) ---------------- */}
      <SiteFooter />

      {/* ---------------- Шторка авторизации ---------------- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Затемнение */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Панель */}
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-app shadow-2xl overflow-y-auto"
            style={{ animation: 'drawer-in 0.25s ease-out' }}
          >
            <div className="min-h-full flex items-start sm:items-center justify-center p-4">
              <div className="w-full py-8">
                <AuthCard
                  initialMode={drawerMode}
                  onClose={() => setDrawerOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Анимация шторки */}
      <style>{`
        @keyframes drawer-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
