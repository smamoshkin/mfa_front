import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import Login from './pages/Login';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Analytics from './pages/Analytics';
import ApiTest from './pages/ApiTest';
import Taxes from './pages/Taxes';
// import ApiStatus from './components/ApiStatus';
import TenantProfile from './pages/TenantProfile';
import ToastNotification from './components/ToastNotification';

// Компонент защищенного маршрута
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

// Компонент публичного маршрута (только для неавторизованных)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return !token ? <>{children}</> : <Navigate to="/analytics" />;
}

function App() {
  useInactivityLogout();

  return (
    <Router>
      <ToastNotification /> 
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/products" element={  
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          } />

          <Route path="/products/:id" element={  
            <PrivateRoute>
              <ProductDetail />
            </PrivateRoute>
          } />
          
          <Route path="/analytics" element={  // Добавляем новый маршрут
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <TenantProfile />
            </PrivateRoute>
          } />
          
          <Route path="/taxes" element={
            <PrivateRoute>
              <Taxes />
            </PrivateRoute>
          } />

          <Route path="/api-test" element={  // Добавляем маршрут для тестирования
            <ApiTest />
          } />
          
          <Route path="/" element={<Navigate to="/analytics" />} />
          
          <Route path="*" element={
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600">Страница не найдена</p>
              </div>
            </div>
          } />
        </Routes>
        {/* <ApiStatus /> */}
      </div>
    </Router>
  );
}

export default App;
