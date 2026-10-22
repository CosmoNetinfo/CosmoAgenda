import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    const contentType = request.headers.get("content-type") || "";

    let transcriptionText = "";

    // 1. Trascrizione Audio o ricezione testo diretto
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioFile = formData.get("audio") as Blob | null;

      if (!audioFile) {
        return NextResponse.json({ error: "Nessun file audio inviato" }, { status: 400 });
      }

      if (!groqApiKey) {
        return NextResponse.json(
          {
            error:
              "GROQ_API_KEY non configurata sul server. Inseriscila nel file .env.local per abilitare Whisper.",
          },
          { status: 503 }
        );
      }

      // Invio a Groq Whisper (whisper-large-v3-turbo)
      const groqFormData = new FormData();
      groqFormData.append("file", audioFile, "audio.webm");
      groqFormData.append("model", "whisper-large-v3-turbo");
      groqFormData.append("language", "it");
      groqFormData.append("response_format", "json");

      const whisperRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: groqFormData,
      });

      if (!whisperRes.ok) {
        const whisperErr = await whisperRes.text();
        console.error("Errore Groq Whisper:", whisperErr);
        return NextResponse.json(
          { error: `Errore nella trascrizione Whisper: ${whisperErr}` },
          { status: whisperRes.status }
        );
      }

      const whisperData = await whisperRes.json();
      transcriptionText = whisperData.text || "";
    } else {
      const jsonBody = await request.json();
      transcriptionText = jsonBody.text || "";
    }

    if (!transcriptionText.trim()) {
      return NextResponse.json({ error: "Trascrizione vuota" }, { status: 400 });
    }

    // 2. Estrazione strutturata JSON con modello Llama di Groq
    const today = new Date().toISOString().slice(0, 10);
    const dayOfWeek = new Date().toLocaleDateString("it-IT", { weekday: "long" });

    let extracted: any = null;

    if (groqApiKey) {
      const systemPrompt = `Sei l'assistente IA dell'agenda "Orbita Agent" di Cosmonet.
Oggi è ${dayOfWeek}, data: ${today}.
Dato il testo dettato dall'utente in italiano, estrai i campi dell'attività e rispondi ESCLUSIVAMENTE con un oggetto JSON valido (senza testo introduttivo, senza markdown o blocchi di codice).

Schema JSON richiesto:
{
  "title": "stringa chiara con l'attività (es. Scrivere articolo su IA, Call con Daniele)",
  "date": "YYYY-MM-DD (calcola la data esatta se l'utente dice 'domani', 'venerdì prossimo', 'tra due giorni', default oggi ${today})",
  "time": "HH:MM o null (se specificato un orario, es. '15:30')",
  "kind": "uno tra: 'articolo', 'vignetta', 'lo-sapevi-che', 'consiglio-rapido', 'flash-news', 'call', 'app', 'sito', 'social', 'altro'",
  "project": "stringa o null (se menzionato es. 'Cosmonet', 'Solfège')",
  "priority": "uno tra: 'bassa', 'normale', 'alta' (default: 'normale')",
  "notes": "stringa con eventuali dettagli secondari o null"
}`;

      const llamaRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcriptionText },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (llamaRes.ok) {
        const llamaData = await llamaRes.json();
        const contentStr = llamaData.choices?.[0]?.message?.content || "{}";
        try {
          extracted = JSON.parse(contentStr);
        } catch {
          extracted = null;
        }
      }
    }

    // Fallback euristico se Llama non è disponibile o parsing fallito
    if (!extracted) {
      extracted = {
        title: transcriptionText,
        date: today,
        time: null,
        kind: "altro",
        project: null,
        priority: "normale",
        notes: null,
      };

      // Riconoscimento base del tipo
      const lower = transcriptionText.toLowerCase();
      if (lower.includes("articolo")) extracted.kind = "articolo";
      else if (lower.includes("vignetta")) extracted.kind = "vignetta";
      else if (lower.includes("call") || lower.includes("chiamata")) extracted.kind = "call";
      else if (lower.includes("social") || lower.includes("post")) extracted.kind = "social";
      else if (lower.includes("lo sapevi che")) extracted.kind = "lo-sapevi-che";
      else if (lower.includes("consiglio")) extracted.kind = "consiglio-rapido";

      // Progetti
      if (lower.includes("cosmonet")) extracted.project = "Cosmonet";
      if (lower.includes("solfège") || lower.includes("solfege")) extracted.project = "Solfège";

      // Priorità
      if (lower.includes("urgente") || lower.includes("alta")) extracted.priority = "alta";
    }

    return NextResponse.json({
      transcription: transcriptionText,
      extracted,
    });
  } catch (error: any) {
    console.error("Errore API voice:", error);
    return NextResponse.json(
      { error: error.message || "Errore elaborazione vocale" },
      { status: 500 }
    );
  }
}
