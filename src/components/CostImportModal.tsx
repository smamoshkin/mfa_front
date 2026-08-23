import { useState } from 'react';
import { X, FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, RefreshCw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/productsApi';
import type { CostImportReport, CostImportRowReport } from '../types/api';

interface CostImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

const ACTION_STYLES: Record<string, { label: string; badge: string; row: string }> = {
  create: {
    label: 'Новая запись',
    badge: 'bg-green-100 text-green-800',
    row: '',
  },
  update: {
    label: 'Обновит существующую',
    badge: 'bg-yellow-100 text-yellow-800',
    row: 'bg-yellow-50/50',
  },
  error: {
    label: 'Ошибка',
    badge: 'bg-red-100 text-red-800',
    row: 'bg-red-50/50',
  },
};

export default function CostImportModal({ isOpen, onClose, onImported }: CostImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [report, setReport] = useState<CostImportReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setSelectedFile(null);
    setReport(null);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await productsApi.getCostTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product_costs_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка скачивания шаблона');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setReport(null); // новый файл — старый предпросмотр неактуален
    setError('');
  };

  // Шаг 1 → 2: загрузить файл и получить предпросмотр (dry_run)
  const handlePreview = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await productsApi.importCosts(selectedFile, true);
      setReport(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка разбора файла');
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 2 → применение (dry_run=false)
  const handleImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setError('');
    try {
      const result = await productsApi.importCosts(selectedFile, false);
      const s = result.summary;
      toast.success(
        `Импорт завершён: новых ${s.created}, обновлено ${s.updated}` +
        (s.errors > 0 ? `, пропущено с ошибками ${s.errors}` : '')
      );
      reset();
      onImported?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка импорта');
    } finally {
      setIsImporting(false);
    }
  };

  const validRowsCount = report
    ? report.summary.created + report.summary.updated
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-card sticky top-0 bg-card z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-app">Себестоимости из файла</h3>
              <p className="text-sm text-app-muted">
                Массовая загрузка себестоимостей (xlsx / csv: sku, cost, start_date)
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-hover rounded-lg transition">
            <X className="w-5 h-5 text-app-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {/* Шаг 1: шаблон + выбор файла */}
          {!report && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">Как это работает</p>
                <ol className="list-decimal ml-5 space-y-0.5">
                  <li>Скачайте шаблон — в нём уже все ваши товары, названия и текущие себестоимости.</li>
                  <li>Измените себестоимости и/или даты начала действия, добавьте строки с историей (несколько строк на один sku).</li>
                  <li>Загрузите файл — увидите предпросмотр, затем подтвердите импорт.</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex-1 py-3 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Скачать шаблон с текущими данными
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-2 mb-2">
                  Файл с себестоимостями (.xlsx / .csv)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <button
                onClick={handlePreview}
                disabled={!selectedFile || isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-xl hover:from-primary-dark hover:to-primary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Проверка файла...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Загрузить и проверить
                  </>
                )}
              </button>
            </>
          )}

          {/* Шаг 2: предпросмотр */}
          {report && (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap text-sm">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                    Новых: {report.summary.created}
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                    Обновлений: {report.summary.updated}
                  </span>
                  <span className="px-3 py-1 bg-hover text-app rounded-full font-medium">
                    Закроется периодов: {report.summary.closed_periods}
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                    Ошибок: {report.summary.errors}
                  </span>
                </div>
                <button
                  onClick={() => { setReport(null); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-app-2 hover:text-app hover:bg-hover rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Выбрать другой файл
                </button>
              </div>

              <div className="border border-card rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-card-2 border-b border-card sticky top-0">
                    <tr>
                      <th className="py-3 px-3 text-left font-semibold text-app">Строка</th>
                      <th className="py-3 px-3 text-left font-semibold text-app">SKU</th>
                      <th className="py-3 px-3 text-left font-semibold text-app">Товар</th>
                      <th className="py-3 px-3 text-right font-semibold text-app">Себест., ₽</th>
                      <th className="py-3 px-3 text-left font-semibold text-app">Дата начала</th>
                      <th className="py-3 px-3 text-left font-semibold text-app">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.rows.map((row: CostImportRowReport) => {
                      const style = ACTION_STYLES[row.action] || ACTION_STYLES.error;
                      return (
                        <tr key={row.row_num} className={style.row}>
                          <td className="py-2.5 px-3 text-app-muted">{row.row_num}</td>
                          <td className="py-2.5 px-3 font-mono text-app">{row.sku || '—'}</td>
                          <td className="py-2.5 px-3 text-app-2 max-w-[220px] truncate" title={row.product_name || ''}>
                            {row.product_name || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-app">
                            {row.cost != null ? Number(row.cost).toFixed(2) : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-app">{row.start_date || '—'}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${style.badge}`}>
                                {style.label}
                              </span>
                              {row.message && (
                                <span className="text-xs text-app-muted truncate" title={row.message}>
                                  {row.message}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 border border-input text-app-2 font-medium rounded-xl hover:bg-hover transition"
                  disabled={isImporting}
                >
                  Отмена
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRowsCount === 0 || isImporting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Импорт...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Импортировать ({validRowsCount})
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
