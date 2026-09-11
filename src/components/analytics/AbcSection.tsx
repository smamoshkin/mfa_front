// Секция «ABC-анализ» страницы «Аналитика»: таблица товаров с категориями
// A/B/C по марже и оборачиваемости. Сортировка и поколоночные фильтры —
// локальные для секции. Товары приходят из контейнера (уже отфильтрованные
// общими фильтрами периода).
import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { RentabilityResponse } from '../../types/analytics';
import type { AnalyticsSectionContext } from '../../pages/Analytics';

type AbcCategory = 'A' | 'B' | 'C';

const ABC_RANK: Record<AbcCategory, number> = { A: 0, B: 1, C: 2 };

// ABC по вкладу в общую маржу: A — первые 80% накопленной маржи, B — следующие 15%, C — остальное
function getMarginCategory(cumulativeSharePercent: number): AbcCategory {
  if (cumulativeSharePercent <= 80) return 'A';
  if (cumulativeSharePercent <= 95) return 'B';
  return 'C';
}

function getTurnoverCategory(turnoverDays: number): AbcCategory {
  if (turnoverDays <= 0) return 'C';
  if (turnoverDays <= 30) return 'A';
  if (turnoverDays <= 60) return 'B';
  return 'C';
}

// Матрица маржа × оборачиваемость: обе оси сильные — A, обе слабые — C, смешанные — B
function getAbcCategory(marginCategory: AbcCategory, turnoverCategory: AbcCategory): AbcCategory {
  const rank = ABC_RANK[marginCategory] + ABC_RANK[turnoverCategory];
  if (rank <= 1) return 'A';
  if (rank === 2) return 'B';
  return 'C';
}

function withAbcCategories(products: RentabilityResponse['products']) {
  const sorted = [...products].sort((a, b) => b.margin - a.margin);
  const totalMargin = sorted.reduce((sum, p) => sum + p.margin, 0);
  let cumulative = 0;

  return sorted.map((product) => {
    cumulative += product.margin;
    const marginShare = totalMargin !== 0 ? (cumulative / totalMargin) * 100 : 100;
    const marginCategory = getMarginCategory(marginShare);
    const turnoverDays = product.turnover_days;
    const turnoverCategory = getTurnoverCategory(turnoverDays);

    return {
      product,
      turnoverDays,
      marginCategory,
      turnoverCategory,
      abcCategory: getAbcCategory(marginCategory, turnoverCategory),
    };
  });
}

const ABC_BADGE_STYLES: Record<AbcCategory, string> = {
  A: 'bg-mint text-ink',
  B: 'bg-sand text-sand-ink',
  C: 'bg-red-100 text-red-700',
};

type AbcRow = ReturnType<typeof withAbcCategories>[number];
type StatsColumnKey = 'sku' | 'margin' | 'margin_percent' | 'turnover' | 'marginCategory' | 'turnoverCategory' | 'abcCategory';

const STATS_COLUMNS: { key: StatsColumnKey; label: string; type: 'text' | 'category' }[] = [
  { key: 'sku', label: 'Артикул', type: 'text' },
  { key: 'margin', label: 'Маржа', type: 'text' },
  { key: 'margin_percent', label: 'Маржинальность', type: 'text' },
  { key: 'turnover', label: 'Оборачиваемость', type: 'text' },
  { key: 'marginCategory', label: 'Категория (маржа)', type: 'category' },
  { key: 'turnoverCategory', label: 'Категория (оборачиваемость)', type: 'category' },
  { key: 'abcCategory', label: 'Категория (общая)', type: 'category' },
];

function getStatsColumnValue(row: AbcRow, key: StatsColumnKey): string | number {
  switch (key) {
    case 'sku': return row.product.sku;
    case 'margin': return row.product.margin;
    case 'margin_percent': return row.product.margin_percent;
    case 'turnover': return row.turnoverDays;
    case 'marginCategory': return row.marginCategory;
    case 'turnoverCategory': return row.turnoverCategory;
    case 'abcCategory': return row.abcCategory;
  }
}

function matchesStatsFilter(row: AbcRow, key: StatsColumnKey, filterValue: string): boolean {
  if (!filterValue.trim()) return true;
  const value = getStatsColumnValue(row, key);
  if (key === 'marginCategory' || key === 'turnoverCategory' || key === 'abcCategory') {
    return value === filterValue;
  }
  return String(value).toLowerCase().includes(filterValue.trim().toLowerCase());
}

export default function AbcSection() {
  const { filteredProducts: products } = useOutletContext<AnalyticsSectionContext>();

  const [statsSortKey, setStatsSortKey] = useState<StatsColumnKey>('margin');
  const [statsSortDirection, setStatsSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statsColumnFilters, setStatsColumnFilters] = useState<Record<StatsColumnKey, string>>({
    sku: '',
    margin: '',
    margin_percent: '',
    turnover: '',
    marginCategory: '',
    turnoverCategory: '',
    abcCategory: '',
  });

  const handleStatsSort = (key: StatsColumnKey) => {
    if (statsSortKey === key) {
      setStatsSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStatsSortKey(key);
      setStatsSortDirection('asc');
    }
  };

  const handleStatsFilterChange = (key: StatsColumnKey, value: string) => {
    setStatsColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const statsRows = useMemo(() => {
    const rows = withAbcCategories(products).filter((row) =>
      STATS_COLUMNS.every((column) => matchesStatsFilter(row, column.key, statsColumnFilters[column.key]))
    );

    return rows.sort((a, b) => {
      const va = getStatsColumnValue(a, statsSortKey);
      const vb = getStatsColumnValue(b, statsSortKey);
      const compared = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      return statsSortDirection === 'asc' ? compared : -compared;
    });
  }, [products, statsColumnFilters, statsSortKey, statsSortDirection]);

  return (
    <>
      {/* Товары: маржа и ABC-категория */}
      <div data-tour="stats-table" className="bg-card rounded-xl shadow-sm border border-card overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card">
          <h2 className="text-xl font-bold text-app">Статистика по товарам</h2>
          <span className="text-sm text-app-muted">
            Показано {statsRows.length} из {products.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-card-2">
              <tr>
                {STATS_COLUMNS.map((column) => (
                  <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-app-muted uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleStatsSort(column.key)}
                      className="flex items-center gap-1 hover:text-app-2"
                    >
                      {column.label}
                      {statsSortKey === column.key ? (
                        statsSortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-gray-300" />
                      )}
                    </button>
                    <div className="mt-2 normal-case">
                      {column.type === 'category' ? (
                        <select
                          value={statsColumnFilters[column.key]}
                          onChange={(e) => handleStatsFilterChange(column.key, e.target.value)}
                          className="w-full text-xs font-normal border border-card rounded px-1.5 py-1 text-app-2"
                        >
                          <option value="">Все</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={statsColumnFilters[column.key]}
                          onChange={(e) => handleStatsFilterChange(column.key, e.target.value)}
                          placeholder="Фильтр..."
                          className="w-full text-xs font-normal border border-card rounded px-1.5 py-1 text-app-2 placeholder:text-app-muted"
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {statsRows.map(({ product, turnoverDays, marginCategory, turnoverCategory, abcCategory }) => (
                <tr key={product.sku} className="hover:bg-hover">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-app">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-app">
                    {product.margin.toLocaleString()} ₽
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    product.margin_percent > 40 ? 'text-emerald-600' :
                    product.margin_percent > 20 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {product.margin_percent.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-app-muted">
                    {turnoverDays.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${ABC_BADGE_STYLES[marginCategory]}`}>
                      {marginCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${ABC_BADGE_STYLES[turnoverCategory]}`}>
                      {turnoverCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${ABC_BADGE_STYLES[abcCategory]}`}>
                      {abcCategory}
                    </span>
                  </td>
                </tr>
              ))}
              {statsRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-app-muted">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
