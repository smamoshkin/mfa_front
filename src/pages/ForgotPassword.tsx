import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MailCheck, ArrowLeft } from 'lucide-react';
import { authApi } from '../api/authApi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Не удалось отправить письмо. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
        {!sent ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-app mb-2">Сброс пароля</h1>
              <p className="text-app-2">
                Введите email аккаунта — отправим ссылку для установки нового пароля
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="your@email.com"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Отправляем…' : 'Отправить ссылку'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <MailCheck className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-app mb-2">Проверьте почту</h1>
            <p className="text-app-2 mb-8">
              Если аккаунт <span className="font-medium">{email}</span> существует,
              мы отправили на него письмо со ссылкой для сброса пароля.
              Ссылка действует 60 минут.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-card">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 py-3 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}
