import { eq, and, sql, desc, asc, lte, gte, inArray, count } from "drizzle-orm";
import { db } from "./index";
import {
  profiles,
  examDomains,
  topics,
  userTopicProgress,
  checklistItems,
  userChecklistProgress,
  studySchedule,
  studySessions,
  questions,
  quizAttempts,
  quizAnswers,
  spacedRepetition,
  notes,
  tags,
  noteTags,
} from "./schema";

// ── getDomains ───────────────────────────────────────────
// Get all exam domains with their topics
export async function getDomains() {
  return db.query.examDomains.findMany({
    orderBy: asc(examDomains.sortOrder),
    with: {
      topics: {
        orderBy: asc(topics.sortOrder),
      },
    },
  });
}

// ── getTopics ────────────────────────────────────────────
// Get topics for a specific domain
export async function getTopics(domainId: string) {
  return db.query.topics.findMany({
    where: eq(topics.domainId, domainId),
    orderBy: asc(topics.sortOrder),
    with: {
      children: {
        orderBy: asc(topics.sortOrder),
      },
      checklistItems: {
        orderBy: asc(checklistItems.sortOrder),
      },
    },
  });
}

// ── getTopicById ─────────────────────────────────────────
// Get a single topic with children and checklist items
export async function getTopicById(topicId: string) {
  return db.query.topics.findFirst({
    where: eq(topics.id, topicId),
    with: {
      domain: true,
      parent: true,
      children: {
        orderBy: asc(topics.sortOrder),
        with: {
          checklistItems: {
            orderBy: asc(checklistItems.sortOrder),
          },
        },
      },
      checklistItems: {
        orderBy: asc(checklistItems.sortOrder),
      },
      questions: true,
    },
  });
}

// ── getUserTopicProgress ─────────────────────────────────
// Get all topic progress for a user
export async function getUserTopicProgress(userId: string) {
  return db.query.userTopicProgress.findMany({
    where: eq(userTopicProgress.userId, userId),
  });
}

// ── getQuestions ──────────────────────────────────────────
// Get questions with optional filters
export async function getQuestions(filters?: {
  topicId?: string;
  domainId?: string;
  difficulty?: number;
  limit?: number;
}) {
  const conditions = [];

  if (filters?.topicId) {
    conditions.push(eq(questions.topicId, filters.topicId));
  }

  if (filters?.domainId) {
    // Get all topic IDs for this domain, then filter questions
    const domainTopics = await db
      .select({ id: topics.id })
      .from(topics)
      .where(eq(topics.domainId, filters.domainId));

    const topicIds = domainTopics.map((t) => t.id);
    if (topicIds.length > 0) {
      conditions.push(inArray(questions.topicId, topicIds));
    } else {
      // No topics found for this domain, return empty
      return [];
    }
  }

  if (filters?.difficulty) {
    conditions.push(eq(questions.difficulty, filters.difficulty));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  return db.query.questions.findMany({
    where: whereClause,
    limit: filters?.limit ?? 50,
    with: {
      topic: {
        with: {
          domain: true,
        },
      },
    },
  });
}

// ── getQuizAttempts ──────────────────────────────────────
// Get user's quiz history
export async function getQuizAttempts(userId: string) {
  return db.query.quizAttempts.findMany({
    where: eq(quizAttempts.userId, userId),
    orderBy: desc(quizAttempts.completedAt),
    with: {
      domain: true,
      topic: true,
    },
  });
}

// ── getQuizAttemptWithAnswers ─────────────────────────────
// Get a single quiz attempt with all answers and question details
export async function getQuizAttemptWithAnswers(attemptId: string) {
  return db.query.quizAttempts.findFirst({
    where: eq(quizAttempts.id, attemptId),
    with: {
      domain: true,
      topic: true,
      answers: {
        with: {
          question: {
            with: {
              topic: true,
            },
          },
        },
      },
    },
  });
}

// ── getNotes ─────────────────────────────────────────────
// Get user's notes with optional filtering
export async function getNotes(
  userId: string,
  filters?: {
    domainId?: string;
    topicId?: string;
    tagId?: string;
    pinned?: boolean;
    search?: string;
  }
) {
  const conditions = [eq(notes.userId, userId)];

  if (filters?.domainId) {
    conditions.push(eq(notes.domainId, filters.domainId));
  }

  if (filters?.topicId) {
    conditions.push(eq(notes.topicId, filters.topicId));
  }

  if (filters?.pinned !== undefined) {
    conditions.push(eq(notes.pinned, filters.pinned));
  }

  if (filters?.search) {
    conditions.push(
      sql`(${notes.title} ILIKE ${"%" + filters.search + "%"} OR ${notes.content} ILIKE ${"%" + filters.search + "%"})`
    );
  }

  // If filtering by tag, join through noteTags
  if (filters?.tagId) {
    const noteIdsWithTag = await db
      .select({ noteId: noteTags.noteId })
      .from(noteTags)
      .where(eq(noteTags.tagId, filters.tagId));

    const noteIds = noteIdsWithTag.map((r) => r.noteId);
    if (noteIds.length === 0) return [];
    conditions.push(inArray(notes.id, noteIds));
  }

  return db.query.notes.findMany({
    where: and(...conditions),
    orderBy: [desc(notes.pinned), desc(notes.updatedAt)],
    with: {
      domain: true,
      topic: true,
      noteTags: {
        with: {
          tag: true,
        },
      },
    },
  });
}

// ── getNoteById ──────────────────────────────────────────
// Get single note with tags
export async function getNoteById(noteId: string) {
  return db.query.notes.findFirst({
    where: eq(notes.id, noteId),
    with: {
      domain: true,
      topic: true,
      noteTags: {
        with: {
          tag: true,
        },
      },
    },
  });
}

// ── getUserTags ──────────────────────────────────────────
// Get all tags for a user
export async function getUserTags(userId: string) {
  return db.query.tags.findMany({
    where: eq(tags.userId, userId),
  });
}

// ── getDashboardData ─────────────────────────────────────
// Get dashboard stats: progress, streak, weak areas
export async function getDashboardData(userId: string) {
  // 1. Profile data (streak, exam date, etc.)
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  // 2. All domains for structure
  const domains = await db.query.examDomains.findMany({
    orderBy: asc(examDomains.sortOrder),
  });

  // 3. Total topic count
  const [totalTopicsResult] = await db
    .select({ count: count() })
    .from(topics);

  // 4. User's topic progress summary
  const progressRows = await db
    .select({
      status: userTopicProgress.status,
      count: count(),
    })
    .from(userTopicProgress)
    .where(eq(userTopicProgress.userId, userId))
    .groupBy(userTopicProgress.status);

  const progressByStatus = Object.fromEntries(
    progressRows.map((r) => [r.status, r.count])
  );

  // 5. Domain-level progress breakdown
  const domainProgress = await db
    .select({
      domainId: topics.domainId,
      total: count(),
      completed: sql<number>`count(*) filter (where ${userTopicProgress.status} = 'completed')`,
      inProgress: sql<number>`count(*) filter (where ${userTopicProgress.status} = 'in_progress')`,
    })
    .from(topics)
    .leftJoin(
      userTopicProgress,
      and(
        eq(userTopicProgress.topicId, topics.id),
        eq(userTopicProgress.userId, userId)
      )
    )
    .groupBy(topics.domainId);

  // 6. Recent study sessions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSessions = await db
    .select({
      date: sql<string>`date(${studySessions.studiedAt})`,
      totalMinutes: sql<number>`sum(${studySessions.durationMinutes})`,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        gte(studySessions.studiedAt, sevenDaysAgo)
      )
    )
    .groupBy(sql`date(${studySessions.studiedAt})`)
    .orderBy(sql`date(${studySessions.studiedAt})`);

  // 7. Recent quiz performance
  const recentQuizzes = await db.query.quizAttempts.findMany({
    where: eq(quizAttempts.userId, userId),
    orderBy: desc(quizAttempts.completedAt),
    limit: 10,
    with: {
      domain: true,
      topic: true,
    },
  });

  // 8. Weak areas (topics with lowest scores)
  const weakAreas = await getWeakTopics(userId);

  // 9. Due for spaced repetition
  const today = new Date().toISOString().split("T")[0];
  const [dueCount] = await db
    .select({ count: count() })
    .from(spacedRepetition)
    .where(
      and(
        eq(spacedRepetition.userId, userId),
        lte(spacedRepetition.nextReviewDate, today)
      )
    );

  return {
    profile,
    domains,
    totalTopics: totalTopicsResult.count,
    progressByStatus,
    domainProgress,
    recentSessions,
    recentQuizzes,
    weakAreas,
    spacedRepetitionDueCount: dueCount.count,
  };
}

// ── getStudySchedule ─────────────────────────────────────
// Get study schedule for a date range
export async function getStudySchedule(
  userId: string,
  startDate: string,
  endDate: string
) {
  const scheduleRows = await db
    .select({
      schedule: studySchedule,
      topic: topics,
      domain: examDomains,
    })
    .from(studySchedule)
    .innerJoin(topics, eq(studySchedule.topicId, topics.id))
    .innerJoin(examDomains, eq(topics.domainId, examDomains.id))
    .where(
      and(
        eq(studySchedule.userId, userId),
        gte(studySchedule.scheduledDate, startDate),
        lte(studySchedule.scheduledDate, endDate)
      )
    )
    .orderBy(asc(studySchedule.scheduledDate));

  return scheduleRows.map((row) => ({
    ...row.schedule,
    topic: {
      ...row.topic,
      domain: row.domain,
    },
  }));
}

// ── getSpacedRepetitionDue ───────────────────────────────
// Get questions due for spaced repetition review
export async function getSpacedRepetitionDue(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const dueItems = await db
    .select({
      spacedRepetition,
      question: questions,
    })
    .from(spacedRepetition)
    .innerJoin(questions, eq(spacedRepetition.questionId, questions.id))
    .where(
      and(
        eq(spacedRepetition.userId, userId),
        lte(spacedRepetition.nextReviewDate, today)
      )
    )
    .orderBy(asc(spacedRepetition.nextReviewDate));

  return dueItems.map((row) => ({
    ...row.spacedRepetition,
    question: row.question,
  }));
}

// ── getWeakTopics ────────────────────────────────────────
// Get topics with lowest quiz scores
export async function getWeakTopics(userId: string, limit = 10) {
  const weakTopics = await db
    .select({
      topicId: quizAnswers.questionId,
      topicIdActual: questions.topicId,
      totalAnswers: count(),
      correctAnswers: sql<number>`count(*) filter (where ${quizAnswers.isCorrect} = true)`,
      accuracy: sql<number>`
        case
          when count(*) > 0
          then round((count(*) filter (where ${quizAnswers.isCorrect} = true))::numeric / count(*)::numeric * 100, 1)
          else 0
        end
      `,
    })
    .from(quizAnswers)
    .innerJoin(questions, eq(quizAnswers.questionId, questions.id))
    .innerJoin(
      quizAttempts,
      and(
        eq(quizAnswers.attemptId, quizAttempts.id),
        eq(quizAttempts.userId, userId)
      )
    )
    .groupBy(quizAnswers.questionId, questions.topicId)
    .having(sql`count(*) >= 1`)
    .orderBy(
      sql`case when count(*) > 0 then round((count(*) filter (where ${quizAnswers.isCorrect} = true))::numeric / count(*)::numeric * 100, 1) else 0 end`
    )
    .limit(limit);

  // Aggregate by topic
  const topicMap = new Map<
    string,
    { totalAnswers: number; correctAnswers: number }
  >();

  for (const row of weakTopics) {
    const existing = topicMap.get(row.topicIdActual) ?? {
      totalAnswers: 0,
      correctAnswers: 0,
    };
    existing.totalAnswers += row.totalAnswers;
    existing.correctAnswers += row.correctAnswers;
    topicMap.set(row.topicIdActual, existing);
  }

  const topicIds = [...topicMap.keys()];
  if (topicIds.length === 0) return [];

  const topicDetails = await db.query.topics.findMany({
    where: inArray(topics.id, topicIds),
    with: {
      domain: true,
    },
  });

  return topicDetails
    .map((topic) => {
      const stats = topicMap.get(topic.id)!;
      return {
        ...topic,
        totalAnswers: stats.totalAnswers,
        correctAnswers: stats.correctAnswers,
        accuracy:
          stats.totalAnswers > 0
            ? Math.round((stats.correctAnswers / stats.totalAnswers) * 1000) /
              10
            : 0,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

// ── getUserChecklistProgress ─────────────────────────────
// Get user's checklist completion for a topic
export async function getUserChecklistProgress(
  userId: string,
  topicId: string
) {
  const items = await db
    .select({
      checklistItem: checklistItems,
      completed: userChecklistProgress.completed,
      completedAt: userChecklistProgress.completedAt,
    })
    .from(checklistItems)
    .leftJoin(
      userChecklistProgress,
      and(
        eq(userChecklistProgress.checklistItemId, checklistItems.id),
        eq(userChecklistProgress.userId, userId)
      )
    )
    .where(eq(checklistItems.topicId, topicId))
    .orderBy(asc(checklistItems.sortOrder));

  return items.map((row) => ({
    ...row.checklistItem,
    completed: row.completed ?? false,
    completedAt: row.completedAt,
  }));
}

// ── getProfile ───────────────────────────────────────────
// Get user profile
export async function getProfile(userId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
}

// ── getStudySessions ─────────────────────────────────────
// Get study sessions for a user, optionally filtered by date range
export async function getStudySessions(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  const conditions = [eq(studySessions.userId, userId)];

  if (filters?.startDate) {
    conditions.push(gte(studySessions.studiedAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(studySessions.studiedAt, filters.endDate));
  }

  const rows = await db
    .select({
      session: studySessions,
      topic: topics,
    })
    .from(studySessions)
    .leftJoin(topics, eq(studySessions.topicId, topics.id))
    .where(and(...conditions))
    .orderBy(desc(studySessions.studiedAt))
    .limit(filters?.limit ?? 50);

  return rows.map((row) => ({
    ...row.session,
    topic: row.topic,
  }));
}
