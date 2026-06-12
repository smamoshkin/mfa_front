import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import type { RentabilityResponse, RentabilityProduct } from '../types/analytics';

interface AnalyticsChartsProps {
  analyticsData: RentabilityResponse;
  filteredProducts: RentabilityProduct[];
}

export default function AnalyticsCharts({ analyticsData, filteredProducts }: AnalyticsChartsProps) {
  // Здесь позже будут реальные графики Recharts
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Визуализация данных</h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg">
            Графики
          </button>
          <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Таблицы
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Левая колонка */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {analyticsData.rentability.profitability.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Общая рентабельность</h3>
            <p className="text-gray-600 text-sm">
              Средняя рентабельность по всем товарам за выбранный период
            </p>
            <div className="mt-4 h-2 bg-white rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{ width: `${Math.min(analyticsData.rentability.profitability, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-green-700">
                {analyticsData.rentability.margin_per_unit.toFixed(2)} ₽
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Маржа на единицу</h3>
            <p className="text-gray-600 text-sm">
              Средняя маржа на один проданный товар
            </p>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-lg">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-700">
                {analyticsData.rentability.shop_margin_revenue.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Магазинная наценка</h3>
            <p className="text-gray-600 text-sm">
              Отношение маржи к выручке (по выручке)
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {analyticsData.rentability.shop_margin_revenue.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">От выручки</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {analyticsData.rentability.shop_margin_payout.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">От выплаты</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Топ товары по марже</h3>
              <span className="text-sm text-gray-600">
                {filteredProducts.length} товаров
              </span>
            </div>
            <div className="space-y-3">
              {filteredProducts
                .sort((a, b) => b.margin - a.margin)
                .slice(0, 3)
                .map((product, index) => (
                  <div key={product.sku} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.sku}</div>
                        <div className="text-xs text-gray-500">
                          {parseInt(product.quantity_sold).toLocaleString()} шт.
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {product.margin.toLocaleString()} ₽
                      </div>
                      <div className={`text-xs ${
                        product.margin_percent > 40 ? 'text-green-600' :
                        product.margin_percent > 20 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {product.margin_percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Графики будут реализованы с использованием библиотеки Recharts
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Планируются: график продаж по дням, распределение маржи по товарам, динамика рентабельности
          </p>
        </div>
      </div>
    </div>
  );
}