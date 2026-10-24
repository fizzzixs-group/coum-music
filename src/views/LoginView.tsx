import { useState } from "react";

import { api, humanError } from "@/api/backend";
import { isMobilePlatform } from "@/lib/platform";
import { useLibrary } from "@/store/library";

/** Экран входа: обычный OAuth Яндекса + запасной вариант с ручным токеном. */
export function LoginView() {
  const applyAccount = useLibrary((s) => s.applyAccount);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // На телефоне вход через браузер возвращает токен не всегда, поэтому
  // ручной ввод сразу раскрыт — это рабочий путь, а не запасной.
  const mobile = isMobilePlatform();

  const submit = async () => {
    if (token.trim().length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const account = await api.loginWithToken(token.trim());
      await applyAccount(account);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__mark">C</div>
        <h1 className="login__title">Coum Music</h1>
        <p className="login__text">
          Войди в свой аккаунт Яндекса — и всё, что у тебя есть в Музыке, окажется здесь.
          Токен хранится только {mobile ? "на этом устройстве" : "на этом компьютере"}.
        </p>

        {/* Вход по аккаунту работает везде: на телефоне страница Яндекса
            открывается в самом приложении, и после входа оно возвращается
            обратно уже с токеном — ничего копировать не нужно. */}
        <div className="login__actions">
          <button
            className="btn-primary"
            onClick={async () => {
              setError(null);
              try {
                await api.login();
              } catch (e) {
                setError(humanError(e));
              }
            }}
          >
            Войти через Яндекс
          </button>
        </div>

        {error && <div className="login__error">{error}</div>}

        <details className="login__manual" open={mobile}>
          <summary>{mobile ? "Вставить токен" : "Вставить токен вручную"}</summary>
          <div className="login__manual-row">
            <input
              className="text-input"
              placeholder="y0_AgAAAAB..."
              value={token}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
            />
            <button className="btn-ghost" disabled={busy} onClick={() => void submit()}>
              {busy ? "Проверяю…" : "Войти"}
            </button>
          </div>
          <p className="login__hint">
            {mobile
              ? "Проще всего так: открой в браузере телефона ссылку ниже, войди в Яндекс и скопируй access_token из адреса, на который тебя перекинет."
              : "Токен можно достать в браузере: открой music.yandex.ru, войди, затем в адресной строке вызови страницу авторизации"}
            <br />
            <code>oauth.yandex.ru/authorize?response_type=token&amp;client_id=23cabbbdc6cd418abb4b39c32c41195d</code>
            <br />
            {!mobile && (
              <>
                и скопируй значение <code>access_token</code> из адреса, на который тебя перекинет.
              </>
            )}
          </p>
        </details>

        {/* Версия прямо на экране входа: по ней видно, какая сборка стоит. */}
        <div className="login__version">
          Coum Music {__APP_VERSION__} · {mobile ? "Android" : "Windows"}
        </div>
      </div>
    </div>
  );
}
