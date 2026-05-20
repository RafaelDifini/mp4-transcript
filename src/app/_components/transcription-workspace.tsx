"use client";

import type { FileStatus, QueueItem } from "../_hooks/use-transcription-queue";
import { useTranscriptionQueue } from "../_hooks/use-transcription-queue";

const APP_FEATURES = ["Local", "Fila multipla", "Exporta .txt"] as const;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function downloadTxt(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/\.[^.]+$/, "") + ".txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: FileStatus }) {
  const map: Record<FileStatus, { label: string; cls: string }> = {
    pending: { label: "Na fila", cls: "status-pending" },
    processing: { label: "Transcrevendo", cls: "status-processing" },
    done: { label: "Concluido", cls: "status-done" },
    error: { label: "Erro", cls: "status-error" },
  };

  const { label, cls } = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${cls}`}
    >
      {label}
    </span>
  );
}

function WorkspaceHeader() {
  return (
    <header className="surface-panel-strong rounded-2xl px-5 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="tone-kicker flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-0)]" />
            MP4 para Texto
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Transcricao local, fila simples e revisao rapida.
          </h1>
          <p className="tone-body max-w-2xl text-sm leading-6">
            Carregue audio ou video, acompanhe o processamento e exporte o
            resultado sem sair da tela.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {APP_FEATURES.map((feature) => (
            <span key={feature} className="pill-muted rounded-full px-3 py-1.5">
              {feature}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

function SectionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="surface-panel rounded-2xl p-4 sm:p-5">{children}</section>;
}

function UploadSection({
  queueLength,
  doneCount,
  inputRef,
  isDragging,
  onInputChange,
  onDrop,
  onDragOver,
  onDragLeave,
}: {
  queueLength: number;
  doneCount: number;
  inputRef: React.RefObject<HTMLInputElement>;
  isDragging: boolean;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
}) {
  return (
    <SectionShell>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="tone-kicker text-[11px] font-semibold uppercase tracking-[0.2em]">
            Entrada
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Adicione arquivos para transcrever
          </h2>
          <p className="tone-body mt-1 text-sm">
            Suporta MP4, MOV, AVI, MKV, WebM, MP3, M4A, WAV e OGG.
          </p>
        </div>

        <div className="pill-muted hidden rounded-xl px-3 py-2 text-right text-xs sm:block">
          <div>{queueLength} na fila</div>
          <div>{doneCount} concluidos</div>
        </div>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          "rounded-2xl p-5 transition-colors duration-150 sm:p-6",
          isDragging
            ? "surface-dropzone surface-dropzone-active"
            : "surface-dropzone",
        ].join(" ")}
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="surface-subtle tone-kicker flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M12 16V5" strokeLinecap="round" />
                <path d="m7.5 9.5 4.5-4.5 4.5 4.5" strokeLinecap="round" />
                <path d="M5 18.5h14" strokeLinecap="round" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                Arraste arquivos aqui ou selecione manualmente
              </p>
              <p className="tone-body mt-1 text-sm leading-6">
                O processamento continua localmente. Nenhum arquivo e enviado
                para servicos externos.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={inputRef}
              type="file"
              name="mediaFiles"
              multiple
              accept="video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm,.mp3,.m4a,.wav,.ogg"
              className="sr-only"
              aria-label="Selecionar arquivos de video ou audio para transcricao"
              onChange={onInputChange}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn-primary focus-ring inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
            >
              Selecionar arquivos
            </button>
            <p className="tone-muted text-xs leading-5">
              Dica: voce pode adicionar varios arquivos antes de iniciar a fila.
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function QueueHeader({
  pendingCount,
  doneCount,
  isRunning,
  onStart,
}: {
  pendingCount: number;
  doneCount: number;
  isRunning: boolean;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border-0)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="tone-kicker text-[11px] font-semibold uppercase tracking-[0.2em]">
          Fila
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          Acompanhamento da transcricao
        </h2>
        <p className="tone-body mt-1 text-sm">
          Revise o status de cada arquivo e abra o texto quando a transcricao
          terminar.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={!pendingCount || isRunning}
        className={[
          "focus-ring inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
          !pendingCount || isRunning
            ? "cursor-not-allowed bg-[rgba(34,34,34,0.82)] text-[var(--text-2)]"
            : "btn-secondary",
        ].join(" ")}
      >
        {isRunning
          ? "Transcrevendo…"
          : pendingCount > 0
            ? `Transcrever ${pendingCount} arquivo${
                pendingCount > 1 ? "s" : ""
              }`
            : `${doneCount} concluido${doneCount > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

function EmptyQueueState() {
  return (
    <div className="surface-dropzone mt-4 rounded-2xl px-4 py-10 text-center">
      <p className="text-sm font-medium text-[var(--text-0)]">
        Nenhum arquivo carregado ainda
      </p>
      <p className="tone-muted mt-2 text-sm">
        Adicione arquivos acima para montar a fila de transcricao.
      </p>
    </div>
  );
}

function QueueCard({
  item,
  copiedId,
  expandedId,
  onToggleExpanded,
  onCopy,
  onRemove,
}: {
  item: QueueItem;
  copiedId: string | null;
  expandedId: string | null;
  onToggleExpanded: (id: string) => void;
  onCopy: (id: string, text: string) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const isExpanded = expandedId === item.id;

  return (
    <article className="surface-subtle rounded-2xl p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {item.file.name}
            </p>
            <p className="tone-muted mt-1 text-xs">{formatSize(item.file.size)}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {item.status === "done" && (
            <>
              <button
                type="button"
                onClick={() => onToggleExpanded(item.id)}
                className="btn-ghost focus-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {isExpanded ? "Ocultar texto" : "Ver texto"}
              </button>
              <button
                type="button"
                onClick={() => onCopy(item.id, item.text)}
                className="btn-ghost focus-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                {copiedId === item.id ? "Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={() => downloadTxt(item.file.name, item.text)}
                className="btn-ghost focus-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Exportar .txt
              </button>
            </>
          )}

          {item.status !== "processing" && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="btn-danger focus-ring rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              Remover
            </button>
          )}
        </div>

        {isExpanded && item.status === "done" && (
          <div className="transcript-surface rounded-xl p-3">
            <textarea
              readOnly
              value={item.text}
              rows={8}
              className="focus-ring w-full resize-y rounded-lg border border-[var(--border-0)] bg-[rgba(8,8,8,0.92)] px-3 py-3 text-sm leading-6 text-[var(--text-0)]"
            />
            <p className="tone-muted mt-2 text-right text-xs">
              {wordCount(item.text)} palavras · {item.text.length} caracteres
            </p>
          </div>
        )}

        {item.status === "error" && (
          <div className="status-error rounded-xl p-3">
            <pre className="whitespace-pre-wrap break-words text-xs leading-5">
              {item.error}
            </pre>
          </div>
        )}
      </div>
    </article>
  );
}

function QueueSection({
  queue,
  pendingCount,
  doneCount,
  isRunning,
  copiedId,
  expandedId,
  hasQueue,
  onStart,
  onToggleExpanded,
  onCopy,
  onRemove,
}: {
  queue: QueueItem[];
  pendingCount: number;
  doneCount: number;
  isRunning: boolean;
  copiedId: string | null;
  expandedId: string | null;
  hasQueue: boolean;
  onStart: () => void;
  onToggleExpanded: (id: string) => void;
  onCopy: (id: string, text: string) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  return (
    <SectionShell>
      <QueueHeader
        pendingCount={pendingCount}
        doneCount={doneCount}
        isRunning={isRunning}
        onStart={onStart}
      />

      {!hasQueue ? (
        <EmptyQueueState />
      ) : (
        <div className="mt-4 space-y-3">
          {queue.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              copiedId={copiedId}
              expandedId={expandedId}
              onToggleExpanded={onToggleExpanded}
              onCopy={onCopy}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </SectionShell>
  );
}

export function TranscriptionWorkspace() {
  const {
    queue,
    isRunning,
    isDragging,
    copiedId,
    expandedId,
    liveMessage,
    inputRef,
    pendingCount,
    doneCount,
    hasQueue,
    setIsDragging,
    handleInputChange,
    handleDrop,
    handleStart,
    handleCopy,
    removeItem,
    toggleExpanded,
  } = useTranscriptionQueue();

  return (
    <main className="min-h-screen bg-[var(--bg-0)] text-[var(--text-0)]">
      <div className="theme-app mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <p className="sr-only" aria-live="polite">
          {liveMessage}
        </p>

        <WorkspaceHeader />

        <UploadSection
          queueLength={queue.length}
          doneCount={doneCount}
          inputRef={inputRef}
          isDragging={isDragging}
          onInputChange={handleInputChange}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        />

        <QueueSection
          queue={queue}
          pendingCount={pendingCount}
          doneCount={doneCount}
          isRunning={isRunning}
          copiedId={copiedId}
          expandedId={expandedId}
          hasQueue={hasQueue}
          onStart={handleStart}
          onToggleExpanded={toggleExpanded}
          onCopy={handleCopy}
          onRemove={removeItem}
        />
      </div>
    </main>
  );
}
