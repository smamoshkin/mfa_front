import axios from 'axios';

// Базовый URL API из переменных окружения
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут
});

// Интерцептор для добавления JWT токена
axiosClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
axiosClient.interceptors.response.use(
  (response) => {
    // Можно обрабатывать успешные ответы здесь
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Логирование ошибок
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
      });
    } else if (error.request) {
      console.error('API Request Error:', error.request);
    } else {
      console.error('API Error:', error.message);
    }

    // Если ошибка 401 (Unauthorized) и еще не пытались обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Попытка обновить токен (если есть refresh token логика)
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (refreshToken) {
          // Здесь можно добавить запрос на обновление токена
          // const response = await axios.post('/auth/refresh', { refresh_token: refreshToken });
          // const { access_token } = response.data;
          // localStorage.setItem('access_token', access_token);
          // originalRequest.headers.Authorization = `Bearer ${access_token}`;
          // return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Если не удалось обновить токен или нет refresh token
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('auth-storage');
      
      // Редирект на логин только если не на странице логина
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Для ошибок 403, 404, 500 можно добавить специальную обработку
    if (error.response?.status === 403) {
      console.error('Forbidden access');
      // Можно показать уведомление
    }

    if (error.response?.status === 404) {
      console.error('Resource not found');
    }

    if (error.response?.status === 500) {
      console.error('Server error');
    }

    // Пробрасываем ошибку дальше
    return Promise.reject(error);
  }
);

export default axiosClient;