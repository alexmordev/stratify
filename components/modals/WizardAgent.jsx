'use client';

import { useState, useEffect, useRef, useId } from 'react';
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
    t(lang, 'stepObjectives'),
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
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                opacity: isDisabled ? 0.35 : 1,
                minWidth: 60,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isDone || isActive ? 'var(--ink)' : 'var(--bg-2)',
                  border: isActive ? '2px solid var(--ink)' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: isDone || isActive ? 'white' : 'var(--ink-3)',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: isActive ? 'var(--ink)' : 'var(--ink-3)', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: i < current ? 'var(--ink)' : 'var(--line-2)',
                  margin: '0 4px',
                  marginBottom: 18,
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAgent ? 'flex-start' : 'flex-end',
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--ink-4)', paddingLeft: isAgent ? 4 : 0, paddingRight: isAgent ? 0 : 4 }}>
        {isAgent ? t(lang, 'agentLabel') : t(lang, 'youLabel')}
      </span>
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          borderRadius: isAgent ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
          background: isAgent ? 'var(--bg-2)' : 'var(--ink)',
          color: isAgent ? 'var(--ink)' : 'white',
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {content}
      </div>
    </div>
  );
}

// ─── Step 1: Chat ─────────────────────────────────────────────────────────────
function StepChat({ messages, streaming, onSend, lang }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streaming]);

  function handleSend() {
    const val = input.trim();
    if (!val || streaming) return;
    onSend(val);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '24px 28px',
        }}
      >
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} lang={lang} />
        ))}
        {streaming && (
          <ChatBubble role="assistant" content={streaming} lang={lang} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          borderTop: '1px solid var(--line-2)',
          padding: '16px 28px',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t(lang, 'inputPlaceholder')}
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            borderRadius: 8,
            border: '1px solid var(--line)',
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: 'inherit',
            background: 'var(--bg)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <Btn variant="primary" onClick={handleSend} disabled={!input.trim() || streaming}>
          {t(lang, 'send')}
        </Btn>
      </div>
    </div>
  );
}

// ─── Step 2: Approve Meta ─────────────────────────────────────────────────────
function StepApprove({ meta, onApprove, lang }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6 }}>
        Revisa el resumen de tu meta antes de continuar.
      </div>

      <div
        style={{
          background: 'var(--bg-2)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {meta?.title && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Título
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>{meta.title}</div>
          </div>
        )}
        {meta?.why && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Por qué
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{meta.why}</div>
          </div>
        )}
        {meta?.success && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Éxito cuando…
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{meta.success}</div>
          </div>
        )}
        {meta?.horizon && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Horizonte
            </div>
            <div className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{meta.horizon}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Btn variant="primary" size="lg" onClick={onApprove} style={{ width: '100%', justifyContent: 'center' }}>
          {t(lang, 'approveMeta')}
        </Btn>
      </div>
    </div>
  );
}

// ─── Step 3: Edit Objectives ──────────────────────────────────────────────────
function MetaField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

function ObjetivoRow({ obj, onChange, onRemove, lang }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleColorClick(colorId) {
    onChange({ ...obj, color: colorId });
  }

  function handleWeeklyLoadChange(e) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      onChange({ ...obj, weeklyLoad: val });
    }
  }

  const pal = palById(obj.color);
  const hasRichFields = obj.tipo || obj.conexion || obj.plazo || obj.siEntonces || obj.seguimiento;

  return (
    <div
      style={{
        background: 'var(--bg-2)',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Top row: dot + area badge + title + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <ColorDot
          data-testid={`obj-color-dot-${obj.id}`}
          color={pal.dot}
          size={10}
          style={{ marginTop: 3, flexShrink: 0 }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Area + tipo badges */}
          {(obj.area || obj.tipo) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {obj.area && (
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--ink-3)',
                  background: 'var(--bg-3, var(--line-2))', borderRadius: 4,
                  padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {obj.area}
                </span>
              )}
              {obj.tipo && (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: obj.tipo === 'Aprendizaje' || obj.tipo === 'Learning' ? 'oklch(0.45 0.12 250)' : 'oklch(0.45 0.12 150)',
                  background: obj.tipo === 'Aprendizaje' || obj.tipo === 'Learning' ? 'oklch(0.95 0.04 250)' : 'oklch(0.95 0.04 150)',
                  borderRadius: 4, padding: '1px 6px',
                }}>
                  {obj.tipo}
                </span>
              )}
              {obj.plazo && (
                <span style={{
                  fontSize: 10, color: 'var(--ink-3)',
                  background: 'var(--bg-3, var(--line-2))', borderRadius: 4,
                  padding: '1px 6px',
                }}>
                  {obj.plazo}
                </span>
              )}
            </div>
          )}
          {/* Title */}
          {editing ? (
            <textarea
              value={obj.title}
              onChange={(e) => onChange({ ...obj, title: e.target.value })}
              rows={3}
              style={{
                border: '1px solid var(--line)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 13,
                fontFamily: 'inherit',
                background: 'var(--bg)',
                color: 'var(--ink)',
                resize: 'vertical',
                width: '100%',
              }}
            />
          ) : (
            <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{obj.title}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            style={{ fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
          >
            {editing ? t(lang, 'save') : t(lang, 'edit')}
          </button>
          <button
            type="button"
            onClick={onRemove}
            style={{ fontSize: 11, color: 'oklch(0.5 0.15 25)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
          >
            {t(lang, 'delete')}
          </button>
        </div>
      </div>

      {/* Rich fields (collapsible) */}
      {hasRichFields && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              alignSelf: 'flex-start', fontSize: 11, color: 'var(--ink-3)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
            {expanded ? 'Ocultar detalles' : 'Ver detalles del objetivo'}
          </button>
          {expanded && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              borderTop: '1px solid var(--line-2)', paddingTop: 10,
            }}>
              <MetaField label="Conexión con la meta" value={obj.conexion} />
              <MetaField label="Si… Entonces…" value={obj.siEntonces} />
              <MetaField label="Seguimiento" value={obj.seguimiento} />
            </div>
          )}
        </>
      )}

      {/* Color swatches */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)', marginRight: 4 }}>{t(lang, 'color')}:</span>
        {PALETTE.map((p) => (
          <button
            key={p.id}
            type="button"
            data-testid={`color-swatch-${p.id}-${obj.id}`}
            onClick={() => handleColorClick(p.id)}
            title={p.id}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: p.dot,
              border: obj.color === p.id ? '2px solid var(--ink)' : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
            }}
          />
        ))}
      </div>

      {/* Weekly load */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t(lang, 'weeklyLoad')}:</span>
        <input
          type="number"
          data-testid={`weeklyload-input-${obj.id}`}
          min={1}
          step={1}
          value={obj.weeklyLoad}
          onChange={handleWeeklyLoadChange}
          style={{
            width: 56,
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '3px 8px',
            fontSize: 13,
            fontFamily: 'inherit',
            background: 'var(--bg)',
            color: 'var(--ink)',
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>h/sem</span>
      </div>
    </div>
  );
}

function StepObjetivos({ objetivos, onChange, onAddOwn, onCreate, lang, creating }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
        Edita los objetivos propuestos por el agente o añade los tuyos.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {objetivos.map((obj) => (
          <ObjetivoRow
            key={obj.id}
            obj={obj}
            onChange={(updated) => onChange(objetivos.map((o) => (o.id === updated.id ? updated : o)))}
            onRemove={() => onChange(objetivos.filter((o) => o.id !== obj.id))}
            lang={lang}
          />
        ))}
      </div>

      <Btn variant="secondary" onClick={onAddOwn}>
        + {t(lang, 'addOwn')}
      </Btn>

      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <Btn
          variant="primary"
          size="lg"
          disabled={objetivos.length === 0 || creating}
          onClick={onCreate}
          data-testid="wizard-create-btn"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {creating ? '…' : t(lang, 'createMeta')}
        </Btn>
      </div>
    </div>
  );
}

// ─── WizardAgent (main) ───────────────────────────────────────────────────────
let _tempIdCounter = 0;
function tempId() {
  return `obj-temp-${++_tempIdCounter}`;
}

export default function WizardAgent({
  onClose,
  // Test-only props for jumping to a specific step/state
  _testStep,
  _testMeta,
  _testObjetivos,
}) {
  const router = useRouter();
  const [lang, setLang] = useState('es');

  // Step: 0=Definir, 1=Acordar, 2=Objetivos, 3=Listo
  const [step, setStep] = useState(_testStep !== undefined ? _testStep : 0);

  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState('');
  const [meta, setMeta] = useState(_testMeta ?? null);
  const [objetivos, setObjetivos] = useState(_testObjetivos ?? []);
  const [creating, setCreating] = useState(false);
  const [loadingPropose, setLoadingPropose] = useState(false);

  // Sync test props when they change (for test scenarios)
  useEffect(() => {
    if (_testStep !== undefined) setStep(_testStep);
  }, [_testStep]);
  useEffect(() => {
    if (_testObjetivos !== undefined) setObjetivos(_testObjetivos);
  }, [_testObjetivos]);
  useEffect(() => {
    if (_testMeta !== undefined) setMeta(_testMeta);
  }, [_testMeta]);

  useEffect(() => {
    setLang(getLang());
    function handleLangChange() {
      setLang(getLang());
    }
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  // Send first agent message on mount (only when starting from step 0 normally)
  useEffect(() => {
    if (_testStep !== undefined) return;
    const greeting =
      lang === 'en'
        ? 'Hi! I\'m here to help you define your goal. What do you want to achieve?'
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
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreaming(full);
      }
      reader.releaseLock();

      setMessages((prev) => [...prev, { role: 'assistant', content: full }]);
      setStreaming('');

      // Auto-detect if agent has provided a meta summary (heuristic: after 4+ messages)
      if (newMessages.filter((m) => m.role === 'user').length >= 3) {
        extractMetaFromConversation(newMessages, full);
      }
    } catch (err) {
      console.error('[wizard chat]', err);
      setStreaming('');
    }
  }

  function extractMetaFromConversation(msgs, lastAgentMsg) {
    // Simple heuristic: build a meta from conversation context
    const userMessages = msgs.filter((m) => m.role === 'user').map((m) => m.content);
    setMeta((prev) => ({
      title: prev?.title ?? userMessages[0] ?? '',
      why: prev?.why ?? userMessages[1] ?? '',
      success: prev?.success ?? userMessages[2] ?? '',
      horizon: prev?.horizon ?? userMessages[3] ?? '',
      title_en: prev?.title_en ?? userMessages[0] ?? '',
      why_en: prev?.why_en ?? userMessages[1] ?? '',
      success_en: prev?.success_en ?? userMessages[2] ?? '',
      horizon_en: prev?.horizon_en ?? userMessages[3] ?? '',
    }));
  }

  function handleAdvanceToApprove() {
    // Build meta summary from conversation if not already set
    if (!meta) {
      const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content);
      setMeta({
        title: userMessages[0] ?? '',
        why: userMessages[1] ?? '',
        success: userMessages[2] ?? '',
        horizon: userMessages[3] ?? '',
        title_en: userMessages[0] ?? '',
        why_en: userMessages[1] ?? '',
        success_en: userMessages[2] ?? '',
        horizon_en: userMessages[3] ?? '',
      });
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
        body: JSON.stringify({ mode: 'propose', metaSummary: meta, lang }),
      });
      const data = await res.json();
      const proposed = (data.objetivos ?? []).map((o) => ({
        ...o,
        id: tempId(),
        weeklyLoad: Math.max(1, Math.floor(Number(o.weeklyLoad) || 1)),
      }));
      setObjetivos(proposed);
    } catch (err) {
      console.error('[wizard propose]', err);
    } finally {
      setLoadingPropose(false);
    }
  }

  function handleAddOwn() {
    setObjetivos((prev) => [
      ...prev,
      { id: tempId(), title: 'Nuevo objetivo', color: 'sand', weeklyLoad: 3 },
    ]);
  }

  async function handleCreate() {
    if (objetivos.length === 0 || creating) return;
    setCreating(true);
    try {
      await createFromWizard(meta, objetivos);
      setStep(3);
      setTimeout(() => {
        router.push('/objetivos');
      }, 1200);
    } catch (err) {
      console.error('[wizard create]', err);
      setCreating(false);
    }
  }

  return (
    <div
      data-testid="wizard-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        data-testid="wizard-modal"
        style={{
          background: 'var(--bg)',
          borderRadius: 16,
          width: 'min(680px, 95vw)',
          height: 'min(680px, 90vh)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: '1px solid var(--line-2)',
            padding: '20px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
              {t(lang, 'wizardTitle')}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                color: 'var(--ink-3)',
                padding: '0 4px',
                lineHeight: 1,
              }}
              aria-label={t(lang, 'close')}
            >
              ×
            </button>
          </div>
          <Stepper current={step} lang={lang} />
        </div>

        {/* Body */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div data-testid="wizard-step-1" style={{ display: 'none' }} />
            <StepChat
              messages={messages}
              streaming={streaming}
              onSend={handleSend}
              lang={lang}
            />
            <div style={{ borderTop: '1px solid var(--line-2)', padding: '12px 28px', display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={handleAdvanceToApprove} disabled={messages.filter((m) => m.role === 'user').length === 0}>
                Continuar →
              </Btn>
            </div>
          </div>
        )}

        {step === 1 && (
          <StepApprove meta={meta} onApprove={handleApproveMeta} lang={lang} />
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {loadingPropose ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
                Generando objetivos…
              </div>
            ) : (
              <StepObjetivos
                objetivos={objetivos}
                onChange={setObjetivos}
                onAddOwn={handleAddOwn}
                onCreate={handleCreate}
                lang={lang}
                creating={creating}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>
              {t(lang, 'stepDone')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
              Redirigiendo a objetivos…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
