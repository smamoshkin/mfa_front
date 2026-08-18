import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, Eye, DollarSign, Package, TrendingUp, BarChart3, X, CircleDollarSign, User } from 'lucide-react';
import { productsApi } from '../api/productsApi';
import type { Product, ProductWithMetrics } from '../types/api';
import ProductModal from '../components/ProductModal';
import ProductDeleteModal from '../components/ProductDeleteModal';
import ImageTooltip from '../components/ImageTooltip';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Products() {
  const { user, logout } = useAuthStore();
  const [products, setProducts] = useState<ProductWithMetrics[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithMetrics | null>(null);
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false);
  // 1. Добавьте состояние для позиционирования вверху компонента
  const [tooltipState, setTooltipState] = useState<{
    isVisible: boolean;
    imageUrl: string;
    alt: string;
    position: { x: number; y: number };
  } | null>(null);

  // Загрузка товаров
  useEffect(() => {
    loadProducts();
  }, []);

  // Применение фильтров
  useEffect(() => {
    applyFilters();
  }, [products, search, selectedCategory, showActiveOnly]);

  const navigate = useNavigate();

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Реальный API запрос
      const products = await productsApi.getProducts({
        active: showActiveOnly ? true : undefined,
        category: selectedCategory || undefined,
        search: search || undefined,
      });
      
      // Загружаем метрики для каждого товара (если нужно)
      // const productsWithMetrics = await Promise.all(
      //   products.map(async (product) => {
      //     try {
      //       const currentCost = await productsApi.getCurrentCost(product.id);
      //       // Здесь можно добавить логику расчета метрик
      //       return {
      //         ...product,
      //         current_cost: currentCost ? parseFloat(currentCost.cost) : undefined,
      //       };
      //     } catch (error) {
      //       console.error(`Ошибка загрузки себестоимости для товара ${product.id}:`, error);
      //       return product;
      //     }
      //   })
      // );
      
      setProducts(products);
    } catch (error: any) {
      console.error('Ошибка загрузки товаров:', error);
      setError(error.response?.data?.message || 'Ошибка загрузки товаров');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.sku.toLowerCase().includes(searchLower) ||
        p.barcode.toLowerCase().includes(searchLower) ||
        p.marketplace_sku.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (showActiveOnly) {
      filtered = filtered.filter(p => p.is_active);
    }

    setFilteredProducts(filtered);
  };

  const handleEditProduct = (product: ProductWithMetrics) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = ( product: ProductWithMetrics ) => {
    setSelectedProduct(product);
    setIsDeleteProductOpen(true);
  };

  const handleViewProduct = (product: ProductWithMetrics) => {
    // В будущем здесь будет переход на детальную страницу
    console.log('Просмотр товара:', product);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    // console.log('Сохранение товара:', productData);
    try {
      if (selectedProduct) {
        // Обновление существующего товара
        await productsApi.updateProduct(selectedProduct.id, productData);
      } else {
        // Создание нового товара
        await productsApi.createProduct(productData);
      }
      await loadProducts(); // Перезагружаем список
    } catch (error) {
      // console.error('Ошибка сохранения товара:', error);
      throw error; // Пробрасываем ошибку в модалку
    }
  };

  const handleProductTermination = async (productData: any) => {
    // console.log('Удаление товара:', productData.id);
    try {
      // Удаление товара
      await productsApi.deleteProduct(productData.id);
      await loadProducts(); // Перезагружаем список
    } catch(error) {
      throw error;
    }
  };



  // 2. Функции для управления тултипом
  const showTooltip = (imageUrl: string, alt: string, event: React.MouseEvent) => {
    if (!imageUrl) return;
    
    const adjustedPos = getAdjustedPosition(
      event.clientX + 15,
      event.clientY + 15
    );
    
    setTooltipState({
      isVisible: true,
      imageUrl,
      alt,
      position: adjustedPos
    });
  };

const hideTooltip = () => {
  setTooltipState(null);
};

// Функция для корректировки позиции с учетом границ экрана
const getAdjustedPosition = (x: number, y: number, tooltipWidth = 280, tooltipHeight = 280) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let adjustedX = x;
  let adjustedY = y;
  
  // Проверяем правую границу
  if (x + tooltipWidth > viewportWidth) {
    adjustedX = x - tooltipWidth - 30; // Показываем слева от курсора
  }
  
  // Проверяем нижнюю границу
  if (y + tooltipHeight / 2 > viewportHeight) {
    adjustedY = viewportHeight - tooltipHeight / 2 - 10;
  }
  
  // Проверяем верхнюю границу
  if (y - tooltipHeight / 2 < 10) {
    adjustedY = tooltipHeight / 2 + 10;
  }
  
  return { x: adjustedX, y: adjustedY };
};


  const calculateTotals = () => {
    const totals = filteredProducts.reduce((acc, product) => ({
      totalRevenue: acc.totalRevenue + (product.last_month_revenue || 0),
      totalSales: acc.totalSales + (product.last_month_sales || 0),
      avgProfitability: product.profitability ? acc.avgProfitability + product.profitability : acc.avgProfitability,
      count: acc.count + 1,
      activeCount: acc.activeCount + (product.is_active ? 1 : 0),
    }), {
      totalRevenue: 0,
      totalSales: 0,
      avgProfitability: 0,
      count: 0,
      activeCount: 0,
    });

    return {
      ...totals,
      avgProfitability: totals.avgProfitability / (totals.count || 1),
    };
  };

  const totals = calculateTotals();
  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Товары</span>
              </div>

              <nav className="ml-10 flex space-x-8">
                <Link
                  to="/analytics"
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300"
                >
                  Аналитика
                </Link>
                <Link
                  to="/products"
                  className="text-blue-600 font-medium border-b-2 border-blue-600 px-1 pb-1"
                >
                  Товары
                </Link>
                <Link
                  to="/taxes"
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300"
                >
                  Налоговые ставки
                </Link>
              </nav>

            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Link to="/profile" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">{user?.name || user?.email}</span>
                </Link>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок и кнопка добавления */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Каталог товаров</h1>
            <p className="text-gray-600 mt-2">Управление товарами и отслеживание показателей</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить товар
          </button>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию, артикулу, штрихкоду..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700">Только активные</span>
              </label>
              
              {(search || selectedCategory || !showActiveOnly) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setShowActiveOnly(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                  <span>Сбросить фильтры</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Найдено: {filteredProducts.length} товаров ({totals.activeCount} активных)
            </span>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Фильтры применяются в реальном времени
              </span>
            </div>
          </div>
        </div>

        {/* Статистика 
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +12.5%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round(totals.totalRevenue / 1000)}K ₽
            </h3>
            <p className="text-gray-500 text-sm">Выручка за 30 дней</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +8.2%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {totals.totalSales.toLocaleString()}
            </h3>
            <p className="text-gray-500 text-sm">Продажи за 30 дней</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +3.1%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {totals.avgProfitability.toFixed(1)}%
            </h3>
            <p className="text-gray-500 text-sm">Средняя рентабельность</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-orange-100">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {filteredProducts.length}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {totals.activeCount}
            </h3>
            <p className="text-gray-500 text-sm">Активных товаров</p>
          </div>
        </div>*/}

        {/* Таблица товаров */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Загрузка товаров...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Товары не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Товар</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Артикулы</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Категория</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Статус</th>
                    {/* <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Продажи (30 дн.)</th> */}
                    {/* <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Рентабельность</th> */}
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div 
                              className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group"
                              onMouseEnter={(e) => product.foto && showTooltip(product.foto, product.name, e)}
                              onMouseMove={(e) => {
                                if (product.foto && tooltipState?.isVisible) {
                                  // Обновляем позицию при движении мыши
                                  setTooltipState(prev => prev ? {
                                    ...prev,
                                    position: {
                                      x: e.clientX + 15,
                                      y: e.clientY + 15
                                    }
                                  } : null);
                                }
                              }}
                              onMouseLeave={hideTooltip}
                            >
                              {product.foto ? (
                                <img 
                                  src={product.foto} 
                                  alt={product.name}
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%239CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              
                              {/* Индикатор что есть увеличенное изображение */}
                              {product.foto && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg pointer-events-none"></div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-gray-500">SKU: </span>
                            <span className="font-mono text-gray-900">{product.sku}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">WB: </span>
                            <span className="font-mono text-gray-900">{product.marketplace_sku}</span>
                          </div>
                          {product.barcode && (
                            <div className="text-sm">
                              <span className="text-gray-500">Штрихкод: </span>
                              <span className="font-mono text-gray-900">{product.barcode}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            product.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          {product.is_active ? 'Активен' : 'Неактивен'}
                        </div>
                      </td>
                      {/* <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">
                            {product.last_month_sales?.toLocaleString() || '—'} шт.
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.last_month_revenue ? `${Math.round(product.last_month_revenue / 1000)}K ₽` : '—'}
                          </div>
                        </div>
                      </td> 
                      <td className="py-4 px-6">
                        {product.profitability ? (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium text-center ${
                            product.profitability > 30 ? 'bg-green-100 text-green-800' :
                            product.profitability > 20 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.profitability.toFixed(1)}%
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>*/}
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/products/${product.id}`)} // Добавляем переход
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Себестоимость"
                            >
                            <CircleDollarSign className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
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
      
      {/* Тултип для просмотра изображения */}
      {tooltipState && tooltipState.isVisible && (
        <div
          className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
          style={{
            top: `${tooltipState.position.y}px`,
            left: `${tooltipState.position.x}px`,
            transform: 'translateY(-50%)', // Центрируем по вертикали относительно курсора
          }}
        >
          <div className="relative">
            {/* Стрелка указывающая на курсор */}
            <div 
              className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{
                borderRight: '8px solid white',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                filter: 'drop-shadow(-2px 0 2px rgba(0,0,0,0.1))'
              }}
            />
            
            {/* Контейнер изображения */}
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-3 ml-2">
              <div className="w-64 h-64 overflow-hidden rounded-lg">
                <img
                  src={tooltipState.imageUrl}
                  alt={tooltipState.alt}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Если изображение не загрузилось, скрываем тултип
                    hideTooltip();
                  }}
                />
              </div>
              
              {/* Подпись 
              <div className="mt-2 text-xs text-gray-500 text-center">
                Наведите на другое изображение
              </div>*/}
            </div>
          </div>
        </div>
      )}

        {/* Пагинация (пока заглушка) */}
        {/*filteredProducts.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Показано {filteredProducts.length} из {products.length} товаров
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                ← Назад
              </button>
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                1
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                2
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                3
              </button>
              <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                Далее →
              </button>
            </div>
          </div>
        )*/}
      </main>

      {/* Модалка для товара */}
      {isModalOpen && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          existingProducts={products}
        />
      )}

      {/* Модалка для удаления товара */}
      {isDeleteProductOpen && (
        <ProductDeleteModal
          product={selectedProduct}
          isOpen={isDeleteProductOpen}
          onClose={() => setIsDeleteProductOpen(false)}
          onSave={handleProductTermination}
        />
      )}
    </div>
  );
}