import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { Zap, Mail, Lock, CheckCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');

  // If no token — show "forgot password" form
  // If token present — show "new password" form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email });
      setSuccess(data.message || 'Проверьте почту');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await authApi.resetPassword({ token, password });
      setSuccess(data.message || 'Пароль изменён');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-dark">
        <div className="card max-w-sm text-center">
          <CheckCircle size={48} className="text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Готово!</h2>
          <p className="text-sm text-gray-400 mb-6">{success}</p>
          <Link to="/login" className="btn-primary w-full">Войти</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-dark">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </div>
        </Link>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-center">
            {token ? 'Новый пароль' : 'Забыли пароль?'}
          </h2>

          {!token ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input pl-10" placeholder="Ваш email" required />
              </div>
              {error && <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner size="sm" /> : 'Отправить ссылку'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input pl-10" placeholder="Новый пароль (мин. 6 символов)" required minLength={6} />
              </div>
              {error && <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner size="sm" /> : 'Сменить пароль'}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-gray-500 hover:text-gray-300">Вернуться к входу</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
