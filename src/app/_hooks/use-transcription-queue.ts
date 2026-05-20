"use client";

import { useCallback, useRef, useState } from "react";

export type FileStatus = "pending" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  file: File;
  status: FileStatus;
  text: string;
  error: string;
}

function createQueueItem(file: File): QueueItem {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    file,
    status: "pending",
    text: "",
    error: "",
  };
}

async function transcribeFile(
  item: QueueItem
): Promise<{ text: string; error: string }> {
  const form = new FormData();
  form.append("file", item.file);

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
  });
  const data = await response.json();

  if (!response.ok || data.error) {
    return { text: "", error: data.error ?? "Erro desconhecido" };
  }

  return { text: data.text ?? "", error: "" };
}

export function useTranscriptionQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("Nenhum arquivo na fila.");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const items = Array.from(files).map(createQueueItem);

    if (!items.length) return;

    setQueue((prev) => [...prev, ...items]);
    setLiveMessage(
      `${items.length} arquivo${items.length > 1 ? "s" : ""} adicionado${
        items.length > 1 ? "s" : ""
      } a fila.`
    );
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length) addFiles(event.target.files);
      event.target.value = "";
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (event.dataTransfer.files?.length) {
        addFiles(event.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const removeItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setExpandedId((prev) => (prev === id ? null : prev));
    setLiveMessage("Arquivo removido da fila.");
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleCopy = useCallback(async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setLiveMessage("Texto copiado para a area de transferencia.");

    window.setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  }, []);

  const handleStart = useCallback(async () => {
    const pending = queue.filter((item) => item.status === "pending");
    if (!pending.length || isRunning) return;

    setIsRunning(true);
    setLiveMessage(
      `Processamento iniciado para ${pending.length} arquivo${
        pending.length > 1 ? "s" : ""
      }.`
    );

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? { ...current, status: "processing" }
            : current
        )
      );

      setLiveMessage(`Transcrevendo ${item.file.name}.`);
      const { text, error } = await transcribeFile(item);

      setQueue((prev) =>
        prev.map((current) =>
          current.id === item.id
            ? { ...current, status: error ? "error" : "done", text, error }
            : current
        )
      );

      setLiveMessage(
        error ? `Falha em ${item.file.name}.` : `${item.file.name} concluido.`
      );
    }

    setIsRunning(false);
  }, [isRunning, queue]);

  const pendingCount = queue.filter((item) => item.status === "pending").length;
  const doneCount = queue.filter((item) => item.status === "done").length;
  const hasQueue = queue.length > 0;

  return {
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
  };
}
