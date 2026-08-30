import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MailCheck, AlertCircle, RefreshCw, CheckCircle2, Mail, X } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

type Status = 'verifying' | 'success' | 'invalid';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const startedRef = useRef(false);

  // Модалка повторной отправки (вместо браузерного prompt)
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (startedRef.current) return; // защита от StrictMode двойного вызова
    startedRef.current = true;

    if (!token) {
      setStatus('invalid');
      return;
    }

    authApi.verifyEmail(token)
      .then(async (response) => {
        sessionStorage.setItem('access_token', response.access_token);
        useAuthStore.setState({ token: response.access_token, user: null });
        setStatus('success');
        // Грузим профиль ДО перехода — иначе приложение откроется с пустым
        // пользователем (профиль-заглушки), как при обычном входе это
        // делает login() в сторе
        await useAuthStore.getState().loadCurrentUser();
        // Автопереход в приложение
        setTimeout(() => navigate('/analytics'), 2500);
      })
      .catch(() => setStatus('invalid'));
  }, [token, navigate]);

  const openResendModal = () => {
    setResendEmail('');
    setResendError('');
    setIsResendModalOpen(true);
  };

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError('');
    if (!resendEmail.trim()) {
      setResendError('Введите email');
      return;
    }
    setIsResending(true);
    try {
      const res = await authApi.resendVerification(resendEmail.trim());
      setIsResendModalOpen(false);
      setResendMsg(res.message);
    } catch {
      setResendError('Не удалось отправить письмо. Попробуйте позже.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-app mb-2">Подтверждаем email…</h1>
            <p className="text-app-2">Секунду, проверяем ссылку</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-app mb-2">Email подтверждён!</h1>
            <p className="text-app-2 mb-6">
              Аккаунт активирован, входим в приложение…
            </p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 animate-pulse w-full" />
            </div>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-app mb-2">Ссылка недействительна</h1>
            <p className="text-app-2 mb-6">
              Ссылка устарела (действует 48 часов) или уже была использована.
              Можно отправить письмо заново.
            </p>
            {resendMsg && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-left">
                <MailCheck className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-blue-700 text-sm">{resendMsg}</p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={openResendModal}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Отправить письмо заново
              </button>
              <Link
                to="/login"
                className="block py-3 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition"
              >
                Перейти ко входу
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Модалка повторной отправки письма */}
      {isResendModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-soft rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-app">Отправить письмо заново</h3>
              </div>
              <button
                onClick={() => setIsResendModalOpen(false)}
                className="p-2 hover:bg-hover rounded-lg transition"
              >
                <X className="w-5 h-5 text-app-muted" />
              </button>
            </div>

            <p className="text-app-2 text-sm mb-4">
              Укажите email аккаунта — отправим новое письмо со ссылкой подтверждения.
            </p>

            {resendError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{resendError}</p>
              </div>
            )}

            <form onSubmit={handleResendSubmit} className="space-y-4">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                placeholder="your@email.com"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsResendModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isResending}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
