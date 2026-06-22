import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 минут

export function useInactivityLogout() {
  const { token, logout } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
    };

    const events: string[] = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [token, logout]);
}
