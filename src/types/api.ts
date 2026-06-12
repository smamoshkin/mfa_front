// Типы на основе контрактов API

// Продукт из API
export interface Product {
    id: number;
    tenant_id: number;
    sku: string;
    marketplace_sku: string;
    foto: string;
    barcode: string;
    name: string;
    description: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  // Себестоимость из API
  export interface ProductCost {
    id: number;
    product_id: number;
    cost: string; // строка, но будем парсить в число
    start_date: string;
    end_date: string;
    created_by: string;
    created_at: string;
  }
  
  // Текущая себестоимость
  export interface CurrentCost {
    cost: string;
    start_date: string;
    end_date: string;
    created_by: string;
    id: number;
    product_id: number;
    created_at: string;
  }
  
  // Расширенный продукт с себестоимостью и метриками (для фронта)
  export interface ProductWithMetrics extends Product {
    current_cost?: number;
    last_month_sales?: number;
    last_month_revenue?: number;
    profitability?: number;
    stock?: number; // Остатки будем получать из API WB
  }

  // Запрос на создание себестоимости
  export interface CreateProductCostRequest {
    cost: number;
    start_date: string;
    end_date: string;
    created_by: string;
    product_id: number;
  }
  
  // Ответ при создании себестоимости
  export interface CreateProductCostResponse {
    id: number;
    product_id: number;
    cost: string; // строка в ответе
    start_date: string;
    end_date: string;
    created_by: string;
    created_at: string;
  }