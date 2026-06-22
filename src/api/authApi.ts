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

export interface RegisterRequest {
  login_email: string;
  password: string;
  name: string;
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

  // Регистрация
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await axiosClient.post('/auth/register', {
      login_email: data.login_email,
      password: data.password,
      name: data.name || '',
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



