import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import {
  User, Mail, Key, Lock, Shield,
  Save, Eye, EyeOff, Globe, Building,
  CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { authApi } from '../api/authApi';
import { format } from 'date-fns';

// Схемы валидации
const profileSchema = z.object({
  name: z.string().min(2, 'Имя должно быть не менее 2 символов').max(100),
  email: z.string().email('Введите корректный email'),
  wb_api_key: z.string().optional(),
  ozon_api_key: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Введите текущий пароль'),
  new_password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  confirm_password: z.string().min(6, 'Подтвердите пароль'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Пароли не совпадают",
  path: ["confirm_password"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function TenantProfile() {
  const { user, updateUser, setWbApiKey } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'api'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [showWbKey, setShowWbKey] = useState(false);
  const [wbApiKeyInput, setWbApiKeyInput] = useState(user?.wb_api_key || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      wb_api_key: user?.wb_api_key || '',
      ozon_api_key: user?.ozon_api_key || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  // Обновляем форму при изменении пользователя
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
        wb_api_key: user.wb_api_key || '',
        ozon_api_key: user.ozon_api_key || '',
      });
      setWbApiKeyInput(user.wb_api_key || '');
    }
  }, [user]);

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      await authApi.updateProfile(data);
      await updateUser(); // Обновляем данные в store
      setMessage({ type: 'success', text: 'Профиль успешно обновлен!' });
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Ошибка обновления профиля' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      await authApi.changePassword(data);
      passwordForm.reset();
      setMessage({ type: 'success', text: 'Пароль успешно изменен!' });
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Ошибка изменения пароля' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWbApiKeyUpdate = async () => {
    if (!wbApiKeyInput.trim()) {
      setMessage({ type: 'error', text: 'Введите API ключ Wildberries' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      await setWbApiKey(wbApiKeyInput.trim());
      setMessage({ type: 'success', text: 'API ключ Wildberries успешно сохранён!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Ошибка сохранения ключа: ${err.response?.data?.detail || err.message || 'неизвестная ошибка'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Левая панель - навигация и информация */}
          <div className="lg:w-1/4 space-y-6">
            <div className="bg-card rounded-xl shadow-sm border border-card p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-app">{user?.name || 'Пользователь'}</h2>
                <p className="text-app-2 text-sm">{user?.email}</p>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user?.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-app-muted">ID:</span>
                  <span className="font-mono text-app">{user?.id}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-app-muted">Аккаунт создан:</span>
                  <span className="text-app">{formatDate(user?.created_at)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-app-muted">Последний вход:</span>
                  <span className="text-app">{formatDate(user?.last_login)}</span>
                </div>
                {user?.email_verified && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Email подтвержден
                  </div>
                )}
              </div>
            </div>

            {/* Навигация */}
            <div className="bg-card rounded-xl shadow-sm border border-card p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-app-2 hover:bg-hover'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Профиль</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-app-2 hover:bg-hover'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Безопасность</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('api')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition ${
                    activeTab === 'api'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-app-2 hover:bg-hover'
                  }`}
                >
                  <Key className="w-5 h-5" />
                  <span>API ключи</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Правая панель - контент */}
          <div className="lg:w-3/4">
            {message && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Вкладка профиля */}
            {activeTab === 'profile' && (
              <div className="bg-card rounded-xl shadow-sm border border-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-app">Информация профиля</h2>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-app-muted" />
                    <span className="text-sm text-app-muted">Личные данные</span>
                  </div>
                </div>

                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-app-2 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-app-muted" />
                          <span>Имя</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        {...profileForm.register('name')}
                        className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="Ваше имя"
                      />
                      {profileForm.formState.errors.name && (
                        <p className="mt-2 text-sm text-red-600">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-app-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-app-muted" />
                          <span>Email</span>
                        </div>
                      </label>
                      <input
                        type="email"
                        {...profileForm.register('email')}
                        className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="your@email.com"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="mt-2 text-sm text-red-600">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-card">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:from-primary-dark hover:to-primary transition flex items-center disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            Сохранение...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Сохранить изменения
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Вкладка безопасности */}
            {activeTab === 'security' && (
              <div className="bg-card rounded-xl shadow-sm border border-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-app">Безопасность</h2>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-app-muted" />
                    <span className="text-sm text-app-muted">Защита аккаунта</span>
                  </div>
                </div>

                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-app-2 mb-2">
                        Текущий пароль
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.current ? "text" : "password"}
                          {...passwordForm.register('current_password')}
                          className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-app-muted hover:text-app-2"
                        >
                          {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.current_password && (
                        <p className="mt-2 text-sm text-red-600">
                          {passwordForm.formState.errors.current_password.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-app-2 mb-2">
                          Новый пароль
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? "text" : "password"}
                            {...passwordForm.register('new_password')}
                            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-app-muted hover:text-app-2"
                          >
                            {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.new_password && (
                          <p className="mt-2 text-sm text-red-600">
                            {passwordForm.formState.errors.new_password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-app-2 mb-2">
                          Подтверждение пароля
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.confirm ? "text" : "password"}
                            {...passwordForm.register('confirm_password')}
                            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-12"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-app-muted hover:text-app-2"
                          >
                            {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordForm.formState.errors.confirm_password && (
                          <p className="mt-2 text-sm text-red-600">
                            {passwordForm.formState.errors.confirm_password.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-card">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:from-primary-dark hover:to-primary transition flex items-center disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            Изменение...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Изменить пароль
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Рекомендации по безопасности</h4>
                      <ul className="text-sm text-amber-700 space-y-1">
                        <li>• Используйте сложный пароль с буквами, цифрами и символами</li>
                        <li>• Никогда не передавайте пароль третьим лицам</li>
                        <li>• Регулярно меняйте пароль для повышения безопасности</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Вкладка API ключей */}
            {activeTab === 'api' && (
              <div className="bg-card rounded-xl shadow-sm border border-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-app">API ключи</h2>
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5 text-app-muted" />
                    <span className="text-sm text-app-muted">Интеграции с маркетплейсами</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Wildberries API */}
                  <div className="p-6 border border-card rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-app">Wildberries API</h3>
                          <p className="text-sm text-app-muted">Для синхронизации данных с Wildberries</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user?.wb_api_key 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-hover text-app'
                      }`}>
                        {user?.wb_api_key ? 'Настроен' : 'Не настроен'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-app-2 mb-2">
                          API ключ Wildberries
                          {user?.wb_api_key_expire_at ? (
                            <span className="ml-2 text-blue-600 font-normal">
                              Истекает {format(new Date(user.wb_api_key_expire_at), 'dd.MM.yyyy HH:mm')}
                            </span>
                          ) : null}
                        </label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <input
                              type={showWbKey ? 'text' : 'password'}
                              value={wbApiKeyInput}
                              onChange={(e) => setWbApiKeyInput(e.target.value)}
                              className="w-full px-4 py-3 pr-12 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                              placeholder="Введите API ключ Wildberries"
                            />
                            <button
                              type="button"
                              onClick={() => setShowWbKey((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-2"
                              tabIndex={-1}
                            >
                              {showWbKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleWbApiKeyUpdate}
                            disabled={isLoading}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            {isLoading ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Сохранение...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Сохранить
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-app-2">
                        <p>Как получить ключ:</p>
                        <ol className="list-decimal list-inside space-y-1 mt-1">
                          <li>Зайдите в личный кабинет Wildberries</li>
                          <li>Перейдите в раздел "Настройки" → "Доступ к API"</li>
                          <li>Скопируйте ключ и вставьте в поле выше</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Ozon API 
                  <div className="p-6 border border-card rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-app">Ozon API</h3>
                          <p className="text-sm text-app-muted">Для синхронизации данных с Ozon (опционально)</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user?.ozon_api_key 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-hover text-app'
                      }`}>
                        {user?.ozon_api_key ? 'Настроен' : 'Не настроен'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-app-2 mb-2">
                          API ключ Ozon
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="password"
                            value={user?.ozon_api_key || ''}
                            onChange={(e) => profileForm.setValue('ozon_api_key', e.target.value)}
                            className="flex-1 px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Введите API ключ"
                          />
                          <button
                            onClick={() => handleApiKeyUpdate('ozon', profileForm.getValues('ozon_api_key'))}
                            disabled={isLoading}
                            className="px-6 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition disabled:opacity-50"
                          >
                            {isLoading ? 'Сохранение...' : 'Сохранить'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>*/}
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Важная информация</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• API ключи хранятся в зашифрованном виде</li>
                        <li>• Ключи используются только для синхронизации данных</li>
                        <li>• Никогда не передавайте ключи третьим лицам</li>
                        <li>• При смене ключа в личном кабинете маркетплейса обновите его здесь</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}