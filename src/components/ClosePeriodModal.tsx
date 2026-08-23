// src/components/ClosePeriodModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

interface ClosePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (endDate: string) => Promise<void>;
  currentStartDate: string;
  taxRate: number;
}

export default function ClosePeriodModal({
  isOpen,
  onClose,
  onSubmit,
  currentStartDate,
  taxRate
}: ClosePeriodModalProps) {
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Устанавливаем текущую дату по умолчанию при открытии
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setEndDate(today);
      setError('');
    }
  }, [isOpen]);

  // Рассчитываем минимальную дату (startDate + 1 день)
  const getMinDate = () => {
    const start = new Date(currentStartDate);
    start.setDate(start.getDate() + 1);
    return start.toISOString().split('T')[0];
  };

  // Рассчитываем максимальную дату (сегодня)
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!endDate) {
      setError('Пожалуйста, выберите дату окончания');
      return;
    }

    const startDateObj = new Date(currentStartDate);
    const endDateObj = new Date(endDate);
    
    if (endDateObj <= startDateObj) {
      setError('Дата окончания должна быть позже даты начала');
      return;
    }

    if (endDateObj > new Date()) {
      setError('Дата окончания не может быть в будущем');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit(endDate);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при закрытии периода');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Затемнение фона */}
      <div className="fixed inset-0 bg-black/30 bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-app">Закрыть период ставки</h2>
                <p className="text-sm text-app-2 mt-1">Налоговая ставка: {taxRate}%</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-app-muted hover:text-app-2 hover:bg-hover rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Дата начала периода
                </label>
                <div className="px-4 py-3 bg-card-2 rounded-lg border border-card">
                  <span className="text-app font-medium">
                    {new Date(currentStartDate).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Дата окончания периода *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setError('');
                  }}
                  min={getMinDate()}
                  max={getMaxDate()}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    error ? 'border-red-300' : 'border-input'
                  }`}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-app-muted">
                    Минимальная: {new Date(getMinDate()).toLocaleDateString('ru-RU')}
                  </span>
                  <span className="text-xs text-app-muted">
                    Максимальная: {new Date(getMaxDate()).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <X className="w-4 h-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Что произойдет?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                    <span>Текущая ставка будет действовать до {new Date(endDate).toLocaleDateString('ru-RU')}</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                    <span>После этой даты потребуется установить новую ставку</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-card">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-app-2 hover:bg-hover font-medium rounded-lg transition disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  'Закрыть период'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}