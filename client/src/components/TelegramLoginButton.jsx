import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { authApi } from '../api/client';
import { useAuthStore } from '../store/auth';
import Spinner from './ui/Spinner';

export default function TelegramLoginButton() {
  const [botUsername, setBotUsername] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const containerRef = useRef(null);

  useEffect(() => {
    api.get('/config').then(({ data }) => {
      if (data.telegram_bot_username) setBotUsername(data.telegram_bot_username);
    }).catch(() => {});
  }, []);

  const handleTelegramAuth = useCallback(async (user) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.telegram(user);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка авторизации Telegram');
    } finally {
      setLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    window.onTelegramAuth = handleTelegramAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => { delete window.onTelegramAuth; };
  }, [botUsername, handleTelegramAuth]);

  if (!botUsername) return null;

  if (loading) {
    return (
      <button disabled className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2AABEE]/10 text-[#2AABEE]">
        <Spinner size="sm" />
      </button>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="flex justify-center [&>iframe]{border-radius:12px}" />
      {error && <p className="text-sm text-danger mt-2 text-center">{error}</p>}
    </div>
  );
}
