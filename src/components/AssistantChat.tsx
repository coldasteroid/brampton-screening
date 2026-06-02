'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { t, type Lang } from '~/lib/i18n';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  lang: Lang;
}

export default function AssistantChat({ lang }: Props) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ground the chat in the notice being viewed, if any (/ticket/BRP-2026-000123).
  const ticketId = pathname.match(/\/ticket\/(BRP-\d{4}-\d{6})/i)?.[1]?.toUpperCase() ?? null;

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(false);
    const next: Msg[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, lang, ticketId }),
      });
      if (!res.ok) throw new Error(`chat failed (${res.status})`);
      const data = (await res.json()) as { text: string };
      setMessages((m) => [...m, { role: 'assistant', content: data.text }]);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const starters: string[] = [
    t(lang, 'assistant.starter_options'),
    t(lang, 'assistant.starter_review'),
    t(lang, 'assistant.starter_plan'),
  ];

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t(lang, 'assistant.title')}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-fair shadow-lg transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-fair/60"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path
              d="M21 11.5a8.5 8.5 0 0 1-12.2 7.6L3 21l1.9-5.8A8.5 8.5 0 1 1 21 11.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-2xl">
          {/* Header */}
          <div className="bg-ink px-5 py-4 text-white">
            <p className="font-display text-base font-semibold tracking-tight">{t(lang, 'assistant.title')}</p>
            <p className="mt-0.5 text-xs text-white/70">{t(lang, 'assistant.subtitle')}</p>
          </div>

          {/* Transcript */}
          <div ref={scrollRef} className="flex max-h-[50vh] min-h-[14rem] flex-col gap-3 overflow-y-auto px-4 py-4">
            <Bubble role="assistant">{t(lang, 'assistant.greeting')}</Bubble>
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role}>
                {m.content}
              </Bubble>
            ))}
            {busy && (
              <Bubble role="assistant">
                <span className="inline-flex gap-1" aria-label="…">
                  <Dot /> <Dot /> <Dot />
                </span>
              </Bubble>
            )}
            {error && <p className="px-1 text-xs text-danger">{t(lang, 'assistant.error')}</p>}

            {messages.length === 0 && !busy && (
              <div className="mt-1 flex flex-wrap gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft transition hover:border-ink/40 hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="border-t border-line p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder={t(lang, 'assistant.placeholder')}
                className="input max-h-28 flex-1 resize-none py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="btn-primary shrink-0 px-3 py-2 text-sm disabled:opacity-50"
              >
                {t(lang, 'assistant.send')}
              </button>
            </div>
            <p className="mt-2 px-1 text-[11px] leading-snug text-ink-subtle">{t(lang, 'assistant.disclaimer')}</p>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          'max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ' +
          (isUser ? 'bg-ink text-white' : 'bg-surface-sunken text-ink')
        }
      >
        {children}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle" />;
}
