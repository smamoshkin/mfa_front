import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, Package, AlertCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { ProductCost, CreateProductCostRequest } from '../types/api';

interface CostModalProps {
  productId: number;
  productName: string;
  cost: ProductCost | null; // null для создания новой
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CreateProductCostRequest, 'product_id'> & { product_id?: number }) => Promise<void>;
}

export default function CostModal({ productId, productName, cost, isOpen, onClose, onSave }: CostModalProps) {
  const [formData, setFormData] = useState({
    cost: 0,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '', // ПУСТАЯ строка по умолчанию
    created_by: 'user',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [overlapError, setOverlapError] = useState<string>(''); // Новое состояние для ошибки пересечения

  // Инициализация формы
  useEffect(() => {
    if (cost) {
      setFormData({
        cost: parseFloat(cost.cost),
        start_date: cost.start_date.split('T')[0], // Берем только дату
        end_date: cost.end_date ? cost.end_date.split('T')[0] : '', // Если null - пустая строка
        created_by: cost.created_by,
      });
    } else {
      // Новая себестоимость
      setFormData({
        cost: 0,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '', // ПУСТАЯ строка для новой себестоимости
        created_by: 'user',
      });
    }
    setError('');
    setEndDateError('');
    setOverlapError(''); // Сбрасываем ошибку пересечения
  }, [cost, productId, isOpen]);

  // Валидация дат
  useEffect(() => {
    if (formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      
      if (end < start) {
        setEndDateError('Дата окончания не может быть раньше даты начала');
      } else {
        setEndDateError('');
      }
    } else {
      setEndDateError(''); // Если поле пустое - ошибки нет
    }
  }, [formData.start_date, formData.end_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOverlapError(''); // Сбрасываем ошибку пересечения перед отправкой

    // Валидация
    if (formData.cost <= 0) {
      setError('Себестоимость должна быть больше 0');
      return;
    }

    if (endDateError) {
      setError('Исправьте ошибки в датах');
      return;
    }

    setIsLoading(true);
    try {
      // Подготавливаем данные для отправки
      const dataToSend: any = {
        cost: formData.cost,
        start_date: formData.start_date,
        created_by: formData.created_by,
        product_id: productId,
      };
      
      // Добавляем end_date только если оно заполнено
      if (formData.end_date.trim()) {
        dataToSend.end_date = formData.end_date;
      } else {
        // Для API: null означает "бессрочная себестоимость"
        dataToSend.end_date = null;
      }
      
      await onSave(dataToSend);
      onClose();
    } catch (err: any) {
      // Проверяем, является ли ошибка ошибкой пересечения интервалов
      if (err.response?.status === 400) {
        const errorDetail = err.response?.data?.detail || err.message;
        
        // Проверяем, содержит ли ошибка ключевые слова о пересечении
        if (errorDetail.includes('overlaps') || errorDetail.includes('пересекает') || errorDetail.includes('период')) {
          setOverlapError(errorDetail);
        } else {
          setError(errorDetail);
        }
      } else {
        setError(err.message || 'Ошибка сохранения себестоимости');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // При изменении дат сбрасываем ошибку пересечения
    if (field === 'start_date' || field === 'end_date') {
      setOverlapError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {cost ? 'Редактировать себестоимость' : 'Добавить себестоимость'}
              </h3>
              <p className="text-sm text-gray-500">
                Товар: {productName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Общая ошибка */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Ошибка пересечения интервалов */}
          {overlapError && (
            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-800 font-medium text-sm mb-1">Конфликт интервалов</p>
                <p className="text-amber-700 text-sm">{overlapError}</p>
                <p className="text-amber-600 text-xs mt-1">
                  Пожалуйста, выберите другой период или измените существующие себестоимости.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Себестоимость */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>Себестоимость (₽)*</span>
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.cost || ''}
                  onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none pl-12"
                  placeholder="0.00"
                  required
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₽
                </span>
              </div>
            </div>

            {/* Даты действия */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Дата начала*</span>
                  </div>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  required
                />
                {formData.start_date && (
                  <p className="mt-1 text-xs text-gray-500">
                    {format(new Date(formData.start_date), 'd MMMM yyyy', { locale: ru })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Дата окончания</span>
                    {/*<span className="text-xs text-gray-400">(необязательно)</span>*/}
                  </div>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                    endDateError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder="Бессрочно"
                />
                {endDateError ? (
                  <p className="mt-1 text-xs text-red-600">{endDateError}</p>
                ) : formData.end_date ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {format(new Date(formData.end_date), 'd MMMM yyyy', { locale: ru })}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-blue-600">
                    Оставьте пустым для бессрочной себестоимости
                  </p>
                )}
              </div>
            </div>

            {/* Кто создал */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>Кто добавил</span>
                </div>
              </label>
              <input
                type="text"
                value={formData.created_by}
                onChange={(e) => handleChange('created_by', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Ваше имя"
              />
            </div>

            {/* Информация о товаре */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Информация о товаре</p>
                  <p className="text-sm text-gray-600">ID: {productId} | {productName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || !!endDateError}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Сохранение...
                </>
              ) : cost ? (
                'Обновить себестоимость'
              ) : (
                'Добавить себестоимость'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}