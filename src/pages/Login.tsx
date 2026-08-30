import AuthCard from '../components/auth/AuthCard';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard initialMode="login" />

        <div className="text-center mt-8">
          <p className="text-app-muted text-sm">
            © 2026 faapp. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}
