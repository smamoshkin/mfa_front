import { BarChart3, Package, RefreshCw, TrendingUp, User, Activity } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import WbApiKeyModal from '../components/WbApiKeyModal';
import { Link } from 'react-router-dom';
import type { DashboardMetrics, SalesData, TopProduct, ActivityItem } from '../types/dashboard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout, setWbApiKey } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    metrics: DashboardMetrics;
    salesChart: SalesData[];
    topProducts: TopProduct[];
    recentActivity: ActivityItem[];
    lastSync: string;
  } | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days'>('30days');

  // Загрузка данных при монтировании
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [metrics, salesChart, topProducts, recentActivity] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getSalesChartData(selectedPeriod),
        dashboardApi.getTopProducts(5),
        dashboardApi.getRecentActivity()
      ]);
  
      setDashboardData({
        metrics,
        salesChart,
        topProducts,
        recentActivity,
        lastSync: new Date().toISOString()
      });
      
      // ДОБАВЬ успешное уведомление (опционально, можно убрать если мешает)
      // toast.success('Данные дашборда загружены');
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      
      // ДОБАВЬ уведомление об ошибке
      toast.error('Не удалось загрузить данные дашборда');
      
      // Установи заглушечные данные при ошибке
      setDashboardData({
        metrics: { sales: 0, revenue: 0, products: 0, profitability: 0 },
        salesChart: [],
        topProducts: [],
        recentActivity: [
          { time: new Date().toISOString(), action: 'Ошибка загрузки данных', status: 'error' }
        ],
        lastSync: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    // ДОБАВЬ уведомление о начале синхронизации
    const syncToast = toast.loading('Начинаем синхронизацию...');
    
    try {
      const result = await dashboardApi.startSync();
      
      if (result.success) {
        // Обновляем уведомление на успешное
        toast.success('Синхронизация успешно завершена', { id: syncToast });
        
        // Перезагружаем данные после успешной синхронизации
        await loadDashboardData();
      } else {
        toast.error('Синхронизация не удалась', { id: syncToast });
      }
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      
      // Обновляем уведомление на ошибку
      toast.error('Ошибка при синхронизации. Проверьте подключение к API', { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePeriodChange = async (period: '7days' | '30days' | '90days') => {
    setSelectedPeriod(period);
    try {
      const salesChart = await dashboardApi.getSalesChartData(period);
      setDashboardData(prev => prev ? { ...prev, salesChart } : null);
    } catch (error) {
      console.error('Ошибка загрузки данных для периода:', error);
      toast.error('Не удалось загрузить данные для выбранного периода');
    }
  };

  // Метрики с реальными данными или заглушками
  const metrics = dashboardData ? [
    { 
      label: 'Продажи за месяц', 
      value: dashboardData.metrics.sales.toLocaleString(), 
      change: dashboardData.metrics.sales_change ? `${dashboardData.metrics.sales_change > 0 ? '+' : ''}${dashboardData.metrics.sales_change.toFixed(1)}%` : '+12.5%', 
      icon: TrendingUp, 
      color: dashboardData.metrics.sales_change && dashboardData.metrics.sales_change >= 0 ? 'green' : 'red' 
    },
    { 
      label: 'Выручка', 
      value: `₽ ${dashboardData.metrics.revenue.toLocaleString()}`, 
      change: dashboardData.metrics.revenue_change ? `${dashboardData.metrics.revenue_change > 0 ? '+' : ''}${dashboardData.metrics.revenue_change.toFixed(1)}%` : '+8.2%', 
      icon: BarChart3, 
      color: dashboardData.metrics.revenue_change && dashboardData.metrics.revenue_change >= 0 ? 'blue' : 'red' 
    },
    { 
      label: 'Товаров в каталоге', 
      value: dashboardData.metrics.products.toString(), 
      change: dashboardData.metrics.products_change ? `${dashboardData.metrics.products_change > 0 ? '+' : ''}${dashboardData.metrics.products_change}` : '+5', 
      icon: Package, 
      color: 'purple' 
    },
    { 
      label: 'Рентабельность', 
      value: `${dashboardData.metrics.profitability.toFixed(1)}%`, 
      change: dashboardData.metrics.profitability_change ? `${dashboardData.metrics.profitability_change > 0 ? '+' : ''}${dashboardData.metrics.profitability_change.toFixed(1)}%` : '+3.1%', 
      icon: Activity, 
      color: dashboardData.metrics.profitability_change && dashboardData.metrics.profitability_change >= 0 ? 'orange' : 'red' 
    },
  ] : [
    { label: 'Продажи за месяц', value: '—', change: '', icon: TrendingUp, color: 'gray' },
    { label: 'Выручка', value: '—', change: '', icon: BarChart3, color: 'gray' },
    { label: 'Товаров в каталоге', value: '—', change: '', icon: Package, color: 'gray' },
    { label: 'Рентабельность', value: '—', change: '', icon: Activity, color: 'gray' },
  ];

  // Форматирование времени для активности
  const formatTime = (timeString: string) => {
    const now = new Date();
    const time = new Date(timeString);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} час назад`;
    return time.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
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
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">WB Analytics</span>
              </div>
              
              <nav className="ml-10 flex space-x-8">
                <Link 
                  to="/dashboard" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 px-1 pb-1"
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
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300"
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
              onClick={async () => {
                try {
                  await handleSync();
                } catch (error) {
                  toast.error('Ошибка при запуске синхронизации');
                }
              }}
              disabled={isSyncing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
              
              <div className="relative">
                <Link to="/profile" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">{user?.name || user?.email}</span>
                </Link>
              </div>
              
              {!user?.wb_api_key && (
                <button
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                >
                  Добавить WB ключ
                </button>
              )}
              
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
        {/* Приветствие */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Добро пожаловать, {user?.name || 'Пользователь'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Вот обзор вашей деятельности на Wildberries
            {dashboardData?.lastSync && (
              <span className="text-gray-400 text-sm ml-2">
                (данные обновлены: {formatTime(dashboardData.lastSync)})
              </span>
            )}
          </p>
        </div>

        {/* Метрики 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${getColorClass(metric.color, 'bg', 100)}`}>
                  <metric.icon className={`w-6 h-6 ${getColorClass(metric.color, 'text', 600)}`} />
                </div>
                {metric.change && (
                  <span className={`text-sm font-medium ${getColorClass(metric.color, 'text', 600)} ${getColorClass(metric.color, 'bg', 50)} px-2 py-1 rounded-full`}>
                    {metric.change}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
              <p className="text-gray-500 text-sm">{metric.label}</p>
            </div>
          ))}
        </div>*/}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* График продаж 
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Динамика продаж</h2>
              <select 
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value as any)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="7days">За 7 дней</option>
                <option value="30days">За 30 дней</option>
                <option value="90days">За 90 дней</option>
              </select>
            </div>*/}
            
            {/* График продаж 
            {dashboardData?.salesChart && dashboardData.salesChart.length > 0 ? (
              <div className="h-64">*/}
                {/* Здесь будет компонент графика 
                <div className="flex items-center justify-between h-full">
                  <div className="w-full">*/}
                    {/* Простой текстовый график для начала 
                    <div className="flex items-end justify-between h-48 px-4">
                      {dashboardData.salesChart.map((data, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className="w-8 bg-blue-500 rounded-t-lg mb-2"
                            style={{ height: `${(data.sales / Math.max(...dashboardData.salesChart.map(d => d.sales))) * 100}%` }}
                          ></div>
                          <span className="text-xs text-gray-500">
                            {new Date(data.date).getDate()}/{new Date(data.date).getMonth() + 1}
                          </span>
                          <span className="text-xs font-medium">{data.sales}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-4 text-gray-500">
                      Продажи по дням
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Нет данных для графика</p>
                </div>
              </div>
            )}
          </div>*/}

          {/* Активность */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Последняя активность</h2>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 mt-2 rounded-full ${getStatusColor(activity.status)}`}></div>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.action}</p>
                      <p className="text-gray-500 text-sm">{formatTime(activity.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Нет данных об активности
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Синхронизация...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Запустить синхронизацию
                  </>
                )}
              </button>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Последняя синхронизация: {dashboardData?.lastSync ? formatTime(dashboardData.lastSync) : 'неизвестно'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Топ товары 
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Топ товары по продажам</h2>
          
          {dashboardData?.topProducts && dashboardData.topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Товар</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Продажи</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Выручка</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Рентабельность</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.topProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-8 h-8 object-cover rounded mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.sku && (
                              <div className="text-sm text-gray-500">{product.sku}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.sales.toLocaleString()}</td>
                      <td className="py-3 px-4">₽ {product.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                          product.profitability > 20 ? 'bg-green-100 text-green-800' : 
                          product.profitability > 10 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.profitability.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Нет данных о товарах
            </div>
          )}
        </div>*/}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} WB Analytics Dashboard. Все данные обновляются в реальном времени.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Документация
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Поддержка
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Конфиденциальность
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      <WbApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)}
        onSuccess={() => {
          setIsApiKeyModalOpen(false);
          loadDashboardData();
        }}
      />
    </div>
  );
}

// Вспомогательные функции
function getColorClass(color: string, type: 'text' | 'bg', shade: number): string {
  const colorMap: Record<string, string> = {
    green: 'green',
    blue: 'blue',
    purple: 'purple',
    orange: 'orange',
    red: 'red',
    gray: 'gray'
  };
  
  const actualColor = colorMap[color] || 'gray';
  return `${type}-${actualColor}-${shade}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'success': return 'bg-green-500';
    case 'info': return 'bg-blue-500';
    case 'warning': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}