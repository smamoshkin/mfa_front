import axiosClient from './axiosClient';
import type { Product, ProductCost, CurrentCost, CreateProductCostRequest, CostImportReport } from '../types/api';

export const productsApi = {
  // Получение списка товаров
  getProducts: async (params?: {
    category?: string;
    search?: string;
    active?: boolean;
  }): Promise<Product[]> => {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  },

  // Получение товара по ID
  getProductById: async (id: number): Promise<Product> => {
    // console.log(id)
    const response = await axiosClient.get(`/products/${id}`);
    // console.log(response.data)
    return response.data;
  },

  // Получение товара по SKU
  getProductBySku: async (sku: string): Promise<Product> => {
    const response = await axiosClient.get(`/products/sku/${sku}`);
    return response.data;
  },

  // Создание товара
  createProduct: async (data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>): Promise<Product> => {
    const response = await axiosClient.post('/products', data);
    return response.data;
  },

  // Обновление товара
  updateProduct: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await axiosClient.put(`/products/${id}`, data);
    return response.data;
  },

  // Удаление товара
  deleteProduct: async (id: number): Promise<void> => {
    await axiosClient.delete(`/products/${id}`);
  },

  // Получение истории себестоимости товара
  getProductCosts: async (productId: number): Promise<ProductCost[]> => {
    const response = await axiosClient.get(`/product-costs/product/${productId}`);
    return response.data;
  },

  // Получение текущей себестоимости товара
  getCurrentCost: async (productId: number): Promise<CurrentCost> => {
    const response = await axiosClient.get(`/product-costs/product/${productId}/current`);
    return response.data;
  },

  // Создание себестоимости
  createProductCost: async (data: CreateProductCostRequest): Promise<ProductCost> => {
    const response = await axiosClient.post('/product-costs', data);
    return response.data;
  },

  // Обновление себестоимости
  updateProductCost: async (id: number, data: Partial<CreateProductCostRequest>): Promise<ProductCost> => {
    const response = await axiosClient.put(`/product-costs/${id}`, data);
    return response.data;
  },

  // Удаление себестоимости
  deleteProductCost: async (id: number): Promise<void> => {
    await axiosClient.delete(`/product-costs/${id}`);
  },

  // Скачать xlsx-шаблон себестоимостей с текущими данными (раундтрип)
  getCostTemplate: async (): Promise<Blob> => {
    const response = await axiosClient.get('/product-costs/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Импорт себестоимостей из файла.
  // dryRun=true — предпросмотр (отчёт без записи), dryRun=false — применение
  importCosts: async (file: File, dryRun: boolean): Promise<CostImportReport> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dry_run', String(dryRun));
    const response = await axiosClient.post('/product-costs/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};