import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Analytics from './pages/Analytics';
import ApiTest from './pages/ApiTest';
import Taxes from './pages/Taxes';
// import ApiStatus from './components/ApiStatus';
import TenantProfile from './pages/TenantProfile';
import ToastNotification from './components/ToastNotification';
import PrivacyPage from './pages/legal/PrivacyPage';
import OfferPage from './pages/legal/OfferPage';
import ConsentPage from './pages/legal/ConsentPage';

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
      <div className="min-h-screen bg-app">
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />

          {/* Публичные страницы авторизации (доступны в любом состоянии) */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Юридические страницы (публичные, доступны и залогиненным) */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/offer" element={<OfferPage />} />
          <Route path="/consent" element={<ConsentPage />} />

          {/* Все защищённые страницы — внутри общего каркаса (хедер + навигация) */}
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/profile" element={<TenantProfile />} />
            <Route path="/taxes" element={<Taxes />} />
          </Route>

          <Route path="/api-test" element={  // Добавляем маршрут для тестирования
            <ApiTest />
          } />

          {/* Лендинг — публичная страница для гостей; залогиненные уезжают в приложение */}
          <Route path="/" element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          } />

          <Route path="*" element={
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-app mb-4">404</h1>
                <p className="text-app-2">Страница не найдена</p>
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
