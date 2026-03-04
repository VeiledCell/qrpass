import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert Blob to File for OpenAI SDK
    const audioFile = new File([file], "recording.webm", { type: file.type });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("Transcription Error:", error);
    return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 500 });
  }
}
