import { useState } from "react";

import { ColorPicker } from "@/components/ColorPicker";
import { shade, onColor, useTheme, type CustomTheme, type CustomThemeId } from "@/store/theme";

type Props = {
  /** Какая тема редактируется; null — создание новой. */
  editing: CustomTheme | null;
  onClose: () => void;
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Окно своей темы. Раскладка горизонтальная: слева предпросмотр и два
 * цвета, справа пикер — окно остаётся низким и влезает даже в маленькое
 * окно приложения, не уходя под плеер.
 */
export function ThemeEditor({ editing, onClose }: Props) {
  const saveCustomTheme = useTheme((s) => s.saveCustomTheme);
  const removeCustomTheme = useTheme((s) => s.removeCustomTheme);

  const [name, setName] = useState(editing?.name ?? "Моя тема");
  const [primary, setPrimary] = useState(editing?.primary ?? "#3ddc84");
  const [base, setBase] = useState(editing?.base ?? "#101014");
  const [target, setTarget] = useState<"primary" | "base">("primary");

  const ok = HEX_RE.test(primary) && HEX_RE.test(base);
  const onPrimary = onColor(primary);
  const onBase = onColor(base);

  const save = () => {
    if (!ok) return;
    saveCustomTheme({
      id: editing?.id as CustomThemeId | undefined,
      name,
      primary,
      base,
    });
    onClose();
  };

  return (
    <div className="modal" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__card te">
        <button className="modal__close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <div className="modal__head">
          <h2 className="modal__title">{editing ? "Своя тема" : "Новая тема"}</h2>
          <div className="modal__sub">Два цвета — оттенки и текст подберутся сами</div>
        </div>

        <div className="te-body">
          {/* Левая колонка: как это будет выглядеть */}
          <div className="te-left">
            <div className="te-prev" style={{ background: base, color: onBase }}>
              <div
                className="te-prev__badge"
                style={{ background: shade(base, 0.08), color: onBase }}
              >
                ✧ МОЯ ВОЛНА
              </div>
              <div
                className="te-prev__cover"
                style={{
                  background: `linear-gradient(140deg, ${primary}, ${shade(primary, -0.4)})`,
                }}
              />
              <div className="te-prev__title">Funk Mersin</div>
              <div className="te-prev__artist" style={{ opacity: 0.7 }}>
                Jynxx · DJ CHANSEY
              </div>
              <div className="te-prev__bars">
                {[58, 82, 46, 96, 64, 88, 52].map((h, i) => (
                  <i key={i} style={{ height: `${h}%`, background: primary }} />
                ))}
              </div>
              <div className="te-prev__row">
                <div className="te-prev__play" style={{ background: primary, color: onPrimary }}>
                  ❚❚
                </div>
                <div className="te-prev__line" style={{ background: shade(base, 0.14) }}>
                  <span style={{ width: "42%", background: primary }} />
                </div>
              </div>
            </div>

            <div className="te-colors">
              <button
                className="te-color"
                data-active={target === "primary"}
                onClick={() => setTarget("primary")}
              >
                <span className="te-color__swatch" style={{ background: primary }} />
                <span className="te-color__label">Основной</span>
                <span className="te-color__hex">{primary.toUpperCase()}</span>
              </button>
              <button
                className="te-color"
                data-active={target === "base"}
                onClick={() => setTarget("base")}
              >
                <span className="te-color__swatch" style={{ background: base }} />
                <span className="te-color__label">Фон</span>
                <span className="te-color__hex">{base.toUpperCase()}</span>
              </button>
            </div>
          </div>

          {/* Правая колонка: пикер и сохранение */}
          <div className="te-right">
            <div className="te-picker">
              <ColorPicker
                value={target === "primary" ? primary : base}
                onChange={(hex) => {
                  if (target === "primary") setPrimary(hex);
                  else setBase(hex);
                }}
              />
            </div>

            <div className="te-save">
              <input
                className="modal__input"
                value={name}
                maxLength={32}
                placeholder="Название темы"
                onChange={(e) => setName(e.target.value)}
              />
              <button className="btn-primary" disabled={!ok} onClick={save}>
                {editing ? "Сохранить" : "Создать"}
              </button>
            </div>

            {editing && (
              <button
                className="te-delete"
                onClick={() => {
                  removeCustomTheme(editing.id);
                  onClose();
                }}
              >
                Удалить тему
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
