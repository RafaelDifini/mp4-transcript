import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

export const maxDuration = 300;

const WHISPER_SERVER_URL =
  process.env.WHISPER_SERVER_URL ?? "http://127.0.0.1:8000";

async function checkWhisperServer(): Promise<boolean> {
  try {
    const res = await fetch(`${WHISPER_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const tmpDir = os.tmpdir();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inputPath = join(tmpDir, `transcript_${id}_input`);
  const wavPath = join(tmpDir, `transcript_${id}.wav`);

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado. Use o campo 'file' no FormData." },
        { status: 400 }
      );
    }

    const serverUp = await checkWhisperServer();
    if (!serverUp) {
      return NextResponse.json(
        {
          error:
            "Servidor de transcricao nao esta rodando.\n\nInicie com: start.bat (Windows) ou ./start.sh (macOS/Linux)",
        },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    try {
      await execAsync(
        `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}"`,
        { timeout: 120_000 }
      );
    } catch (ffmpegErr) {
      return NextResponse.json(
        {
          error: `ffmpeg falhou na conversao. Verifique se o ffmpeg esta instalado e se o arquivo e um video valido.\n\nDetalhes: ${String(ffmpegErr)}`,
        },
        { status: 422 }
      );
    }

    const wavBytes = await readFile(wavPath);
    const formData = new FormData();
    const blob = new Blob([wavBytes], { type: "audio/wav" });
    formData.append("file", blob, "audio.wav");

    const whisperRes = await fetch(`${WHISPER_SERVER_URL}/transcribe`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(270_000),
    });

    if (!whisperRes.ok) {
      const errBody = await whisperRes.text();
      return NextResponse.json(
        { error: `Erro no servidor de transcricao (${whisperRes.status}):\n${errBody}` },
        { status: 500 }
      );
    }

    const data = (await whisperRes.json()) as { text?: string; detail?: string };

    if (data.detail) {
      return NextResponse.json({ error: data.detail }, { status: 500 });
    }

    return NextResponse.json({ text: data.text ?? "" });
  } catch (err) {
    console.error("[transcribe] erro inesperado:", err);
    return NextResponse.json(
      { error: `Erro interno: ${String(err)}` },
      { status: 500 }
    );
  } finally {
    await Promise.allSettled([
      unlink(inputPath).catch(() => {}),
      unlink(wavPath).catch(() => {}),
    ]);
  }
}
