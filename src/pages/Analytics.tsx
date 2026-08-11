import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, DollarSign, Package, PieChart, Wallet, Megaphone, Warehouse, Truck, Receipt, Percent,
  Download, Filter, Calendar, RefreshCw, AlertCircle, User, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import AnalyticsFiltersComponent from '../components/AnalyticsFilters';
import { analyticsApi } from '../api/analyticsApi';
import type { RentabilityResponse, AnalyticsFilters } from '../types/analytics';
import { format } from 'date-fns';

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

const ABC_BADGE_STYLES: Record<AbcCategory, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-amber-100 text-amber-700',
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
  const { user, logout } = useAuthStore();
  const [analyticsData, setAnalyticsData] = useState<RentabilityResponse | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<RentabilityResponse['products']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

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

  const loadAnalyticsData = async (f: AnalyticsFilters = filters) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await analyticsApi.getRentability({
        date_from: f.date_from,
        date_to: f.date_to,
        group_by: f.group_by,
      });
      setAnalyticsData(data);
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
        downloadBlob(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
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
  const downloadBlob = (blob: Blob, filename: string, mimeType: string) => {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Аналитика</span>
              </div>
              
              <nav className="ml-10 flex space-x-8">
                <Link
                  to="/analytics"
                  className="text-purple-600 font-medium border-b-2 border-purple-600 px-1 pb-1"
                >
                  Аналитика
                </Link>
                <Link
                  to="/products"
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300"
                >
                  Товары
                </Link>
                <Link
                  to="/taxes"
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300"
                >
                  Налоговые ставки
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={loadAnalyticsData}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                title="Обновить данные"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('excel')}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Экспорт...' : 'Excel'}
                </button>
              </div>

              <div className="relative">
                <Link to="/profile" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">{user?.name || user?.email}</span>
                </Link>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Аналитика рентабельности</h1>
          <p className="text-gray-600">
            Подробный анализ продаж, маржи и рентабельности товаров
          </p>
        </div>

        {error ? (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Ошибка загрузки данных</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={loadAnalyticsData}
                className="mt-2 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                Повторить попытку
              </button>
            </div>
          </div>
        ) : null}

        {/* Фильтры */}
        <AnalyticsFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApply}
        />

        {/* Общая статистика */}
        {analyticsData && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
                  <span className="text-xs font-medium text-white bg-white/20 px-2 py-0.5 rounded-full">
                    {analyticsData.rentability.profitability > 0 ? '+' : ''}
                    {analyticsData.rentability.profitability.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-0.5">
                  {analyticsData.rentability.profitability.toFixed(1)}%
                </h3>
                <p className="text-white/80 text-sm">Общая рентабельность</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <DollarSign className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className={`text-xs font-medium ${
                    analyticsData.rentability.profitability > 20 ? 'text-emerald-700 bg-emerald-50' :
                    analyticsData.rentability.profitability > 10 ? 'text-yellow-600 bg-yellow-50' :
                    'text-red-600 bg-red-50'
                  } px-2 py-0.5 rounded-full`}>
                    {analyticsData.rentability.profitability > 0 ? '+' : ''}
                    {analyticsData.rentability.profitability.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.summary.total_revenue}
                </h3>
                <p className="text-gray-500 text-sm">Общая выручка</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <Wallet className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {analyticsData.rentability.shop_margin_payout.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.totals.total_payout.toLocaleString()} ₽
                </h3>
                <p className="text-gray-500 text-sm">Перечислено продавцу</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <PieChart className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {analyticsData.rentability.shop_margin_revenue.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.rentability.margin_minus_expenses.toLocaleString()} ₽
                </h3>
                <p className="text-gray-500 text-sm">Маржа</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50">
                    <Package className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {analyticsData.totals.product_count} шт.
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.totals.total_quantity}
                </h3>
                <p className="text-gray-500 text-sm">Продано товаров</p>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Расходы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Megaphone className="w-5 h-5 text-red-700" />
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    {(analyticsData.rentability.total_advertising / analyticsData.totals.total_revenue * 100).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.rentability.total_advertising.toLocaleString()} ₽
                </h3>
                <p className="text-gray-500 text-sm">Расходы на рекламу</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Warehouse className="w-5 h-5 text-red-700" />
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    {(analyticsData.totals.total_storage_fee / analyticsData.totals.total_revenue * 100).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.totals.total_storage_fee.toLocaleString()} ₽
                </h3>
                <p className="text-gray-500 text-sm">Хранение</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Truck className="w-5 h-5 text-red-700" />
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    {(analyticsData.rentability.total_logistics / analyticsData.totals.total_revenue * 100).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.rentability.total_logistics.toLocaleString()} ₽
                </h3>
                <p className="text-gray-500 text-sm">Логистика</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Receipt className="w-5 h-5 text-red-700" />
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    {(analyticsData.totals.total_tax / analyticsData.totals.total_revenue * 100).toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.totals.total_tax.toLocaleString()} ₽
                </h3>
                <p className="text-gray-500 text-sm">Налог</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-red-50">
                    <Percent className="w-5 h-5 text-red-700" />
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                    {analyticsData.rentability.drr.toFixed(2)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                  {analyticsData.rentability.drr.toFixed(2)}%
                </h3>
                <p className="text-gray-500 text-sm">DRR</p>
              </div>
            </div>

            {/* Товары: маржа и ABC-категория */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Статистика по товарам</h2>
                <span className="text-sm text-gray-500">
                  Показано {statsRows.length} из {filteredProducts.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {STATS_COLUMNS.map((column) => (
                        <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            type="button"
                            onClick={() => handleStatsSort(column.key)}
                            className="flex items-center gap-1 hover:text-gray-700"
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
                                className="w-full text-xs font-normal border border-gray-200 rounded px-1.5 py-1 text-gray-700"
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
                                className="w-full text-xs font-normal border border-gray-200 rounded px-1.5 py-1 text-gray-700 placeholder:text-gray-400"
                              />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statsRows.map(({ product, turnoverDays, marginCategory, turnoverCategory, abcCategory }) => (
                      <tr key={product.sku} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.margin.toLocaleString()} ₽
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          product.margin_percent > 40 ? 'text-emerald-600' :
                          product.margin_percent > 20 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {product.margin_percent.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
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
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 WB Analytics Dashboard. Аналитика обновляется после каждой синхронизации.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button className="text-gray-500 hover:text-gray-700 text-sm">
                Инструкция по аналитике
              </button>
              <button className="text-gray-500 hover:text-gray-700 text-sm">
                Справка по показателям
              </button>
              <button className="text-gray-500 hover:text-gray-700 text-sm">
                Экспорт данных
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}