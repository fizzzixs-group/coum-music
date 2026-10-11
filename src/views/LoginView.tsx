import { useState } from "react";

import { api, humanError } from "@/api/backend";
import { useLibrary } from "@/store/library";

/** Экран входа: обычный OAuth Яндекса + запасной вариант с ручным токеном. */
export function LoginView() {
  const applyAccount = useLibrary((s) => s.applyAccount);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Токен хранится только на этом компьютере.
        </p>

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

        <details className="login__manual">
          <summary>Вставить токен вручную</summary>
          <div className="login__manual-row">
            <input
              className="text-input"
              placeholder="y0_AgAAAAB..."
              value={token}
              spellCheck={false}
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
            Токен можно достать в браузере: открой music.yandex.ru, войди, затем в адресной строке
            вызови страницу авторизации
            <br />
            <code>oauth.yandex.ru/authorize?response_type=token&amp;client_id=23cabbbdc6cd418abb4b39c32c41195d</code>
            <br />
            и скопируй значение <code>access_token</code> из адреса, на который тебя перекинет.
          </p>
        </details>
      </div>
    </div>
  );
}
