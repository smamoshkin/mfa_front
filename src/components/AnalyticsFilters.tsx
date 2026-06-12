import { Search, Filter, Calendar } from 'lucide-react';
import { AnalyticsFilters } from '../types/analytics';
import { 
  startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, subYears,
  startOfQuarter, endOfQuarter, subQuarters,
  format 
} from 'date-fns';

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFilterChange: (filters: AnalyticsFilters) => void;
}

export default function AnalyticsFiltersComponent({ filters, onFilterChange }: AnalyticsFiltersProps) {
  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleGroupByChange = (value: 'day' | 'week' | 'month' | 'year') => {
    onFilterChange({ ...filters, group_by: value });
  };

  const handleSkuChange = (value: string) => {
    onFilterChange({ ...filters, sku: value });
  };

  const handleMarginChange = (value: number) => {
    onFilterChange({ ...filters, min_margin_percent: value || undefined });
  };

  const handleQuantityChange = (value: number) => {
    onFilterChange({ ...filters, min_quantity: value || undefined });
  };

  // Функция для установки предопределенных периодов
  const setPeriod = (period: 'current_month' | 'last_month' | 'last_quarter' | 'last_year') => {
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date;
  
    switch (period) {
      case 'current_month':
        // Текущий месяц: с первого по последнее число текущего месяца
        dateFrom = startOfMonth(now);
        dateTo = endOfMonth(now);
        break;
      
      case 'last_month':
        // Прошлый месяц
        const lastMonth = subMonths(now, 1);
        dateFrom = startOfMonth(lastMonth);
        dateTo = endOfMonth(lastMonth);
        break;
      
      case 'last_quarter':
        // Прошлый квартал
        const lastQuarter = subQuarters(startOfQuarter(now), 1);
        dateFrom = startOfQuarter(lastQuarter);
        dateTo = endOfQuarter(lastQuarter);
        break;
      
      case 'last_year':
        // Прошлый год
        const lastYear = subYears(now, 1);
        dateFrom = startOfYear(lastYear);
        dateTo = endOfYear(lastYear);
        break;
      
      default:
        // По умолчанию - текущий месяц
        dateFrom = startOfMonth(now);
        dateTo = endOfMonth(now);
    }
  
    // Форматируем даты в YYYY-MM-DD и обновляем фильтры через onFilterChange
    onFilterChange({ 
      ...filters,
      date_from: format(dateFrom, 'yyyy-MM-dd'),
      date_to: format(dateTo, 'yyyy-MM-dd')
    });
  };

  // Вспомогательная функция для сравнения дат
  const isLastMonthSelected = () => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
    return filters.date_from === lastMonthStart;
  };

  const isCurrentMonthSelected = () => {
    const currentMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    return filters.date_from === currentMonthStart;
  };

  const isLastQuarterSelected = () => {
    const now = new Date();
    const lastQuarter = subQuarters(startOfQuarter(now), 1);
    const lastQuarterStart = format(startOfQuarter(lastQuarter), 'yyyy-MM-dd');
    return filters.date_from === lastQuarterStart;
  };

  const isLastYearSelected = () => {
    const now = new Date();
    const lastYear = subYears(now, 1);
    const lastYearStart = format(startOfYear(lastYear), 'yyyy-MM-dd');
    return filters.date_from === lastYearStart;
  };

  // Функция сброса фильтров
  const resetFilters = () => {
    const now = new Date();
    const dateFrom = startOfMonth(now);
    const dateTo = endOfMonth(now);
    
    onFilterChange({
      date_from: format(dateFrom, 'yyyy-MM-dd'),
      date_to: format(dateTo, 'yyyy-MM-dd'),
      group_by: 'month',
      sku: undefined,
      min_margin_percent: undefined,
      min_quantity: undefined
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Фильтры аналитики</h3>
        </div>
        <div className="text-sm text-gray-500">
          Показаны данные за период
        </div>
      </div>

      {/* Быстрый выбор периода */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setPeriod('current_month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isCurrentMonthSelected()
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Текущий месяц
        </button>
        <button
          onClick={() => setPeriod('last_month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isLastMonthSelected()
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}>
          Прошлый месяц
        </button>
        <button
          onClick={() => setPeriod('last_quarter')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isLastQuarterSelected()
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Прошлый квартал
        </button>
        <button
          onClick={() => setPeriod('last_year')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isLastYearSelected()
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Прошлый год
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Дата начала */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Дата начала</span>
            </div>
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleDateChange('date_from', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Дата окончания */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Дата окончания</span>
            </div>
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleDateChange('date_to', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Группировка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Группировка
          </label>
          <select
            value={filters.group_by}
            onChange={(e) => handleGroupByChange(e.target.value as any)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="day">По дням</option>
            <option value="week">По неделям</option>
            <option value="month">По месяцам</option>
            <option value="year">По годам</option>
          </select>
        </div>

        {/* Поиск по SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <span>Поиск SKU/товара</span>
            </div>
          </label>
          <input
            type="text"
            value={filters.sku || ''}
            onChange={(e) => handleSkuChange(e.target.value)}
            placeholder="Введите SKU или название"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Минимальная рентабельность */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Мин. рентабельность (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.min_margin_percent || ''}
            onChange={(e) => handleMarginChange(parseInt(e.target.value) || 0)}
            placeholder="0%"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Дополнительные фильтры */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Мин. количество продаж
          </label>
          <input
            type="number"
            min="0"
            value={filters.min_quantity || ''}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="w-full px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Информация о периоде */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Период: с {filters.date_from} по {filters.date_to}
          </span>
          <span className="text-gray-600">
            Группировка: {filters.group_by === 'day' ? 'по дням' : 
                        filters.group_by === 'week' ? 'по неделям' : 
                        filters.group_by === 'month' ? 'по месяцам' : 'по годам'}
          </span>
        </div>
      </div>
    </div>
  );
}