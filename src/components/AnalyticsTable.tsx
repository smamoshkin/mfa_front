import { useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RentabilityProduct } from '../types/analytics';

interface AnalyticsTableProps {
  products: RentabilityProduct[];
  isLoading: boolean;
}

export default function AnalyticsTable({ products, isLoading }: AnalyticsTableProps) {
  const [sortField, setSortField] = useState<keyof RentabilityProduct>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof RentabilityProduct) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Для числовых строк
    if (sortField === 'quantity_sold') {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: keyof RentabilityProduct) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getMarginColor = (margin: number) => {
    if (margin > 40) return 'text-green-600 bg-green-50';
    if (margin > 20) return 'text-yellow-600 bg-yellow-50';
    if (margin > 0) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (value: number) => {
    if (value > 50) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value > 20) return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    if (value > 0) return <TrendingUp className="w-4 h-4 text-orange-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Загрузка данных...</p>
      </div>
    );
  }

  if (sortedProducts.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных для отображения</h3>
        <p className="text-gray-600">Попробуйте изменить параметры фильтров</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th 
              className="py-4 px-6 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('sku')}
            >
              <div className="flex items-center">
                SKU {getSortIcon('sku')}
              </div>
            </th>
            <th 
              className="py-4 px-6 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('quantity_sold')}
            >
              <div className="flex items-center">
                Продано {getSortIcon('quantity_sold')}
              </div>
            </th>
            <th 
              className="py-4 px-6 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('revenue')}
            >
              <div className="flex items-center">
                Выручка {getSortIcon('revenue')}
              </div>
            </th>
            <th 
              className="py-4 px-6 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('margin')}
            >
              <div className="flex items-center">
                Маржа {getSortIcon('margin')}
              </div>
            </th>
            <th 
              className="py-4 px-6 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('margin_percent')}
            >
              <div className="flex items-center">
                Рентабельность {getSortIcon('margin_percent')}
              </div>
            </th>
            <th 
              className="py-4 px-6 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('margin_per_unit')}
            >
              <div className="flex items-center">
                Маржа/ед. {getSortIcon('margin_per_unit')}
              </div>
            </th>
            <th 
              className="py-4 px-6 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('logistics_per_unit')}
            >
              <div className="flex items-center">
                Логистика/ед. {getSortIcon('logistics_per_unit')}
              </div>
            </th>
            <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedProducts.map((product) => (
            <tr key={product.sku} className="hover:bg-gray-50 transition">
              <td className="py-4 px-6">
                <div className="font-mono text-gray-900">{product.sku}</div>
                {product.product_name && (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {product.product_name}
                  </div>
                )}
              </td>
              <td className="py-4 px-6">
                <div className="font-medium text-gray-900">
                  {parseInt(product.quantity_sold).toLocaleString()} шт.
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="font-medium text-gray-900">
                  {formatCurrency(product.revenue)}
                </div>
              </td>
              <td className="py-4 px-6">
                <div className={`font-medium ${product.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(product.margin)}
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center space-x-2">
                  {getTrendIcon(product.margin_percent)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMarginColor(product.margin_percent)}`}>
                    {product.margin_percent.toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="font-medium text-gray-900">
                  {product.margin_per_unit.toFixed(2)} ₽
                </div>
              </td>
              <td className="py-4 px-6">
                <div className="text-gray-700">
                  {product.logistics_per_unit.toFixed(2)} ₽
                </div>
              </td>
              <td className="py-4 px-6">
                <button
                  onClick={() => {
                    // В будущем здесь будет переход на страницу товара
                    console.log('Просмотр товара:', product.sku);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                  title="Просмотр товара"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Пагинация/информация */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Показано {sortedProducts.length} товаров
          </div>
          <div className="text-sm text-gray-600">
            Сортировка по: {sortField} ({sortDirection === 'asc' ? 'по возрастанию' : 'по убыванию'})
          </div>
        </div>
      </div>
    </div>
  );
}