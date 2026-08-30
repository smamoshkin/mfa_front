/**
 * Анимированный логотип FAAPP — буквы FA в синем квадратике.
 *
 * Цикл (одна проигрывка при монтировании): FA стоят → F кувыркается
 * вперёд и переворачивается: нижняя палочка становится левой малой
 * колонкой, большая верхняя — правой высокой (_i_I); A сужается в самую
 * высокую колонку со стрелкой вверх → пауза (растущая гистограмма = РОСТ)
 * → возврат в FA. В покое логотип — буквы FA.
 *
 * Механика анимаций — в `index.css` (`.faapp-logo-*`).
 * При prefers-reduced-motion остаётся статичное FA.
 */

interface FaappLogoProps {
  /** Размер квадратика: md — хедер приложения/футер, lg — хедер лендинга */
  size?: 'md' | 'lg';
}

export default function FaappLogo({ size = 'md' }: FaappLogoProps) {
  const box = size === 'lg'
    ? 'w-9 h-9 rounded-xl'
    : 'w-8 h-8 rounded-lg';

  return (
    <div className={`${box} bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center overflow-hidden`}>
      <svg
        viewBox="0 0 32 32"
        className="w-6 h-6 text-white"
        fill="none"
        aria-label="FAAPP"
        role="img"
      >
        {/* --- F: падает вперёд и переворачивается в две колонки + основание --- */}
        <g className="faapp-logo-f" transform="translate(1 3)">
          {/* ствол F — станет основанием гистограммы */}
          <rect x="7" y="8" width="3" height="18" fill="currentColor" />
          {/* верхняя (большая) палочка — станет правой высокой колонкой */}
          <rect x="7" y="8" width="12" height="3" fill="currentColor" />
          {/* нижняя палочка — станет левой малой колонкой */}
          <rect x="7" y="15" width="9" height="3" fill="currentColor" />
        </g>

        {/* --- A: сужается в высокую колонку со стрелкой на вершине --- */}
        <g className="faapp-logo-a">
          {/* левая нога */}
          <path d="M25 8 L21 26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          {/* правая нога */}
          <path d="M25 8 L29 26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          {/* перекладина — растворяется при сжатии */}
          <path className="faapp-logo-a-bar" d="M22.7 19.5 L27.3 19.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* стрелка на вершине колонки A — вырастает в конце */}
        <path
          className="faapp-logo-arrow"
          d="M25 3 L28.4 6.8 L26.6 6.8 L26.6 8.6 L23.4 8.6 L23.4 6.8 L21.6 6.8 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
