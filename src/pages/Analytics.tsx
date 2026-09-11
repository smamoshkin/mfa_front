// Страница «Аналитика» — контейнер подразделов.
//
// Подразделы (Рентабельность / ABC-анализ / Динамика) — вложенные роуты,
// навигация по ним — в глобальном sidebar каркаса (AppLayout). Контент
// подраздела меняется через <Outlet/>. Фильтры периода — общие для всех
// подразделов: остаются на месте и управляют загрузкой данных страницы.
//
// Логика данных (загрузка, MoM-бейджи, фильтрация товаров) живёт здесь;
// подразделы получают готовое через Outlet context.
import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Download, AlertCircle, SearchX, Key } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import WbApiKeyModal from '../components/WbApiKeyModal';
import { useAuthStore } from '../store/authStore';
import AnalyticsFiltersComponent from '../components/AnalyticsFilters';
import { analyticsApi } from '../api/analyticsApi';
import type { RentabilityResponse, AnalyticsFilters } from '../types/analytics';
import { previousPeriodRange, computeMoMChange, type MomBadges } from '../components/analytics/mom';
import { format, parseISO } from 'date-fns';

/** Контекст, который страница передаёт подразделам через <Outlet/> */
export interface AnalyticsSectionContext {
  analyticsData: RentabilityResponse | null;
  momBadges: MomBadges | null;
  filteredProducts: RentabilityResponse['products'];
}

export default function Analytics() {
  const { user } = useAuthStore();
  // Шаблон «Динамики» не зависит от данных — пустое состояние его не перекрывает
  const location = useLocation();
  const isDynamicsSection = location.pathname.startsWith('/analytics/dynamics');
  const [analyticsData, setAnalyticsData] = useState<RentabilityResponse | null>(null);
  // Прошлый период той же длины — для бейджей «разница с прошлым месяцем»
  const [prevAnalyticsData, setPrevAnalyticsData] = useState<RentabilityResponse | null>(null);
  const [prevPeriod, setPrevPeriod] = useState<{ date_from: string; date_to: string } | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<RentabilityResponse['products']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

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

  // Разница с прошлым периодом для бейджей карточек показателей.
  // Денежные метрики — относительное изменение (%), рентабельность и DRR —
  // разница в процентных пунктах (п.п.). Расходы: рост = ухудшение (bad).
  const momBadges = useMemo<MomBadges | null>(() => {
    if (!analyticsData || !prevAnalyticsData || !prevPeriod) return null;
    // Пустой отчёт за прошлый период = продаж не было, сравнивать не с чем
    if (prevAnalyticsData.products.length === 0) return null;

    const label = `${format(parseISO(prevPeriod.date_from), 'dd.MM.yyyy')} – ${format(parseISO(prevPeriod.date_to), 'dd.MM.yyyy')}`;
    const ch = (current: number, previous: number, kind: 'money' | 'pp', lowerIsBetter = false) =>
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

      if (format === 'excel') {
        console.log('Начинаем экспорт в Excel...');

        const blob = await analyticsApi.exportExcel(filters);

        const dateFromStr = filters.date_from.replace(/-/g, '');
        const dateToStr = filters.date_to.replace(/-/g, '');
        const filename = `analytics_${dateFromStr}_${dateToStr}.xlsx`;

        downloadBlob(blob, filename);

        console.log('Экспорт завершен успешно!');
      } else {
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

    if (err.response?.data) {
      try {
        if (err.response.data instanceof Blob) {
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

    alert(`Ошибка экспорта в ${format.toUpperCase()}: ${errorMessage}`);
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

        {/* Фильтры — общие для всех подразделов */}
        <div data-tour="filters" className="mb-8">
          <AnalyticsFiltersComponent
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApply}
          />
        </div>

            {analyticsData && !hasData && !isDynamicsSection ? (
              <div className="bg-card rounded-2xl border border-card shadow-sm py-20 px-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
                  {!hasApiKey ? (
                    <Key className="h-8 w-8 text-primary" />
                  ) : (
                    <SearchX className="h-8 w-8 text-primary" />
                  )}
                </div>

                <h3 className="mb-2 text-xl font-bold text-app">
                  {!hasApiKey
                    ? 'Аналитика пока недоступна'
                    : 'За выбранный период нет данных'}
                </h3>

                <p className="mx-auto mb-6 max-w-md text-app-muted">
                  {!hasApiKey
                    ? 'Подключите API ключ Wildberries, чтобы загрузить продажи и увидеть рентабельность, маржу и ABC-анализ.'
                    : 'Скорее всего, данные за этот период ещё не засинхронизированы или продаж не было. Попробуйте расширить период или дождитесь синхронизации.'}
                </p>

                {!hasApiKey && (
                  <button
                    onClick={() => setIsKeyModalOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-medium text-white transition hover:from-primary-dark hover:to-primary"
                  >
                    Подключить API ключ
                  </button>
                )}
              </div>
            ) : (
              <Outlet
                context={
                  {
                    analyticsData,
                    momBadges,
                    filteredProducts,
                  } satisfies AnalyticsSectionContext
                }
              />
            )}
      </div>
    </div>
  );
}
