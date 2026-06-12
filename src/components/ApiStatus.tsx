import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { checkApiHealth } from '../utils/apiHealthCheck';

export default function ApiStatus() {
  const [status, setStatus] = useState<{
    isHealthy: boolean;
    message: string;
    responseTime?: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const health = await checkApiHealth();
      setStatus(health);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking API health:', error);
      setStatus({
        isHealthy: false,
        message: 'Ошибка проверки статуса API',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Проверяем статус каждые 30 секунд
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`rounded-lg shadow-lg p-4 border ${
        status.isHealthy 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            status.isHealthy ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {status.isHealthy ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
          </div>
          
          <div className="flex-grow">
            <div className="font-medium text-gray-900">
              {status.isHealthy ? 'API доступен' : 'Проблемы с API'}
            </div>
            <div className="text-sm text-gray-600">
              {status.message}
              {status.responseTime && (
                <span className="ml-2 text-gray-500">
                  ({status.responseTime}ms)
                </span>
              )}
            </div>
            {lastChecked && (
              <div className="text-xs text-gray-500 mt-1">
                Проверено: {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <button
            onClick={checkStatus}
            disabled={isChecking}
            className={`p-2 rounded-lg ${
              status.isHealthy 
                ? 'text-green-600 hover:bg-green-100' 
                : 'text-red-600 hover:bg-red-100'
            } transition ${isChecking ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Проверить статус API"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {!status.isHealthy && (
          <div className="mt-3 pt-3 border-t border-red-200">
            <div className="flex items-start space-x-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700">
                  Проверьте:
                </p>
                <ul className="list-disc list-inside text-red-600 mt-1 space-y-1">
                  <li>Запущен ли бэкенд на localhost:8000</li>
                  <li>Настройки в файле .env</li>
                  <li>Сетевое подключение</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}