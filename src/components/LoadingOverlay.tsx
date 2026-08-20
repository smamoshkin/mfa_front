interface LoadingOverlayProps {
  show: boolean;
}

/**
 * Прозрачный спиннер на весь экран с лёгким затемнением содержимого.
 * Показывается, пока show === true.
 */
export default function LoadingOverlay({ show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      role="status"
      aria-label="Загрузка"
    >
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
