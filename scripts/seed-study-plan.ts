import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import {
  examDomains,
  topics,
  studySchedule,
  profiles,
} from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { prepare: false });
const db = drizzle(sql);

async function seed() {
  const userId = process.argv[2];
  const examDateStr = process.argv[3];

  if (!userId || !examDateStr) {
    console.log("Usage: npx tsx scripts/seed-study-plan.ts <user_id> <exam_date>");
    console.log("Example: npx tsx scripts/seed-study-plan.ts abc-123 2026-06-30");
    process.exit(1);
  }

  console.log(`🌱 Generating study plan for user ${userId}...`);
  console.log(`📅 Exam date: ${examDateStr}`);

  // Clear existing schedule
  await db.delete(studySchedule).where(eq(studySchedule.userId, userId));

  // Fetch domains and topics
  const allDomains = await db
    .select()
    .from(examDomains)
    .orderBy(examDomains.sortOrder);

  const allTopics = await db
    .select()
    .from(topics)
    .orderBy(topics.sortOrder);

  // Calculate days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(examDateStr);
  const totalDays = Math.max(
    1,
    Math.floor((examDate.getTime() - today.getTime()) / 86400000)
  );

  console.log(`📊 Days until exam: ${totalDays}`);

  // Group topics by domain
  const topicsByDomain = new Map<string, typeof allTopics>();
  allTopics.forEach((t) => {
    const list = topicsByDomain.get(t.domainId) || [];
    list.push(t);
    topicsByDomain.set(t.domainId, list);
  });

  // Distribute topics across days
  const items: {
    userId: string;
    topicId: string;
    scheduledDate: string;
  }[] = [];

  let dayOffset = 0;

  for (const domain of allDomains) {
    const domainTopics = topicsByDomain.get(domain.id) || [];
    const domainDays = Math.max(
      1,
      Math.round((domain.weight / 100) * totalDays)
    );

    console.log(
      `  📂 ${domain.titleKo} (${domain.weight}%): ${domainTopics.length} topics over ${domainDays} days`
    );

    domainTopics.forEach((topic, i) => {
      const offset =
        dayOffset + Math.floor((i / Math.max(1, domainTopics.length)) * domainDays);
      const date = new Date(today);
      date.setDate(date.getDate() + Math.min(offset, totalDays - 1));

      items.push({
        userId,
        topicId: topic.id,
        scheduledDate: date.toISOString().split("T")[0],
      });
    });

    dayOffset += domainDays;
  }

  // Insert in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await db.insert(studySchedule).values(batch);
  }

  // Update profile exam date
  await db
    .update(profiles)
    .set({ examDate: examDateStr, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  console.log(`\n✅ ${items.length} schedule items created!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
