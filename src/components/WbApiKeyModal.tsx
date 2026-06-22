import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, Key, AlertCircle, Check } from 'lucide-react';

interface WbApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WbApiKeyModal({ isOpen, onClose, onSuccess }: WbApiKeyModalProps) {
  const { user, setWbApiKey, isLoading } = useAuthStore();
  const [apiKey, setApiKey] = useState(user?.wb_api_key || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!apiKey.trim()) {
      setError('Введите API ключ');
      return;
    }

    try {
      await setWbApiKey(apiKey);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения ключа');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">API ключ Wildberries</h3>
              <p className="text-sm text-gray-500">Для синхронизации данных</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ваш API ключ Wildberries
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Введите ключ из личного кабинета WB"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <p className="mt-2 text-sm text-gray-500">
              Найти можно в личном кабинете WB: Настройки → Доступ к API
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-green-700 text-sm">Ключ успешно сохранен!</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить ключ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}