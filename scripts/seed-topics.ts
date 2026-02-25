import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { examDomains, topics, checklistItems } from "../src/lib/db/schema";
import { ENCOR_DOMAINS, type TopicData } from "../src/lib/constants/encor-topics";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { prepare: false });
const db = drizzle(sql);

async function seed() {
  console.log("🌱 Seeding ENCOR domains and topics...");

  // Clear existing data
  await db.delete(checklistItems);
  await db.delete(topics);
  await db.delete(examDomains);

  for (const domain of ENCOR_DOMAINS) {
    // Insert domain
    const [insertedDomain] = await db
      .insert(examDomains)
      .values({
        number: domain.number,
        titleEn: domain.titleEn,
        titleKo: domain.titleKo,
        weight: domain.weight,
        color: domain.color,
        sortOrder: domain.number,
      })
      .returning();

    console.log(`  ✅ Domain ${domain.number}: ${domain.titleKo}`);

    // Insert topics recursively
    let topicOrder = 0;

    async function insertTopic(
      topicData: TopicData,
      parentId: string | null
    ) {
      const [insertedTopic] = await db
        .insert(topics)
        .values({
          domainId: insertedDomain.id,
          parentId,
          code: topicData.code,
          titleEn: topicData.titleEn,
          titleKo: topicData.titleKo,
          sortOrder: topicOrder++,
        })
        .returning();

      console.log(`    📝 ${topicData.code}: ${topicData.titleKo}`);

      // Insert checklist items
      if (topicData.checklist) {
        for (let i = 0; i < topicData.checklist.length; i++) {
          await db.insert(checklistItems).values({
            topicId: insertedTopic.id,
            content: topicData.checklist[i],
            sortOrder: i,
          });
        }
      }

      // Insert children
      if (topicData.children) {
        for (const child of topicData.children) {
          await insertTopic(child, insertedTopic.id);
        }
      }
    }

    for (const topic of domain.topics) {
      await insertTopic(topic, null);
    }
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
