// src/api/dashboardApi.ts
import axiosClient from './axiosClient';
import type { 
  DashboardMetrics, 
  SalesData, 
  TopProduct,
  DashboardResponse 
} from '../types/dashboard';

export const dashboardApi = {
  // Получение данных дашборда
  getDashboardData: async (): Promise<DashboardResponse> => {
    try {
    //   const response = await axiosClient.get('/dashboard');
    //   return response.data;
    return {
        "metrics": {
          "sales": 4247,
          "revenue": 1330724.74,
          "products": 59,
          "profitability": 34.24822698313499,
          "sales_change": -34.6,
          "revenue_change": -34.2,
          "products_change": 0,
          "profitability_change": 220.4
        },
        "salesChart": [
          {
            "date": "2026-01-02",
            "sales": 55,
            "revenue": 20947.52
          },
          {
            "date": "2026-01-03",
            "sales": 67,
            "revenue": 23717.89
          },
          {
            "date": "2026-01-04",
            "sales": 114,
            "revenue": 37854.85
          },
          {
            "date": "2026-01-05",
            "sales": 109,
            "revenue": 36930.35
          },
          {
            "date": "2026-01-06",
            "sales": 153,
            "revenue": 52017.16
          },
          {
            "date": "2026-01-07",
            "sales": 110,
            "revenue": 36632.37
          },
          {
            "date": "2026-01-08",
            "sales": 113,
            "revenue": 39456.52
          },
          {
            "date": "2026-01-09",
            "sales": 128,
            "revenue": 43718.19
          },
          {
            "date": "2026-01-10",
            "sales": 174,
            "revenue": 57662.13
          },
          {
            "date": "2026-01-11",
            "sales": 184,
            "revenue": 61976.22
          },
          {
            "date": "2026-01-12",
            "sales": 210,
            "revenue": 71414.71
          },
          {
            "date": "2026-01-13",
            "sales": 202,
            "revenue": 64854.08
          },
          {
            "date": "2026-01-14",
            "sales": 181,
            "revenue": 57036.88
          },
          {
            "date": "2026-01-15",
            "sales": 196,
            "revenue": 60899.44
          },
          {
            "date": "2026-01-16",
            "sales": 227,
            "revenue": 68381.05
          },
          {
            "date": "2026-01-17",
            "sales": 229,
            "revenue": 69592.92
          },
          {
            "date": "2026-01-18",
            "sales": 246,
            "revenue": 73657.86
          },
          {
            "date": "2026-01-19",
            "sales": 215,
            "revenue": 62636.8
          },
          {
            "date": "2026-01-20",
            "sales": 214,
            "revenue": 63619.39
          },
          {
            "date": "2026-01-21",
            "sales": 195,
            "revenue": 57531.84
          },
          {
            "date": "2026-01-22",
            "sales": 224,
            "revenue": 64488.59
          },
          {
            "date": "2026-01-23",
            "sales": 219,
            "revenue": 63492.78
          },
          {
            "date": "2026-01-24",
            "sales": 233,
            "revenue": 67706.53
          },
          {
            "date": "2026-01-25",
            "sales": 249,
            "revenue": 74498.67
          }
        ],
        "topProducts": [
          {
            "id": 1,
            "name": "Товар 95951145",
            "sku": "95951145",
            "sales": 858,
            "revenue": 268163.29,
            "profitability": 72.11732064444764,
            "image_url": null,
            "category": null
          },
          {
            "id": 2,
            "name": "Товар 19031427",
            "sku": "19031427",
            "sales": 679,
            "revenue": 215972.93,
            "profitability": 74.9117006932304,
            "image_url": null,
            "category": null
          },
          {
            "id": 3,
            "name": "Карточки для фотосессии новорожденных",
            "sku": "10151059",
            "sales": 553,
            "revenue": 175604.39,
            "profitability": 64.05293324386709,
            "image_url": "https://basket-15.wbbasket.ru/vol2259/part225940/225940771/images/square/1.webp",
            "category": null
          },
          {
            "id": 4,
            "name": "Товар 1062247",
            "sku": "1062247",
            "sales": 425,
            "revenue": 160462.75,
            "profitability": 56.12449462569973,
            "image_url": null,
            "category": null
          },
          {
            "id": 5,
            "name": "Товар kf-1-1",
            "sku": "kf-1-1",
            "sales": 305,
            "revenue": 84643.32,
            "profitability": 59.75786110469202,
            "image_url": null,
            "category": null
          }
        ],
        "recentActivity": [
          {
            "time": "2026-01-31T16:05:04.986429",
            "action": "Продажа товара 10151059",
            "status": "success",
            "details": "Количество: 1"
          },
          {
            "time": "2026-01-31T16:05:04.986428",
            "action": "Продажа товара 95951145",
            "status": "success",
            "details": "Количество: 1"
          },
          {
            "time": "2026-01-31T16:05:04.986428",
            "action": "Продажа товара 95951052",
            "status": "success",
            "details": "Количество: 1"
          },
          {
            "time": "2026-01-23T17:33:51.791764",
            "action": "Обновлена себестоимость",
            "status": "info",
            "details": "Товар ID: 64"
          },
          {
            "time": "2026-01-23T17:33:06.424104",
            "action": "Обновлена себестоимость",
            "status": "info",
            "details": "Товар ID: 63"
          }
        ],
        "lastSync": "2026-01-31T16:05:04.986429"
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Получение метрик
  getMetrics: async (): Promise<DashboardMetrics> => {
    try {
    //   const response = await axiosClient.get('/dashboard/metrics');
    //   return response.data;
    return {
        "sales": 4247,
        "revenue": 1330724.74,
        "products": 59,
        "profitability": 34.24822698313499,
        "sales_change": -34.6,
        "revenue_change": -34.2,
        "products_change": 0,
        "profitability_change": 220.4
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  },

  // Получение данных для графика продаж
  getSalesChartData: async (period: '7days' | '30days' | '90days' = '30days'): Promise<SalesData[]> => {
    try {
    //   const response = await axiosClient.get('/dashboard/sales-chart', {
    //     params: { period }
    //   });
    //   return response.data;
        return [
            {
              "date": "2026-01-02",
              "sales": 55,
              "revenue": 20947.52
            },
            {
              "date": "2026-01-03",
              "sales": 67,
              "revenue": 23717.89
            },
            {
              "date": "2026-01-04",
              "sales": 114,
              "revenue": 37854.85
            },
            {
              "date": "2026-01-05",
              "sales": 109,
              "revenue": 36930.35
            },
            {
              "date": "2026-01-06",
              "sales": 153,
              "revenue": 52017.16
            },
            {
              "date": "2026-01-07",
              "sales": 110,
              "revenue": 36632.37
            },
            {
              "date": "2026-01-08",
              "sales": 113,
              "revenue": 39456.52
            },
            {
              "date": "2026-01-09",
              "sales": 128,
              "revenue": 43718.19
            },
            {
              "date": "2026-01-10",
              "sales": 174,
              "revenue": 57662.13
            },
            {
              "date": "2026-01-11",
              "sales": 184,
              "revenue": 61976.22
            },
            {
              "date": "2026-01-12",
              "sales": 210,
              "revenue": 71414.71
            },
            {
              "date": "2026-01-13",
              "sales": 202,
              "revenue": 64854.08
            },
            {
              "date": "2026-01-14",
              "sales": 181,
              "revenue": 57036.88
            },
            {
              "date": "2026-01-15",
              "sales": 196,
              "revenue": 60899.44
            },
            {
              "date": "2026-01-16",
              "sales": 227,
              "revenue": 68381.05
            },
            {
              "date": "2026-01-17",
              "sales": 229,
              "revenue": 69592.92
            },
            {
              "date": "2026-01-18",
              "sales": 246,
              "revenue": 73657.86
            },
            {
              "date": "2026-01-19",
              "sales": 215,
              "revenue": 62636.8
            },
            {
              "date": "2026-01-20",
              "sales": 214,
              "revenue": 63619.39
            },
            {
              "date": "2026-01-21",
              "sales": 195,
              "revenue": 57531.84
            },
            {
              "date": "2026-01-22",
              "sales": 224,
              "revenue": 64488.59
            },
            {
              "date": "2026-01-23",
              "sales": 219,
              "revenue": 63492.78
            },
            {
              "date": "2026-01-24",
              "sales": 233,
              "revenue": 67706.53
            },
            {
              "date": "2026-01-25",
              "sales": 249,
              "revenue": 74498.67
            }
          ];
    } catch (error) {
      console.error('Error fetching sales chart data:', error);
      throw error;
    }
  },

  // Получение топ товаров
  getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
    try {
    //   const response = await axiosClient.get('/dashboard/top-products', {
    //     params: { limit }
    //   });
    //   return response.data;
    return [
        {
          "id": 1,
          "name": "Товар 95951145",
          "sku": "95951145",
          "sales": 858,
          "revenue": 268163.29,
          "profitability": 72.11732064444764,
          "image_url": null,
          "category": null
        },
        {
          "id": 2,
          "name": "Товар 19031427",
          "sku": "19031427",
          "sales": 679,
          "revenue": 215972.93,
          "profitability": 74.9117006932304,
          "image_url": null,
          "category": null
        },
        {
          "id": 3,
          "name": "Карточки для фотосессии новорожденных",
          "sku": "10151059",
          "sales": 553,
          "revenue": 175604.39,
          "profitability": 64.05293324386709,
          "image_url": "https://basket-15.wbbasket.ru/vol2259/part225940/225940771/images/square/1.webp",
          "category": null
        },
        {
          "id": 4,
          "name": "Товар 1062247",
          "sku": "1062247",
          "sales": 425,
          "revenue": 160462.75,
          "profitability": 56.12449462569973,
          "image_url": null,
          "category": null
        },
        {
          "id": 5,
          "name": "Товар kf-1-1",
          "sku": "kf-1-1",
          "sales": 305,
          "revenue": 84643.32,
          "profitability": 59.75786110469202,
          "image_url": null,
          "category": null
        }
      ];
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  },

  // Запуск синхронизации
  startSync: async (): Promise<{ success: boolean; message: string; lastSync: string }> => {
    try {
    //   const response = await axiosClient.post('/dashboard/sync');
    //   return response.data;
      const response = await axiosClient.post('sync/wb/')
    return '{}'
    } catch (error) {
      console.error('Error starting sync:', error);
      throw error;
    }
  },

  // Получение последней активности
  getRecentActivity: async (): Promise<Array<{
    time: string;
    action: string;
    status: 'success' | 'info' | 'warning' | 'error';
  }>> => {
    try {
    //   const response = await axiosClient.get('/dashboard/recent-activity');
    //   return response.data;
    return [
        {
          "time": "2026-01-31T16:05:04.986429",
          "action": "Продажа товара 10151059",
          "status": "success",
          "details": "Количество: 1"
        },
        {
          "time": "2026-01-31T16:05:04.986428",
          "action": "Продажа товара 95951145",
          "status": "success",
          "details": "Количество: 1"
        },
        {
          "time": "2026-01-31T16:05:04.986428",
          "action": "Продажа товара 95951052",
          "status": "success",
          "details": "Количество: 1"
        },
        {
          "time": "2026-01-23T17:33:51.791764",
          "action": "Обновлена себестоимость",
          "status": "info",
          "details": "Товар ID: 64"
        },
        {
          "time": "2026-01-23T17:33:06.424104",
          "action": "Обновлена себестоимость",
          "status": "info",
          "details": "Товар ID: 63"
        }
      ];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }
};