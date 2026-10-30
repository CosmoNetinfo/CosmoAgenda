import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { timingSafeEqual } from "crypto";
import { REPEAT_RULE_REGEX, CONTENT_KINDS, nextRepeatDate, buildNextTask } from "@/lib/repeat";

// Server MCP remoto per Claude, Grok e assistenti IA
// Trasporto HTTP Streamable / JSON-RPC 2.0 conforme alle specifiche MCP 2024-11-05

const MCP_TOOLS = [
  {
    name: "add_task",
    description: "Aggiunge una nuova attività nell'agenda Orbita Agent",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Cosa c'è da fare (titolo dell'attività)",
        },
        date: {
          type: "string",
          description: "Data in cui va fatta l'attività nel formato YYYY-MM-DD (es. 2026-10-23)",
        },
        time: {
          type: "string",
          description: "Ora facoltativa nel formato HH:MM (es. 15:30)",
        },
        kind: {
          type: "string",
          enum: [
            "articolo",
            "vignetta",
            "lo-sapevi-che",
            "consiglio-rapido",
            "flash-news",
            "call",
            "app",
            "sito",
            "social",
            "altro",
          ],
          description: "Tipo di attività",
        },
        project: {
          type: "string",
          description: "Nome del progetto (es. Cosmonet, Solfège)",
        },
        priority: {
          type: "string",
          enum: ["bassa", "normale", "alta"],
          description: "Livello di priorità (default: normale)",
        },
        notes: {
          type: "string",
          description: "Note, dettagli o link facoltativi",
        },
        link: {
          type: "string",
          description: "Link dell'articolo/contenuto da pubblicare (coda di pubblicazione)",
        },
        social_text: {
          type: "string",
          description: "Testo del post per i social",
        },
        pub_status: {
          type: "string",
          enum: ["da_preparare", "pronto", "pubblicato"],
          description: "Stato nella coda di pubblicazione (default da_preparare per articolo, vignetta, lo-sapevi-che, consiglio-rapido, flash-news, social)",
        },
        repeat_rule: {
          type: "string",
          description: "Ripetizione: 'daily' oppure 'weekly:2,5' (0=domenica ... 6=sabato). Alla chiusura dell'attività si crea la successiva.",
        },
      },
      required: ["title", "date"],
    },
  },
  {
    name: "list_tasks",
    description: "Elenca le attività filtrate per intervallo di date, stato o progetto",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Data inizio intervallo (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          description: "Data fine intervallo (YYYY-MM-DD)",
        },
        status: {
          type: "string",
          enum: ["all", "todo", "done", "skipped"],
          description: "Filtra per stato (default: todo)",
        },
        project: {
          type: "string",
          description: "Filtra per nome progetto",
        },
        kind: {
          type: "string",
          description: "Filtra per tipo di attività",
        },
        pub_status: {
          type: "string",
          enum: ["in_coda", "da_preparare", "pronto", "pubblicato"],
          description: "Coda di pubblicazione: in_coda = da_preparare + pronto",
        },
      },
    },
  },
  {
    name: "get_day",
    description: "Restituisce tutte le attività di una singola giornata, ordinate per orario",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Data da consultare (YYYY-MM-DD)",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "update_task",
    description: "Modifica i dettagli di un'attività esistente",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID univoco UUID dell'attività",
        },
        title: { type: "string" },
        date: { type: "string" },
        time: { type: "string" },
        kind: { type: "string" },
        project: { type: "string" },
        priority: { type: "string", enum: ["bassa", "normale", "alta"] },
        notes: { type: "string" },
        status: { type: "string", enum: ["todo", "done", "skipped"] },
        link: { type: "string" },
        social_text: { type: "string" },
        pub_status: { type: "string", enum: ["da_preparare", "pronto", "pubblicato"] },
        repeat_rule: { type: "string", description: "'daily', 'weekly:2,5' oppure stringa vuota per toglierla" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "postpone_task",
    description:
      "Posticipa un'attività a un'altra data (tiene il conto di quante volte è stata rimandata). Usa to_date oppure days.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "ID UUID dell'attività" },
        to_date: { type: "string", description: "Nuova data YYYY-MM-DD" },
        days: { type: "number", description: "Giorni da aggiungere alla data attuale (es. 1 = domani rispetto alla data dell'attività)" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "postpone_day",
    description:
      "Posticipa in blocco le attività ancora da fare di un giorno (o di un intervallo). Per sicurezza, chiedere conferma all'utente prima di usarlo.",
    inputSchema: {
      type: "object",
      properties: {
        from_date: { type: "string", description: "Giorno di partenza YYYY-MM-DD" },
        to_date: { type: "string", description: "Giorno di arrivo YYYY-MM-DD" },
        end_date: { type: "string", description: "Facoltativo: ultimo giorno dell'intervallo di partenza" },
        keep_high_priority: { type: "boolean", description: "Se true lascia dove sono le attività con priorità alta" },
      },
      required: ["from_date", "to_date"],
    },
  },
  {
    name: "complete_task",
    description: "Segna un'attività come completata (done)",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID univoco dell'attività da segnare completata",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "skip_task",
    description: "Segna un'attività come saltata (skipped)",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID univoco dell'attività da saltare",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "add_note",
    description: "Aggiunge o accoda un appunto/nota a un'attività esistente",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID dell'attività",
        },
        note: {
          type: "string",
          description: "Testo della nota da aggiungere",
        },
      },
      required: ["task_id", "note"],
    },
  },
  {
    name: "add_file",
    description: "Allega un file Markdown (.md) a un'attività (max 200 KB)",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID UUID dell'attività a cui allegare il file (alias: 'attivita')",
        },
        attivita: {
          type: "string",
          description: "Alias di task_id",
        },
        name: {
          type: "string",
          description: "Nome del file, deve terminare con .md (es. bozza.md, alias: 'nome')",
        },
        nome: {
          type: "string",
          description: "Alias di name",
        },
        content_md: {
          type: "string",
          description: "Contenuto Markdown in formato testo (max 200 KB, alias: 'contenuto')",
        },
        contenuto: {
          type: "string",
          description: "Alias di content_md",
        },
      },
      required: [],
    },
  },
  {
    name: "list_files",
    description: "Elenca i file Markdown allegati a un'attività o all'intera agenda",
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "string",
          description: "ID dell'attività (opzionale, alias: 'attivita')",
        },
        attivita: {
          type: "string",
          description: "Alias di task_id",
        },
      },
    },
  },
  {
    name: "get_file",
    description: "Restituisce il contenuto completo di un file Markdown allegato tramite il suo ID",
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "string",
          description: "ID UUID del file allegato",
        },
      },
      required: ["file_id"],
    },
  },
  {
    name: "update_file",
    description: "Modifica il contenuto o il nome di un file Markdown (.md) esistente (max 200 KB)",
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "string",
          description: "ID UUID del file da modificare",
        },
        content_md: {
          type: "string",
          description: "Nuovo contenuto Markdown (alias: 'contenuto')",
        },
        contenuto: {
          type: "string",
          description: "Alias di content_md",
        },
        name: {
          type: "string",
          description: "Nuovo nome del file con estensione .md (alias: 'nome')",
        },
        nome: {
          type: "string",
          description: "Alias di name",
        },
      },
      required: ["file_id"],
    },
  },
  {
    name: "add_idea",
    description: "Aggiunge uno o più link alla sezione Idee (evita duplicati)",
    inputSchema: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          items: { type: "string" },
          description: "Array di link URL da salvare",
        },
        url: {
          type: "string",
          description: "Singolo link URL",
        },
        project: {
          type: "string",
          enum: ["articolo-cosmonet", "vignetta", "lo-sapevi-che", "altro"],
          description: "Progetto di destinazione (default: articolo-cosmonet)",
        },
        title: {
          type: "string",
          description: "Titolo opzionale, usato solo con un singolo link (se omesso si usa il dominio)",
        },
        note: {
          type: "string",
          description: "Nota o appunto opzionale",
        },
      },
    },
  },
  {
    name: "list_ideas",
    description: "Elenca le idee salvate con filtro opzionale per stato e progetto",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["tutte", "nuova", "in_lavorazione", "pronta", "scartata"],
          description: "Filtra per stato (default: tutte)",
        },
        project: {
          type: "string",
          enum: ["tutti", "articolo-cosmonet", "vignetta", "lo-sapevi-che", "altro"],
          description: "Filtra per progetto",
        },
      },
    },
  },
  {
    name: "update_idea",
    description: "Modifica stato, nota o collega un'idea a un'attività",
    inputSchema: {
      type: "object",
      properties: {
        idea_id: {
          type: "string",
          description: "ID UUID dell'idea da aggiornare",
        },
        status: {
          type: "string",
          enum: ["nuova", "in_lavorazione", "pronta", "scartata"],
        },
        note: {
          type: "string",
        },
        task_id: {
          type: "string",
          description: "ID UUID dell'attività collegata",
        },
      },
      required: ["idea_id"],
    },
  },
];

// Verifica del token segreto (nessun valore di riserva: senza variabile d'ambiente il server resta chiuso)
function verifyToken(token: string): boolean {
  const expectedToken = process.env.MCP_AUTH_TOKEN;
  if (!expectedToken || expectedToken.length < 32) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expectedToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

// UUID del proprietario dell'agenda (richiesto per gli insert con admin client,
// perché auth.uid() vale null quando si usa la service role key)
function getOwnerUserId(): string {
  const uid = process.env.ORBITA_USER_ID;
  if (!uid) throw new Error("ORBITA_USER_ID non configurata: impossibile operare sui dati");
  return uid;
}

// Verifica che l'attività appartenga al proprietario (il client admin ignora la RLS)
async function assertTaskOwned(supabase: any, taskId: string, ownerUserId: string) {
  const { data } = await supabase.from("tasks").select("id").eq("id", taskId).eq("user_id", ownerUserId).maybeSingle();
  if (!data) throw new Error("Attività non trovata");
}

// Se l'attività ripete, crea la prossima occorrenza (senza duplicati)
async function spawnNextOccurrence(supabase: any, task: any) {
  if (!task?.repeat_rule) return null;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const next = nextRepeatDate(task.date, task.repeat_rule, today);
  if (!next) return null;
  const { data: dup } = await supabase
    .from("tasks").select("id").eq("user_id", task.user_id).eq("title", task.title).eq("date", next).limit(1);
  if (dup && dup.length > 0) return null;
  const { data } = await supabase.from("tasks").insert(buildNextTask(task, next)).select().single();
  return data || null;
}

// Handler per l'esecuzione degli strumenti
async function executeTool(name: string, args: any) {
  const supabase = createAdminClient();
  const ownerUserId = getOwnerUserId();

  switch (name) {
    case "add_task": {
      const { title, date, time, kind, project, priority, notes, link, social_text, pub_status, repeat_rule } = args;
      if (repeat_rule && !REPEAT_RULE_REGEX.test(repeat_rule)) throw new Error("repeat_rule non valida: usa 'daily' o 'weekly:2,5'");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: ownerUserId,
          title,
          date,
          time: time || null,
          kind: kind || "altro",
          project: project || null,
          priority: priority || "normale",
          notes: notes || null,
          link: link || null,
          social_text: social_text || null,
          pub_status: pub_status || (CONTENT_KINDS.includes(kind || "altro") ? "da_preparare" : null),
          repeat_rule: repeat_rule || null,
          status: "todo",
          created_by: "claude",
        })
        .select()
        .single();

      if (error) throw error;

      // Invia notifica push nativa immediata (stile messaggio WhatsApp)
      try {
        const timeStr = data.time ? ` alle ${data.time.substring(0, 5)}` : "";
        sendPushToUser(ownerUserId, {
          title: "👾 C'è da fare una cosa!",
          body: `"${data.title}" per il ${data.date}${timeStr}`,
          url: "/",
        }).catch((e) => console.error("Errore notifica push MCP:", e));
      } catch (pushErr) {
        // Non bloccare la risposta MCP se l'invio push fallisce
      }

      return {
        success: true,
        message: `Attività aggiunta: "${data.title}" per il giorno ${data.date}`,
        task: data,
      };
    }

    case "list_tasks": {
      const { start_date, end_date, status, project, kind, pub_status } = args;
      let query = supabase.from("tasks").select("*").eq("user_id", ownerUserId);

      if (start_date) query = query.gte("date", start_date);
      if (end_date) query = query.lte("date", end_date);
      if (status && status !== "all") query = query.eq("status", status);
      if (project) query = query.ilike("project", `%${project}%`);
      if (kind) query = query.eq("kind", kind);
      if (pub_status === "in_coda") query = query.in("pub_status", ["da_preparare", "pronto"]);
      else if (pub_status) query = query.eq("pub_status", pub_status);

      query = query.order("date", { ascending: true }).order("time", { ascending: true, nullsFirst: false });

      const { data, error } = await query;
      if (error) throw error;
      return { count: data?.length || 0, tasks: data || [] };
    }

    case "get_day": {
      const { date } = args;
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", ownerUserId)
        .eq("date", date)
        .order("time", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return {
        date,
        total: data?.length || 0,
        completed: data?.filter((t) => t.status === "done").length || 0,
        tasks: data || [],
      };
    }

    case "update_task": {
      const { task_id, ...rest } = args;
      const allowed = ["title", "notes", "date", "time", "kind", "project", "priority", "status", "link", "social_text", "pub_status", "repeat_rule"];
      const updates: Record<string, any> = {};
      for (const k of allowed) if (rest[k] !== undefined) updates[k] = rest[k] === "" ? null : rest[k];
      if (updates.title === null) delete updates.title;
      if (updates.repeat_rule && !REPEAT_RULE_REGEX.test(updates.repeat_rule)) throw new Error("repeat_rule non valida: usa 'daily' o 'weekly:2,5'");
      if (updates.pub_status === null) delete updates.pub_status;
      if (updates.pub_status === "pubblicato" && !updates.status) updates.status = "done";
      if (updates.date && rest.date && updates.date !== undefined) {
        // cambio data a mano = posticipo/spostamento: tienilo tracciato
        const { data: cur } = await supabase.from("tasks").select("date, original_date, postponed_count").eq("id", task_id).eq("user_id", ownerUserId).single();
        if (cur && updates.date > cur.date) {
          updates.original_date = cur.original_date || cur.date;
          updates.postponed_count = (cur.postponed_count || 0) + 1;
        }
      }
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", task_id)
        .eq("user_id", ownerUserId)
        .select()
        .single();

      if (error) throw error;
      let next_task = null;
      if (data.status === "done" || data.status === "skipped") next_task = await spawnNextOccurrence(supabase, data);
      return { success: true, task: data, next_task };
    }

    case "postpone_task": {
      const { task_id, to_date, days } = args;
      const { data: cur, error: e1 } = await supabase
        .from("tasks").select("date, original_date, postponed_count, status")
        .eq("id", task_id).eq("user_id", ownerUserId).single();
      if (e1) throw e1;
      let target = to_date as string | undefined;
      if (!target && typeof days === "number") {
        const d = new Date(`${cur.date}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + days);
        target = d.toISOString().slice(0, 10);
      }
      if (!target || !/^\d{4}-\d{2}-\d{2}$/.test(target)) throw new Error("Indicare to_date (YYYY-MM-DD) oppure days");
      const { data, error } = await supabase
        .from("tasks")
        .update({
          date: target,
          original_date: cur.original_date || cur.date,
          postponed_count: (cur.postponed_count || 0) + 1,
        })
        .eq("id", task_id).eq("user_id", ownerUserId)
        .select().single();
      if (error) throw error;
      return { success: true, message: `"${data.title}" posticipata al ${target} (rimandata ${data.postponed_count} volte)`, task: data };
    }

    case "postpone_day": {
      const { from_date, to_date, end_date, keep_high_priority } = args;
      let q = supabase.from("tasks").select("id, title, date, priority, original_date, postponed_count")
        .eq("user_id", ownerUserId).eq("status", "todo").gte("date", from_date).lte("date", end_date || from_date);
      if (keep_high_priority) q = q.neq("priority", "alta");
      const { data: list, error: e1 } = await q;
      if (e1) throw e1;
      const moved: any[] = [];
      for (const t of list || []) {
        if (t.date === to_date) continue;
        const { error } = await supabase.from("tasks").update({
          date: to_date,
          original_date: t.original_date || t.date,
          postponed_count: (t.postponed_count || 0) + 1,
        }).eq("id", t.id).eq("user_id", ownerUserId);
        if (!error) moved.push({ id: t.id, title: t.title });
      }
      return { success: true, moved_count: moved.length, to_date, moved };
    }

    case "complete_task": {
      const { task_id } = args;
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "done", done_at: new Date().toISOString() })
        .eq("id", task_id)
        .eq("user_id", ownerUserId)
        .select()
        .single();

      if (error) throw error;
      const next_task = await spawnNextOccurrence(supabase, data);
      return { success: true, message: `Attività "${data.title}" completata!${next_task ? ` Prossima: ${next_task.date}` : ""}`, task: data, next_task };
    }

    case "skip_task": {
      const { task_id } = args;
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "skipped" })
        .eq("id", task_id)
        .eq("user_id", ownerUserId)
        .select()
        .single();

      if (error) throw error;
      const next_task = await spawnNextOccurrence(supabase, data);
      return { success: true, message: `Attività "${data.title}" saltata.${next_task ? ` Prossima: ${next_task.date}` : ""}`, task: data, next_task };
    }

    case "add_note": {
      const { task_id, note } = args;
      const { data: existing, error: fetchErr } = await supabase
        .from("tasks")
        .select("notes")
        .eq("id", task_id)
        .eq("user_id", ownerUserId)
        .single();

      if (fetchErr) throw fetchErr;

      const currentNotes = existing.notes ? `${existing.notes}\n---\n` : "";
      const updatedNotes = `${currentNotes}${note}`;

      const { data, error } = await supabase
        .from("tasks")
        .update({ notes: updatedNotes })
        .eq("id", task_id)
        .eq("user_id", ownerUserId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, task: data };
    }

    case "add_file": {
      const taskId = args.task_id || args.attivita;
      let name = args.name || args.nome || "documento.md";
      const content = args.content_md !== undefined ? args.content_md : args.contenuto !== undefined ? args.contenuto : "";

      if (!taskId) throw new Error("Parametro 'task_id' (o 'attivita') obbligatorio");
      if (!name.endsWith(".md")) name = `${name}.md`;
      await assertTaskOwned(supabase, taskId, ownerUserId);

      const byteLength = new TextEncoder().encode(content).length;
      if (byteLength > 204800) {
        throw new Error("Il file supera il limite massimo consentito di 200 KB");
      }

      const { data, error } = await supabase
        .from("task_files")
        .insert({
          task_id: taskId,
          name,
          content_md: content,
          created_by: "claude",
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `File Markdown "${data.name}" allegato con successo all'attività`,
        file: data,
      };
    }

    case "list_files": {
      const taskId = args.task_id || args.attivita;
      let query = supabase
        .from("task_files")
        .select("id, task_id, name, created_by, created_at, updated_at, tasks!inner(user_id)")
        .eq("tasks.user_id", ownerUserId);
      if (taskId) {
        query = query.eq("task_id", taskId);
      }
      query = query.order("created_at", { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return { count: data?.length || 0, files: data || [] };
    }

    case "get_file": {
      const fileId = args.file_id || args.id;
      if (!fileId) throw new Error("Parametro 'file_id' obbligatorio");
      const { data, error } = await supabase
        .from("task_files")
        .select("*, tasks!inner(user_id)")
        .eq("id", fileId)
        .eq("tasks.user_id", ownerUserId)
        .single();
      if (error) throw error;
      return { success: true, file: data };
    }

    case "update_file": {
      const fileId = args.file_id || args.id;
      if (!fileId) throw new Error("Parametro 'file_id' obbligatorio");

      const updates: any = { updated_at: new Date().toISOString() };
      const content = args.content_md !== undefined ? args.content_md : args.contenuto;
      if (content !== undefined) {
        const byteLength = new TextEncoder().encode(content).length;
        if (byteLength > 204800) {
          throw new Error("Il file supera il limite massimo consentito di 200 KB");
        }
        updates.content_md = content;
      }

      let name = args.name || args.nome;
      if (name) {
        if (!name.endsWith(".md")) name = `${name}.md`;
        updates.name = name;
      }

      const { data: owned } = await supabase
        .from("task_files")
        .select("id, tasks!inner(user_id)")
        .eq("id", fileId)
        .eq("tasks.user_id", ownerUserId)
        .maybeSingle();
      if (!owned) throw new Error("File non trovato");

      const { data, error } = await supabase
        .from("task_files")
        .update(updates)
        .eq("id", fileId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `File "${data.name}" aggiornato con successo`,
        file: data,
      };
    }

    case "add_idea": {
      const urls: string[] = [];
      if (Array.isArray(args.urls)) {
        urls.push(...args.urls);
      } else if (typeof args.urls === "string") {
        urls.push(...args.urls.split("\n").map((u: string) => u.trim()).filter(Boolean));
      } else if (args.url) {
        urls.push(args.url.trim());
      }

      if (urls.length === 0) {
        throw new Error("Specificare almeno un URL valido tramite 'urls' o 'url'");
      }

      const project = args.project || "articolo-cosmonet";
      const note = args.note || null;
      const createdItems: any[] = [];
      const skippedDuplicates: string[] = [];
      const failed: string[] = [];

      for (const u of urls) {
        let validUrl = u.trim();
        if (!/^https?:\/\//i.test(validUrl)) validUrl = `https://${validUrl}`;

        // Verifica duplicati filtrati anche per user_id
        const { data: existing } = await supabase
          .from("ideas")
          .select("id, url")
          .eq("url", validUrl)
          .eq("user_id", ownerUserId)
          .maybeSingle();

        if (existing) {
          skippedDuplicates.push(validUrl);
          continue;
        }

        let domain = "";
        try {
          domain = new URL(validUrl).hostname.replace(/^www\./, "");
        } catch {
          domain = validUrl;
        }

        const title = (urls.length === 1 && args.title) || domain;

        const { data, error } = await supabase
          .from("ideas")
          .insert({
            user_id: ownerUserId,
            url: validUrl,
            title,
            note,
            project,
            status: "nuova",
            created_by: "claude",
          })
          .select()
          .single();

        if (error) {
          failed.push(`${validUrl}: ${error.message}`);
        } else if (data) {
          createdItems.push(data);
        }
      }

      return {
        success: true,
        added_count: createdItems.length,
        ideas: createdItems,
        duplicates_skipped: skippedDuplicates,
        failed,
      };
    }

    case "list_ideas": {
      const { status, project } = args;
      let query = supabase.from("ideas").select("*").eq("user_id", ownerUserId);

      if (status && status !== "tutte") query = query.eq("status", status);
      if (project && project !== "tutti") query = query.eq("project", project);

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return { count: data?.length || 0, ideas: data || [] };
    }

    case "update_idea": {
      const { idea_id, status, note, task_id } = args;
      if (!idea_id) throw new Error("Parametro 'idea_id' obbligatorio");

      const updates: any = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (note !== undefined) updates.note = note;
      if (task_id !== undefined) updates.task_id = task_id;

      const { data, error } = await supabase
        .from("ideas")
        .update(updates)
        .eq("id", idea_id)
        .eq("user_id", ownerUserId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: "Idea aggiornata con successo", idea: data };
    }

    default:
      throw new Error(`Strumento non supportato: ${name}`);
  }
}

// Intestazioni CORS per tutti i metodi — richieste da tutte le origini
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

// Preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Token sbagliato → 404 (non 401) così Claude non tenta OAuth
  if (!verifyToken(params.token)) {
    return NextResponse.json(
      { error: "Non trovato" },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  try {
    const body = await request.json();

    // Gestione standard JSON-RPC 2.0 (Claude MCP)
    if (body.jsonrpc === "2.0") {
      const { id, method, params: rpcParams } = body;

      // Notifiche (es. notifications/initialized): nessuna risposta JSON-RPC
      if (id === undefined || id === null) {
        return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
      }

      // Inizializzazione protocollo MCP
      if (method === "initialize") {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "orbita-agent", version: "1.0.0" },
            },
          },
          { headers: CORS_HEADERS }
        );
      }

      // Ping
      if (method === "ping") {
        return NextResponse.json(
          { jsonrpc: "2.0", id, result: {} },
          { headers: CORS_HEADERS }
        );
      }

      // Elenco degli strumenti
      if (method === "tools/list") {
        return NextResponse.json(
          { jsonrpc: "2.0", id, result: { tools: MCP_TOOLS } },
          { headers: CORS_HEADERS }
        );
      }

      // Esecuzione strumento
      if (method === "tools/call") {
        const { name, arguments: toolArgs } = rpcParams;
        try {
          const result = await executeTool(name, toolArgs || {});
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
              },
            },
            { headers: CORS_HEADERS }
          );
        } catch (execError: any) {
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: `Errore nell'esecuzione dello strumento ${name}: ${execError.message}`,
                  },
                ],
              },
            },
            { headers: CORS_HEADERS }
          );
        }
      }

      return NextResponse.json(
        { jsonrpc: "2.0", id, error: { code: -32601, message: `Metodo non trovato: ${method}` } },
        { headers: CORS_HEADERS }
      );
    }

    // Gestione semplificata per chiamate REST dirette: { action: "add_task", ... }
    if (body.action) {
      const result = await executeTool(body.action, body.parameters || body);
      return NextResponse.json({ success: true, result }, { headers: CORS_HEADERS });
    }

    return NextResponse.json(
      { error: "Formato payload non supportato. Richiesto JSON-RPC 2.0 o action." },
      { status: 400, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("Errore server MCP:", error);
    return NextResponse.json(
      { error: error.message || "Errore interno server MCP" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// GET restituisce la descrizione degli strumenti per verifica rapida nel browser
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Token sbagliato → 404 (non 401) così Claude non tenta OAuth
  if (!verifyToken(params.token)) {
    return NextResponse.json(
      { error: "Non trovato" },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      status: "online",
      server: "orbita-agent",
      protocolVersion: "2024-11-05",
      tools: MCP_TOOLS,
    },
    { headers: CORS_HEADERS }
  );
}
