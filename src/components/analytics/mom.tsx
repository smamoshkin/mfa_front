// Общие хелперы для карточек показателей: расчёт «разницы с прошлым периодом»
// и бейдж, который её показывает. Используются страницей «Аналитика»
// (расчёт) и секцией «Рентабельность» (отображение).
import { ArrowUp, ArrowDown } from 'lucide-react';
import { format, parseISO, addDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// Период для сравнения: если выбраны целые календарные месяцы — предыдущие
// целые месяцы (для одного месяца это ровно прошлый календарный месяц);
// для произвольного диапазона — предыдущее окно той же длины.
export function previousPeriodRange(dateFrom: string, dateTo: string): { date_from: string; date_to: string } {
  const from = parseISO(dateFrom);
  const to = parseISO(dateTo);

  const isCalendarAligned = from.getDate() === 1 && to.getDate() === endOfMonth(to).getDate();
  if (isCalendarAligned) {
    const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
    return {
      date_from: format(startOfMonth(subMonths(from, months)), 'yyyy-MM-dd'),
      date_to: format(endOfMonth(subMonths(to, months)), 'yyyy-MM-dd'),
    };
  }

  const days = Math.max(Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1, 1);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  return { date_from: format(prevFrom, 'yyyy-MM-dd'), date_to: format(prevTo, 'yyyy-MM-dd') };
}

export type MoMChangeKind = 'money' | 'pp'; // money — относительное изменение, pp — разница в процентных пунктах

export interface MoMChange {
  text: string;                     // '+12.5%' | '-3.2 п.п.' | '0.0%'
  title: string;                    // подсказка при наведении
  tone: 'good' | 'bad' | 'neutral'; // good/bad — с учётом направления метрики (расходы: рост = bad)
  direction: 1 | -1 | 0;
}

export function computeMoMChange(
  current: number,
  previous: number,
  kind: MoMChangeKind,
  lowerIsBetter: boolean,
  periodLabel: string,
): MoMChange | null {
  let delta: number;
  if (kind === 'pp') {
    // Процентные метрики (рентабельность, DRR) честнее сравнивать в пунктах:
    // рост 5% → 10% — это +5 п.п., а не «+100%»
    delta = current - previous;
  } else {
    // Относительное изменение не определено при нулевой/отрицательной базе
    if (previous <= 0) return null;
    delta = (current / previous - 1) * 100;
  }

  const rounded = Number(delta.toFixed(1));
  const direction = rounded > 0 ? 1 : rounded < 0 ? -1 : 0;
  const improved = lowerIsBetter ? direction < 0 : direction > 0;

  return {
    text: `${direction > 0 ? '+' : ''}${rounded.toFixed(1)}${kind === 'pp' ? ' п.п.' : '%'}`,
    title: `По сравнению с прошлым периодом (${periodLabel})`,
    tone: direction === 0 ? 'neutral' : improved ? 'good' : 'bad',
    direction,
  };
}

/** Набор бейджей для карточек секции «Рентабельность» */
export interface MomBadges {
  profitability: MoMChange | null;
  revenue: MoMChange | null;
  payout: MoMChange | null;
  margin: MoMChange | null;
  advertising: MoMChange | null;
  storage: MoMChange | null;
  logistics: MoMChange | null;
  tax: MoMChange | null;
  drr: MoMChange | null;
}

// Бейдж в правом верхнем углу карточки. change === null → «—» (нет базы сравнения).
export function MoMBadge({ change, onDark = false }: { change: MoMChange | null; onDark?: boolean }) {
  if (!change) {
    return (
      <span
        title="Нет данных за прошлый период для сравнения"
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${onDark ? 'text-white/80 bg-white/20' : 'text-app-muted bg-card-2'}`}
      >
        —
      </span>
    );
  }

  const Icon = change.direction > 0 ? ArrowUp : change.direction < 0 ? ArrowDown : null;
  const toneClass = onDark
    ? 'text-white bg-white/20'
    : change.tone === 'good'
      ? 'text-emerald-700 bg-emerald-50'
      : change.tone === 'bad'
        ? 'text-red-600 bg-red-50'
        : 'text-app-muted bg-card-2';

  return (
    <span
      title={change.title}
      className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${toneClass}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {change.text}
    </span>
  );
}
