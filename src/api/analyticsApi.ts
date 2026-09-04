import axiosClient from './axiosClient';
import type { RentabilityResponse, AnalyticsFilters } from '../types/analytics';

export const analyticsApi = {
  // Получение аналитики рентабельности
  getRentability: async (filters: {
    date_from: string;
    date_to: string;
    group_by: 'day' | 'week' | 'month' | 'year';
  }): Promise<RentabilityResponse> => {
    const response = await axiosClient.get('/analytics/rentability', { params: filters });
    return response.data;
  },

  // Получение финансового обзора
  getFinancialOverview: async (filters: {
    date_from?: string;
    date_to?: string;
  } = {}): Promise<any> => {
    const response = await axiosClient.get('/analytics/financial-overview', { params: filters });
    return response.data;
  },

  // Получение отчетов поставщика
  getSupplierReports: async (filters: {
    date_from?: string;
    date_to?: string;
  } = {}): Promise<any> => {
    const response = await axiosClient.get('/supplier-reports/period', { params: filters });
    return response.data;
  },

  // ЭКСПОРТ В EXCEL (исправленный)
  exportExcel: async (filters: AnalyticsFilters): Promise<Blob> => {
    const response = await axiosClient.post(
      '/analytics/export/excel',
      filters,
      {
        responseType: 'blob',
        // Экспорт пересчитывает вьюху по сырым данным и может занять >30с:
        // дефолтный таймаут axios обрывал выгрузку с "Ошибка при экспорте данных".
        // Серверный лимит gunicorn — 180с, здесь зеркально.
        timeout: 180000,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data;
  },

  // Экспорт в PDF (если будет реализован)
  exportPdf: async (_filters: AnalyticsFilters): Promise<Blob> => {
    // Пока возвращаем ошибку или заглушку
    throw new Error('Экспорт в PDF временно недоступен');
  },

  // Фильтрация продуктов (если на бэкенде нет, делаем на фронте)
  filterProducts: (
    products: RentabilityResponse['products'],
    filters: {
      sku?: string;
      min_margin_percent?: number;
      min_quantity?: number;
    }
  ): RentabilityResponse['products'] => {
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
  }
};