import { useState, useEffect } from 'react';
import { X, Package, DollarSign, Tag, Barcode, Image, Info, Trash2 } from 'lucide-react';
import type { Product } from '../types/api';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
}

export default function ProductDeleteModal({ product, isOpen, onClose, onSave }: ProductModalProps) {
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

  // Инициализация формы при открытии модалки или изменении продукта
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        marketplace_sku: product.marketplace_sku,
        name: product.name,
        description: product.description,
        category: product.category,
        barcode: product.barcode,
        foto: product.foto,
        is_active: product.is_active,
      });
    } else {
      // foo
    }
    setError('');
  }, [product, isOpen]);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSave(product);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения товара');
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Удалить товар
              </h3>
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
        <div /*onSubmit={handleSubmit}*/ className="p-6">
          {/* {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <Info className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )} */}

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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                  placeholder="WB-001"
                  disabled
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                  placeholder="12345678"
                  disabled
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                  placeholder="4601234567890"
                  disabled
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                  placeholder="Смартфон X Pro 256GB"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                  placeholder="Флагманский смартфон с камерой 108 Мп..."
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория
                </label>
                <input
                  type="text"
                  value={formData.category}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                  placeholder="Электроника"
                  list="categories"
                  disabled
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-not-allowed"
                    disabled
                  />
                  <span className="text-gray-700 cursor-not-allowed">Товар активен</span>
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
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium rounded-xl hover:from-rose-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Удаление...
                    </>
                ) : (
                    'Удалить товар'
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}