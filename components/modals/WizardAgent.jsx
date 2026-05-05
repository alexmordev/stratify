'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Btn from '@/components/ui/Btn';
import ColorDot from '@/components/ui/ColorDot';
import { t } from '@/lib/i18n';
import { PALETTE, palById } from '@/lib/palette';
import { createFromWizard } from '@/lib/actions/wizard';

function getLang() {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('lang');
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ current, lang }) {
  const steps = [
    t(lang, 'stepDefine'),
    t(lang, 'stepAgree'),
    t(lang, 'stepMilestones'),
    t(lang, 'stepDone'),
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((label, i) => {
        const isDone = i < current;
        const isActive = i === current;
        const isDisabled = i > current;

        return (
          <div
            key={label}
            style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1' : 'none' }}
          >
            <div
              data-testid={`stepper-step-${i}`}
              aria-disabled={isDisabled ? 'true' : 'false'}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                opacity: isDisabled ? 0.35 : 1, minWidth: 56,
              }}
            >
              <div
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isDone || isActive ? 'var(--ink)' : 'var(--bg-2)',
                  border: isActive ? '2px solid var(--ink)' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600,
                  color: isDone || isActive ? 'white' : 'var(--ink-3)',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: isActive ? 'var(--ink)' : 'var(--ink-3)', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1, height: 2,
                  background: i < current ? 'var(--ink)' : 'var(--line-2)',
                  margin: '0 4px', marginBottom: 18,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ role, content, lang }) {
  const isAgent = role === 'assistant';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAgent ? 'flex-start' : 'flex-end', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--ink-4)', paddingLeft: isAgent ? 4 : 0, paddingRight: isAgent ? 0 : 4 }}>
        {isAgent ? t(lang, 'agentLabel') : t(lang, 'youLabel')}
      </span>
      <div
        style={{
          maxWidth: '78%', padding: '10px 14px',
          borderRadius: isAgent ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
          background: isAgent ? 'var(--bg-2)' : 'var(--ink)',
          color: isAgent ? 'var(--ink)' : 'white',
          fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}
      >
        {content}
      </div>
    </div>
  );
}

// ─── Step 0: Chat ─────────────────────────────────────────────────────────────
function StepChat({ messages, streaming, onSend, lang }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current?.scrollIntoView) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  function handleSend() {
    const val = input.trim();
    if (!val || streaming) return;
    onSend(val);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 28px' }}>
        {messages.map((msg, i) => <ChatBubble key={i} role={msg.role} content={msg.content} lang={lang} />)}
        {streaming && <ChatBubble role="assistant" content={streaming} lang={lang} />}
        <div ref={bottomRef} />
      </div>
      <div style={{ borderTop: '1px solid var(--line-2)', padding: '16px 28px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={t(lang, 'inputPlaceholder')} rows={2}
          style={{ flex: 1, resize: 'none', borderRadius: 8, border: '1px solid var(--line)', padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', outline: 'none' }}
        />
        <Btn variant="primary" onClick={handleSend} disabled={!input.trim() || streaming}>
          {t(lang, 'send')}
        </Btn>
      </div>
    </div>
  );
}

// ─── Pomodoro calculator ──────────────────────────────────────────────────────
function countWeekdays(from, to) {
  let count = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ─── Step 1: Approve Meta ─────────────────────────────────────────────────────
function FieldBlock({ label, value, multiline }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</span>
    </div>
  );
}

function StepApprove({ meta, onMetaChange, onApprove, lang }) {
  const sessions = meta?.fecha_logro
    ? countWeekdays(new Date(), new Date(meta.fecha_logro))
    : null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
        {lang === 'en' ? 'Review your goal before continuing.' : 'Revisa tu meta antes de continuar.'}
      </div>

      <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {lang === 'en' ? 'Identity & Direction' : 'Identidad y Dirección'}
        </div>
        <FieldBlock label={t(lang, 'enunciado')} value={meta?.title} multiline />
        <FieldBlock label={t(lang, 'horizonte')} value={meta?.horizon} />
        <FieldBlock label={t(lang, 'identidad_deseada')} value={meta?.identidad_deseada} />

        <div style={{ height: 1, background: 'var(--line-2)' }} />

        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {lang === 'en' ? 'Motivation & Resilience' : 'Motivación y Resiliencia'}
        </div>
        <FieldBlock label={t(lang, 'motivacion')} value={meta?.why} multiline />
        <FieldBlock label={t(lang, 'obstaculo_interno')} value={meta?.obstaculo_interno} />
        <FieldBlock label={t(lang, 'plan_respuesta')} value={meta?.plan_respuesta} />

        <div style={{ height: 1, background: 'var(--line-2)' }} />

        {/* Achievement date + pomodoro */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {lang === 'en' ? 'Target Date' : 'Fecha de Logro'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="date"
            value={meta?.fecha_logro ?? ''}
            onChange={(e) => onMetaChange({ ...meta, fecha_logro: e.target.value })}
            style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', fontSize: 14, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', width: '100%' }}
          />
          {sessions !== null && sessions > 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', background: 'var(--bg-3, var(--line-2))', borderRadius: 6, padding: '6px 10px', lineHeight: 1.5 }}>
              {lang === 'en'
                ? `~${sessions} sessions of 25 min (Mon–Fri, 1/day) to reach this goal`
                : `~${sessions} sesiones de 25 min (L–V, 1/día) para lograr esta meta`}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Btn variant="primary" size="lg" onClick={onApprove} style={{ width: '100%', justifyContent: 'center' }}>
          {t(lang, 'approveMeta')}
        </Btn>
      </div>
    </div>
  );
}

// ─── Step 2: Edit Hitos ───────────────────────────────────────────────────────
// Arc position → palette color index (Q1=moss, Q2=sky, Q3=lagoon, Q4=violet, wraps)
const ARC_COLORS = ['moss', 'sky', 'lagoon', 'violet', 'peach', 'blush', 'sand', 'graphite'];

function HitoRow({ hito, index, onChange, onRemove, lang }) {
  const [editing, setEditing] = useState(true);
  const pal = palById(hito.color ?? 'sand');

  function field(key, label, multiline = false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {editing ? (
          multiline ? (
            <textarea
              value={hito[key] ?? ''}
              onChange={(e) => onChange({ ...hito, [key]: e.target.value })}
              rows={2}
              style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical', width: '100%' }}
            />
          ) : (
            <input
              type={key === 'fecha_objetivo' ? 'date' : 'text'}
              value={hito[key] ?? ''}
              onChange={(e) => onChange({ ...hito, [key]: e.target.value })}
              style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '4px 8px', fontSize: 13, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', width: '100%' }}
            />
          )
        ) : (
          <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{hito[key] || '—'}</span>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, borderLeft: `3px solid ${pal.dot}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ColorDot color={pal.dot} size={10} />
          {hito.arc && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', background: 'var(--bg-3, var(--line-2))', borderRadius: 4, padding: '1px 6px', letterSpacing: '0.06em' }}>
              {hito.arc}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>
            {lang === 'en' ? `Milestone ${index + 1}` : `Hito ${index + 1}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button type="button" onClick={() => setEditing((v) => !v)} style={{ fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
            {editing ? t(lang, 'save') : t(lang, 'edit')}
          </button>
          <button type="button" onClick={onRemove} style={{ fontSize: 11, color: 'oklch(0.5 0.15 25)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
            {t(lang, 'delete')}
          </button>
        </div>
      </div>

      {field('enunciado', t(lang, 'hitoEnunciado'), true)}
      {field('criterio_verificacion', t(lang, 'criterio_verificacion'), true)}
      {field('fecha_objetivo', t(lang, 'fecha_objetivo'))}
      {field('puente_con_meta', t(lang, 'puente_con_meta'), true)}

      {/* Color picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t(lang, 'color')}:</span>
        {PALETTE.map((p) => (
          <button
            key={p.id} type="button"
            onClick={() => onChange({ ...hito, color: p.id })}
            title={p.id}
            style={{ width: 16, height: 16, borderRadius: '50%', background: p.dot, border: hito.color === p.id ? '2px solid var(--ink)' : '2px solid transparent', cursor: 'pointer', padding: 0, outline: 'none' }}
          />
        ))}
      </div>
    </div>
  );
}

function StepHitos({ hitos, onChange, onAddOwn, onNext, lang, creating }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
        {lang === 'en'
          ? 'Review the proposed milestones — verifiable checkpoints toward your goal.'
          : 'Revisa los hitos propuestos — checkpoints verificables hacia tu meta.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hitos.map((h, i) => (
          <HitoRow
            key={h.id} hito={h} index={i}
            onChange={(updated) => onChange(hitos.map((x) => (x.id === updated.id ? updated : x)))}
            onRemove={() => onChange(hitos.filter((x) => x.id !== h.id))}
            lang={lang}
          />
        ))}
      </div>

      <Btn variant="secondary" onClick={onAddOwn}>+ {t(lang, 'addOwnHito')}</Btn>

      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <Btn
          variant="primary" size="lg"
          disabled={hitos.length === 0 || creating}
          onClick={onNext}
          data-testid="wizard-create-btn"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {creating ? '…' : t(lang, 'createMeta')}
        </Btn>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _tempIdCounter = 0;
function tempId(prefix = 'tmp') { return `${prefix}-${++_tempIdCounter}`; }

/** Try to parse the structured Agent PM Metas output block. */
function parseAgent01Output(text) {
  if (!text.includes('OUTPUT AGENT PM METAS') && !text.includes('OUTPUT AGENTE 01')) return null;

  function extract(...labels) {
    for (const label of labels) {
      const re = new RegExp(`${label}[:\\s]*\\n([\\s\\S]*?)(?=\\n[A-ZÁÉÍÓÚÑA-Z][A-ZÁÉÍÓÚÑA-Z ]+:|===|$)`, 'i');
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return '';
  }

  return {
    title: extract('SUPERORDINATE GOAL', 'META SUPERORDINADA'),
    horizon: extract('TIME HORIZON', 'HORIZONTE TEMPORAL'),
    identidad_deseada: extract('DESIRED IDENTITY', 'IDENTIDAD DESEADA'),
    why: extract('CORE VALUES AND MOTIVATION', 'VALORES Y MOTIVACIÓN CENTRAL'),
    obstaculo_interno: extract('MAIN INTERNAL OBSTACLE', 'OBSTÁCULO INTERNO PRINCIPAL'),
    plan_respuesta: extract('OBSTACLE RESPONSE PLAN', 'PLAN DE RESPUESTA AL OBSTÁCULO'),
  };
}

// ─── WizardAgent (main) ───────────────────────────────────────────────────────
export default function WizardAgent({
  onClose,
  _testStep,
  _testMeta,
}) {
  const router = useRouter();
  const [lang, setLang] = useState('es');

  // Steps: 0=Define, 1=Agree, 2=Milestones, 3=Done
  const [step, setStep] = useState(_testStep !== undefined ? _testStep : 0);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState('');
  const [meta, setMeta] = useState(_testMeta ?? null);
  const [hitos, setHitos] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loadingPropose, setLoadingPropose] = useState(false);

  useEffect(() => { if (_testStep !== undefined) setStep(_testStep); }, [_testStep]);
  useEffect(() => { if (_testMeta !== undefined) setMeta(_testMeta); }, [_testMeta]);

  useEffect(() => {
    setLang(getLang());
    function handleLangChange() { setLang(getLang()); }
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  useEffect(() => {
    if (_testStep !== undefined) return;
    const greeting = lang === 'en'
      ? "Hi! I'm here to help you define your goal. What do you want to achieve?"
      : '¡Hola! Estoy aquí para ayudarte a definir tu meta. ¿Qué quieres lograr?';
    setMessages([{ role: 'assistant', content: greeting }]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(userInput) {
    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setStreaming('');

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error('Claude API error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreaming(full);
      }
      reader.releaseLock();

      setMessages((prev) => [...prev, { role: 'assistant', content: full }]);
      setStreaming('');

      const parsed = parseAgent01Output(full);
      if (parsed?.title) {
        setMeta((prev) => ({
          ...prev,
          title: parsed.title,
          title_en: prev?.title_en ?? parsed.title,
          horizon: parsed.horizon,
          horizon_en: prev?.horizon_en ?? parsed.horizon,
          identidad_deseada: parsed.identidad_deseada,
          why: parsed.why,
          why_en: prev?.why_en ?? parsed.why,
          obstaculo_interno: parsed.obstaculo_interno,
          plan_respuesta: parsed.plan_respuesta,
          success: '', success_en: '',
        }));
      } else if (newMessages.filter((m) => m.role === 'user').length >= 3) {
        const userMsgs = newMessages.filter((m) => m.role === 'user').map((m) => m.content);
        setMeta((prev) => ({
          title: prev?.title ?? userMsgs[0] ?? '',
          title_en: prev?.title_en ?? userMsgs[0] ?? '',
          why: prev?.why ?? userMsgs[1] ?? '',
          why_en: prev?.why_en ?? userMsgs[1] ?? '',
          horizon: prev?.horizon ?? '', horizon_en: prev?.horizon_en ?? '',
          identidad_deseada: prev?.identidad_deseada ?? '',
          obstaculo_interno: prev?.obstaculo_interno ?? '',
          plan_respuesta: prev?.plan_respuesta ?? '',
          success: '', success_en: '',
        }));
      }
    } catch (err) {
      console.error('[wizard chat]', err);
      setStreaming('');
    }
  }

  function handleAdvanceToApprove() {
    if (!meta) {
      const userMsgs = messages.filter((m) => m.role === 'user').map((m) => m.content);
      setMeta({ title: userMsgs[0] ?? '', title_en: userMsgs[0] ?? '', why: userMsgs[1] ?? '', why_en: userMsgs[1] ?? '', success: '', success_en: '', horizon: '', horizon_en: '', identidad_deseada: '', obstaculo_interno: '', plan_respuesta: '' });
    }
    setStep(1);
  }

  async function handleApproveMeta() {
    setStep(2);
    setLoadingPropose(true);
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'propose', metaSummary: meta }),
      });
      const data = await res.json();
      const proposed = (data.hitos ?? []).map((h, i) => ({
        ...h,
        id: tempId('hito'),
        color: h.color ?? ARC_COLORS[i % ARC_COLORS.length],
      }));
      setHitos(proposed);
    } catch (err) {
      console.error('[wizard propose]', err);
    } finally {
      setLoadingPropose(false);
    }
  }

  function handleAddOwnHito() {
    setHitos((prev) => [
      ...prev,
      { id: tempId('hito'), enunciado: '', criterio_verificacion: '', fecha_objetivo: '', puente_con_meta: '', color: 'sand' },
    ]);
  }

  async function handleCreate() {
    if (hitos.length === 0 || creating) return;
    setCreating(true);
    try {
      await createFromWizard(meta, hitos);
      setStep(3);
      setTimeout(() => router.push('/metas'), 1200);
    } catch (err) {
      console.error('[wizard create]', err);
      setCreating(false);
    }
  }

  return (
    <div
      data-testid="wizard-overlay"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        data-testid="wizard-modal"
        style={{ background: 'var(--bg)', borderRadius: 16, width: 'min(700px, 95vw)', height: 'min(700px, 92vh)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.25)' }}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--line-2)', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{t(lang, 'wizardTitle')}</span>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-3)', padding: '0 4px', lineHeight: 1 }} aria-label={t(lang, 'close')}>
              ×
            </button>
          </div>
          <Stepper current={step} lang={lang} />
        </div>

        {/* Body */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div data-testid="wizard-step-1" style={{ display: 'none' }} />
            <StepChat messages={messages} streaming={streaming} onSend={handleSend} lang={lang} />
            <div style={{ borderTop: '1px solid var(--line-2)', padding: '12px 28px', display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={handleAdvanceToApprove} disabled={messages.filter((m) => m.role === 'user').length === 0}>
                {lang === 'en' ? 'Continue →' : 'Continuar →'}
              </Btn>
            </div>
          </div>
        )}

        {step === 1 && (
          <StepApprove meta={meta} onMetaChange={setMeta} onApprove={handleApproveMeta} lang={lang} />
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {loadingPropose ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--ink-3)', fontSize: 14 }}>
                <span className="spin" style={{
                  display: 'inline-block', width: 28, height: 28, borderRadius: '50%',
                  border: '2.5px solid var(--line)',
                  borderTopColor: 'var(--accent)',
                  borderRightColor: 'var(--accent)',
                  boxSizing: 'border-box',
                }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {lang === 'en' ? 'Agent is thinking' : 'El agente está pensando'}
                  <span style={{ display: 'inline-flex' }}>
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </span>
                </span>
              </div>
            ) : (
              <StepHitos
                hitos={hitos} onChange={setHitos}
                onAddOwn={handleAddOwnHito} onNext={handleCreate}
                lang={lang} creating={creating}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>{t(lang, 'stepDone')}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
              {lang === 'en' ? 'Redirecting to goals…' : 'Redirigiendo a metas…'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
