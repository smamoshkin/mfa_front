import { useState, useEffect } from 'react';
import { X, Package, DollarSign, Tag, Barcode, Image, Info, AlertTriangle } from 'lucide-react';
import type { Product } from '../types/api';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  // Полный список товаров текущего тенанта — для предупреждения о дубле marketplace_sku
  existingProducts?: Product[];
}

export default function ProductModal({ product, isOpen, onClose, onSave, existingProducts = [] }: ProductModalProps) {
  const [formData, setFormData] = useState({
    sku: '',
    marketplace_sku: '',
    name: '',
    description: '',
    category: '',
    barcode: '',
    foto: '',
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Предупреждение о дубле marketplace_sku (неблокирующее)
  const [duplicateWarning, setDuplicateWarning] = useState<Product[]>([]);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);

  // Инициализация формы при открытии модалки или изменении продукта
  useEffect(() => {
    if (product) {
      setFormData({
        // Строковые поля бэк может вернуть как null (товары из синка) —
        // приводим к '', иначе React ругается на value={null} у
        // контролируемых input/textarea
        sku: product.sku || '',
        marketplace_sku: product.marketplace_sku || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        barcode: product.barcode || '',
        foto: product.foto || '',
        is_active: product.is_active ?? true,
      });
    } else {
      // Сброс формы для нового товара
      setFormData({
        sku: '',
        marketplace_sku: '',
        name: '',
        description: '',
        category: '',
        barcode: '',
        foto: '',
        is_active: true,
      });
    }
    setError('');
    setDuplicateWarning([]);
    setConfirmedDuplicate(false);
  }, [product, isOpen]);

  // Активные товары с тем же marketplace_sku (кроме текущего редактируемого).
  // Дубль marketplace_sku допустим (разные sku) — это только предупреждение.
  const findActiveDuplicates = (): Product[] => {
    const value = formData.marketplace_sku.trim().toLowerCase();
    if (!value) return [];
    return existingProducts.filter(
      (p) =>
        p.id !== product?.id &&
        p.is_active &&
        (p.marketplace_sku || '').trim().toLowerCase() === value
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Валидация
    if (!formData.sku.trim()) {
      setError('Введите SKU товара');
      setIsLoading(false);
      return;
    }

    if (!formData.name.trim()) {
      setError('Введите название товара');
      setIsLoading(false);
      return;
    }

    // Предупреждение о дубле marketplace_sku: первый сабмит показывает
    // предупреждение и запоминает подтверждение, повторный — сохраняет
    const duplicates = findActiveDuplicates();
    if (duplicates.length > 0 && !confirmedDuplicate) {
      setDuplicateWarning(duplicates);
      setConfirmedDuplicate(true);
      setIsLoading(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения товара');
      // после ошибки сбрасываем подтверждение — при повторной попытке
      // предупреждение (если дубль ещё актуален) покажется снова
      setConfirmedDuplicate(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // При изменении артикула WB предупреждение о дубле теряет актуальность
    if (field === 'marketplace_sku') {
      setDuplicateWarning([]);
      setConfirmedDuplicate(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {product ? 'Редактировать товар' : 'Добавить новый товар'}
              </h3>
              <p className="text-sm text-gray-500">
                {product ? 'Обновите информацию о товаре' : 'Заполните данные нового товара'}
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
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <Info className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {duplicateWarning.length > 0 && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-yellow-800 text-sm">
                <p className="font-medium">
                  У вас уже есть активные товары с артикулом WB «{formData.marketplace_sku}»:
                </p>
                <ul className="list-disc ml-5 mt-1">
                  {duplicateWarning.map((p) => (
                    <li key={p.id}>
                      {p.name || 'Без названия'} (SKU: {p.sku})
                    </li>
                  ))}
                </ul>
                <p className="mt-1">
                  Создание не блокируется. Если это намеренно — нажмите «Всё равно сохранить».
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Основная информация */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span>SKU (внутренний артикул)*</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="WB-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>Артикул Wildberries*</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.marketplace_sku}
                  onChange={(e) => handleChange('marketplace_sku', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="12345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-gray-400" />
                    <span>Штрихкод</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="4601234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-400" />
                    <span>URL изображения</span>
                  </div>
                </label>
                <input
                  type="url"
                  value={formData.foto}
                  onChange={(e) => handleChange('foto', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://images.wbstatic.net/c246x328/new/12345678-1.jpg"
                />
                {formData.foto && (
                  <div className="mt-2">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={formData.foto} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название товара*
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Смартфон X Pro 256GB"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Флагманский смартфон с камерой 108 Мп..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Электроника"
                  list="categories"
                />
                <datalist id="categories">
                  <option value="Электроника" />
                  <option value="Аудиотехника" />
                  <option value="Компьютеры" />
                  <option value="Гаджеты" />
                  <option value="Аксессуары" />
                  <option value="Одежда" />
                  <option value="Обувь" />
                  <option value="Красота" />
                  <option value="Дом и сад" />
                </datalist>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">Товар активен</span>
                  <span className="text-sm text-gray-500">(отображается в каталоге)</span>
                </label>
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
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Сохранение...
                </>
              ) : duplicateWarning.length > 0 ? (
                'Всё равно сохранить'
              ) : product ? (
                'Сохранить изменения'
              ) : (
                'Добавить товар'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}