import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '../api/authApi';
import type { RegisterResponse } from '../api/authApi';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  // true, когда логин отклонён из-за неподтверждённого email (403 + X-Error-Code)
  emailUnverified: boolean;

  // Действия
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<RegisterResponse>;
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
      emailUnverified: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null, emailUnverified: false });
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
          const errorCode = error.response?.headers?.['x-error-code'];
          const isUnverified =
            error.response?.status === 403 && errorCode === 'email_unverified';
          const errorMessage = isUnverified
            ? 'Email не подтверждён. Проверьте почту — мы отправили письмо со ссылкой подтверждения.'
            : error.response?.data?.detail ||
              error.response?.data?.message ||
              'Ошибка входа. Проверьте email и пароль';

          set({
            error: errorMessage,
            emailUnverified: isUnverified,
            isLoading: false,
          });

          // Очищаем токен при ошибке
          localStorage.removeItem('access_token');
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({
            login_email: email,
            password: password,
            name: name || 'Новый пользователь',
          });

          // Регистрация НЕ логинит: токена нет, ждём подтверждения email.
          // Ответ (message + email) уходит вызывающей странице — она покажет
          // экран «проверьте почту».
          set({ isLoading: false });
          return response;

        } catch (error: any) {
          const errorMessage = error.response?.data?.detail ||
                             error.response?.data?.message ||
                             'Ошибка регистрации';

          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
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

      clearError: () => set({ error: null, emailUnverified: false }),
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