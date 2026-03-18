import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-surface-dark">
      <header className="sticky top-0 z-50 bg-surface-dark/80 backdrop-blur border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white transition"><ArrowLeft size={20} /></Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold gradient-text">ST VILLAGE PROXY</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Политика конфиденциальности</h1>
        <div className="prose prose-invert prose-sm space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Сбор данных</h2>
            <p>Сервис ST VILLAGE PROXY собирает минимально необходимые данные для предоставления услуг:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Адрес электронной почты — для регистрации, авторизации и уведомлений</li>
              <li>Telegram ID — при авторизации через Telegram</li>
              <li>Данные об оплатах — для учёта и формирования чеков</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Использование данных</h2>
            <p>Собранные данные используются исключительно для:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Предоставления и поддержки услуг Сервиса</li>
              <li>Отправки уведомлений о статусе подписки и платежей</li>
              <li>Обеспечения безопасности аккаунта Пользователя</li>
              <li>Улучшения качества работы Сервиса</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Защита данных</h2>
            <p>Пароли хранятся в зашифрованном виде (bcrypt). Передача данных осуществляется по защищённому протоколу HTTPS. Доступ к персональным данным ограничен.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Передача третьим лицам</h2>
            <p>Сервис не передаёт и не продаёт персональные данные Пользователей третьим лицам, за исключением случаев, предусмотренных законодательством РФ.</p>
            <p>Платёжные данные обрабатываются сервисом ЮКасса и не хранятся на серверах Сервиса.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Cookies</h2>
            <p>Сервис использует cookies и localStorage для хранения сессии авторизации. Отключение cookies может привести к невозможности использования Сервиса.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Удаление данных</h2>
            <p>Пользователь может запросить удаление своего аккаунта и всех связанных данных, обратившись в поддержку. Данные будут удалены в течение 30 дней.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Изменения</h2>
            <p>Сервис оставляет за собой право обновлять настоящую Политику. Актуальная версия всегда доступна на данной странице.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
