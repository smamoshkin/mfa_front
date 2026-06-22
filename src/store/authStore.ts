import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../api/authApi';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Действия
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setWbApiKey: (wbApiKey: string) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  updateUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ 
            email: username,  // username из параметра = это email
            password: password 
          });
          
          set({
            user: null,
            token: response.access_token,
            isLoading: false,
          });
          
          sessionStorage.setItem('access_token', response.access_token);

          // Загружаем информацию о пользователе после успешного логина
          get().loadCurrentUser();

        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                             error.response?.data?.message || 
                             'Ошибка входа. Проверьте email и пароль';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          
          // Очищаем токен при ошибке
          localStorage.removeItem('access_token');
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          // ИСПРАВЛЯЕМ ЗДЕСЬ: регистрация использует login_email
          const response = await authApi.register({ 
            login_email: email,  // меняем поле на login_email
            password: password,
            name: name || 'Новый пользователь',
          });
          
          set({
            user: null, // user будет null после регистрации
            token: response.access_token,
            isLoading: false,
          });
          
          sessionStorage.setItem('access_token', response.access_token);
          
          // Загружаем информацию о пользователе
          get().loadCurrentUser();
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                             error.response?.data?.message || 
                             'Ошибка регистрации';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          error: null,
        });
        authApi.logout();
      },

      setWbApiKey: async (wbApiKey: string) => {
        const { user } = get();
        if (!user) throw new Error('Пользователь не авторизован');

        set({ isLoading: true, error: null });
        try {
          await authApi.updateWbApiKey(user.id.toString(), wbApiKey);
          // Бэкенд не возвращает User — обновляем поле локально
          set({
            user: { ...user, wb_api_key: wbApiKey },
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail ||
                             error.response?.data?.message ||
                             'Ошибка сохранения API ключа';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      loadCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          const user = await authApi.getCurrentUser();
          set({
            user,
            isLoading: false,
          });
        } catch (error: any) {
          // Если ошибка 401, разлогиниваем пользователя
          if (error.response?.status === 401) {
            get().logout();
          } else {
            set({
              error: 'Ошибка загрузки пользователя',
              isLoading: false,
            });
          }
        }
      },

      updateUser: async () => {
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isLoading: false, error: null });
        } catch (error) {
          console.error('Ошибка обновления пользователя:', error);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token
      }),
    }
  )
);