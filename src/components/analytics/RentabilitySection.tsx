// Секция «Рентабельность» страницы «Аналитика»: карточки основных
// показателей и расходов. Данные и бейджи «к прошлому периоду» приходят
// из контейнера страницы через Outlet context.
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3, DollarSign, Package, PieChart, Wallet, Megaphone, Warehouse, Truck, Receipt, Percent,
} from 'lucide-react';
import { MoMBadge } from './mom';
import type { AnalyticsSectionContext } from '../../pages/Analytics';

export default function RentabilitySection() {
  const { analyticsData, momBadges } = useOutletContext<AnalyticsSectionContext>();

  // Данных нет (ошибка загрузки) — секция пустая, состояние показывает контейнер
  if (!analyticsData) return null;
  return (
    <>
      <h2 className="text-sm font-semibold text-app-muted uppercase tracking-wide mb-3">
        Основные показатели
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className={`rounded-xl shadow-sm border p-4 ${
          analyticsData.rentability.profitability >= 0
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-700'
            : 'bg-gradient-to-br from-red-600 to-red-700 border-red-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-white/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <MoMBadge onDark change={momBadges?.profitability ?? null} />
          </div>
          <h3 className="text-xl font-bold text-white mb-0.5">
            {analyticsData.rentability.profitability.toFixed(1)}%
          </h3>
          <p className="text-white/80 text-sm">Общая рентабельность</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <DollarSign className="w-5 h-5 text-emerald-700" />
            </div>
            <MoMBadge change={momBadges?.revenue ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.summary.total_revenue}
          </h3>
          <p className="text-app-muted text-sm">Общая выручка</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <Wallet className="w-5 h-5 text-emerald-700" />
            </div>
            <MoMBadge change={momBadges?.payout ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.totals.total_payout.toLocaleString()} ₽
          </h3>
          <p className="text-app-muted text-sm">Перечислено продавцу</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <PieChart className="w-5 h-5 text-emerald-700" />
            </div>
            <MoMBadge change={momBadges?.margin ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.rentability.margin_minus_expenses.toLocaleString()} ₽
          </h3>
          <p className="text-app-muted text-sm">Маржа</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-emerald-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <Package className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {analyticsData.totals.product_count} шт.
            </span>
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.totals.total_quantity}
          </h3>
          <p className="text-app-muted text-sm">Продано товаров</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-app-muted uppercase tracking-wide mb-3">
        Расходы
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-red-50">
              <Megaphone className="w-5 h-5 text-red-700" />
            </div>
            <MoMBadge change={momBadges?.advertising ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.rentability.total_advertising.toLocaleString()} ₽
          </h3>
          <p className="text-app-muted text-sm">Расходы на рекламу</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-red-50">
              <Warehouse className="w-5 h-5 text-red-700" />
            </div>
            <MoMBadge change={momBadges?.storage ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.totals.total_storage_fee.toLocaleString()} ₽
          </h3>
          <p className="text-app-muted text-sm">Хранение</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-red-50">
              <Truck className="w-5 h-5 text-red-700" />
            </div>
            <MoMBadge change={momBadges?.logistics ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.rentability.total_logistics.toLocaleString()} ₽
          </h3>
          <p className="text-app-muted text-sm">Логистика</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-red-50">
              <Receipt className="w-5 h-5 text-red-700" />
            </div>
            <MoMBadge change={momBadges?.tax ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.totals.total_tax.toLocaleString()} ₽
          </h3>
          <p className="text-app-muted text-sm">Налог</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-red-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-1.5 rounded-lg bg-red-50">
              <Percent className="w-5 h-5 text-red-700" />
            </div>
            <MoMBadge change={momBadges?.drr ?? null} />
          </div>
          <h3 className="text-xl font-bold text-app mb-0.5">
            {analyticsData.rentability.drr.toFixed(2)}%
          </h3>
          <p className="text-app-muted text-sm">DRR</p>
        </div>
      </div>
    </>
  );
}
