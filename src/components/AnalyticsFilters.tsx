import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnalyticsFilters } from '../types/analytics';
import {
  startOfMonth, endOfMonth, subMonths, addMonths,
  format
} from 'date-fns';

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFilterChange: (filters: AnalyticsFilters) => void;
  onApply: () => void;
}

export default function AnalyticsFiltersComponent({ filters, onFilterChange, onApply }: AnalyticsFiltersProps) {
  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const getSelectedMonth = () => {
    return filters.date_from ? new Date(filters.date_from + 'T00:00:00') : new Date();
  };

  const navigateMonth = (direction: 'prev' | 'current' | 'next') => {
    let ref: Date;
    if (direction === 'current') {
      ref = new Date();
    } else {
      const current = getSelectedMonth();
      ref = direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
    }
    onFilterChange({
      ...filters,
      date_from: format(startOfMonth(ref), 'yyyy-MM-dd'),
      date_to: format(endOfMonth(ref), 'yyyy-MM-dd'),
    });
  };

  const isCurrentMonthSelected = () => {
    const now = new Date();
    return (
      filters.date_from === format(startOfMonth(now), 'yyyy-MM-dd') &&
      filters.date_to === format(endOfMonth(now), 'yyyy-MM-dd')
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Предыдущий месяц
        </button>

        <button
          onClick={() => navigateMonth('current')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isCurrentMonthSelected()
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Текущий месяц
        </button>

        <button
          onClick={() => navigateMonth('next')}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          Следующий месяц
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleDateChange('date_from', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleDateChange('date_to', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <button
          onClick={onApply}
          className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Применить
        </button>
      </div>
    </div>
  );
}