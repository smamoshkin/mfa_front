import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, DollarSign, Package, PieChart, 
  Download, Filter, Calendar, RefreshCw, AlertCircle 
} from 'lucide-react';
import AnalyticsFiltersComponent from '../components/AnalyticsFilters';
import AnalyticsTable from '../components/AnalyticsTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { analyticsApi } from '../api/analyticsApi';
import type { RentabilityResponse, AnalyticsFilters } from '../types/analytics';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<RentabilityResponse | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<RentabilityResponse['products']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  // Начальные фильтры (текущий месяц)
  const [filters, setFilters] = useState<AnalyticsFilters>({
    date_from: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    date_to: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
    group_by: 'month',
  });

  // Загрузка данных
  useEffect(() => {
    loadAnalyticsData();
  }, [filters.date_from, filters.date_to, filters.group_by]);

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

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Реальный API вызов
      const data = await analyticsApi.getRentability({
        date_from: filters.date_from,
        date_to: filters.date_to,
        group_by: filters.group_by,
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
                  to="/dashboard" 
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300"
                >
                  Дашборд
                </Link>
                <Link 
                  to="/products" 
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300"
                >
                  Товары
                </Link>
                <Link 
                  to="/analytics" 
                  className="text-purple-600 font-medium border-b-2 border-purple-600 px-1 pb-1"
                >
                  Аналитика
                </Link>
                <Link 
                  to="/taxes" 
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300">
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
                {/* <button
                  onClick={() => handleExport('pdf')}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </button> */}
              </div>
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
        />

        {/* Общая статистика */}
        {analyticsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`text-sm font-medium ${
                    analyticsData.rentability.profitability > 20 ? 'text-green-600 bg-green-50' :
                    analyticsData.rentability.profitability > 10 ? 'text-yellow-600 bg-yellow-50' :
                    'text-red-600 bg-red-50'
                  } px-2 py-1 rounded-full`}>
                    {analyticsData.rentability.profitability > 0 ? '+' : ''}
                    {analyticsData.rentability.profitability.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsData.summary.total_revenue}
                </h3>
                <p className="text-gray-500 text-sm">Общая выручка</p>
                <div className="mt-2 text-sm text-gray-600">
                  Маржа: {analyticsData.summary.total_margin}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-green-100">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {analyticsData.totals.product_count} шт.
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsData.totals.total_quantity}
                </h3>
                <p className="text-gray-500 text-sm">Продано товаров</p>
                <div className="mt-2 text-sm text-gray-600">
                  {analyticsData.rentability.margin_per_unit.toFixed(2)} ₽ маржа/ед.
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <PieChart className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {analyticsData.rentability.shop_margin_revenue.toFixed(1)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsData.rentability.margin_after_salary.toLocaleString()} ₽
                </h3>
                <p className="text-gray-500 text-sm">Маржа после зарплаты</p>
                <div className="mt-2 text-sm text-gray-600">
                  Зарплата: {analyticsData.rentability.total_salary.toLocaleString()} ₽
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    {filteredProducts.length}/{analyticsData.products.length}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {analyticsData.totals.product_count}
                </h3>
                <p className="text-gray-500 text-sm">Товаров в аналитике</p>
                <div className="mt-2 text-sm text-gray-600">
                  Показано: {filteredProducts.length} товаров
                </div>
              </div>
            </div>

            {/* Графики */}
            <div className="mb-8">
              <AnalyticsCharts 
                analyticsData={analyticsData}
                filteredProducts={filteredProducts}
              />
            </div>

            {/* Детальная аналитика */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Детальная аналитика</h2>
                <div className="text-sm text-gray-500">
                  Период: с {format(new Date(analyticsData.period.date_from), 'd MMMM yyyy', { locale: ru })} по{' '}
                  {format(new Date(analyticsData.period.date_to), 'd MMMM yyyy', { locale: ru })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Основные показатели</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Общая маржа:</span>
                      <span className="font-medium">{analyticsData.rentability.margin_minus_expenses.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Маржа на единицу:</span>
                      <span className="font-medium">{analyticsData.rentability.margin_per_unit.toFixed(2)} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Магазинная наценка (выручка):</span>
                      <span className="font-medium">{analyticsData.rentability.shop_margin_revenue.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Магазинная наценка (выплата):</span>
                      <span className="font-medium">{analyticsData.rentability.shop_margin_payout.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Расходы</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Логистика:</span>
                      <span className="font-medium">{analyticsData.rentability.total_logistics.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Реклама:</span>
                      <span className="font-medium">{analyticsData.rentability.total_advertising.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Хранение:</span>
                      <span className="font-medium">{analyticsData.totals.total_storage_fee.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Налог:</span>
                      <span className="font-medium">{analyticsData.totals.total_tax.toLocaleString()} ₽</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Финансовые показатели</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Выплата WB (10%):</span>
                      <span className="font-medium">{analyticsData.rentability.wb_realized_10p.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Премия (5%):</span>
                      <span className="font-medium">{analyticsData.rentability.premium_5p.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Маржа (10%):</span>
                      <span className="font-medium">{analyticsData.rentability.margin_10p.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">DRR:</span>
                      <span className="font-medium">{analyticsData.rentability.drr.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Таблица товаров */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <AnalyticsTable 
                products={filteredProducts}
                isLoading={isLoading}
              />
            </div>

            {/* Информация о данных */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">Информация:</span> Данные обновляются при каждой загрузке страницы. 
                  {error && <span className="ml-2 text-red-600">Внимание: {error}</span>}
                </div>
                <div className="flex items-center space-x-4">
                  <span>DRR: {analyticsData.rentability.drr.toFixed(2)}%</span>
                  <span>Товаров: {filteredProducts.length}</span>
                  <span>Период: {analyticsData.period.group_by}</span>
                </div>
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