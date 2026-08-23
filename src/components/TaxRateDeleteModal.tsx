// src/components/TaxRateDeleteModal.tsx
import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import type { TaxRate } from '../types/tax';

interface TaxRateDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rate: TaxRate | null;
  onDelete: () => Promise<void>;
}

/** Модалка удаления ставки: показывает состав записи (поля недоступны для правки) */
export default function TaxRateDeleteModal({ isOpen, onClose, rate, onDelete }: TaxRateDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !rate) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '∞ (бессрочно)';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      await onDelete();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка удаления ставки');
    } finally {
      setLoading(false);
    }
  };

  const disabledInput = 'w-full px-4 py-3 border border-input rounded-lg bg-card-2 text-app-2 cursor-not-allowed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Затемнение фона */}
      <div className="fixed inset-0 bg-black/30 bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-card">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-app">Удалить ставку</h2>
                <p className="text-sm text-app-2 mt-1">Действие нельзя отменить</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-app-muted hover:text-app-2 hover:bg-hover rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Состав записи — как при редактировании, но поля недоступны */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-app-2 mb-2">Ставка налога (%)</label>
              <div className={disabledInput}>{rate.tax_rate}%</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-2 mb-2">Дата начала</label>
              <div className={disabledInput}>{formatDate(rate.start_date)}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-app-2 mb-2">Дата окончания</label>
              <div className={disabledInput}>{formatDate(rate.end_date)}</div>
            </div>

            {rate.created_by && (
              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">Кто внес изменение</label>
                <div className={disabledInput}>{rate.created_by}</div>
              </div>
            )}

            <div className="p-4 bg-sand/40 border border-sand rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-sand-ink mt-0.5 flex-shrink-0" />
              <p className="text-sm text-app-2">
                Если это была единственная ставка, отчётность останется без налога
                до создания новой.
              </p>
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
          <div className="flex justify-end space-x-3 px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-app-2 hover:bg-hover font-medium rounded-lg transition disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Удаление...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
