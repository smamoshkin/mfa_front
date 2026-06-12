// src/pages/Taxes.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, TrendingUp, CheckCircle, XCircle, BarChart3, Package, User, Activity, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { taxApi } from '../api/taxApi';
import type { TaxRate, TaxRateFormData } from '../types/tax';
import toast from 'react-hot-toast';
import ClosePeriodModal from '../components/ClosePeriodModal';

export default function Taxes() {
  const { user, logout } = useAuthStore();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTaxRate, setCurrentTaxRate] = useState<TaxRate | null>(null);
  
  // Состояния для формы
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TaxRateFormData>({
    tax_rate: 20,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    created_by: ''
  });

  // Состояния для модального окна
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
      console.error('Ошибка загрузки текущей ставки:', error);
    }
  };

  // Обработчики формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tax_rate' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Редактирование
        await taxApi.updateTaxRate(editingId, {
          ...formData,
          end_date: formData.end_date || null
        });
        toast.success('Ставка успешно обновлена');
      } else {
        // Создание
        await taxApi.createTaxRate({
          ...formData,
          end_date: formData.end_date || null
        });
        toast.success('Ставка успешно создана');
      }
      
      // Сброс формы и обновление данных
      resetForm();
      await loadTaxRates();
      await loadCurrentTaxRate();
    } catch (error: any) {
      console.error('Ошибка сохранения ставки:', error);
      toast.error(error.response?.data?.detail || 'Ошибка сохранения ставки');
    }
  };

  const handleEdit = (taxRate: TaxRate) => {
    setEditingId(taxRate.id);
    setFormData({
      tax_rate: taxRate.tax_rate,
      start_date: taxRate.start_date.split('T')[0],
      end_date: taxRate.end_date ? taxRate.end_date.split('T')[0] : '',
      created_by: taxRate.created_by || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту налоговую ставку?')) {
      return;
    }

    try {
      await taxApi.deleteTaxRate(id);
      toast.success('Ставка успешно удалена');
      await loadTaxRates();
      await loadCurrentTaxRate();
    } catch (error) {
      console.error('Ошибка удаления ставки:', error);
      toast.error('Не удалось удалить ставку');
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

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      tax_rate: 20,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      created_by: ''
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Шапка с навигацией */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">WB Analytics</span>
              </div>
              
              <nav className="ml-10 flex space-x-8">
                <Link 
                  to="/dashboard" 
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300 transition"
                >
                  Дашборд
                </Link>
                <Link 
                  to="/products" 
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300 transition"
                >
                  Товары
                </Link>
                <Link 
                  to="/analytics" 
                  className="text-gray-500 hover:text-gray-700 font-medium px-1 pb-1 hover:border-b-2 hover:border-gray-300 transition"
                >
                  Аналитика
                </Link>
                <Link 
                  to="/taxes" 
                  className="text-blue-600 font-medium border-b-2 border-blue-600 px-1 pb-1 transition"
                >
                  Налоговые ставки
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <Link to="/profile" className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-700">{user?.name || user?.email}</span>
                </Link>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Налоговые ставки
              </h1>
              <p className="text-gray-600 mt-2">
                Управление налоговыми ставками для расчета отчетности
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              {showForm ? 'Отмена' : 'Новая ставка'}
            </button>
          </div>
        </div>

        {/* Текущая ставка */}
        {currentTaxRate && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Текущая ставка налога</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-3xl font-bold text-gray-900 mr-3">
                      {currentTaxRate.tax_rate}%
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Активна
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    Действует с {formatDate(currentTaxRate.start_date)}
                    {currentTaxRate.end_date && ` по ${formatDate(currentTaxRate.end_date)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(currentTaxRate)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Форма создания/редактирования */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Редактировать ставку' : 'Новая налоговая ставка'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ставка налога (%)
                  </label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата начала *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={formData.start_date}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Оставьте пустым для бессрочного действия"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Оставьте пустым для бессрочного действия
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Кто внес изменение (опционально)
                </label>
                <input
                  type="text"
                  name="created_by"
                  value={formData.created_by}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Имя пользователя"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                >
                  {editingId ? 'Сохранить изменения' : 'Создать ставку'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Таблица ставок */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">История налоговых ставок</h2>
            <p className="text-gray-600 text-sm mt-1">
              Все установленные налоговые ставки в хронологическом порядке
            </p>
          </div>
          
          {taxRates.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Нет налоговых ставок</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition"
              >
                Создать первую ставку
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ставка
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Период действия
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Создано
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {taxRates.map((rate) => {
                    const isActive = isRateActive(rate);
                    return (
                      <tr key={rate.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <TrendingUp className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                            </div>
                            <div className="ml-4">
                              <span className="text-lg font-semibold text-gray-900">
                                {rate.tax_rate}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">
                                с {formatDate(rate.start_date)}
                              </div>
                              <div className="text-sm text-gray-500">
                                по {formatDate(rate.end_date)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Активна
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Не активна
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {new Date(rate.created_at).toLocaleDateString('ru-RU')}
                          </div>
                          {rate.created_by && (
                            <div className="text-xs text-gray-500">
                              {rate.created_by}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                            <div className="flex space-x-2">
                                <button
                                onClick={() => handleEdit(rate)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Редактировать"
                                >
                                <Edit className="w-4 h-4" />
                                </button>
                                
                                {!rate.end_date && (
                                <button
                                    onClick={() => openCloseModal(rate.id, rate.start_date, rate.tax_rate)}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                    title="Закрыть период"
                                >
                                    <Calendar className="w-4 h-4" />
                                </button>
                                )}
                                
                                <button
                                onClick={() => handleDelete(rate.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Удалить"
                                >
                                <Trash2 className="w-4 h-4" />
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Как это работает</h3>
            <ul className="space-y-2 text-sm text-gray-600">
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
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Статистика</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Всего ставок</p>
                <p className="text-2xl font-bold text-gray-900">{taxRates.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Активных ставок</p>
                <p className="text-2xl font-bold text-green-600">
                  {taxRates.filter(isRateActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Советы</h3>
            <p className="text-sm text-gray-600">
              При изменении режима налогооблажения для вашего бизнеса, создайте новую ставку с новой датой начала.
              Старую ставку необходимо закрыть датой, предшествующей дате начала действия новой ставки, что бы не возникало пересечения периодов действия ставок. Для этого воспользуйтесь кнопкой "Закрыть период" в колонке "Действия".
            </p>
          </div>
        </div>
      </main>

      {/* Подвал */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} WB Analytics Dashboard. Налоговые ставки обновляются вручную.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Документация
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                Поддержка
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
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
    </div>
  );

}