// Секция «Динамика рентабельности» страницы «Аналитика» — ШАБЛОН-ЗАГЛУШКА.
// Появится после доработки бэкенда (расчёт показателей по периодам).
// Каркас размечен так, чтобы будущие графики (recharts уже в зависимостях)
// встали на готовые места: линейный график сверху + сетка мини-карточек.
import { LineChart, BarChart3, CalendarRange, Construction } from 'lucide-react';

export default function DynamicsSection() {
  return (
    <>
      {/* Заглушка-уведомление */}
      <div className="mb-6 bg-sand/40 border border-sand rounded-xl p-4 flex items-start gap-3">
        <Construction className="w-5 h-5 text-sand-ink mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-app">Раздел в разработке</p>
          <p className="text-sm text-app-2 mt-0.5">
            Здесь появятся графики динамики показателей по периодам — рентабельность,
            маржа, выручка, DRR. Бэкенд начнёт отдавать помесячные ряды после доработки,
            фронт подключит их к этому шаблону.
          </p>
        </div>
      </div>

      {/* Шаблон: большой график динамики рентабельности */}
      <div className="bg-card rounded-xl shadow-sm border border-card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-soft rounded-lg">
              <LineChart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-app">Рентабельность по периодам</h3>
              <p className="text-xs text-app-muted">Доля прибыли в выручке, %</p>
            </div>
          </div>
          <span className="text-xs text-app-muted bg-card-2 px-2 py-1 rounded-full flex items-center gap-1">
            <CalendarRange className="w-3 h-3" />
            Период из фильтров
          </span>
        </div>

        {/* Скелетон будущего линейного графика */}
        <div className="relative h-56 rounded-lg bg-card-2 border border-card overflow-hidden">
          {/* сетка */}
          <div className="absolute inset-0 flex flex-col justify-between px-4 py-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-t border-dashed border-card" />
            ))}
          </div>
          {/* «линия» — плейсхолдер */}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30">
            <path
              d="M2 32 L18 28 L34 30 L50 22 L66 24 L82 14 L98 8"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="0.8"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-app-muted bg-card/80 px-3 py-1 rounded-full">
              График появится после доработки бэкенда
            </span>
          </div>
        </div>

        {/* Ось периодов */}
        <div className="flex justify-between mt-2 px-4 text-[10px] text-app-muted">
          {['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл'].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      {/* Шаблон: сетка мини-графиков по показателям */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Маржа', hint: '₽ по периодам' },
          { title: 'Выручка', hint: '₽ по периодам' },
          { title: 'DRR', hint: '% по периодам' },
          { title: 'Оборачиваемость', hint: 'дни по периодам' },
        ].map((item) => (
          <div key={item.title} className="bg-card rounded-xl shadow-sm border border-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="p-1.5 rounded-lg bg-primary-soft">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] text-app-muted bg-card-2 px-2 py-0.5 rounded-full">скоро</span>
            </div>
            <h4 className="font-bold text-app text-sm">{item.title}</h4>
            <p className="text-xs text-app-muted mb-3">{item.hint}</p>
            {/* скелетон мини-баров */}
            <div className="flex items-end gap-1 h-12">
              {[30, 45, 38, 60, 52, 70, 66].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/15"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
