import { useState, useRef, useEffect } from 'react';

interface ImageTooltipProps {
  imageUrl: string;
  alt: string;
  children: React.ReactNode;
}

export default function ImageTooltip({ imageUrl, alt, children }: ImageTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Позиционируем тултип справа от изображения
    let left = triggerRect.right + 10;
    let top = triggerRect.top + window.scrollY;

    // Проверяем, чтобы тултип не выходил за правый край экрана
    if (left + tooltipRect.width > window.innerWidth) {
      left = triggerRect.left - tooltipRect.width - 10;
    }

    // Проверяем, чтобы тултип не выходил за нижний край экрана
    if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
      top = window.innerHeight + window.scrollY - tooltipRect.height - 10;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      
      // Обновляем позицию при скролле или ресайзе
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {children}
      </div>

      {/* Тултип с фиксированным позиционированием */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] bg-card rounded-lg shadow-2xl border border-card p-3"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: '256px',
            height: '256px',
          }}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover rounded"
          />
        </div>
      )}
    </>
  );
}