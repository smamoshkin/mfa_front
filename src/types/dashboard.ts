// src/types/dashboard.ts
export interface DashboardMetrics {
    sales: number;
    revenue: number;
    products: number;
    profitability: number;
    sales_change?: number;
    revenue_change?: number;
    products_change?: number;
    profitability_change?: number;
  }
  
  export interface SalesData {
    date: string;
    sales: number;
    revenue: number;
  }
  
  export interface TopProduct {
    id: number;
    name: string;
    sku?: string;
    sales: number;
    revenue: number;
    profitability: number;
    image_url?: string;
    category?: string;
  }
  
  export interface DashboardResponse {
    metrics: DashboardMetrics;
    salesChart: SalesData[];
    topProducts: TopProduct[];
    recentActivity: ActivityItem[];
    lastSync: string;
  }
  
  export interface ActivityItem {
    time: string;
    action: string;
    status: 'success' | 'info' | 'warning' | 'error';
    details?: string;
  }
  
  export interface SyncStatus {
    isSyncing: boolean;
    progress?: number;
    status?: string;
    lastSync?: string;
  }