import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { LogIn, Mail, Lock, AlertCircle, User, MailCheck, RefreshCw } from 'lucide-react';

// Схема валидации для входа
const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
});

// Схема валидации для регистрации (добавляем имя)
const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Имя должно быть не менее 2 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Login() {
  const { login, register, isLoading, error, emailUnverified, clearError } = useAuthStore();
  const [isLoginMode, setIsLoginMode] = useState(true);
  // После успешной регистрации — экран «проверьте почту» вместо формы
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  // Повторная отправка письма: кулдаун 60с (зеркалит rate limit бэка)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Используем разные схемы для логина и регистрации
  const schema = isLoginMode ? loginSchema : registerSchema;

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      ...(isLoginMode ? {} : { name: '' })
    },
  });

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    const email = registeredEmail || getValues('email');
    if (!email) return;
    setIsResending(true);
    try {
      await authApi.resendVerification(email);
      setResendCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: any) => {
    clearError();

    if (isLoginMode) {
      await login(data.email, data.password);
    } else {
      // Регистрация НЕ логинит: показываем экран «проверьте почту»
      try {
        const response = await register(data.email, data.password, data.name);
        setRegisteredEmail(response.email);
      } catch {
        // ошибка уже в сторе (error) — остаёмся на форме
      }
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearError();
    reset(); // Сбрасываем форму при переключении режима
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${
              isLoginMode 
                ? 'bg-gradient-to-br from-primary to-primary-dark' 
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
            } rounded-2xl mb-4`}>
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-app mb-2">
              {isLoginMode ? 'Вход в систему' : 'Регистрация'}
            </h1>
            <p className="text-app-2">
              {isLoginMode 
                ? 'Войдите в ваш аккаунт WB Analytics' 
                : 'Создайте новый аккаунт'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {emailUnverified && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0
                  ? `Письмо отправлено — повтор через ${resendCooldown} с`
                  : 'Отправить письмо подтверждения заново'}
              </button>
            </div>
          )}

          {registeredEmail ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                <MailCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-app mb-2">Проверьте почту</h2>
              <p className="text-app-2 mb-2">
                Мы отправили письмо со ссылкой подтверждения на
                <span className="font-medium"> {registeredEmail}</span>.
              </p>
              <p className="text-app-2 text-sm mb-6">
                Ссылка действует 48 часов. После подтверждения вы сможете войти.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className="w-full py-3 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                {resendCooldown > 0
                  ? `Отправлено — повтор через ${resendCooldown} с`
                  : 'Отправить письмо заново'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisteredEmail(null);
                  setIsLoginMode(true);
                  reset();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:opacity-90 transition"
              >
                Перейти ко входу
              </button>
            </div>
          ) : (
          <>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Поле имени только для регистрации */}
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Имя
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-app-muted" />
                  <input
                    type="text"
                    {...formRegister('name')}
                    className="w-full pl-11 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Ваше имя"
                  />
                </div>
                {/* errors.name существует только в режиме регистрации —
                    useForm типизирован union-схемой, поэтому локальное сужение типа */}
                {(errors as { name?: { message?: string } }).name && (
                  <p className="mt-2 text-sm text-red-600">
                    {(errors as { name?: { message?: string } }).name?.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-app-2 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-app-muted" />
                <input
                  type="email"
                  {...formRegister('email')}
                  className="w-full pl-11 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-app-2 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-app-muted" />
                <input
                  type="password"
                  {...formRegister('password')}
                  className="w-full pl-11 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
              
              {!isLoginMode && (
                <p className="mt-2 text-xs text-app-muted">
                  Пароль должен содержать не менее 6 символов
                </p>
              )}
            </div>

            {isLoginMode && (
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 font-semibold rounded-xl focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl ${
                isLoginMode
                  ? 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary focus:ring-blue-300 text-white'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-300 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLoginMode ? 'Вход...' : 'Регистрация...'}
                </div>
              ) : isLoginMode ? (
                'Войти в аккаунт'
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-card">
            <button
              onClick={toggleMode}
              className="w-full py-3 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition"
            >
              {isLoginMode
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-app-muted">
              {isLoginMode
                ? 'Входя в систему, вы соглашаетесь с нашими'
                : 'Регистрируясь, вы соглашаетесь с нашими'}
              <br />
              <a href="#" className="text-blue-600 hover:underline">
                Условиями использования
              </a>{' '}
              и{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Политикой конфиденциальности
              </a>
            </p>
          </div>
          </>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-app-muted text-sm">
            © 2025 WB Analytics Dashboard. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}