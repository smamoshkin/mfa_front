// src/api/taxApi.ts
import axiosClient from './axiosClient';
import type { TaxRate, TaxRateCreate, TaxRateUpdate, TaxRateCurrent } from '../types/tax';

export const taxApi = {
  // Получить все налоговые ставки tenant
  getTaxRates: async (): Promise<TaxRate[]> => {
    const response = await axiosClient.get('/tax-rates');
    return response.data;
  },

  // Получить текущую активную ставку
  getCurrentTaxRate: async (targetDate?: string): Promise<TaxRateCurrent> => {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await axiosClient.get('/tax-rates/current', { params });
    return response.data;
  },

  // Получить ставку на конкретную дату
  getTaxRateByDate: async (date: string): Promise<TaxRate> => {
    const response = await axiosClient.get(`/tax-rates/date/${date}`);
    return response.data;
  },

  // Получить историю ставок за период
  getTaxRateHistory: async (dateFrom?: string, dateTo?: string): Promise<TaxRate[]> => {
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    
    const response = await axiosClient.get('/tax-rates/history', { params });
    return response.data;
  },

  // Получить ставку по ID
  getTaxRateById: async (id: number): Promise<TaxRate> => {
    const response = await axiosClient.get(`/tax-rates/${id}`);
    return response.data;
  },

  // Создать новую ставку
  createTaxRate: async (taxRate: TaxRateCreate): Promise<TaxRate> => {
    const response = await axiosClient.post('/tax-rates', taxRate);
    return response.data;
  },

  // Обновить ставку
  updateTaxRate: async (id: number, taxRate: TaxRateUpdate): Promise<TaxRate> => {
    const response = await axiosClient.put(`/tax-rates/${id}`, taxRate);
    return response.data;
  },

  // Удалить ставку
  deleteTaxRate: async (id: number): Promise<void> => {
    await axiosClient.delete(`/tax-rates/${id}`);
  },

  // Закрыть период ставки
  closeTaxRatePeriod: async (id: number, endDate: string): Promise<TaxRate> => {
    const response = await axiosClient.patch(`/tax-rates/${id}/close`, null, {
      params: { end_date: endDate }
    });
    return response.data;
  },
};