// Типы для аналитики рентабельности
export interface RentabilityPeriod {
    date_from: string;
    date_to: string;
    group_by: 'day' | 'week' | 'month' | 'year';
  }
  
  export interface RentabilityTotals {
    total_quantity: string;
    total_revenue: number;
    total_payout: number;
    total_margin: number;
    total_storage_fee: number;
    total_regular_deduction: number;
    total_dzhem_deduction: number;
    total_delivery_rub: number;
    total_penalty: number;
    total_acceptance: number;
    total_return_revenue: number;
    total_tax: number;
    total_cost: number;
    product_count: number;
  }
  
  export interface RentabilityMetrics {
    margin_minus_expenses: number;
    margin_per_unit: number;
    shop_margin_revenue: number;
    shop_margin_payout: number;
    drr: number;
    fixed_salary: number;
    wb_realized_10p: number;
    premium_calculation: number;
    premium_5p: number;
    total_salary: number;
    margin_10p: number;
    margin_after_salary: number;
    profitability: number;
    total_advertising: number;
    total_logistics: number;
  }
  
  export interface RentabilityProduct {
    sku: string;
    product_name: string;
    quantity_sold: string;
    revenue: number;
    margin: number;
    margin_percent: number;
    margin_per_unit: number;
    logistics_per_unit: number;
    turnover_days: number;
  }
  
  export interface RentabilitySummary {
    total_revenue: string;
    total_margin: string;
    profitability: string;
    margin_per_unit: string;
    products_count: number;
  }
  
  export interface RentabilityResponse {
    period: RentabilityPeriod;
    totals: RentabilityTotals;
    rentability: RentabilityMetrics;
    products: RentabilityProduct[];
    summary: RentabilitySummary;
  }
  
  // Типы для фильтров аналитики
  export interface AnalyticsFilters {
    date_from: string;
    date_to: string;
    group_by: 'day' | 'week' | 'month' | 'year';
    sku?: string;
    min_margin_percent?: number;
    min_quantity?: number;
  }