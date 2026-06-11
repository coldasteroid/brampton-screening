'use client';

import { useEffect, useRef, useState } from 'react';

interface Attachment {
  key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  citations?: string[];
  toolsUsed?: string[];
}

const STARTERS: { label: string; text: string }[] = [
  {
    label: 'Look up a notice',
    text: 'Look up notice BRP-2026-001003 and compute its screening-review deadline.',
  },
  {
    label: 'Draft cancel reasoning',
    text: 'Draft Notice of Decision reasoning for cancelling a property-maintenance ticket where the resident was hospitalized during the cited period and provided medical records.',
  },
  {
    label: 'Fire-route severity',
    text: 'When can a fire-route violation be reduced under Brampton APS? Search the relevant by-law and walk me through the safety vs hardship balance.',
  },
  {
    label: 'Precedent: hardship',
    text: 'Show me recent decided reviews where the resident claimed financial hardship — how were they decided?',
  },
];

export default function OfficerAgentChat({ officerName }: { officerName: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  async function send(text: string) {
    const trimmed = text.trim();
    if ((!trimmed && pending.length === 0) || busy || uploading) return;
    setError(null);

    const attachments = pending.length > 0 ? pending : undefined;
    const next: Msg[] = [...messages, { role: 'user', content: trimmed, attachments }];
    setMessages(next);
    setInput('');
    setPending([]);
    setBusy(true);

    const groundedTicket =
      ticketId.trim() && /^BRP-\d{4}-\d{6}$/i.test(ticketId.trim())
        ? ticketId.trim().toUpperCase()
        : null;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'officer',
          messages: next.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          ticketId: groundedTicket,
        }),
      });
      if (!res.ok) throw new Error(`agent failed (${res.status})`);
      const data = (await res.json()) as { text: string; citations?: string[]; toolsUsed?: string[] };
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.text,
          citations: data.citations,
          toolsUsed: data.toolsUsed,
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      const res = await fetch('/api/agent/attachments', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}) as Record<string, unknown>);
      if (!res.ok) {
        const msg = (data as { error?: string }).error ?? `upload failed (${res.status})`;
        const rejected = (data as { rejected?: Array<{ filename: string; reason: string }> }).rejected;
        const detail = rejected?.map((r) => `${r.filename}: ${r.reason}`).join('; ');
        throw new Error(detail ? `${msg} — ${detail}` : msg);
      }
      const uploaded = (data as { files?: Attachment[] }).files ?? [];
      setPending((prev) => [...prev, ...uploaded].slice(0, 3));
      const rejected = (data as { rejected?: Array<{ filename: string; reason: string }> }).rejected;
      if (rejected && rejected.length) {
        setError(rejected.map((r) => `${r.filename}: ${r.reason}`).join('; '));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removePending(key: string) {
    setPending((p) => p.filter((a) => a.key !== key));
  }

  function clearConversation() {
    setMessages([]);
    setInput('');
    setPending([]);
    setError(null);
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col bg-surface">
      <header className="border-b border-line bg-surface-raised px-6 py-3.5">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fair-dark">
              Screening Officer · Agent
            </p>
            <p className="mt-0.5 truncate font-display text-base font-semibold text-ink">
              FairPlan Officer Agent
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <label htmlFor="ground" className="text-[11px] uppercase tracking-[0.12em] text-ink-subtle">
                Ground in notice
              </label>
              <input
                id="ground"
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="BRP-2026-001234"
                className="input w-44 px-2.5 py-1 font-mono text-xs"
              />
            </div>
            <button
              type="button"
              onClick={clearConversation}
              disabled={busy || (messages.length === 0 && pending.length === 0)}
              className="btn-ghost text-xs border border-line disabled:opacity-40"
            >
              New chat
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[860px] px-6 py-8">
          {messages.length === 0 && !busy ? (
            <EmptyState officerName={officerName} onSelect={send} />
          ) : (
            <ol className="space-y-6">
              {messages.map((m, i) => (
                <li key={i}>
                  <MessageBubble
                    role={m.role}
                    content={m.content}
                    attachments={m.attachments}
                    citations={m.citations}
                    toolsUsed={m.toolsUsed}
                  />
                </li>
              ))}
              {busy && (
                <li>
                  <MessageBubble role="assistant" content="" thinking />
                </li>
              )}
            </ol>
          )}
          {error && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-line bg-surface-raised"
      >
        <div className="mx-auto max-w-[860px] px-6 py-4">
          <div className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm focus-within:border-ink/40">
            {(pending.length > 0 || uploading) && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {pending.map((a) => (
                  <span
                    key={a.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunken px-2.5 py-1 text-xs text-ink"
                  >
                    <FileGlyph mime={a.mimeType} />
                    <span className="max-w-[14rem] truncate">{a.filename}</span>
                    <span className="text-[10px] text-ink-subtle">
                      {Math.round(a.sizeBytes / 1024)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removePending(a.key)}
                      aria-label={`Remove ${a.filename}`}
                      className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-ink-subtle hover:bg-line/40 hover:text-ink"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
                {uploading && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunken px-2.5 py-1 text-xs text-ink-soft">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle" />
                    uploading…
                  </span>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/heic,application/pdf"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || pending.length >= 3}
                aria-label="Attach files"
                title="Attach images or PDFs (up to 3)"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-ink/30 hover:text-ink disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M21.4 11.05 12.5 19.95a5.5 5.5 0 1 1-7.78-7.78l9.62-9.62a3.67 3.67 0 1 1 5.19 5.19l-9.42 9.42a1.83 1.83 0 0 1-2.6-2.6l8.43-8.43"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder="Ask about a by-law, draft reasoning, walk through a case…"
                className="max-h-48 flex-1 resize-none bg-transparent text-sm leading-relaxed text-ink placeholder:text-ink-subtle focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || uploading || (!input.trim() && pending.length === 0)}
                aria-label="Send"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-fair transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M12 19V5m0 0-6 6m6-6 6 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-subtle">
            Advisory only · the officer always has the final decision · Brampton APS only
          </p>
        </div>
      </form>
    </div>
  );
}

function EmptyState({
  officerName,
  onSelect,
}: {
  officerName: string;
  onSelect: (text: string) => void;
}) {
  return (
    <div className="py-10">
      <p className="font-display text-3xl font-semibold tracking-tight text-ink">
        Hi {officerName.split(' ')[0]} — what can I help you with?
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        I work only on Brampton APS — I can look up notices, pull screening reviews and evidence manifests,
        search the by-law corpus, find precedent decisions, compute the 15-day windows, and draft Notice of
        Decision reasoning. Attach images or PDFs with the paperclip; pin a notice in the header to ground the
        whole conversation in one case.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSelect(s.text)}
            className="card group flex flex-col gap-1.5 p-4 text-left transition hover:border-ink/30 hover:shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fair-dark">{s.label}</p>
            <p className="text-sm leading-relaxed text-ink-soft group-hover:text-ink">{s.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  attachments,
  citations,
  toolsUsed,
  thinking,
}: {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  citations?: string[];
  toolsUsed?: string[];
  thinking?: boolean;
}) {
  const isUser = role === 'user';
  return (
    <div className={isUser ? 'flex flex-col items-end gap-2' : 'flex flex-col gap-2'}>
      {!isUser && (
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-fair text-[10px] font-semibold">
            FP
          </span>
          Officer Agent
        </div>
      )}
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-2xl bg-ink px-4 py-3 text-sm leading-relaxed text-white whitespace-pre-line'
            : 'rounded-2xl bg-surface-raised border border-line px-5 py-4 text-sm leading-relaxed text-ink'
        }
      >
        {thinking ? (
          <span className="inline-flex items-center gap-1" aria-label="…">
            <Dot /> <Dot /> <Dot />
          </span>
        ) : isUser ? (
          content || <em className="text-white/60">(attachments only)</em>
        ) : (
          <RichText text={content} />
        )}
      </div>
      {isUser && attachments && attachments.length > 0 && (
        <div className="flex max-w-[80%] flex-wrap justify-end gap-1.5">
          {attachments.map((a) => (
            <span
              key={a.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-2.5 py-1 text-xs text-ink"
            >
              <FileGlyph mime={a.mimeType} />
              <span className="max-w-[14rem] truncate">{a.filename}</span>
              <span className="text-[10px] text-ink-subtle">{Math.round(a.sizeBytes / 1024)} KB</span>
            </span>
          ))}
        </div>
      )}
      {!isUser && !thinking && ((toolsUsed && toolsUsed.length > 0) || (citations && citations.length > 0)) && (
        <div className="flex flex-wrap gap-1.5">
          {toolsUsed?.map((t, i) => (
            <span
              key={`tool-${i}-${t}`}
              className="rounded-full bg-fair/10 px-2.5 py-0.5 font-mono text-[10px] text-fair-dark"
              title={`tool used: ${t}`}
            >
              ⚙ {t}
            </span>
          ))}
          {citations?.map((c) => (
            <span
              key={c}
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[10px] text-ink-soft"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FileGlyph({ mime }: { mime: string }) {
  const isImage = mime.startsWith('image/');
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-ink-subtle" fill="none" aria-hidden="true">
      {isImage ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <path
            d="m3 17 5-5 4 4 3-3 6 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path
            d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/**
 * Lightweight markdown renderer for the assistant's replies.
 * Supports: paragraphs, `## headings`, `- bullets`, `**bold**`, and `inline code`.
 */
function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paragraphBuffer: string[] = [];
  let key = 0;

  function flushList() {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key++} className="my-2 list-disc space-y-1 pl-5">
        {listBuffer.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }
  function flushPara() {
    if (paragraphBuffer.length === 0) return;
    blocks.push(
      <p key={key++} className="my-2 first:mt-0 last:mb-0 whitespace-pre-line">
        {inline(paragraphBuffer.join(' '))}
      </p>,
    );
    paragraphBuffer = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('## ')) {
      flushList();
      flushPara();
      blocks.push(
        <h3 key={key++} className="mt-3 mb-1.5 font-display text-base font-semibold text-ink">
          {inline(line.slice(3))}
        </h3>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ''));
    } else if (line.trim() === '') {
      flushList();
      flushPara();
    } else {
      flushList();
      paragraphBuffer.push(line);
    }
  }
  flushList();
  flushPara();
  return <>{blocks}</>;
}

function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let rest = text;
  let i = 0;
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/);
    const code = rest.match(/`([^`]+)`/);
    const nextMatch =
      bold && code ? (bold.index! < code.index! ? bold : code) : bold ?? code ?? null;
    if (!nextMatch) {
      parts.push(rest);
      break;
    }
    const idx = nextMatch.index!;
    if (idx > 0) parts.push(rest.slice(0, idx));
    if (nextMatch === bold) {
      parts.push(<strong key={i++}>{nextMatch[1]}</strong>);
    } else {
      parts.push(
        <code key={i++} className="rounded bg-surface-sunken px-1 py-0.5 font-mono text-[12px]">
          {nextMatch[1]}
        </code>,
      );
    }
    rest = rest.slice(idx + nextMatch[0].length);
  }
  return parts;
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle" />;
}
