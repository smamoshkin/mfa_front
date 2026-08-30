import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../api/authApi';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  // Проверяем токен при открытии страницы: использованная/устаревшая ссылка
  // сразу показывает ошибку, а не форму, которая упадёт только на сабмите
  const [tokenValid, setTokenValid] = useState<boolean | null>(null); // null = проверяем
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; // защита от StrictMode двойного вызова
    startedRef.current = true;

    if (!token) {
      setTokenValid(false);
      return;
    }
    authApi.validateResetToken(token)
      .then((res) => setTokenValid(res.valid))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось изменить пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
        {tokenValid === null && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-soft rounded-2xl mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-app mb-2">Проверяем ссылку…</h1>
            <p className="text-app-2">Секунду</p>
          </div>
        )}

        {tokenValid === false && !done && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-app mb-2">Ссылка недействительна</h1>
            <p className="text-app-2 mb-8">
              Ссылка устарела (действует 60 минут) или уже была использована.
              Запросите новую.
            </p>
            <Link
              to="/forgot-password"
              className="block w-full py-3.5 px-4 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 transition"
            >
              Запросить новую ссылку
            </Link>
          </div>
        )}

        {tokenValid === true && done ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-app mb-2">Пароль изменён</h1>
            <p className="text-app-2">Перенаправляем на страницу входа…</p>
          </div>
        ) : tokenValid === true ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-app mb-2">Новый пароль</h1>
              <p className="text-app-2">Придумайте новый пароль для входа</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Минимум 8 символов"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Повторите пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Ещё раз"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full py-3.5 px-4 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Сохраняем…' : 'Установить пароль'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-card text-center">
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Вернуться ко входу
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
