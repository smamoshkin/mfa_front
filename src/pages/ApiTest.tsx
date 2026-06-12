import { useState } from 'react';
import { Wifi, Check, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { checkApiHealth } from '../utils/apiHealthCheck';
import { authApi } from '../api/authApi';
import { productsApi } from '../api/productsApi';
import { analyticsApi } from '../api/analyticsApi';

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');

  const testEndpoints = async () => {
    setIsTesting(true);
    setError('');
    const newResults: Record<string, any> = {};

    try {
      // 1. Проверка здоровья API
      const health = await checkApiHealth();
      newResults.health = {
        success: health.isHealthy,
        message: health.message,
        responseTime: health.responseTime,
      };

      // 2. Проверка публичных эндпоинтов (если есть)
      // Пропускаем, если нет публичных эндпоинтов

      // 3. Проверка аутентификации
      try {
        const token = localStorage.getItem('access_token');
        newResults.auth = {
          hasToken: !!token,
          tokenValid: false,
        };

        if (token) {
          // Пробуем получить текущего пользователя
          try {
            const user = await authApi.getCurrentUser();
            newResults.auth.tokenValid = true;
            newResults.auth.user = user.email;
          } catch (authError: any) {
            newResults.auth.tokenValid = false;
            newResults.auth.error = authError.response?.status === 401 
              ? 'Токен невалидный' 
              : authError.message;
          }
        }
      } catch (error: any) {
        newResults.auth = {
          success: false,
          error: error.message,
        };
      }

      // 4. Проверка товаров
      try {
        const products = await productsApi.getProducts({ limit: 1 });
        newResults.products = {
          success: true,
          count: products.length,
        };
      } catch (error: any) {
        newResults.products = {
          success: false,
          error: error.message,
          status: error.response?.status,
        };
      }

      // 5. Проверка аналитики
      try {
        const dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        
        await analyticsApi.getRentability({
          date_from: dateFrom.toISOString().split('T')[0],
          date_to: new Date().toISOString().split('T')[0],
          group_by: 'month',
        });
        newResults.analytics = {
          success: true,
        };
      } catch (error: any) {
        newResults.analytics = {
          success: false,
          error: error.message,
          status: error.response?.status,
        };
      }

    } catch (error: any) {
      setError(`Общая ошибка тестирования: ${error.message}`);
    } finally {
      setResults(newResults);
      setIsTesting(false);
    }
  };

  const getStatusIcon = (result: any) => {
    if (result.success === undefined) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return result.success ? (
      <Check className="w-5 h-5 text-green-500" />
    ) : (
      <X className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Wifi className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Тестирование подключения к API</h1>
                <p className="text-gray-600">Проверка доступности эндпоинтов бэкенда</p>
              </div>
            </div>
            
            <button
              onClick={testEndpoints}
              disabled={isTesting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Тестирование...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Запустить тесты
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Здоровье API */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Состояние API</h3>
                {results.health && getStatusIcon(results.health)}
              </div>
              
              {results.health ? (
                <div className={`p-4 rounded-lg ${
                  results.health.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Статус:</span>
                      <div className={`font-medium ${
                        results.health.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {results.health.success ? 'Доступен' : 'Недоступен'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Время ответа:</span>
                      <div className="font-medium text-gray-900">
                        {results.health.responseTime ? `${results.health.responseTime}ms` : '—'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">Сообщение:</span>
                      <div className="font-medium text-gray-900">{results.health.message}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нажмите "Запустить тесты" для проверки
                </div>
              )}
            </div>

            {/* Аутентификация */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Аутентификация</h3>
                {results.auth && getStatusIcon(results.auth)}
              </div>
              
              {results.auth ? (
                <div className={`p-4 rounded-lg ${
                  results.auth.tokenValid ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Токен в localStorage:</span>
                      <div className={`font-medium ${
                        results.auth.hasToken ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {results.auth.hasToken ? 'Присутствует' : 'Отсутствует'}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Валидность токена:</span>
                      <div className={`font-medium ${
                        results.auth.tokenValid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {results.auth.tokenValid ? 'Валидный' : 'Невалидный'}
                      </div>
                    </div>
                    {results.auth.user && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">Пользователь:</span>
                        <div className="font-medium text-gray-900">{results.auth.user}</div>
                      </div>
                    )}
                    {results.auth.error && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">Ошибка:</span>
                        <div className="font-medium text-red-700">{results.auth.error}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нажмите "Запустить тесты" для проверки
                </div>
              )}
            </div>

            {/* Товары */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Товары</h3>
                {results.products && getStatusIcon(results.products)}
              </div>
              
              {results.products ? (
                <div className={`p-4 rounded-lg ${
                  results.products.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Статус:</span>
                      <div className={`font-medium ${
                        results.products.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {results.products.success ? 'Доступен' : 'Недоступен'}
                      </div>
                    </div>
                    {results.products.success && (
                      <div>
                        <span className="text-sm text-gray-600">Загружено товаров:</span>
                        <div className="font-medium text-gray-900">{results.products.count}</div>
                      </div>
                    )}
                    {!results.products.success && results.products.status && (
                      <div>
                        <span className="text-sm text-gray-600">HTTP статус:</span>
                        <div className="font-medium text-gray-900">{results.products.status}</div>
                      </div>
                    )}
                    {results.products.error && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">Ошибка:</span>
                        <div className="font-medium text-red-700">{results.products.error}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нажмите "Запустить тесты" для проверки
                </div>
              )}
            </div>

            {/* Аналитика */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Аналитика</h3>
                {results.analytics && getStatusIcon(results.analytics)}
              </div>
              
              {results.analytics ? (
                <div className={`p-4 rounded-lg ${
                  results.analytics.success ? 'bg-green-50' : results.analytics.status === 404 ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Статус:</span>
                      <div className={`font-medium ${
                        results.analytics.success ? 'text-green-700' : 
                        results.analytics.status === 404 ? 'text-yellow-700' : 
                        'text-red-700'
                      }`}>
                        {results.analytics.success ? 'Доступен' : 
                         results.analytics.status === 404 ? 'Эндпоинт не найден' : 
                         'Недоступен'}
                      </div>
                    </div>
                    {!results.analytics.success && results.analytics.status && (
                      <div>
                        <span className="text-sm text-gray-600">HTTP статус:</span>
                        <div className="font-medium text-gray-900">{results.analytics.status}</div>
                      </div>
                    )}
                    {results.analytics.error && (
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">Ошибка:</span>
                        <div className="font-medium text-red-700">{results.analytics.error}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нажмите "Запустить тесты" для проверки
                </div>
              )}
            </div>

            {/* Инструкция */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Инструкция по настройке</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Убедитесь, что бэкенд запущен на <code className="bg-blue-100 px-1 rounded">localhost:8000</code></li>
                <li>Проверьте файл <code className="bg-blue-100 px-1 rounded">.env</code> с настройками</li>
                <li>Для аутентификации зарегистрируйтесь или войдите</li>
                <li>Если эндпоинты возвращают 404, проверьте правильность URL</li>
                <li>При ошибках CORS проверьте настройки бэкенда</li>
              </ol>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Текущий URL API:</span>
                  <div className="font-mono bg-gray-100 p-2 rounded mt-1">
                    {import.meta.env.VITE_API_BASE_URL || 'Не настроен'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Токен в localStorage:</span>
                  <div className="font-mono bg-gray-100 p-2 rounded mt-1 truncate">
                    {localStorage.getItem('access_token') 
                      ? `${localStorage.getItem('access_token')?.substring(0, 30)}...` 
                      : 'Отсутствует'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}