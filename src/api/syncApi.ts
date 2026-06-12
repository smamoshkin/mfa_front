import axiosClient from './axiosClient';

export interface SyncTask {
  id: string;
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE';
  result?: any;
  error?: string;
  date_done?: string;
}

export const syncApi = {
  // Запуск синхронизации
  startSync: async (tenantId: string): Promise<{ task_id: string }> => {
    const response = await axiosClient.post(`/sync/wb/${tenantId}`);
    return response.data;
  },

  // Получение статуса задачи
  getTaskStatus: async (taskId: string): Promise<SyncTask> => {
    const response = await axiosClient.get(`/sync/task/${taskId}/status`);
    return response.data;
  },

  // Получение истории синхронизаций
  getSyncHistory: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<SyncTask[]> => {
    const response = await axiosClient.get('/sync/history', { params });
    return response.data;
  },
};