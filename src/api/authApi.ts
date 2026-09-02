// authApi.ts
import axiosClient from './axiosClient';
import type { User } from '../types/api';

export interface LoginRequest {
  email: string;  // Это email пользователя
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Регистрация больше НЕ логинит сразу: сначала подтверждение email письмом
export interface RegisterResponse {
  message: string;
  email: string;
}

// Версия текста согласия на обработку ПД. Держать в синхроне с документом
// docs/legal/02-consent-pd.md («Версия: X.Y») — бэк пишет её в таблицу pd_consents.
export const PD_CONSENT_VERSION = '1.0';

export interface RegisterRequest {
  login_email: string;
  password: string;
  name: string;
  consent_version?: string;
}

export const authApi = {
  // Вход - используем email как username для OAuth2
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);  // Ключевой момент: username = email
    formData.append('password', data.password);
    
    const response = await axiosClient.post('/auth/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Регистрация — письмо со ссылкой подтверждения, без автологина.
  // consent_version: какой версией текста согласия пользователь отметил галку —
  // бэк фиксирует это как доказательство (152-ФЗ).
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await axiosClient.post('/auth/register', {
      login_email: data.login_email,
      password: data.password,
      name: data.name || '',
      consent_version: data.consent_version ?? PD_CONSENT_VERSION,
    });
    return response.data;
  },

  // Подтверждение email по токену из письма — сразу логинит
  verifyEmail: async (token: string): Promise<LoginResponse> => {
    const response = await axiosClient.post('/auth/verify-email', { token });
    return response.data;
  },

  // Повторная отправка письма подтверждения (rate limit 60 сек на бэке)
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await axiosClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  // Запрос сброса пароля — всегда 200, не раскрывает существование email
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Проверка reset-токена без потребления (используется/устарел?)
  validateResetToken: async (token: string): Promise<{ valid: boolean }> => {
    const response = await axiosClient.post('/auth/validate-reset-token', { token });
    return response.data;
  },

  // Установка нового пароля по одноразовому токену из письма
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await axiosClient.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  // Получение текущего пользователя
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get('/tenants/me');
    return response.data;
  },

  // Обновление WB API ключа
  updateWbApiKey: async (tenantId: string, wbApiKey: string): Promise<void> => {
    await axiosClient.patch(`/tenants/${tenantId}/set_wb_key`, {
      wb_api_key: wbApiKey,
    });
  },

  // Выход (на клиенте просто удаляем токен)
  logout: () => {
    sessionStorage.removeItem('access_token');
  },

  updateProfile: async (data: {
    name?: string;
    email?: string;
    wb_api_key?: string;
    ozon_api_key?: string;
  }): Promise<any> => {
    const response = await axiosClient.patch('/auth/profile', data);
    return response.data;
  },
  
  changePassword: async (data: {
    current_password: string;
    new_password: string;
  }): Promise<any> => {
    const response = await axiosClient.post('/auth/change-password', data);
    return response.data;
  },
  
  // Получение даты экспирации токена
  getTokenExpirationDate: async (tenant_id: number): Promise<User> => {
    const response = await axiosClient.get(`/tenants/${tenant_id}/token_expire_date`);
    return response.data;
  },
};



