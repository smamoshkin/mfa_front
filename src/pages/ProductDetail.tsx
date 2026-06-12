import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, DollarSign, Calendar, TrendingUp, 
  BarChart3, Edit2, Plus, Trash2, ExternalLink,
  ShoppingCart, Tag, Barcode, Image, Info, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
// import { 
//   fetchProductById, 
//   fetchProductCosts, 
//   fetchCurrentCost,
//   createProductCost,
//   deleteProductCost,
//   fetchProductWithMetrics
// } from '../api/mockProducts';
import { productsApi } from "../api/productsApi";
import type { Product, ProductCost, CurrentCost, ProductWithMetrics } from '../types/api';
import CostModal from '../components/CostModal';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = parseInt(id || '0');

  const [product, setProduct] = useState<ProductWithMetrics | null>(null);
  const [costs, setCosts] = useState<ProductCost[]>([]);
  const [currentCost, setCurrentCost] = useState<CurrentCost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Состояния для модалок
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<ProductCost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Загрузка данных
  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadProductData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Загружаем товар с метриками
      // const productResponse = await fetchProductWithMetrics(productId);
      // if (!productResponse.data) {
      //   throw new Error('Товар не найден');
      // }
      const productResponse = await productsApi.getProductById(productId);
      // console.log(productResponse.data)
      if (!productResponse) {
        throw new Error('Товар не найден');
      }
      setProduct(productResponse);

      // Загружаем историю себестоимости
      const costsResponse = await productsApi.getProductCosts(productId);
      setCosts(costsResponse);

      // Загружаем текущую себестоимость
      const currentCostResponse = await productsApi.getCurrentCost(productId);
      setCurrentCost(currentCostResponse);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCost = () => {
    setSelectedCost(null);
    setIsCostModalOpen(true);
  };

  const handleEditCost = (cost: ProductCost) => {
    setSelectedCost(cost);
    setIsCostModalOpen(true);
  };

  const handleDeleteCost = async (costId: number) => {
    if (!window.confirm('Удалить эту себестоимость?')) return;
    
    setIsDeleting(true);
    try {
      await productsApi.deleteProductCost(costId);
      await loadProductData(); // Перезагружаем данные
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveCost = async (costData: any) => {
    try {
      if (selectedCost) {
        // Обновление существующей себестоимости
        // Здесь будет вызов updateProductCost
        // console.log('Обновление себестоимости:', costData);
        await productsApi.updateProductCost(selectedCost.id, costData);
      } else {
        // Создание новой себестоимости
        await productsApi.createProductCost(costData);
      }
      await loadProductData(); // Перезагружаем данные
    } catch (err: any) {
      throw err;
    }
  };

  const formatEndDate = (endDate: string | null | undefined): React.ReactNode => {
    if (!endDate || endDate === 'null' || endDate === '') {
      return <span className="text-gray-500">∞ <span className="text-xs">(бессрочно)</span></span>;
    }
    
    const date = new Date(endDate);
    // Проверка на 1970 год (Unix epoch)
    if (date.getFullYear() === 1970 || date.getTime() <= 0) {
      return <span className="text-gray-500">∞ <span className="text-xs">(бессрочно)</span></span>;
    }
    
    return format(date, 'd MMM yyyy', { locale: ru });
  };

  const calculateProfit = () => {
    if (!product || !currentCost || !product.currentPrice) return null;
    
    const costValue = parseFloat(currentCost.cost);
    const price = product.currentPrice;
    const profit = price - costValue;
    const profitability = (profit / price) * 100;
    
    return { profit, profitability };
  };

  const profitData = calculateProfit();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600 mb-6">{error || 'Товар не найден'}</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к товарам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/products')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Товар</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Кнопка назад и действия 
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link 
              to="/products"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к товарам
            </Link>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/products/${productId}/edit`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Редактировать
            </button>
          </div>
        </div>*/}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - информация о товаре */}
          <div className="lg:col-span-2 space-y-8">
            {/* Карточка товара */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Изображение */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 bg-gray-200 rounded-xl overflow-hidden">
                    {product.foto ? (
                      <img 
                        src={product.foto} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Информация */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">SKU</label>
                        <p className="font-mono text-gray-900">{product.sku}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Артикул WB</label>
                        <p className="font-mono text-gray-900">{product.marketplace_sku}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Штрихкод</label>
                        <p className="font-mono text-gray-900">{product.barcode}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Дата обновления</label>
                        <p className="text-gray-900">
                          {format(new Date(product.updated_at), 'd MMMM yyyy', { locale: ru })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Описание</label>
                      <p className="text-gray-900 mt-1">{product.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Метрики 
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Метрики продаж</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {product.last_month_sales?.toLocaleString() || '—'}
                  </div>
                  <div className="text-sm text-gray-500">Продажи (30 дн.)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {product.last_month_revenue ? `${Math.round(product.last_month_revenue / 1000)}K ₽` : '—'}
                  </div>
                  <div className="text-sm text-gray-500">Выручка (30 дн.)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {product.profitability ? `${product.profitability.toFixed(1)}%` : '—'}
                  </div>
                  <div className="text-sm text-gray-500">Рентабельность</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {product.stock?.toLocaleString() || '—'}
                  </div>
                  <div className="text-sm text-gray-500">Остаток на складе</div>
                </div>
              </div>
            </div>*/}

            {/* История себестоимости */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">История себестоимости</h2>
                <button
                  onClick={handleAddCost}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить себестоимость
                </button>
              </div>

              {costs.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных о себестоимости</h3>
                  <p className="text-gray-600 mb-6">Добавьте первую себестоимость для этого товара</p>
                  {/*<button
                    onClick={handleAddCost}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить себестоимость
                  </button>*/}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Период</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Себестоимость</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Добавил</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Дата добавления</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {costs.map((cost) => (
                        <tr 
                          key={cost.id} 
                          className={`hover:bg-gray-50 transition ${
                            currentCost?.id === cost.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {format(new Date(cost.start_date), 'd MMM yyyy', { locale: ru })}
                              </div>
                              <div className="text-sm text-gray-500">
                                по {formatEndDate(cost.end_date)}
                              </div>
                              {currentCost?.id === cost.id && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Текущая
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xl font-bold text-gray-900">
                              {parseFloat(cost.cost).toLocaleString()} ₽
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-700">{cost.created_by}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-700">
                              {format(new Date(cost.created_at), 'd MMM yyyy', { locale: ru })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditCost(cost)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                title="Редактировать"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCost(cost.id)}
                                disabled={isDeleting}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - текущая себестоимость и прибыль */}
          <div className="space-y-8">
            {/* Текущая себестоимость */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Текущая себестоимость</h2>
              
              {currentCost ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {parseFloat(currentCost.cost).toLocaleString()} ₽
                    </div>
                    <div className="text-sm text-gray-500">на единицу товара</div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500">Период действия</label>
                      <p className="text-gray-900 font-medium">
                        {format(new Date(currentCost.start_date), 'd MMMM yyyy', { locale: ru })} —{' '}
                        {formatEndDate(currentCost.end_date)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Добавил</label>
                      <p className="text-gray-900">{currentCost.created_by}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Дата добавления</label>
                      <p className="text-gray-900">
                        {format(new Date(currentCost.created_at), 'd MMMM yyyy', { locale: ru })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const cost = costs.find(c => c.id === currentCost.id);
                      if (cost) handleEditCost(cost);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition"
                  >
                    <Edit2 className="w-4 h-4 inline mr-2" />
                    Изменить себестоимость
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет текущей себестоимости</h3>
                  <p className="text-gray-600 mb-6">Добавьте себестоимость без даты окончания, что бы она использовалась в качестве текущей</p>
                  {/*<button
                    onClick={handleAddCost}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Добавить себестоимость
                  </button>*/}
                </div>
              )}
            </div>

            {/* Расчет прибыли */}
            {profitData && product.currentPrice && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Расчет прибыли</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {product.currentPrice.toLocaleString()} ₽
                      </div>
                      <div className="text-xs text-gray-500">Цена продажи</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {parseFloat(currentCost!.cost).toLocaleString()} ₽
                      </div>
                      <div className="text-xs text-gray-500">Себестоимость</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Прибыль на единицу:</span>
                      <span className="text-xl font-bold text-green-600">
                        {profitData.profit.toLocaleString()} ₽
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Рентабельность:</span>
                      <span className={`text-xl font-bold ${
                        profitData.profitability > 30 ? 'text-green-600' :
                        profitData.profitability > 20 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {profitData.profitability.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {product.last_month_sales && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 mb-1">
                          {(profitData.profit * product.last_month_sales).toLocaleString()} ₽
                        </div>
                        <div className="text-sm text-gray-500">
                          Прибыль за 30 дней ({product.last_month_sales} продаж)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Модальное окно себестоимости */}
      {isCostModalOpen && (
        <CostModal
          productId={productId}
          productName={product.name}
          cost={selectedCost}
          isOpen={isCostModalOpen}
          onClose={() => {
            setIsCostModalOpen(false);
            setSelectedCost(null);
          }}
          onSave={handleSaveCost}
        />
      )}
    </div>
  );
}