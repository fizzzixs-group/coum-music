import { useState } from "react";

import {
  SHAPE_PRESETS,
  TARGETS,
  shapePolygon,
  useShapes,
  type ShapeItem,
} from "@/store/shapes";

/** Ползунок в стиле приложения: тонкая дорожка, заливка и кружок. */
function ShapeSlider({
  label,
  value,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="shape-slider">
      <div className="shape-slider__head">
        <span>{label}</span>
        <b>
          {value}
          {suffix ?? ""}
        </b>
      </div>
      <div className="shape-slider__body">
        <div className="shape-slider__track">
          <i style={{ width: `${percent}%` }} />
        </div>
        <span className="shape-slider__knob" style={{ left: `${percent}%` }} />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
      </div>
    </div>
  );
}

/** Блок «Форма элементов»: свой набор настроек для каждого элемента. */
export function ShapeSettings() {
  const map = useShapes((s) => s.map);
  const active = useShapes((s) => s.active);
  const setActive = useShapes((s) => s.setActive);
  const update = useShapes((s) => s.update);
  const save = useShapes((s) => s.save);
  const hover = useShapes((s) => s.hover);
  const setHover = useShapes((s) => s.setHover);
  const reset = useShapes((s) => s.reset);

  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const item: ShapeItem = map[active];
  // Форма зависит только от волн: флаг on больше не используется.
  const clip = item.bumps > 0 && item.depth > 0 ? shapePolygon(item.bumps, item.depth) : "none";
  const activeLabel = TARGETS.find((t) => t.id === active)?.label ?? "";

  const enabledCount = TARGETS.filter((t) => map[t.id].on).length;

  return (
    <section className="settings__section" data-tab="custom">
      <button className="shape-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="shape-head__title">
          Форма элементов
          {enabledCount > 0 && <span className="shape-head__badge">{enabledCount} вкл.</span>}
        </span>
        <svg
          className="shape-head__arrow"
          data-open={open}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="shape-body">
          <p className="settings__hint">
            Форма настраивается отдельно для каждого элемента: у обложки может быть цветок,
            а кнопка «назад» — кружок.
          </p>

          {/* Выбор элемента */}
          <div className="shape-tabs">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                className="shape-tab"
                data-active={active === t.id}
                data-on={map[t.id].on}
                onClick={() => setActive(t.id)}
              >
                <span
                  className="shape-tab__dot"
                  style={{
                    clipPath:
                      map[t.id].on && (map[t.id].bumps > 0 || map[t.id].depth > 0)
                        ? shapePolygon(map[t.id].bumps, map[t.id].depth)
                        : undefined,
                  }}
                />
                {t.label}
              </button>
            ))}
          </div>

          {/* Включение по волнам: есть волны — форма работает */}
          <p className="settings__hint" style={{ marginTop: 0 }}>
            Форма применяется сразу, как только у элемента есть волны. Ноль волн — обычный круг.
          </p>

          {/* Предпросмотр выбранного */}
          <div className="shape-preview">
            <div
              className="shape-preview__box"
              data-kind={active}
              style={{ clipPath: clip === "none" ? undefined : clip }}
            />
            <div className="shape-preview__caption">
              {item.bumps > 0 && item.depth > 0
                ? `${activeLabel} · ${item.bumps} волн · ${item.depth}%`
                : `${activeLabel} · обычный круг`}
            </div>
          </div>

          {/* Пресеты */}
          <div className="shape-presets">
            {SHAPE_PRESETS.map((preset) => {
              const isActive = preset.bumps === item.bumps && preset.depth === item.depth;
              const presetClip = shapePolygon(preset.bumps, preset.depth);
              return (
                <button
                  key={preset.id}
                  className="shape-preset"
                  data-active={isActive}
                  onClick={() => update(active, { bumps: preset.bumps, depth: preset.depth })}
                >
                  <span
                    className="shape-preset__shape"
                    style={{ clipPath: presetClip === "none" ? undefined : presetClip }}
                  />
                  <span className="shape-preset__label">{preset.label}</span>
                </button>
              );
            })}
          </div>

          <ShapeSlider
            label="Количество волн"
            value={item.bumps}
            max={16}
            onChange={(bumps) => update(active, { bumps })}
          />
          <ShapeSlider
            label="Глубина волн"
            value={item.depth}
            max={40}
            suffix="%"
            onChange={(depth) => update(active, { depth })}
          />

          <label className="shape-toggle">
            <input
              type="checkbox"
              checked={hover}
              onChange={() => setHover(!hover)}
            />
            <span>Кнопки увеличиваются при наведении</span>
          </label>

          <div className="shape-actions">
            <button className="btn-primary" onClick={save}>
              Сохранить
            </button>
            <button className="btn-ghost" onClick={() => setConfirmReset(true)}>
              Сбросить всё
            </button>
          </div>
        </div>
      )}

      {confirmReset && (
        <div
          className="modal"
          onPointerDown={(e) => e.target === e.currentTarget && setConfirmReset(false)}
        >
          <div className="modal__card" style={{ width: 420 }}>
            <div className="modal__head">
              <h2 className="modal__title">Сбросить формы?</h2>
              <div className="modal__sub">
                Все настройки формы будут удалены и вернутся к обычным кругам.
              </div>
            </div>
            <div className="modal__row" style={{ justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                Нет
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
              >
                Да, сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
