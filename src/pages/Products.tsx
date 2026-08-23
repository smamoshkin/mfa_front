import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, DollarSign, Package, X, CircleDollarSign } from 'lucide-react';
import { productsApi } from '../api/productsApi';
import type { ProductWithMetrics } from '../types/api';
import ProductModal from '../components/ProductModal';
import ProductDeleteModal from '../components/ProductDeleteModal';
import CostImportModal from '../components/CostImportModal';
import { useNavigate } from 'react-router-dom';
export default function Products() {
  const [products, setProducts] = useState<ProductWithMetrics[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Сообщение об ошибке загрузки (заполняется в loadProducts)
  const [, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithMetrics | null>(null);
  const [isDeleteProductOpen, setIsDeleteProductOpen] = useState(false);
  const [isCostImportOpen, setIsCostImportOpen] = useState(false);
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
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок и кнопка добавления */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-app">Каталог товаров</h1>
            <p className="text-app-2 mt-2">Управление товарами и отслеживание показателей</p>
          </div>
          <div className="flex gap-3">
            <button
              data-tour="products-actions"
              onClick={() => setIsCostImportOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:from-primary-dark hover:to-primary transition flex items-center shadow-lg"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Себестоимости из файла
            </button>
            <button
              data-tour="products-add"
              onClick={handleAddProduct}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition flex items-center shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Добавить товар
            </button>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div data-tour="products-search" className="bg-card rounded-xl shadow-sm border border-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-app-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию, артикулу..."
                className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                <span className="text-app-2">Только активные</span>
              </label>
              
              {(search || selectedCategory || !showActiveOnly) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setShowActiveOnly(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-app-2 hover:text-app hover:bg-hover rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                  <span>Сбросить фильтры</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-app-2">
              Найдено: {filteredProducts.length} товаров ({totals.activeCount} активных)
            </span>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-app-muted" />
              <span className="text-sm text-app-2">
                Фильтры применяются в реальном времени
              </span>
            </div>
          </div>
        </div>

        {/* Статистика 
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-sm border border-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +12.5%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-app mb-1">
              {Math.round(totals.totalRevenue / 1000)}K ₽
            </h3>
            <p className="text-app-muted text-sm">Выручка за 30 дней</p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +8.2%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-app mb-1">
              {totals.totalSales.toLocaleString()}
            </h3>
            <p className="text-app-muted text-sm">Продажи за 30 дней</p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary-soft">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                +3.1%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-app mb-1">
              {totals.avgProfitability.toFixed(1)}%
            </h3>
            <p className="text-app-muted text-sm">Средняя рентабельность</p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-orange-100">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {filteredProducts.length}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-app mb-1">
              {totals.activeCount}
            </h3>
            <p className="text-app-muted text-sm">Активных товаров</p>
          </div>
        </div>*/}

        {/* Таблица товаров */}
        <div data-tour="products-table" className="bg-card rounded-xl shadow-sm border border-card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-app-2">Загрузка товаров...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-app-muted/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-app mb-2">Товары не найдены</h3>
              <p className="text-app-2">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-card-2 border-b border-card">
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Товар</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Артикулы</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Категория</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Статус</th>
                    <th className="py-2.5 px-4 text-right text-xs font-semibold text-app-2 uppercase tracking-wide">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-hover transition group/row">
                      <td className="py-2 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div
                              className="w-9 h-9 bg-hover rounded-lg overflow-hidden flex-shrink-0 group"
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
                                <div className="w-full h-full bg-hover flex items-center justify-center">
                                  <Package className="w-5 h-5 text-app-muted" />
                                </div>
                              )}

                              {/* Индикатор что есть увеличенное изображение */}
                              {product.foto && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg pointer-events-none"></div>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="font-medium text-app text-sm truncate max-w-[240px]">{product.name}</div>
                            <div className="text-xs text-app-muted truncate max-w-[240px]">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="space-y-0.5 text-sm">
                          <div>
                            <span className="text-app-muted text-xs">SKU: </span>
                            <span className="font-mono text-app">{product.sku}</span>
                          </div>
                          <div>
                            <span className="text-app-muted text-xs">WB: </span>
                            <span className="font-mono text-app">{product.marketplace_sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className="px-2.5 py-0.5 bg-hover text-app rounded-full text-xs">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center ${
                          product.is_active
                            ? 'bg-mint text-ink'
                            : 'bg-hover text-app-muted'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            product.is_active ? 'bg-emerald-600' : 'bg-app-muted'
                          }`}></div>
                          {product.is_active ? 'Активен' : 'Неактивен'}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {/* Кнопки в высоту строки: белые, объёмные, с цветной тенью */}
                        <div className="flex items-stretch justify-end gap-2">
                          <button
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="px-3 py-2 min-h-[44px] bg-card text-blue-600 rounded-lg border border-blue-200/60 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                            title="Себестоимость"
                          >
                            <CircleDollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium hidden lg:inline">Себестоимость</span>
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="px-3 py-2 min-h-[44px] bg-card text-emerald-600 rounded-lg border border-emerald-200/60 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="text-xs font-medium hidden lg:inline">Редактировать</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="px-3 py-2 min-h-[44px] bg-card text-red-600 rounded-lg border border-red-200/60 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs font-medium hidden lg:inline">Удалить</span>
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
            <div className="bg-card rounded-xl shadow-2xl border border-card p-3 ml-2">
              <div className="w-64 h-64 overflow-hidden rounded-lg">
                <img
                  src={tooltipState.imageUrl}
                  alt={tooltipState.alt}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // Если изображение не загрузилось, скрываем тултип
                    hideTooltip();
                  }}
                />
              </div>
              
              {/* Подпись 
              <div className="mt-2 text-xs text-app-muted text-center">
                Наведите на другое изображение
              </div>*/}
            </div>
          </div>
        </div>
      )}

        {/* Пагинация (пока заглушка) */}
        {/*filteredProducts.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-app-2">
              Показано {filteredProducts.length} из {products.length} товаров
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-2 text-sm text-app-2 hover:text-app hover:bg-hover rounded-lg transition">
                ← Назад
              </button>
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                1
              </button>
              <button className="px-3 py-2 text-sm text-app-2 hover:text-app hover:bg-hover rounded-lg transition">
                2
              </button>
              <button className="px-3 py-2 text-sm text-app-2 hover:text-app hover:bg-hover rounded-lg transition">
                3
              </button>
              <button className="px-3 py-2 text-sm text-app-2 hover:text-app hover:bg-hover rounded-lg transition">
                Далее →
              </button>
            </div>
          </div>
        )*/}
      </div>

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

      {/* Модалка импорта себестоимостей из файла */}
      {isCostImportOpen && (
        <CostImportModal
          isOpen={isCostImportOpen}
          onClose={() => setIsCostImportOpen(false)}
          onImported={loadProducts}
        />
      )}
    </div>
  );
}