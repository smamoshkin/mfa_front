// src/components/ToastNotification.tsx
import { Toaster } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ToastNotification() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ margin: '8px' }}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          borderRadius: '0.75rem',
          padding: '16px',
          maxWidth: '400px',
        },
        success: {
          duration: 3000,
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          style: {
            borderLeft: '4px solid #10b981',
          },
        },
        error: {
          duration: 5000,
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          style: {
            borderLeft: '4px solid #ef4444',
          },
        },
        loading: {
          duration: Infinity,
          icon: <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />,
          style: {
            borderLeft: '4px solid #3b82f6',
          },
        },
      }}
    />
  );
}