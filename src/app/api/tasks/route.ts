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
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status");

    let query = supabase.from("tasks").select("*").eq("user_id", session.user.id);

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    if (status && status !== "all") query = query.eq("status", status);

    query = query.order("date", { ascending: true }).order("time", { ascending: true, nullsFirst: false });

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
    const { title, date, time, kind, project, priority, repeat_rule, subtasks, notes, status } = body;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: session.user.id,
        title,
        date,
        time: time || null,
        kind: kind || "altro",
        project: project || null,
        priority: priority || "normale",
        repeat_rule: repeat_rule || null,
        subtasks: subtasks || [],
        notes: notes || null,
        status: status || "todo",
        created_by: "user",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
