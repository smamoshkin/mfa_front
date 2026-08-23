import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const START_TOUR_EVENT = 'faapp:start-tour';

let driverInstance: Driver | null = null;

/** Общий финальный шаг — кнопка тура в правом нижнем углу */
const HELP_STEP = {
  element: '[data-tour="tour-help"]',
  popover: {
    title: 'Тур всегда под рукой',
    description:
      'Этот тур можно пройти заново в любой момент — кнопка спрятана в правом нижнем углу экрана. Если забудете, где что находится, просто нажмите её.',
    side: 'top' as const,
    align: 'center' as const,
  },
};

/** Шаги тура для страницы «Аналитика» */
const ANALYTICS_STEPS = [
  {
    element: '[data-tour="nav"]',
    popover: {
      title: 'Навигация',
      description:
        'Разделы приложения: Аналитика — рентабельность и маржа, Товары — каталог и себестоимость, Налоговые ставки — история ставок.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="profile"]',
    popover: {
      title: 'Профиль',
      description:
        'Личный кабинет: смена пароля и подключение API ключа Wildberries — без ключа данные загружаться не будут.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '[data-tour="filters"]',
    popover: {
      title: 'Период и группировка',
      description:
        'Выберите период (по умолчанию — текущий месяц) и группировку: день, неделя, месяц или год.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="export"]',
    popover: {
      title: 'Экспорт',
      description: 'Скачайте отчёт в Excel с живыми формулами — можно пересчитывать у себя.',
      side: 'left' as const,
      align: 'end' as const,
    },
  },
  {
    element: '[data-tour="stats-table"]',
    popover: {
      title: 'ABC-анализ',
      description:
        'Каждый товар получает категорию A/B/C по марже и оборачиваемости. Сортируйте и фильтруйте по любому столбцу.',
      side: 'top' as const,
      align: 'center' as const,
    },
  },
];

/** Шаги тура для страницы «Товары» — начинаются сразу с фильтров, без общих шагов */
const PRODUCTS_STEPS = [
  {
    element: '[data-tour="products-search"]',
    popover: {
      title: 'Поиск и фильтры',
      description:
        'Ищите по названию и артикулам, фильтруйте по категории. Фильтры применяются сразу, при наведении на фото товара появляется превью.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="products-actions"]',
    popover: {
      title: 'Импорт себестоимостей',
      description:
        'Загрузите себестоимости всех товаров одним файлом — вручную заполнять каждый товар не нужно.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '[data-tour="products-add"]',
    popover: {
      title: 'Добавление товара',
      description:
        'Товары обычно появляются сами после синхронизации с WB, но добавить вручную тоже можно — например, чтобы задать себестоимость заранее.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '[data-tour="products-table"]',
    popover: {
      title: 'Каталог товаров',
      description:
        'Кнопки в строке: «Себестоимость» — история себестоимости товара, «Редактировать» — правка карточки, «Удалить» — удаление. Наведите на фото, чтобы рассмотреть товар.',
      side: 'top' as const,
      align: 'center' as const,
    },
  },
];

/** Шаги тура для страницы «Налоговые ставки» — только про контент страницы */
const TAXES_STEPS = [
  {
    element: '[data-tour="taxes-current"]',
    popover: {
      title: 'Текущая ставка',
      description:
        'Здесь показана ставка, которая действует прямо сейчас — именно она участвует в расчёте налога в отчётности.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '[data-tour="taxes-add"]',
    popover: {
      title: 'Новая ставка',
      description:
        'Сменился режим налогообложения? Создайте новую ставку с датой начала, а старую закройте — периоды не должны пересекаться.',
      side: 'bottom' as const,
      align: 'end' as const,
    },
  },
  {
    element: '[data-tour="taxes-table"]',
    popover: {
      title: 'История ставок',
      description:
        'Все ставки в хронологическом порядке. Кнопки в строке: «Редактировать», «Закрыть период» (для бессрочных) и «Удалить».',
      side: 'top' as const,
      align: 'center' as const,
    },
  },
  {
    element: '[data-tour="taxes-info"]',
    popover: {
      title: 'Правила и советы',
      description:
        'Ниже — короткая справка: как работают периоды, статистика и что делать при смене режима налогообложения.',
      side: 'top' as const,
      align: 'center' as const,
    },
  },
];

/** Шаги по текущей странице */
function getStepsForLocation(pathname: string) {
  let pageSteps;
  if (pathname.startsWith('/products')) {
    pageSteps = PRODUCTS_STEPS;
  } else if (pathname.startsWith('/taxes')) {
    pageSteps = TAXES_STEPS;
  } else {
    pageSteps = ANALYTICS_STEPS;
  }
  return [...pageSteps, HELP_STEP];
}

/* ---------------- Флаги «тур пройден» — отдельно для каждой страницы ---------------- */

const PAGES = ['analytics', 'products', 'taxes'] as const;
type PageKey = (typeof PAGES)[number];

const TOUR_DONE_KEY = 'faapp-tour-completed'; // старый общий флаг (до разделения по страницам)

function getPageKey(pathname: string): PageKey {
  if (pathname.startsWith('/products')) return 'products';
  if (pathname.startsWith('/taxes')) return 'taxes';
  return 'analytics';
}

const pageFlagName = (page: PageKey) => `faapp-tour-${page}-completed`;

function isPageToured(page: PageKey): boolean {
  return localStorage.getItem(pageFlagName(page)) === 'true';
}

/** Хоть одна из страниц пройдена — показываем кнопку «?» */
function isAnyPageToured(): boolean {
  return PAGES.some(isPageToured);
}

// Миграция со старого общего флага: тур Аналитики считался пройденным для всех
if (typeof window !== 'undefined' && localStorage.getItem(TOUR_DONE_KEY) === 'true') {
  PAGES.forEach((page) => {
    if (!isPageToured(page)) localStorage.setItem(pageFlagName(page), 'true');
  });
}

let isTourActive = false;
// Автозапуск «первого визита» — максимум один раз на страницу за загрузку
// приложения, сколько бы раз ни перемонтировался каркас
const hasAutoRunThisSession: Record<PageKey, boolean> = {
  analytics: false,
  products: false,
  taxes: false,
};

function runTour() {
  // Защита от двойного запуска (автозапуск + клик по кнопке, StrictMode и т.п.)
  if (isTourActive) return;

  const page = getPageKey(window.location.pathname);

  driverInstance?.destroy();
  isTourActive = true;
  driverInstance = driver({
    showProgress: true,
    progressText: '{{current}} из {{total}}',
    nextBtnText: 'Далее →',
    prevBtnText: '← Назад',
    doneBtnText: 'Готово',
    allowClose: true,
    steps: getStepsForLocation(window.location.pathname),
    onDestroyed: () => {
      isTourActive = false;
      localStorage.setItem(pageFlagName(page), 'true');
      window.dispatchEvent(new Event('faapp:tour-finished'));
    },
  });
  driverInstance.drive();
  window.dispatchEvent(new Event('faapp:tour-started'));
}

/**
 * Интерактивный тур по интерфейсу. При первом входе на каждую страницу
 * (Аналитика, Товары, Налоговые ставки) тур запускается автоматически
 * один раз; повторно доступен по кнопке «?» в углу экрана.
 */
export default function GuidedTour() {
  const location = useLocation();
  const page = getPageKey(location.pathname);

  const [isRunning, setIsRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(() => isAnyPageToured());

  // Кнопка «?» видна после прохождения любого тура И во время тура
  // (последний шаг тура подсвечивает саму эту кнопку)
  const isButtonVisible = showHelp || isRunning;

  useEffect(() => {
    const start = () => setIsRunning(true);
    const finish = () => {
      setIsRunning(false);
      // Реагируем на завершение тура сразу: каркас не перемонтируется
      // при переходах между страницами, поэтому начальное значение
      // useState не перечитается само — обновляем явно
      setShowHelp(isAnyPageToured());
    };
    window.addEventListener('faapp:tour-started', start);
    window.addEventListener('faapp:tour-finished', finish);
    window.addEventListener(START_TOUR_EVENT, runTour);
    return () => {
      window.removeEventListener('faapp:tour-started', start);
      window.removeEventListener('faapp:tour-finished', finish);
      window.removeEventListener(START_TOUR_EVENT, runTour);
    };
  }, []);

  // Первый визит каждой страницы — через полсекунды, когда она отрисована.
  // Зависимость от [page]: при переходе на другую ещё не «турённую» страницу
  // автозапуск сработает и для неё. Проверяем флаг В МОМЕНТ срабатывания
  // таймера — каркас может перемонтироваться (инициализация auth, редиректы),
  // и каждый маунт создаёт свой таймер; без защиты hasAutoRunThisSession
  // автозапуск повторялся бы после закрытия предыдущего тура.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasAutoRunThisSession[page]) return;
      hasAutoRunThisSession[page] = true;
      if (!isPageToured(page)) runTour();
    }, 600);
    return () => clearTimeout(timer);
  }, [page]);

  if (!isButtonVisible) return null;

  return (
    <button
      data-tour="tour-help"
      onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
      title="Показать тур по интерфейсу"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-card border border-card shadow-md text-app-muted hover:text-primary hover:border-primary/40 transition flex items-center justify-center"
    >
      <span className="text-lg font-bold">?</span>
    </button>
  );
}
