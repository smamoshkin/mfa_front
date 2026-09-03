import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, DollarSign, Package, PieChart, Wallet, Megaphone, Warehouse, Truck, Receipt, Percent,
  Download, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown, SearchX, Key
} from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import WbApiKeyModal from '../components/WbApiKeyModal';
import { useAuthStore } from '../store/authStore';
import AnalyticsFiltersComponent from '../components/AnalyticsFilters';
import { analyticsApi } from '../api/analyticsApi';
import type { RentabilityResponse, AnalyticsFilters } from '../types/analytics';
import { format, parseISO, addDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

type AbcCategory = 'A' | 'B' | 'C';

const ABC_RANK: Record<AbcCategory, number> = { A: 0, B: 1, C: 2 };

// ABC по вкладу в общую маржу: A — первые 80% накопленной маржи, B — следующие 15%, C — остальное
function getMarginCategory(cumulativeSharePercent: number): AbcCategory {
  if (cumulativeSharePercent <= 80) return 'A';
  if (cumulativeSharePercent <= 95) return 'B';
  return 'C';
}

function getTurnoverCategory(turnoverDays: number): AbcCategory {
  if (turnoverDays <= 0) return 'C';
  if (turnoverDays <= 30) return 'A';
  if (turnoverDays <= 60) return 'B';
  return 'C';
}

// Матрица маржа × оборачиваемость: обе оси сильные — A, обе слабые — C, смешанные — B
function getAbcCategory(marginCategory: AbcCategory, turnoverCategory: AbcCategory): AbcCategory {
  const rank = ABC_RANK[marginCategory] + ABC_RANK[turnoverCategory];
  if (rank <= 1) return 'A';
  if (rank === 2) return 'B';
  return 'C';
}

function withAbcCategories(products: RentabilityResponse['products']) {
  const sorted = [...products].sort((a, b) => b.margin - a.margin);
  const totalMargin = sorted.reduce((sum, p) => sum + p.margin, 0);
  let cumulative = 0;

  return sorted.map((product) => {
    cumulative += product.margin;
    const marginShare = totalMargin !== 0 ? (cumulative / totalMargin) * 100 : 100;
    const marginCategory = getMarginCategory(marginShare);
    const turnoverDays = product.turnover_days;
    const turnoverCategory = getTurnoverCategory(turnoverDays);

    return {
      product,
      turnoverDays,
      marginCategory,
      turnoverCategory,
      abcCategory: getAbcCategory(marginCategory, turnoverCategory),
    };
  });
}

// ----------------------------------------------------------------------------
// Разница с прошлым периодом для бейджей карточек показателей.
// Для выбранного месяца сравнение — с прошлым календарным месяцем; для
// произвольного диапазона — с предыдущим периодом той же длины.
// ----------------------------------------------------------------------------

// Период для сравнения: если выбраны целые календарные месяцы — предыдущие
// целые месяцы (для одного месяца это ровно прошлый календарный месяц);
// для произвольного диапазона — предыдущее окно той же длины.
function previousPeriodRange(dateFrom: string, dateTo: string): { date_from: string; date_to: string } {
  const from = parseISO(dateFrom);
  const to = parseISO(dateTo);

  const isCalendarAligned = from.getDate() === 1 && to.getDate() === endOfMonth(to).getDate();
  if (isCalendarAligned) {
    const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
    return {
      date_from: format(startOfMonth(subMonths(from, months)), 'yyyy-MM-dd'),
      date_to: format(endOfMonth(subMonths(to, months)), 'yyyy-MM-dd'),
    };
  }

  const days = Math.max(Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1, 1);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  return { date_from: format(prevFrom, 'yyyy-MM-dd'), date_to: format(prevTo, 'yyyy-MM-dd') };
}

type MoMChangeKind = 'money' | 'pp'; // money — относительное изменение, pp — разница в процентных пунктах

interface MoMChange {
  text: string;                     // '+12.5%' | '-3.2 п.п.' | '0.0%'
  title: string;                    // подсказка при наведении
  tone: 'good' | 'bad' | 'neutral'; // good/bad — с учётом направления метрики (расходы: рост = bad)
  direction: 1 | -1 | 0;
}

function computeMoMChange(
  current: number,
  previous: number,
  kind: MoMChangeKind,
  lowerIsBetter: boolean,
  periodLabel: string,
): MoMChange | null {
  let delta: number;
  if (kind === 'pp') {
    // Процентные метрики (рентабельность, DRR) честнее сравнивать в пунктах:
    // рост 5% → 10% — это +5 п.п., а не «+100%»
    delta = current - previous;
  } else {
    // Относительное изменение не определено при нулевой/отрицательной базе
    if (previous <= 0) return null;
    delta = (current / previous - 1) * 100;
  }

  const rounded = Number(delta.toFixed(1));
  const direction = rounded > 0 ? 1 : rounded < 0 ? -1 : 0;
  const improved = lowerIsBetter ? direction < 0 : direction > 0;

  return {
    text: `${direction > 0 ? '+' : ''}${rounded.toFixed(1)}${kind === 'pp' ? ' п.п.' : '%'}`,
    title: `По сравнению с прошлым периодом (${periodLabel})`,
    tone: direction === 0 ? 'neutral' : improved ? 'good' : 'bad',
    direction,
  };
}

// Бейдж в правом верхнем углу карточки. change === null → «—» (нет базы сравнения).
function MoMBadge({ change, onDark = false }: { change: MoMChange | null; onDark?: boolean }) {
  if (!change) {
    return (
      <span
        title="Нет данных за прошлый период для сравнения"
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${onDark ? 'text-white/80 bg-white/20' : 'text-app-muted bg-card-2'}`}
      >
        —
      </span>
    );
  }

  const Icon = change.direction > 0 ? ArrowUp : change.direction < 0 ? ArrowDown : null;
  const toneClass = onDark
    ? 'text-white bg-white/20'
    : change.tone === 'good'
      ? 'text-emerald-700 bg-emerald-50'
      : change.tone === 'bad'
        ? 'text-red-600 bg-red-50'
        : 'text-app-muted bg-card-2';

  return (
    <span
      title={change.title}
      className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${toneClass}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {change.text}
    </span>
  );
}

const ABC_BADGE_STYLES: Record<AbcCategory, string> = {
  A: 'bg-mint text-ink',
  B: 'bg-sand text-sand-ink',
  C: 'bg-red-100 text-red-700',
};

type AbcRow = ReturnType<typeof withAbcCategories>[number];
type StatsColumnKey = 'sku' | 'margin' | 'margin_percent' | 'turnover' | 'marginCategory' | 'turnoverCategory' | 'abcCategory';

const STATS_COLUMNS: { key: StatsColumnKey; label: string; type: 'text' | 'category' }[] = [
  { key: 'sku', label: 'Артикул', type: 'text' },
  { key: 'margin', label: 'Маржа', type: 'text' },
  { key: 'margin_percent', label: 'Маржинальность', type: 'text' },
  { key: 'turnover', label: 'Оборачиваемость', type: 'text' },
  { key: 'marginCategory', label: 'Категория (маржа)', type: 'category' },
  { key: 'turnoverCategory', label: 'Категория (оборачиваемость)', type: 'category' },
  { key: 'abcCategory', label: 'Категория (общая)', type: 'category' },
];

function getStatsColumnValue(row: AbcRow, key: StatsColumnKey): string | number {
  switch (key) {
    case 'sku': return row.product.sku;
    case 'margin': return row.product.margin;
    case 'margin_percent': return row.product.margin_percent;
    case 'turnover': return row.turnoverDays;
    case 'marginCategory': return row.marginCategory;
    case 'turnoverCategory': return row.turnoverCategory;
    case 'abcCategory': return row.abcCategory;
  }
}

function matchesStatsFilter(row: AbcRow, key: StatsColumnKey, filterValue: string): boolean {
  if (!filterValue.trim()) return true;
  const value = getStatsColumnValue(row, key);
  if (key === 'marginCategory' || key === 'turnoverCategory' || key === 'abcCategory') {
    return value === filterValue;
  }
  return String(value).toLowerCase().includes(filterValue.trim().toLowerCase());
}

export default function Analytics() {
  const { user } = useAuthStore();
  const [analyticsData, setAnalyticsData] = useState<RentabilityResponse | null>(null);
  // Прошлый период той же длины — для бейджей «разница с прошлым месяцем»
  const [prevAnalyticsData, setPrevAnalyticsData] = useState<RentabilityResponse | null>(null);
  const [prevPeriod, setPrevPeriod] = useState<{ date_from: string; date_to: string } | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<RentabilityResponse['products']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Сортировка и фильтрация таблицы "Статистика по товарам"
  const [statsSortKey, setStatsSortKey] = useState<StatsColumnKey>('margin');
  const [statsSortDirection, setStatsSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statsColumnFilters, setStatsColumnFilters] = useState<Record<StatsColumnKey, string>>({
    sku: '',
    margin: '',
    margin_percent: '',
    turnover: '',
    marginCategory: '',
    turnoverCategory: '',
    abcCategory: '',
  });

  const handleStatsSort = (key: StatsColumnKey) => {
    if (statsSortKey === key) {
      setStatsSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStatsSortKey(key);
      setStatsSortDirection('asc');
    }
  };

  const handleStatsFilterChange = (key: StatsColumnKey, value: string) => {
    setStatsColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Начальные фильтры (текущий месяц)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    date_from: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    date_to: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
    group_by: 'month',
  });

  // Загрузка данных при первом рендере
  useEffect(() => {
    loadAnalyticsData(filters);
  }, []);

  // Фильтрация продуктов
  useEffect(() => {
    if (analyticsData) {
      const filtered = analyticsApi.filterProducts(analyticsData.products, {
        sku: filters.sku,
        min_margin_percent: filters.min_margin_percent,
        min_quantity: filters.min_quantity,
      });
      setFilteredProducts(filtered);
    }
  }, [analyticsData, filters.sku, filters.min_margin_percent, filters.min_quantity]);

  const statsRows = useMemo(() => {
    const rows = withAbcCategories(filteredProducts).filter((row) =>
      STATS_COLUMNS.every((column) => matchesStatsFilter(row, column.key, statsColumnFilters[column.key]))
    );

    return rows.sort((a, b) => {
      const va = getStatsColumnValue(a, statsSortKey);
      const vb = getStatsColumnValue(b, statsSortKey);
      const compared = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      return statsSortDirection === 'asc' ? compared : -compared;
    });
  }, [filteredProducts, statsColumnFilters, statsSortKey, statsSortDirection]);

  // Разница с прошлым периодом для бейджей карточек показателей.
  // Денежные метрики — относительное изменение (%), рентабельность и DRR —
  // разница в процентных пунктах (п.п.). Расходы: рост = ухудшение (bad).
  const momBadges = useMemo(() => {
    if (!analyticsData || !prevAnalyticsData || !prevPeriod) return null;
    // Пустой отчёт за прошлый период = продаж не было, сравнивать не с чем
    if (prevAnalyticsData.products.length === 0) return null;

    const label = `${format(parseISO(prevPeriod.date_from), 'dd.MM.yyyy')} – ${format(parseISO(prevPeriod.date_to), 'dd.MM.yyyy')}`;
    const ch = (current: number, previous: number, kind: MoMChangeKind, lowerIsBetter = false) =>
      computeMoMChange(current, previous, kind, lowerIsBetter, label);

    return {
      profitability: ch(analyticsData.rentability.profitability, prevAnalyticsData.rentability.profitability, 'pp'),
      revenue: ch(analyticsData.totals.total_revenue, prevAnalyticsData.totals.total_revenue, 'money'),
      payout: ch(analyticsData.totals.total_payout, prevAnalyticsData.totals.total_payout, 'money'),
      // Маржа на карточке — «маржа минус расходы», её и сравниваем
      margin: ch(analyticsData.rentability.margin_minus_expenses, prevAnalyticsData.rentability.margin_minus_expenses, 'money'),
      advertising: ch(analyticsData.rentability.total_advertising, prevAnalyticsData.rentability.total_advertising, 'money', true),
      storage: ch(analyticsData.totals.total_storage_fee, prevAnalyticsData.totals.total_storage_fee, 'money', true),
      logistics: ch(analyticsData.rentability.total_logistics, prevAnalyticsData.rentability.total_logistics, 'money', true),
      tax: ch(analyticsData.totals.total_tax, prevAnalyticsData.totals.total_tax, 'money', true),
      drr: ch(analyticsData.rentability.drr, prevAnalyticsData.rentability.drr, 'pp', true),
    };
  }, [analyticsData, prevAnalyticsData, prevPeriod]);

  const loadAnalyticsData = async (f: AnalyticsFilters = filters) => {
    setIsLoading(true);
    setError('');

    try {
      // Текущий период + прошлый период той же длины параллельно (для бейджей
      // «разница с прошлым месяцем»). Ошибка прошлого периода не ломает
      // страницу — бейджи просто показывают «—».
      const prevRange = previousPeriodRange(f.date_from, f.date_to);
      const [data, prevData] = await Promise.all([
        analyticsApi.getRentability({
          date_from: f.date_from,
          date_to: f.date_to,
          group_by: f.group_by,
        }),
        analyticsApi.getRentability({
          date_from: prevRange.date_from,
          date_to: prevRange.date_to,
          group_by: f.group_by,
        }).catch(() => null),
      ]);

      setAnalyticsData(data);
      setPrevAnalyticsData(prevData);
      setPrevPeriod(prevData ? prevRange : null);
    } catch (err: any) {
      console.error('Ошибка загрузки аналитики:', err);
      
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Ошибка загрузки данных аналитики';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleApply = () => {
    loadAnalyticsData(filters);
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setIsExporting(true); // Начинаем экспорт
      
      let blob: Blob;
      
      if (format === 'excel') {
        // Показываем уведомление о начале экспорта
        console.log('Начинаем экспорт в Excel...');
        
        // Вызываем функцию экспорта в Excel
        blob = await analyticsApi.exportExcel(filters);
        
        // Формируем имя файла
        const dateFromStr = filters.date_from.replace(/-/g, '');
        const dateToStr = filters.date_to.replace(/-/g, '');
        const filename = `analytics_${dateFromStr}_${dateToStr}.xlsx`;
        
        // Скачиваем файл
        downloadBlob(blob, filename);
        
        // Показываем сообщение об успехе
        console.log('Экспорт завершен успешно!');
        
      } else {
        // Для PDF показываем сообщение
        alert('Экспорт в PDF временно недоступен. Используйте Excel экспорт.');
        setIsExporting(false);
        return;
      }
      
    } catch (err: any) {
      console.error('Ошибка экспорта:', err);
      handleExportError(err, format);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Вспомогательная функция для скачивания файла
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Очистка
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };
  
  // Вспомогательная функция для обработки ошибок
  const handleExportError = async (err: any, format: string) => {
    let errorMessage = 'Ошибка при экспорте данных';
    
    // Пытаемся получить сообщение об ошибке
    if (err.response?.data) {
      try {
        if (err.response.data instanceof Blob) {
          // Если ошибка в виде blob (например, от сервера)
          const text = await err.response.data.text();
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } catch (parseError) {
        console.error('Ошибка парсинга ошибки:', parseError);
      }
    }
    
    // Показываем сообщение об ошибке
    alert(`Ошибка экспорта в ${format.toUpperCase()}: ${errorMessage}`);
    
    // Резервный вариант: скачиваем JSON
    // if (analyticsData) {
    //   const dataStr = JSON.stringify(analyticsData, null, 2);
    //   const dataBlob = new Blob([dataStr], { type: 'application/json' });
    //   downloadBlob(dataBlob, `analytics-backup-${filters.date_from}-${filters.date_to}.json`, 'application/json');
      
    //   alert(`Экспорт в ${format.toUpperCase()} временно недоступен. Скачан JSON файл с данными.`);
    // }
  };

  if (isLoading && !analyticsData) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-app-2">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  const hasApiKey = !!user?.wb_api_key;
  const hasData = !!analyticsData && analyticsData.products.length > 0;

  return (
    <div>
      <LoadingOverlay show={isLoading && !!analyticsData} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WbApiKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          onSuccess={() => loadAnalyticsData(filters)}
        />

        {/* Заголовок + действия страницы */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-app mb-2">Аналитика рентабельности</h1>
            <p className="text-app-2">
              Подробный анализ продаж, маржи и рентабельности товаров
            </p>
          </div>
          <button
            data-tour="export"
            onClick={() => handleExport('excel')}
            disabled={isExporting || !hasData}
            className="px-4 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Экспорт...' : 'Экспорт в Excel'}
          </button>
        </div>

        {error ? (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Ошибка загрузки данных</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={() => loadAnalyticsData()}
                className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                Повторить попытку
              </button>
            </div>
          </div>
        ) : null}

        {/* Фильтры */}
        <div data-tour="filters">
          <AnalyticsFiltersComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApply}
          />
        </div>

        {/* Общая статистика */}
        {analyticsData && !hasData && (
          <div className="bg-card rounded-2xl border border-card shadow-sm py-20 px-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-soft flex items-center justify-center mb-5">
              {!hasApiKey ? (
                <Key className="w-8 h-8 text-primary" />
              ) : (
                <SearchX className="w-8 h-8 text-primary" />
              )}
            </div>
            <h3 className="text-xl font-bold text-app mb-2">
              {!hasApiKey
                ? 'Аналитика пока недоступна'
                : 'За выбранный период нет данных'}
            </h3>
            <p className="text-app-muted max-w-md mx-auto mb-6">
              {!hasApiKey
                ? 'Подключите API ключ Wildberries, чтобы загрузить продажи и увидеть рентабельность, маржу и ABC-анализ.'
                : 'Скорее всего, данные за этот период ещё не засинхронизированы или продаж не было. Попробуйте расширить период или дождитесь синхронизации.'}
            </p>
            {!hasApiKey && (
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:from-primary-dark hover:to-primary transition"
              >
                Подключить API ключ
              </button>
            )}
          </div>
        )}

        {analyticsData && hasData && (
          <>
            <h2 className="text-sm font-semibold text-app-muted uppercase tracking-wide mb-3">
              Основные показатели
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className={`rounded-xl shadow-sm border p-4 ${
                analyticsData.rentability.profitability >= 0
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-700'
                  : 'bg-gradient-to-br from-red-600 to-red-700 border-red-700'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-white/20">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <MoMBadge onDark change={momBadges?.profitability ?? null} />
                </div>
                <h3 className="text-xl font-bold text-white mb-0.5">
                  {analyticsData.rentability.profitability.toFixed(1)}%
                </h3>
                <p className="text-white/80 text-sm">Общая рентабельность</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <DollarSign className="w-5 h-5 text-emerald-700" />
                  </div>
                  <MoMBadge change={momBadges?.revenue ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.summary.total_revenue}
                </h3>
                <p className="text-app-muted text-sm">Общая выручка</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <Wallet className="w-5 h-5 text-emerald-700" />
                  </div>
                  <MoMBadge change={momBadges?.payout ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.totals.total_payout.toLocaleString()} ₽
                </h3>
                <p className="text-app-muted text-sm">Перечислено продавцу</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <PieChart className="w-5 h-5 text-emerald-700" />
                  </div>
                  <MoMBadge change={momBadges?.margin ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.rentability.margin_minus_expenses.toLocaleString()} ₽
                </h3>
                <p className="text-app-muted text-sm">Маржа</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <Package className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {analyticsData.totals.product_count} шт.
                  </span>
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.totals.total_quantity}
                </h3>
                <p className="text-app-muted text-sm">Продано товаров</p>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-app-muted uppercase tracking-wide mb-3">
              Расходы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Megaphone className="w-5 h-5 text-red-700" />
                  </div>
                  <MoMBadge change={momBadges?.advertising ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.rentability.total_advertising.toLocaleString()} ₽
                </h3>
                <p className="text-app-muted text-sm">Расходы на рекламу</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Warehouse className="w-5 h-5 text-red-700" />
                  </div>
                  <MoMBadge change={momBadges?.storage ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.totals.total_storage_fee.toLocaleString()} ₽
                </h3>
                <p className="text-app-muted text-sm">Хранение</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Truck className="w-5 h-5 text-red-700" />
                  </div>
                  <MoMBadge change={momBadges?.logistics ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.rentability.total_logistics.toLocaleString()} ₽
                </h3>
                <p className="text-app-muted text-sm">Логистика</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Receipt className="w-5 h-5 text-red-700" />
                  </div>
                  <MoMBadge change={momBadges?.tax ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.totals.total_tax.toLocaleString()} ₽
                </h3>
                <p className="text-app-muted text-sm">Налог</p>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Percent className="w-5 h-5 text-red-700" />
                  </div>
                  <MoMBadge change={momBadges?.drr ?? null} />
                </div>
                <h3 className="text-xl font-bold text-app mb-0.5">
                  {analyticsData.rentability.drr.toFixed(2)}%
                </h3>
                <p className="text-app-muted text-sm">DRR</p>
              </div>
            </div>

            {/* Товары: маржа и ABC-категория */}
            <div data-tour="stats-table" className="bg-card rounded-xl shadow-sm border border-card overflow-hidden mb-8">
              <div className="flex items-center justify-between px-6 py-4 border-b border-card">
                <h2 className="text-xl font-bold text-app">Статистика по товарам</h2>
                <span className="text-sm text-app-muted">
                  Показано {statsRows.length} из {filteredProducts.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-card-2">
                    <tr>
                      {STATS_COLUMNS.map((column) => (
                        <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase tracking-wider">
                          <button
                            type="button"
                            onClick={() => handleStatsSort(column.key)}
                            className="flex items-center gap-1 hover:text-app-2"
                          >
                            {column.label}
                            {statsSortKey === column.key ? (
                              statsSortDirection === 'asc' ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-300" />
                            )}
                          </button>
                          <div className="mt-2 normal-case">
                            {column.type === 'category' ? (
                              <select
                                value={statsColumnFilters[column.key]}
                                onChange={(e) => handleStatsFilterChange(column.key, e.target.value)}
                                className="w-full text-xs font-normal border border-card rounded px-1.5 py-1 text-app-2"
                              >
                                <option value="">Все</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={statsColumnFilters[column.key]}
                                onChange={(e) => handleStatsFilterChange(column.key, e.target.value)}
                                placeholder="Фильтр..."
                                className="w-full text-xs font-normal border border-card rounded px-1.5 py-1 text-app-2 placeholder:text-app-muted"
                              />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-gray-200">
                    {statsRows.map(({ product, turnoverDays, marginCategory, turnoverCategory, abcCategory }) => (
                      <tr key={product.sku} className="hover:bg-hover">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-app">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-app">
                          {product.margin.toLocaleString()} ₽
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          product.margin_percent > 40 ? 'text-emerald-600' :
                          product.margin_percent > 20 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {product.margin_percent.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-app-muted">
                          {turnoverDays.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${ABC_BADGE_STYLES[marginCategory]}`}>
                            {marginCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${ABC_BADGE_STYLES[turnoverCategory]}`}>
                            {turnoverCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${ABC_BADGE_STYLES[abcCategory]}`}>
                            {abcCategory}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {statsRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-app-muted">
                          Нет данных
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}