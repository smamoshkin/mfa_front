// src/hooks/useTaxRate.ts
import { useState, useEffect } from 'react';
import { taxApi } from '../api/taxApi';
import type { TaxRate } from '../types/tax';

/**
 * Хук для работы с налоговыми ставками
 * @param date - Дата для получения ставки (опционально)
 * @returns Объект с данными ставки, состоянием загрузки и ошибкой
 */
export function useTaxRate(date?: string) {
  const [taxRate, setTaxRate] = useState<TaxRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTaxRate = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await taxApi.getCurrentTaxRate(date);
        // Получаем полную информацию о ставке
        const rates = await taxApi.getTaxRates();
        const fullRate = rates.find(rate => 
          rate.start_date === data.start_date && 
          rate.tax_rate === data.tax_rate
        );
        setTaxRate(fullRate || null);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки налоговой ставки');
        console.error('Error loading tax rate:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTaxRate();
  }, [date]);

  return { taxRate, loading, error };
}