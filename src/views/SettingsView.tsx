import { humanError, api } from "@/api/backend";
import {
  IconCheck,
  IconExternal,
  IconInfo,
  IconLogout,
  IconPalette,
  IconTelegram,
  IconWave,
} from "@/components/Icons";
import { EQ_FREQS, EQ_PRESETS, EQ_RANGE, useEqualizer } from "@/store/equalizer";
import { useLibrary } from "@/store/library";
import { THEMES, useTheme } from "@/store/theme";

const TELEGRAM_URL = "https://t.me/coumfun";

/** Настройки: темы, эквалайзер, аккаунт, ссылка на наш Telegram и версия. */
export function SettingsView() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const account = useLibrary((s) => s.account);
  const logout = useLibrary((s) => s.logout);
  const error = useLibrary((s) => s.error);

  const eqEnabled = useEqualizer((s) => s.enabled);
  const eqGains = useEqualizer((s) => s.gains);
  const eqPreset = useEqualizer((s) => s.preset);
  const setEqEnabled = useEqualizer((s) => s.setEnabled);
  const setBand = useEqualizer((s) => s.setBand);
  const applyPreset = useEqualizer((s) => s.applyPreset);
  const resetEq = useEqualizer((s) => s.reset);

  const openTelegram = () => {
    void api.openExternal(TELEGRAM_URL).catch((e) => {
      useLibrary.setState({ error: humanError(e) });
    });
  };

  return (
    <div className="view scroll">
      <div className="settings">
        <h1 className="settings__title">Настройки</h1>

        <section className="settings__section">
          <h2 className="settings__section-title">
            <IconPalette size={18} /> Оформление
          </h2>
          <p className="settings__hint">
            Тема меняет акцент и фон всего приложения — включая плеер и списки.
          </p>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className="theme-chip"
                data-active={theme === t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
              >
                <span
                  className="theme-chip__swatch"
                  style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.base})` }}
                >
                  {theme === t.id && <IconCheck size={20} className="theme-chip__check" />}
                </span>
                <span className="theme-chip__label">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings__section">
          <h2 className="settings__section-title">
            <IconWave size={18} /> Эквалайзер
          </h2>
          <p className="settings__hint">
            Десять полос, ±{EQ_RANGE} дБ. Обработка идёт поверх потока, настройки сохраняются.
          </p>

          <div className="settings__row">
            <div className="settings__row-text">
              <div className="settings__row-title">Включить эквалайзер</div>
              <div className="settings__row-sub">
                {eqEnabled ? "Активен" : "Сейчас звук идёт без обработки"}
              </div>
            </div>
            <button
              className="switch"
              data-on={eqEnabled}
              aria-pressed={eqEnabled}
              aria-label="Включить эквалайзер"
              onClick={() => setEqEnabled(!eqEnabled)}
            >
              <span className="switch__knob" />
            </button>
          </div>

          <div className="eq-presets">
            {EQ_PRESETS.map((p) => (
              <button
                key={p.id}
                className="chip"
                data-active={eqPreset === p.id}
                onClick={() => applyPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="eq-grid" data-off={!eqEnabled}>
            {EQ_FREQS.map((freq, i) => (
              <div className="eq-grid__band" key={freq}>
                <span className="eq-grid__gain">
                  {eqGains[i] > 0 ? `+${eqGains[i]}` : eqGains[i]}
                </span>
                {/* Слайдер горизонтальный и повёрнут: у вертикальных range
                    в Chromium ломается расчёт высоты и они вылезают из карточки. */}
                <span className="eq-grid__slider-wrap">
                  <input
                    className="eq-grid__slider"
                    type="range"
                    min={-EQ_RANGE}
                    max={EQ_RANGE}
                    step={1}
                    value={eqGains[i] ?? 0}
                    aria-label={`${freq} Гц`}
                    onChange={(e) => setBand(i, Number(e.target.value))}
                  />
                </span>
                <span className="eq-grid__freq">{freq >= 1000 ? `${freq / 1000}к` : freq}</span>
              </div>
            ))}
          </div>

          <div className="settings__row" style={{ marginTop: 18 }}>
            <div className="settings__row-text">
              <div className="settings__row-sub">Вернуть все полосы в ноль и выключить</div>
            </div>
            <button className="btn-ghost" onClick={resetEq}>
              Сбросить
            </button>
          </div>
        </section>

        <section className="settings__section">
          <h2 className="settings__section-title">Аккаунт</h2>
          {account ? (
            <>
              <div className="settings__row">
                <div className="settings__row-text">
                  <div className="settings__row-title">{account.displayName}</div>
                  <div className="settings__row-sub">
                    uid {account.uid} · {account.hasPlus ? "Яндекс Плюс активен" : "без Плюса"}
                  </div>
                </div>
              </div>
              <div className="settings__row">
                <div className="settings__row-text">
                  <div className="settings__row-title">Выйти из аккаунта</div>
                  <div className="settings__row-sub">
                    Токен будет удалён с этого компьютера, музыка останется в Яндексе
                  </div>
                </div>
                <button className="btn-ghost" onClick={() => void logout()}>
                  <IconLogout size={17} />
                  Выйти
                </button>
              </div>
            </>
          ) : (
            <div className="settings__row">
              <div className="settings__row-text">
                <div className="settings__row-title">Ты не в аккаунте</div>
                <div className="settings__row-sub">Войди, чтобы появились плейлисты и волна</div>
              </div>
              <button className="btn-primary" onClick={() => void api.login()}>
                Войти
              </button>
            </div>
          )}
          {error && (
            <div className="login__error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
        </section>

        <section className="settings__section">
          <h2 className="settings__section-title">
            <IconTelegram size={18} /> Coum в Telegram
          </h2>
          <p className="settings__hint">Обновления, сборки и связь с нами — в нашем канале.</p>
          <button className="btn-primary" onClick={openTelegram}>
            <IconTelegram size={18} />
            t.me/coumfun
            <IconExternal size={15} />
          </button>
        </section>

        <section className="settings__section">
          <h2 className="settings__section-title">
            <IconInfo size={18} /> О приложении
          </h2>
          <div className="settings__row">
            <div className="settings__row-text">
              <div className="settings__row-title">Coum Music</div>
              <div className="settings__row-sub">
                версия {__APP_VERSION__} · неофициальный клиент Яндекс.Музыки
              </div>
            </div>
          </div>
          <div className="settings__row">
            <div className="settings__row-text">
              <div className="settings__row-title">Что внутри</div>
              <div className="settings__row-sub">
                Моя волна, волна по треку, плейлисты, поиск, исполнители и избранное.
              </div>
            </div>
          </div>
          <div className="settings__row">
            <div className="settings__row-text">
              <div className="settings__row-title">Горячие клавиши</div>
              <div className="settings__row-sub">
                Space — пауза, ← → — ±5 секунд, Ctrl+← / Ctrl+→ — переключение трека, Ctrl+K — поиск
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
