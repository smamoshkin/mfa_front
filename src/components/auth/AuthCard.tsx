import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/authApi';
import { LogIn, Lock, AlertCircle, User, MailCheck, RefreshCw, X } from 'lucide-react';

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

interface AuthCardProps {
  /** Стартовый режим: вход или регистрация */
  initialMode?: 'login' | 'register';
  /** Крестик закрытия — для drawer на лендинге */
  onClose?: () => void;
}

/**
 * Карточка авторизации: вход / регистрация, блок «email не подтверждён»,
 * экран «проверьте почту» после регистрации, повторная отправка письма.
 * Используется как полноэкранная страница /login и в шторке лендинга.
 */
export default function AuthCard({ initialMode = 'login', onClose }: AuthCardProps) {
  const { login, register, isLoading, error, emailUnverified, clearError } = useAuthStore();
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  // После успешной регистрации — экран «проверьте почту» вместо формы
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  // Повторная отправка письма: кулдаун 60с (зеркалит rate limit бэка)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  // Согласие на обработку ПД (обязательный чекбокс регистрации, не предустановлен —
  // текст из docs/legal/02-consent-pd.md, часть А)
  const [pdConsent, setPdConsent] = useState(false);

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

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    clearError();

    if (isLoginMode) {
      await login(data.email, data.password);
    } else {
      // Без отметки согласия регистрацию не отправляем (кнопка блокируется, это страховка)
      if (!pdConsent) return;
      // Регистрация НЕ логинит: показываем экран «проверьте почту»
      try {
        // name есть только в режиме регистрации (сужение типа, как с errors.name выше)
        const { name } = data as RegisterFormData;
        const response = await register(data.email, data.password, name);
        setRegisteredEmail(response.email);
      } catch {
        // ошибка уже в сторе (error) — остаёмся на форме
      }
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearError();
    setPdConsent(false);
    reset(); // Сбрасываем форму при переключении режима
  };

  return (
    <div className="bg-card rounded-2xl shadow-xl p-6 relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-hover rounded-lg transition z-10"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5 text-app-muted" />
        </button>
      )}

      <div className="text-center mb-5">
        <div className={`inline-flex items-center justify-center w-12 h-12 ${
          isLoginMode
            ? 'bg-gradient-to-br from-primary to-primary-dark'
            : 'bg-gradient-to-br from-green-500 to-emerald-600'
        } rounded-2xl mb-3`}>
          <LogIn className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-app mb-1">
          {isLoginMode ? 'Вход в систему' : 'Регистрация'}
        </h1>
        <p className="text-app-2 text-sm">
          {isLoginMode
            ? 'Войдите в ваш аккаунт faapp'
            : 'Создайте новый аккаунт'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {emailUnverified && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            {resendCooldown > 0
              ? `Письмо отправлено — повтор через ${resendCooldown} с`
              : 'Отправить письмо подтверждения заново'}
          </button>
        </div>
      )}

      {registeredEmail ? (
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-950/40 rounded-2xl mb-3">
            <MailCheck className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-app mb-1">Проверьте почту</h2>
          <p className="text-app-2 mb-1 text-sm">
            Мы отправили письмо со ссылкой подтверждения на
            <span className="font-medium"> {registeredEmail}</span>.
          </p>
          <p className="text-app-2 text-xs mb-4">
            Ссылка действует 48 часов. После подтверждения вы сможете войти.
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="w-full py-2.5 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
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
            className="w-full py-2.5 px-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            Перейти ко входу
          </button>
        </div>
      ) : (
      <>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Поле имени только для регистрации */}
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-app-2 mb-1.5">
                Имя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-app-muted" />
                <input
                  type="text"
                  {...formRegister('name')}
                  className="w-full pl-11 pr-4 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-transparent"
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
            <label className="block text-sm font-medium text-app-2 mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                {...formRegister('email')}
                className="w-full px-4 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-transparent"
                placeholder="your@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-app-2 mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-app-muted" />
              <input
                type="password"
                {...formRegister('password')}
                className="w-full pl-11 pr-4 py-2.5 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-transparent"
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
                className="text-sm text-primary hover:underline"
              >
                Забыли пароль?
              </Link>
            </div>
          )}

          {/* Согласие на обработку ПД — только для регистрации (152-ФЗ, ст. 9:
              отметка должна ставиться пользователем, без неё кнопка неактивна) */}
          {!isLoginMode && (
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={pdConsent}
                  onChange={(e) => setPdConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 shrink-0 accent-[#1F2AE1] cursor-pointer"
                />
                <span className="text-xs text-app-2 leading-relaxed">
                  Я принимаю{' '}
                  <a href="/offer" target="_blank" rel="noopener" className="text-primary hover:underline">
                    Пользовательское соглашение
                  </a>{' '}
                  и даю{' '}
                  <a href="/consent" target="_blank" rel="noopener" className="text-primary hover:underline">
                    согласие на обработку персональных данных
                  </a>{' '}
                  (адрес электронной почты, имя учётной записи, API-ключ Wildberries,
                  IP-адрес, данные cookie) на условиях{' '}
                  <a href="/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
                    Политики конфиденциальности
                  </a>{' '}
                  в целях использования сервиса faapp.ru.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (!isLoginMode && !pdConsent)}
            className={`w-full py-3 px-4 font-semibold rounded-xl focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl ${
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

        <div className="mt-5 pt-4 border-t border-card">
          <button
            onClick={toggleMode}
            className="w-full py-2.5 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition"
          >
            {isLoginMode
              ? 'Нет аккаунта? Зарегистрироваться'
              : 'Уже есть аккаунт? Войти'}
          </button>
        </div>

        {isLoginMode && (
          <div className="mt-4 text-center">
            <p className="text-xs text-app-muted">
              Входя в систему, вы соглашаетесь с нашим
              <br />
              <a href="/offer" target="_blank" rel="noopener" className="text-primary hover:underline">
                Пользовательским соглашением
              </a>{' '}
              и{' '}
              <a href="/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
                Политикой конфиденциальности
              </a>
            </p>
          </div>
        )}
      </>
      )}
    </div>
  );
}
