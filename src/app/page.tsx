"use client";

import { useCallback, useRef, useState } from "react";

type FileStatus = "pending" | "processing" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  status: FileStatus;
  text: string;
  error: string;
}

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
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/\.[^.]+$/, "") + ".txt";
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: FileStatus }) {
  const map: Record<FileStatus, { label: string; cls: string }> = {
    pending:    { label: "Aguardando",    cls: "bg-gray-700 text-gray-300" },
    processing: { label: "Transcrevendo", cls: "bg-blue-900 text-blue-300 animate-pulse" },
    done:       { label: "Concluido",     cls: "bg-green-900 text-green-300" },
    error:      { label: "Erro",          cls: "bg-red-900 text-red-300" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function Home() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const items: QueueItem[] = Array.from(files).map((f) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      status: "pending",
      text: "",
      error: "",
    }));
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const transcribeFile = async (item: QueueItem): Promise<{ text: string; error: string }> => {
    const form = new FormData();
    form.append("file", item.file);
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok || data.error) return { text: "", error: data.error ?? "Erro desconhecido" };
    return { text: data.text ?? "", error: "" };
  };

  const handleStart = async () => {
    const pending = queue.filter((i) => i.status === "pending");
    if (!pending.length || isRunning) return;
    setIsRunning(true);

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i))
      );

      const { text, error } = await transcribeFile(item);

      setQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: error ? "error" : "done", text, error }
            : i
        )
      );
    }

    setIsRunning(false);
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingCount = queue.filter((i) => i.status === "pending").length;
  const doneCount    = queue.filter((i) => i.status === "done").length;
  const hasQueue     = queue.length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-2xl mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
          MP4 para Texto
        </h1>
        <p className="text-sm text-gray-400">
          Transcricao local com faster-whisper. Nenhum dado sai da maquina.
        </p>
      </div>

      <div className="w-full max-w-2xl mb-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={[
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-150",
            isDragging
              ? "border-blue-500 bg-blue-950/30"
              : "border-gray-700 bg-gray-900/40 hover:border-gray-500 hover:bg-gray-900/60",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="video/*,audio/*,.mp4,.mov,.avi,.mkv,.webm,.mp3,.m4a,.wav,.ogg"
            className="hidden"
            onChange={handleInputChange}
          />
          <p className="text-gray-300 text-sm">
            Arraste arquivos ou{" "}
            <span className="text-blue-400 underline underline-offset-2">clique para selecionar</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            MP4, MOV, AVI, MKV, WebM, MP3, M4A, WAV &mdash; multiplos arquivos suportados
          </p>
        </div>
      </div>

      {hasQueue && (
        <div className="w-full max-w-2xl mb-4 space-y-2">
          {queue.map((item) => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(item.file.size)}</p>
                </div>

                <StatusBadge status={item.status} />

                <div className="flex items-center gap-1 shrink-0">
                  {item.status === "done" && (
                    <>
                      <button
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      >
                        {expandedId === item.id ? "Ocultar" : "Ver"}
                      </button>
                      <button
                        onClick={() => handleCopy(item.id, item.text)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      >
                        {copiedId === item.id ? "Copiado!" : "Copiar"}
                      </button>
                      <button
                        onClick={() => downloadTxt(item.file.name, item.text)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                      >
                        .txt
                      </button>
                    </>
                  )}
                  {item.status !== "processing" && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-gray-800 hover:bg-red-900 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>

              {expandedId === item.id && item.status === "done" && (
                <div className="border-t border-gray-800 px-4 pb-4 pt-3">
                  <textarea
                    readOnly
                    value={item.text}
                    rows={8}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 leading-relaxed resize-y focus:outline-none focus:border-gray-500"
                  />
                  <p className="text-right text-xs text-gray-600 mt-1">
                    {wordCount(item.text)} palavras &middot; {item.text.length} caracteres
                  </p>
                </div>
              )}

              {item.status === "error" && (
                <div className="border-t border-red-900/50 px-4 pb-3 pt-2">
                  <pre className="text-xs text-red-400/80 whitespace-pre-wrap font-mono">
                    {item.error}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasQueue && (
        <div className="w-full max-w-2xl">
          <button
            onClick={handleStart}
            disabled={!pendingCount || isRunning}
            className={[
              "w-full py-3 px-6 rounded-xl text-sm font-medium transition-all duration-150",
              !pendingCount || isRunning
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer",
            ].join(" ")}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Transcrevendo...
              </span>
            ) : pendingCount > 0 ? (
              `Transcrever ${pendingCount} arquivo${pendingCount > 1 ? "s" : ""}`
            ) : (
              `${doneCount} arquivo${doneCount > 1 ? "s" : ""} concluido${doneCount > 1 ? "s" : ""}`
            )}
          </button>

          {isRunning && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Processando sequencialmente. Nao feche a janela.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
