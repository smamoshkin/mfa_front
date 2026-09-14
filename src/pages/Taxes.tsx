// src/pages/Taxes.tsx
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import LoadingOverlay from '../components/LoadingOverlay';
import { taxApi } from '../api/taxApi';
import type { TaxRate, TaxRateFormData } from '../types/tax';
import toast from 'react-hot-toast';
import ClosePeriodModal from '../components/ClosePeriodModal';
import TaxRateModal from '../components/TaxRateModal';
import TaxRateDeleteModal from '../components/TaxRateDeleteModal';

export default function Taxes() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTaxRate, setCurrentTaxRate] = useState<TaxRate | null>(null);

  // Модалка создания/редактирования ставки
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);

  // Модалка удаления ставки (кастомное подтверждение вместо window.confirm)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRate, setDeletingRate] = useState<TaxRate | null>(null);

  // Состояния для модального окна закрытия периода
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);
  const [selectedRateInfo, setSelectedRateInfo] = useState<{
    startDate: string;
    taxRate: number;
  } | null>(null);

  // Загрузка данных
  useEffect(() => {
    loadTaxRates();
    loadCurrentTaxRate();
  }, []);

  const loadTaxRates = async () => {
    try {
      setLoading(true);
      const data = await taxApi.getTaxRates();
      setTaxRates(data);
    } catch (error) {
      console.error('Ошибка загрузки налоговых ставок:', error);
      toast.error('Не удалось загрузить налоговые ставки');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentTaxRate = async () => {
    try {
      const data = await taxApi.getCurrentTaxRate();
      // Находим полную запись в списке
      const allRates = await taxApi.getTaxRates();
      const current = allRates.find(rate =>
        rate.start_date === data.start_date &&
        rate.tax_rate === data.tax_rate
      );
      setCurrentTaxRate(current || null);
    } catch (error) {
      // Активной ставки нет (например, период закрыли) — важно обнулить,
      // иначе карточка продолжит показывать устаревшую ставку
      console.error('Ошибка загрузки текущей ставки:', error);
      setCurrentTaxRate(null);
    }
  };

  // Обработчики модалки создания/редактирования
  const handleEdit = (taxRate: TaxRate) => {
    setEditingRate(taxRate);
    setIsRateModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRate(null);
    setIsRateModalOpen(true);
  };

  const handleSaveRate = async (data: TaxRateFormData) => {
    if (editingRate) {
      await taxApi.updateTaxRate(editingRate.id, {
        ...data,
        end_date: data.end_date || null
      });
      toast.success('Ставка успешно обновлена');
    } else {
      await taxApi.createTaxRate({
        ...data,
        end_date: data.end_date || null
      });
      toast.success('Ставка успешно создана');
    }
    await loadTaxRates();
    await loadCurrentTaxRate();
  };

  const handleDelete = (taxRate: TaxRate) => {
    setDeletingRate(taxRate);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRate = async () => {
    if (!deletingRate) return;
    try {
      await taxApi.deleteTaxRate(deletingRate.id);
      toast.success('Ставка успешно удалена');
      await loadTaxRates();
      await loadCurrentTaxRate();
    } catch (error) {
      console.error('Ошибка удаления ставки:', error);
      toast.error('Не удалось удалить ставку');
      throw error;
    }
  };

  // Обновленная функция закрытия периода
  const handleClosePeriod = async (endDate: string) => {
    if (!selectedRateId) return;

    try {
      await taxApi.closeTaxRatePeriod(selectedRateId, endDate);
      toast.success('Период ставки закрыт');
      await loadTaxRates();
      await loadCurrentTaxRate();
    } catch (error: any) {
      console.error('Ошибка закрытия периода:', error);
      throw error; // Пробрасываем ошибку для обработки в модальном окне
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '∞ (бессрочно)';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Проверка, активна ли ставка сейчас
  const isRateActive = (rate: TaxRate) => {
    const today = new Date().toISOString().split('T')[0];
    const start = rate.start_date.split('T')[0];
    const end = rate.end_date ? rate.end_date.split('T')[0] : null;
    
    return start <= today && (!end || end >= today);
  };

    // Функция для открытия модального окна
    const openCloseModal = (id: number, startDate: string, taxRate: number) => {
        setSelectedRateId(id);
        setSelectedRateInfo({ startDate, taxRate });
        setCloseModalOpen(true);
    };

    // Закрытие модального окна
    const handleCloseModal = () => {
        setCloseModalOpen(false);
        setSelectedRateId(null);
        setSelectedRateInfo(null);
    };

  // Полноэкранная загрузка — только при самом первом заходе, дальше — оверлей
  if (loading && taxRates.length === 0) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-app-2">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LoadingOverlay show={loading} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-app">
                Налоговые ставки
              </h1>
              <p className="text-app-2 mt-2">
                Управление налоговыми ставками для расчета отчетности
              </p>
            </div>
            <button
              data-tour="taxes-add"
              onClick={handleCreate}
              className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-medium rounded-lg hover:from-primary-dark hover:to-primary transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Новая ставка
            </button>
          </div>
        </div>

        {/* Нет действующей ставки — период закрыли, ставки кончились или их ещё не создавали */}
        {!currentTaxRate && (
          <div data-tour="taxes-current" className="mb-8 bg-sand/40 border border-sand rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="p-3 bg-sand rounded-lg mr-4">
                <XCircle className="w-6 h-6 text-sand-ink" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-app">Нет действующей ставки</h3>
                <p className="text-app-2 text-sm mt-1">
                  Налог в отчётности рассчитываться не будет — создайте новую ставку
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Текущая ставка — единственное место, где она отображается */}
        {currentTaxRate && (
          <div data-tour="taxes-current" className="mb-8 bg-card rounded-xl shadow-sm border border-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="p-3 bg-mint rounded-lg mr-4">
                  <TrendingUp className="w-6 h-6 text-ink" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-app">Текущая ставка налога</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-3xl font-bold text-app mr-3">
                      {currentTaxRate.tax_rate}%
                    </span>
                    <span className="px-2 py-1 bg-mint text-ink text-sm font-medium rounded-full">
                      Активна
                    </span>
                  </div>
                  <p className="text-app-2 text-sm mt-2">
                    Действует с {formatDate(currentTaxRate.start_date)}
                    {currentTaxRate.end_date && ` по ${formatDate(currentTaxRate.end_date)}`}
                  </p>
                </div>
              </div>

              {/* Кнопки в стиле строк таблицы: белые, объёмные, с цветной тенью */}
              <div className="flex items-stretch gap-2">
                <button
                  onClick={() => handleEdit(currentTaxRate)}
                  className="px-3 py-2 min-h-[44px] bg-card text-blue-600 rounded-lg border border-blue-200/60 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                  title="Редактировать"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Редактировать</span>
                </button>

                {!currentTaxRate.end_date && (
                  <button
                    onClick={() => openCloseModal(currentTaxRate.id, currentTaxRate.start_date, currentTaxRate.tax_rate)}
                    className="px-3 py-2 min-h-[44px] bg-card text-orange-600 rounded-lg border border-orange-200/60 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                    title="Закрыть период"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">Закрыть период</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(currentTaxRate)}
                  className="px-3 py-2 min-h-[44px] bg-card text-red-600 rounded-lg border border-red-200/60 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Удалить</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Таблица ставок: только история — текущая ставка живёт в карточке выше */}
        <div data-tour="taxes-table" className="bg-card rounded-xl shadow-sm border border-card overflow-hidden">
          <div className="px-4 py-3 border-b border-card">
            <h2 className="text-base font-semibold text-app">История налоговых ставок</h2>
            <p className="text-app-muted text-xs mt-0.5">
              Завершённые и запланированные периоды. Действующая ставка — в карточке выше
            </p>
          </div>

          {taxRates.filter((rate) => rate.id !== currentTaxRate?.id).length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-app-muted mx-auto mb-4" />
              <p className="text-app-muted">
                {taxRates.length === 0
                  ? 'Ставок пока не было — создайте первую кнопкой «Новая ставка»'
                  : 'Истории пока нет — действующая ставка показана выше'}
              </p>
              <button
                onClick={handleCreate}
                className="mt-4 px-4 py-2 text-primary hover:bg-primary-soft font-medium rounded-lg transition"
              >
                Создать ещё ставку
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-card-2 border-b border-card">
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Ставка</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Период действия</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Статус</th>
                    <th className="py-2.5 px-4 text-left text-xs font-semibold text-app-2 uppercase tracking-wide">Создано</th>
                    <th className="py-2.5 px-4 text-right text-xs font-semibold text-app-2 uppercase tracking-wide">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card">
                  {taxRates.filter((rate) => rate.id !== currentTaxRate?.id).map((rate) => {
                    const isActive = isRateActive(rate);
                    return (
                      <tr key={rate.id} className="hover:bg-hover transition">
                        <td className="py-2 px-4">
                          <div className="flex items-center">
                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-mint' : 'bg-hover'}`}>
                              <TrendingUp className={`w-4 h-4 ${isActive ? 'text-ink' : 'text-app-2'}`} />
                            </div>
                            <span className="ml-3 text-base font-semibold text-app">
                              {rate.tax_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-app-muted mr-2" />
                            <div>
                              <div className="text-sm text-app">
                                с {formatDate(rate.start_date)}
                              </div>
                              <div className="text-xs text-app-muted">
                                по {formatDate(rate.end_date)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mint text-ink">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Активна
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-hover text-app-muted">
                              <XCircle className="w-3 h-3 mr-1" />
                              Не активна
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <div className="text-sm text-app">
                            {new Date(rate.created_at).toLocaleDateString('ru-RU')}
                          </div>
                          {rate.created_by && (
                            <div className="text-xs text-app-muted">
                              {rate.created_by}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {/* Кнопки в высоту строки: белые, объёмные, с цветной тенью */}
                          <div className="flex items-stretch justify-end gap-2">
                            <button
                              onClick={() => handleEdit(rate)}
                              className="px-3 py-2 min-h-[44px] bg-card text-blue-600 rounded-lg border border-blue-200/60 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                              title="Редактировать"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="text-xs font-medium hidden lg:inline">Редактировать</span>
                            </button>

                            {!rate.end_date && (
                              <button
                                onClick={() => openCloseModal(rate.id, rate.start_date, rate.tax_rate)}
                                className="px-3 py-2 min-h-[44px] bg-card text-orange-600 rounded-lg border border-orange-200/60 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                                title="Закрыть период"
                              >
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium hidden lg:inline">Закрыть период</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(rate)}
                              className="px-3 py-2 min-h-[44px] bg-card text-red-600 rounded-lg border border-red-200/60 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/40 hover:-translate-y-px active:translate-y-0 active:shadow-sm transition flex items-center gap-1.5"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-xs font-medium hidden lg:inline">Удалить</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Информационная панель */}
        <div data-tour="taxes-info" className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl shadow-sm border border-card p-6">
            <h3 className="text-lg font-semibold text-app mb-2">Как это работает</h3>
            <ul className="space-y-2 text-sm text-app-2">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Ставка используется для расчета налогов в отчетности</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Периоды не должны пересекаться</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Только одна ставка может быть активна в любой момент</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-xl shadow-sm border border-card p-6">
            <h3 className="text-lg font-semibold text-app mb-2">Статистика</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-app-muted">Всего ставок</p>
                <p className="text-2xl font-bold text-app">{taxRates.length}</p>
              </div>
              <div>
                <p className="text-sm text-app-muted">Активных ставок</p>
                <p className="text-2xl font-bold text-green-600">
                  {taxRates.filter(isRateActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl shadow-sm border border-card p-6">
            <h3 className="text-lg font-semibold text-app mb-2">Советы</h3>
            <p className="text-sm text-app-2">
              При изменении режима налогооблажения для вашего бизнеса, создайте новую ставку с новой датой начала.
              Старую ставку необходимо закрыть датой, предшествующей дате начала действия новой ставки, что бы не возникало пересечения периодов действия ставок. Для этого воспользуйтесь кнопкой "Закрыть период" в колонке "Действия".
            </p>
          </div>
        </div>
      </div>

      {/* Подвал */}
      <footer className="bg-card border-t border-card py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-app-muted text-sm">
              © {new Date().getFullYear()} FAAPP. Налоговые ставки обновляются вручную.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-app-muted hover:text-app-2 text-sm">
                Документация
              </a>
              <a href="#" className="text-app-muted hover:text-app-2 text-sm">
                Поддержка
              </a>
              <a href="#" className="text-app-muted hover:text-app-2 text-sm">
                Конфиденциальность
              </a>
            </div>
          </div>
        </div>
      </footer>
      {closeModalOpen && selectedRateInfo && (
        <ClosePeriodModal
          isOpen={closeModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleClosePeriod}
          currentStartDate={selectedRateInfo.startDate}
          taxRate={selectedRateInfo.taxRate}
        />
      )}

      {/* Модалка создания/редактирования ставки — единообразно с закрытием периода */}
      <TaxRateModal
        isOpen={isRateModalOpen}
        onClose={() => {
          setIsRateModalOpen(false);
          setEditingRate(null);
        }}
        rate={editingRate}
        onSave={handleSaveRate}
      />

      {/* Модалка подтверждения удаления ставки */}
      <TaxRateDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRate(null);
        }}
        rate={deletingRate}
        onDelete={confirmDeleteRate}
      />
    </div>
  );

}