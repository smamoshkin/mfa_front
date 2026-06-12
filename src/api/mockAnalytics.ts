import { RentabilityResponse, RentabilityProduct } from '../types/analytics';

// Моковые данные аналитики на основе твоего ответа
export const mockRentabilityData: RentabilityResponse = {
  period: {
    date_from: "2024-10-01",
    date_to: "2024-10-31",
    group_by: "month"
  },
  totals: {
    total_quantity: "7346",
    total_revenue: 1778278.8299999998,
    total_payout: 1670681.7399999998,
    total_margin: 636387.0019000001,
    total_storage_fee: 17413.71,
    total_regular_deduction: 36679,
    total_dzhem_deduction: 0,
    total_delivery_rub: 418887.55,
    total_penalty: 0,
    total_acceptance: 0,
    total_return_revenue: 13094,
    total_tax_7p: 124479.51810000002,
    total_cost: 477833.67,
    product_count: 34
  },
  rentability: {
    margin_minus_expenses: 582294.2919000002,
    margin_per_unit: 79.2668516063164,
    shop_margin_revenue: 35.78668267113095,
    shop_margin_payout: 38.09145612018243,
    drr: 5.763631232330484,
    fixed_salary: 60000,
    wb_realized_10p: 177827.883,
    premium_calculation: -141148.883,
    premium_5p: 22057.27044500001,
    total_salary: 82057.270445,
    margin_10p: 58229.429190000024,
    margin_after_salary: 442007.5922650001,
    profitability: 26.45672013300392,
    total_advertising: 36679,
    total_logistics: 418887.55
  },
  products: [
    {
      sku: "10151059",
      product_name: "",
      quantity_sold: "293",
      revenue: 76455.21,
      margin: 9329.3453,
      margin_percent: 12.202366980615187,
      margin_per_unit: 31.840768941979523,
      logistics_per_unit: 59.53839590443686
    },
    {
      sku: "1052252",
      product_name: "",
      quantity_sold: "4",
      revenue: 711.05,
      margin: 268.2165,
      margin_percent: 37.721186977005836,
      margin_per_unit: 67.054125,
      logistics_per_unit: 47.85
    },
    {
      sku: "1062247",
      product_name: "",
      quantity_sold: "737",
      revenue: 274188.56,
      margin: 177232.1908,
      margin_percent: 64.6387984969176,
      margin_per_unit: 240.4778708276798,
      logistics_per_unit: 54.33446404341927
    },
    {
      sku: "95951145",
      product_name: "",
      quantity_sold: "2762",
      revenue: 587435.9,
      margin: 182948.077,
      margin_percent: 31.14349616698605,
      margin_per_unit: 66.23753692976105,
      logistics_per_unit: 55.588251267197684
    },
    {
      sku: "61208",
      product_name: "",
      quantity_sold: "453",
      revenue: 184276.99,
      margin: 77759.0007,
      margin_percent: 42.19680422390229,
      margin_per_unit: 171.65342317880794,
      logistics_per_unit: 58.524790286975716
    },
    {
      sku: "7101111",
      product_name: "",
      quantity_sold: "43",
      revenue: 16744.91,
      margin: 11248.8263,
      margin_percent: 67.1775859052094,
      margin_per_unit: 261.60061162790697,
      logistics_per_unit: 51.353488372093025
    },
    {
      sku: "11161028",
      product_name: "",
      quantity_sold: "19",
      revenue: 13750.07,
      margin: 5317.6651,
      margin_percent: 38.67373111555069,
      margin_per_unit: 279.8771105263158,
      logistics_per_unit: 75.60526315789474
    },
    {
      sku: "11161053",
      product_name: "",
      quantity_sold: "8",
      revenue: 7040.86,
      margin: 2978.9798,
      margin_percent: 42.30988544013089,
      margin_per_unit: 372.372475,
      logistics_per_unit: 47.85
    },
    {
      sku: "95951341",
      product_name: "",
      quantity_sold: "83",
      revenue: 23872.24,
      margin: 10245.0132,
      margin_percent: 42.91601123313104,
      margin_per_unit: 123.43389397590362,
      logistics_per_unit: 52.32710843373494
    },
    {
      sku: "61205",
      product_name: "",
      quantity_sold: "75",
      revenue: 30389.34,
      margin: 8570.7762,
      margin_percent: 28.20323244927333,
      margin_per_unit: 114.277016,
      logistics_per_unit: 72.446
    }
  ],
  summary: {
    total_revenue: "₽1,778,278.83",
    total_margin: "₽636,387.00",
    profitability: "26.5%",
    margin_per_unit: "₽79.27",
    products_count: 34
  }
};

// Функция для получения аналитики
export const fetchRentabilityData = async (filters: {
  date_from: string;
  date_to: string;
  group_by: 'day' | 'week' | 'month' | 'year';
}): Promise<RentabilityResponse> => {
  // Имитация задержки API
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // В реальном приложении здесь будет запрос к API
  // Пока возвращаем моковые данные с обновленными датами из фильтров
  return {
    ...mockRentabilityData,
    period: {
      ...mockRentabilityData.period,
      date_from: filters.date_from,
      date_to: filters.date_to,
      group_by: filters.group_by
    }
  };
};

// Функция для фильтрации продуктов
export const filterProducts = (
  products: RentabilityProduct[],
  filters: {
    sku?: string;
    min_margin_percent?: number;
    min_quantity?: number;
  }
): RentabilityProduct[] => {
  let filtered = [...products];

  if (filters.sku) {
    const skuLower = filters.sku.toLowerCase();
    filtered = filtered.filter(p => 
      p.sku.toLowerCase().includes(skuLower) || 
      p.product_name.toLowerCase().includes(skuLower)
    );
  }

  if (filters.min_margin_percent !== undefined) {
    filtered = filtered.filter(p => p.margin_percent >= filters.min_margin_percent!);
  }

  if (filters.min_quantity !== undefined) {
    filtered = filtered.filter(p => parseInt(p.quantity_sold) >= filters.min_quantity!);
  }

  return filtered;
};