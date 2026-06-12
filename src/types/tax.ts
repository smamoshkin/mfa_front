// src/types/tax.ts
export interface TaxRate {
    id: number;
    tenant_id: number;
    tax_rate: number; // в процентах, например 20.00
    start_date: string; // ISO дата
    end_date: string | null;
    created_at: string;
    created_by: string | null;
  }
  
  export interface TaxRateCreate {
    tax_rate: number;
    start_date: string;
    end_date?: string | null;
    created_by?: string | null;
  }
  
  export interface TaxRateUpdate {
    tax_rate?: number;
    start_date?: string;
    end_date?: string | null;
    created_by?: string | null;
  }
  
  export interface TaxRateCurrent {
    tax_rate: number;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
  }
  
  export interface TaxRateFormData {
    tax_rate: number;
    start_date: string;
    end_date?: string;
    created_by?: string;
  }