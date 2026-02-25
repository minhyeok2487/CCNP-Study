import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { questions, topics } from "../src/lib/db/schema";
import oldQuestions from "./old-questions.json";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

// Category → topic code mapping
// Maps old quiz categories to ENCOR topic codes
const CATEGORY_TO_TOPIC_CODE: Record<string, string> = {
  // Security domain (5.x)
  Security: "5.1",
  // Infrastructure domain (3.x)
  "Spanning Tree Protocol": "3.1",
  Switching: "3.1",
  EtherChannel: "3.1",
  "Packet Forwarding": "3.1",
  "IP Routing Essentials": "3.2",
  Routing: "3.2",
  EIGRP: "3.2",
  OSPF: "3.2",
  "Advanced OSPF": "3.2",
  OSPFv3: "3.2",
  BGP: "3.2",
  "Advanced BGP": "3.2",
  FHRP: "3.4",
  Multicast: "3.4",
  "VRF, GRE, and IPsec": "2.2",
  LISP: "2.3",
  VXLAN: "2.3",
  // Wireless domain (3.3)
  Wireless: "3.3",
  // Architecture domain (1.x)
  "SD-Access": "1.5",
  "SD-WAN": "1.4",
  QoS: "1.6",
  Infrastructure: "3.1",
  // Automation domain (6.x)
  Automation: "6.7",
  "Network Programmability": "6.5",
  // Virtualization domain (2.x)
  Virtualization: "2.1",
};

interface OldQuestion {
  id: number;
  examPart: string;
  question: string;
  options: Record<string, string>;
  correctAnswer: string | string[];
  type: "single" | "multiple";
  category: string;
}

async function main() {
  console.log("Fetching existing topics from DB...");

  // Get all topics with their codes
  const allTopics = await db.select().from(topics);
  const topicByCode = new Map(allTopics.map((t) => [t.code, t]));

  console.log(`Found ${allTopics.length} topics in DB`);

  let seeded = 0;
  let skipped = 0;
  const missingCategories = new Set<string>();

  for (const q of oldQuestions as OldQuestion[]) {
    // Skip questions with missing options
    if (!q.options || typeof q.options !== "object") {
      skipped++;
      continue;
    }

    const topicCode = CATEGORY_TO_TOPIC_CODE[q.category];
    if (!topicCode) {
      missingCategories.add(q.category);
      skipped++;
      continue;
    }

    const topic = topicByCode.get(topicCode);
    if (!topic) {
      console.warn(`Topic code ${topicCode} not found in DB (category: ${q.category})`);
      skipped++;
      continue;
    }

    // Convert options object {A: "...", B: "...", ...} to array
    const optionKeys = Object.keys(q.options).sort();
    const optionsArray = optionKeys.map((key) => q.options[key]);

    // Convert correct answers to 0-based indices
    let correctIndices: number[];
    if (Array.isArray(q.correctAnswer)) {
      correctIndices = q.correctAnswer.map((ans) => optionKeys.indexOf(ans));
    } else {
      correctIndices = [optionKeys.indexOf(q.correctAnswer)];
    }

    const questionType = q.type === "multiple" ? "multiple_select" : "multiple_choice";

    await db.insert(questions).values({
      topicId: topic.id,
      type: questionType as "multiple_choice" | "multiple_select",
      questionEn: q.question,
      questionKo: "",
      optionsEn: optionsArray,
      optionsKo: [],
      correctAnswers: correctIndices,
      explanationEn: "",
      explanationKo: "",
      difficulty: 2,
    });

    seeded++;
  }

  console.log(`\nSeeding complete!`);
  console.log(`  Seeded: ${seeded} questions`);
  console.log(`  Skipped: ${skipped} questions`);

  if (missingCategories.size > 0) {
    console.log(`  Unmapped categories: ${[...missingCategories].join(", ")}`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
