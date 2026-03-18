import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/client';
import { Zap, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import TelegramLoginButton from '../components/TelegramLoginButton';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-dark">
        <div className="card max-w-sm text-center">
          <CheckCircle size={48} className="text-success mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Проверьте почту!</h2>
          <p className="text-sm text-gray-400 mb-6">
            Мы отправили письмо на <strong className="text-gray-200">{form.email}</strong>.
            Перейдите по ссылке в письме для активации аккаунта.
          </p>
          <Link to="/login" className="btn-primary w-full">Перейти к входу</Link>
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
          <span className="text-2xl font-bold gradient-text">ST VILLAGE PROXY</span>
        </Link>

        <div className="card">
          <h2 className="text-xl font-bold mb-6 text-center">Создать аккаунт</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Имя</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="input pl-10" placeholder="Ваше имя" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="input pl-10" placeholder="you@email.com" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-gray-500" />
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="input pl-10 pr-10" placeholder="Минимум 6 символов" required minLength={6} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-500">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size="sm" /> : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-surface px-3 text-gray-500">или</span></div>
          </div>

          <TelegramLoginButton />

          <p className="mt-4 text-center text-sm text-gray-400">
            Уже есть аккаунт? <Link to="/login" className="text-primary hover:underline">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
