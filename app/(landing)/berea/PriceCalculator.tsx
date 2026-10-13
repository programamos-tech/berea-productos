"use client";

import { useId, useState, type CSSProperties } from "react";
import { Icon } from "./Icon";

const MONTHLY_SINGLE_SEDE = 120_000;
const MONTHLY_PER_SEDE = 100_000;
const ANNUAL_FREE_MONTHS = 2;
const MAX_SEDES = 20;
const refRanges = [
  { label: "Menos de 500", message: "menos de 500", extra: 0 },
  { label: "Entre 500 y 1.000", message: "entre 500 y 1.000", extra: 150_000 },
  { label: "Entre 1.000 y 2.000", message: "entre 1.000 y 2.000", extra: 450_000 },
  { label: "Entre 2.000 y 5.000", message: "entre 2.000 y 5.000", extra: 900_000 },
  { label: "Entre 5.000 y 10.000", message: "entre 5.000 y 10.000", extra: 1_800_000 },
  { label: "Más de 10.000", message: "más de 10.000", extra: 2_700_000 },
] as const;
const LAST_RANGE = refRanges.length - 1;

function setupBase(sedes: number) {
  if (sedes <= 3) return 1_200_000;
  if (sedes <= 7) return 2_000_000;
  return 3_000_000;
}

function cop(n: number) {
  return `$\u00a0${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function PriceCalculator({ whatsappUrl }: { whatsappUrl: string }) {
  const [sedes, setSedes] = useState(2);
  const [refIndex, setRefIndex] = useState(2);
  const [annual, setAnnual] = useState(true);
  const sliderId = useId();
  const refsId = useId();

  const range = refRanges[refIndex];
  const setup = setupBase(sedes) + range.extra;
  const monthly = sedes === 1 ? MONTHLY_SINGLE_SEDE : MONTHLY_PER_SEDE * sedes;
  const yearlyFull = monthly * 12;
  const yearly = monthly * (12 - ANNUAL_FREE_MONTHS);
  const savings = yearlyFull - yearly;
  const firstPayment = setup + (annual ? yearly : monthly);
  const sedesLabel = sedes >= MAX_SEDES ? `${MAX_SEDES} o más sedes` : `${sedes} ${sedes === 1 ? "sede" : "sedes"}`;

  const message = [
    "Hola, quiero una cotización de Berea.",
    `Tengo ${sedesLabel} y manejo ${range.message} referencias.`,
    `Me interesa el pago ${annual ? "anual" : "mensual"}.`,
  ].join(" ");
  const quoteUrl = `${whatsappUrl}?text=${encodeURIComponent(message)}`;

  return (
    <div className="calc">
      <div className="calc-form">
        <div className="calc-field">
          <div className="calc-label">
            <span className="calc-ico"><Icon id="store" /></span>
            <label htmlFor={sliderId}>¿Cuántas sedes tienes?</label>
          </div>
          <div className="calc-stepper">
            <button type="button" aria-label="Quitar una sede" onClick={() => setSedes((s) => Math.max(1, s - 1))} disabled={sedes <= 1}>
              −
            </button>
            <output aria-live="polite">{sedesLabel}</output>
            <button type="button" aria-label="Agregar una sede" onClick={() => setSedes((s) => Math.min(MAX_SEDES, s + 1))} disabled={sedes >= MAX_SEDES}>
              +
            </button>
          </div>
          <input
            id={sliderId}
            className="calc-range"
            type="range"
            min={1}
            max={MAX_SEDES}
            value={sedes}
            onChange={(e) => setSedes(Number(e.target.value))}
            style={{ "--fill": `${((sedes - 1) / (MAX_SEDES - 1)) * 100}%` } as CSSProperties}
          />
        </div>

        <div className="calc-field">
          <div className="calc-label">
            <span className="calc-ico"><Icon id="boxes" /></span>
            <label htmlFor={refsId}>¿Cuántas referencias manejas, más o menos?</label>
          </div>
          <div className="calc-stepper">
            <button type="button" aria-label="Menos referencias" onClick={() => setRefIndex((i) => Math.max(0, i - 1))} disabled={refIndex <= 0}>
              −
            </button>
            <output aria-live="polite">{range.label}</output>
            <button type="button" aria-label="Más referencias" onClick={() => setRefIndex((i) => Math.min(LAST_RANGE, i + 1))} disabled={refIndex >= LAST_RANGE}>
              +
            </button>
          </div>
          <input
            id={refsId}
            className="calc-range"
            type="range"
            min={0}
            max={LAST_RANGE}
            step={1}
            value={refIndex}
            aria-valuetext={`${range.label} referencias`}
            onChange={(e) => setRefIndex(Number(e.target.value))}
            style={{ "--fill": `${(refIndex / LAST_RANGE) * 100}%` } as CSSProperties}
          />
        </div>

        <fieldset className="calc-field">
          <legend className="calc-label">
            <span className="calc-ico"><Icon id="calendar" /></span>
            ¿Cómo prefieres pagar la mensualidad?
          </legend>
          <div className="calc-toggle">
            <label className={!annual ? "is-on" : undefined}>
              <input type="radio" name="billing" checked={!annual} onChange={() => setAnnual(false)} />
              Mes a mes
            </label>
            <label className={annual ? "is-on" : undefined}>
              <input type="radio" name="billing" checked={annual} onChange={() => setAnnual(true)} />
              Todo el año
              <span className="calc-save">{ANNUAL_FREE_MONTHS} meses gratis</span>
            </label>
          </div>
        </fieldset>
      </div>

      <div className="calc-result">
        <p className="calc-result-head">Tu valor estimado</p>

        <div className="calc-line">
          <div>
            <span>Implementación</span>
            <small>Pago único · {range.label.toLowerCase()} referencias</small>
          </div>
          <b>{cop(setup)}</b>
        </div>

        <div className="calc-line">
          <div>
            <span>Sistema y soporte</span>
            <small>{annual ? `Pago anual · ${sedesLabel}` : `Mensual · ${sedesLabel}`}</small>
          </div>
          <div className="calc-amount">
            {annual ? <s>{cop(yearlyFull)}</s> : null}
            <b>{cop(annual ? yearly : monthly)}</b>
            <small>{annual ? "al año" : "al mes"}</small>
          </div>
        </div>

        {annual ? (
          <p className="calc-savings"><Icon id="check" /> Ahorras {cop(savings)} al año</p>
        ) : (
          <p className="calc-hint">Si pagas todo el año, ahorras {cop(monthly * ANNUAL_FREE_MONTHS)}.</p>
        )}

        <div className="calc-total">
          <span>{annual ? "Primer año" : "Primer mes"} · con implementación</span>
          <strong>{cop(firstPayment)}</strong>
        </div>

        <div className="calc-next">
          <span className="calc-next-ico"><Icon id="down" /></span>
          <div>
            <span>{annual ? "Desde el segundo año" : "Desde el segundo mes"}</span>
            <small>Ya no pagas implementación</small>
          </div>
          <b>
            {cop(annual ? yearly : monthly)}
            <small>{annual ? " /año" : " /mes"}</small>
          </b>
        </div>

        <a className="btn btn-primary btn-lg calc-cta" href={quoteUrl} target="_blank" rel="noopener noreferrer">
          <Icon id="whatsapp" /> Quiero esta cotización
        </a>
        <p className="calc-fine">Valores aproximados en pesos colombianos. Te confirmamos el precio exacto después de la visita.</p>
      </div>
    </div>
  );
}
