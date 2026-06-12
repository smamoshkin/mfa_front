import axiosClient from '../api/axiosClient';

export const checkApiHealth = async (): Promise<{
  isHealthy: boolean;
  message: string;
  responseTime?: number;
}> => {
  const startTime = Date.now();
  
  try {
    // Пробуем получить публичный эндпоинт (если есть)
    // Или просто проверяем соединение
    await axiosClient.get('/health', { timeout: 5000 });
    
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: true,
      message: 'API доступен',
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.code === 'ECONNREFUSED') {
      return {
        isHealthy: false,
        message: 'Не удалось подключиться к серверу API',
        responseTime,
      };
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return {
        isHealthy: false,
        message: 'Сетевая ошибка. Проверьте подключение к интернету',
        responseTime,
      };
    }
    
    if (error.response?.status === 404) {
      // Эндпоинт /health может не существовать, но соединение есть
      return {
        isHealthy: true,
        message: 'Соединение установлено (эндпоинт /health не найден)',
        responseTime,
      };
    }
    
    return {
      isHealthy: false,
      message: `Ошибка подключения: ${error.message}`,
      responseTime,
    };
  }
};