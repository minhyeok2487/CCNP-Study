import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id));

  return NextResponse.json(profile || null);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const [result] = await db
    .insert(profiles)
    .values({
      id: user.id,
      displayName: body.displayName,
      examDate: body.examDate,
      dailyGoalMinutes: body.dailyGoalMinutes ?? 60,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        displayName: body.displayName,
        examDate: body.examDate,
        dailyGoalMinutes: body.dailyGoalMinutes ?? 60,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(result);
}
