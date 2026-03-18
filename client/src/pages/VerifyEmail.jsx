import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi, profileApi } from '../api/client';
import { CheckCircle, XCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function VerifyEmail({ type }) {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен не указан');
      return;
    }

    const verify = type === 'link'
      ? profileApi.verifyLinkEmail(token)
      : authApi.verifyEmail(token);

    verify
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.error || 'Ошибка верификации'); });
  }, [token, type]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-dark">
      <div className="card max-w-sm text-center">
        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-gray-400">Проверяем...</p>
          </div>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{type === 'link' ? 'Email привязан!' : 'Email подтверждён!'}</h2>
            <p className="text-sm text-gray-400 mb-6">{message}</p>
            <Link to={type === 'link' ? '/dashboard' : '/login'} className="btn-primary w-full">
              {type === 'link' ? 'Вернуться в ЛК' : 'Войти'}
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-danger mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ошибка</h2>
            <p className="text-sm text-gray-400 mb-6">{message}</p>
            <Link to="/login" className="btn-secondary w-full">Вернуться</Link>
          </>
        )}
      </div>
    </div>
  );
}
