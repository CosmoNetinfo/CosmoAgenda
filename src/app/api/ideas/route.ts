import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const project = searchParams.get("project");

    let query = supabase.from("ideas").select("*").eq("user_id", session.user.id);

    if (status && status !== "tutte") query = query.eq("status", status);
    if (project && project !== "tutti") query = query.eq("project", project);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await request.json();
    const { url, title, note, project, status, task_id, created_by } = body;

    if (!url) {
      return NextResponse.json({ error: "URL obbligatorio" }, { status: 400 });
    }

    // Verifica duplicato per questo utente
    const { data: existing } = await supabase
      .from("ideas")
      .select("id, title, url")
      .eq("user_id", session.user.id)
      .eq("url", url.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "duplicate",
          message: "Questo link è già presente tra le tue idee.",
          existing,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("ideas")
      .insert({
        user_id: session.user.id,
        url: url.trim(),
        title: title || null,
        note: note || null,
        project: project || "articolo-cosmonet",
        status: status || "nuova",
        task_id: task_id || null,
        created_by: created_by || "user",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
