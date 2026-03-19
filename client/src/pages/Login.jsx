import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Zap, Mail, Lock, Eye, EyeOff, Send } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import TelegramLoginButton from '../components/TelegramLoginButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [needVerify, setNeedVerify] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data;
      if (msg?.code === 'EMAIL_NOT_VERIFIED') {
        setNeedVerify(true);
        setError(msg.error);
      } else {
        setError(msg?.error || 'Ошибка входа');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.resendVerification({ email });
      setSuccess('Письмо отправлено повторно. Проверьте почту.');
      setError('');
      setNeedVerify(false);
    } catch { setError('Ошибка при отправке'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-dark">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold gradient-text">ST VILLAGE PROXY</span>
        </Link>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-center">Вход в аккаунт</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input pl-10" placeholder="you@email.com" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10" placeholder="••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-500">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
                {error}
                {needVerify && (
                  <button type="button" onClick={handleResend} className="block text-primary text-xs mt-1 underline">
                    Отправить письмо повторно
                  </button>
                )}
              </div>
            )}

            {success && (
              <div className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size="sm" /> : 'Войти'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-surface px-3 text-gray-500">или</span></div>
          </div>

          <TelegramLoginButton />

          <div className="mt-4 text-center text-sm text-gray-400">
            <Link to="/register" className="text-primary hover:underline">Создать аккаунт</Link>
            <span className="mx-2">•</span>
            <Link to="/reset-password" className="text-gray-500 hover:text-gray-300">Забыли пароль?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
