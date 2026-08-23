// src/components/TaxRateModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Percent } from 'lucide-react';
import type { TaxRate, TaxRateFormData } from '../types/tax';

interface TaxRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** null — создание новой ставки, иначе редактирование существующей */
  rate: TaxRate | null;
  onSave: (data: TaxRateFormData) => Promise<void>;
}

/**
 * Модальное окно создания/редактирования налоговой ставки.
 * Единообразно с ClosePeriodModal («Закрыть период»).
 */
export default function TaxRateModal({ isOpen, onClose, rate, onSave }: TaxRateModalProps) {
  const [formData, setFormData] = useState<TaxRateFormData>({
    tax_rate: 20,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    created_by: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Заполняем форму при открытии: существующей ставкой или значениями по умолчанию
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (rate) {
        setFormData({
          tax_rate: rate.tax_rate,
          start_date: rate.start_date.split('T')[0],
          end_date: rate.end_date ? rate.end_date.split('T')[0] : '',
          created_by: rate.created_by || ''
        });
      } else {
        setFormData({
          tax_rate: 20,
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          created_by: ''
        });
      }
    }
  }, [isOpen, rate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tax_rate' ? parseFloat(value) || 0 : value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tax_rate < 0 || formData.tax_rate > 100) {
      setError('Ставка должна быть от 0 до 100%');
      return;
    }

    if (formData.end_date && formData.end_date <= formData.start_date) {
      setError('Дата окончания должна быть позже даты начала');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения ставки');
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
              <div className="p-2 bg-primary-soft rounded-lg mr-3">
                <Percent className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-app">
                  {rate ? 'Редактировать ставку' : 'Новая налоговая ставка'}
                </h2>
                <p className="text-sm text-app-2 mt-1">
                  {rate
                    ? `Период с ${new Date(rate.start_date).toLocaleDateString('ru-RU')}`
                    : 'Будет действовать с даты начала'}
                </p>
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
                  Ставка налога (%) *
                </label>
                <input
                  type="number"
                  name="tax_rate"
                  value={formData.tax_rate}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Дата начала *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Дата окончания
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={formData.start_date}
                  className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                />
                <p className="text-xs text-app-muted mt-2">
                  Оставьте пустым для бессрочного действия
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Кто внес изменение (опционально)
                </label>
                <input
                  type="text"
                  name="created_by"
                  value={formData.created_by}
                  onChange={handleInputChange}
                  placeholder="Имя пользователя"
                  className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <X className="w-4 h-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}
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
                className="px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-lg hover:from-primary-dark hover:to-primary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  rate ? 'Сохранить изменения' : 'Создать ставку'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
