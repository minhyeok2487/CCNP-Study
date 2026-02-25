import { eq, and, sql, asc, count, inArray } from "drizzle-orm";
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

// ── upsertProfile ────────────────────────────────────────
// Create or update user profile
export async function upsertProfile(
  userId: string,
  data: {
    displayName?: string;
    examDate?: string | null;
    dailyGoalMinutes?: number;
  }
) {
  const [result] = await db
    .insert(profiles)
    .values({
      id: userId,
      displayName: data.displayName,
      examDate: data.examDate,
      dailyGoalMinutes: data.dailyGoalMinutes ?? 60,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        ...(data.displayName !== undefined && {
          displayName: data.displayName,
        }),
        ...(data.examDate !== undefined && { examDate: data.examDate }),
        ...(data.dailyGoalMinutes !== undefined && {
          dailyGoalMinutes: data.dailyGoalMinutes,
        }),
        updatedAt: new Date(),
      },
    })
    .returning();

  return result;
}

// ── updateTopicProgress ──────────────────────────────────
// Update topic status for a user (upsert)
export async function updateTopicProgress(
  userId: string,
  topicId: string,
  status: "not_started" | "in_progress" | "completed"
) {
  const [result] = await db
    .insert(userTopicProgress)
    .values({
      userId,
      topicId,
      status,
    })
    .onConflictDoUpdate({
      target: [userTopicProgress.userId, userTopicProgress.topicId],
      set: {
        status,
        updatedAt: new Date(),
      },
    })
    .returning();

  return result;
}

// ── toggleChecklistItem ──────────────────────────────────
// Toggle checklist item completion for a user
export async function toggleChecklistItem(
  userId: string,
  checklistItemId: string
) {
  // Check current state
  const existing = await db
    .select()
    .from(userChecklistProgress)
    .where(
      and(
        eq(userChecklistProgress.userId, userId),
        eq(userChecklistProgress.checklistItemId, checklistItemId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Toggle existing
    const newCompleted = !existing[0].completed;
    const [result] = await db
      .update(userChecklistProgress)
      .set({
        completed: newCompleted,
        completedAt: newCompleted ? new Date() : null,
      })
      .where(eq(userChecklistProgress.id, existing[0].id))
      .returning();

    return result;
  } else {
    // Create new completed entry
    const [result] = await db
      .insert(userChecklistProgress)
      .values({
        userId,
        checklistItemId,
        completed: true,
        completedAt: new Date(),
      })
      .returning();

    return result;
  }
}

// ── createQuizAttempt ────────────────────────────────────
// Create quiz attempt with all answers in a transaction
export async function createQuizAttempt(data: {
  userId: string;
  mode: string;
  domainId?: string;
  topicId?: string;
  totalQuestions: number;
  correctCount: number;
  timeTakenSeconds?: number;
  answers: {
    questionId: string;
    selectedAnswers: number[];
    isCorrect: boolean;
  }[];
}) {
  return db.transaction(async (tx) => {
    // 1. Create the attempt
    const [attempt] = await tx
      .insert(quizAttempts)
      .values({
        userId: data.userId,
        mode: data.mode,
        domainId: data.domainId,
        topicId: data.topicId,
        totalQuestions: data.totalQuestions,
        correctCount: data.correctCount,
        timeTakenSeconds: data.timeTakenSeconds,
      })
      .returning();

    // 2. Insert all answers
    if (data.answers.length > 0) {
      await tx.insert(quizAnswers).values(
        data.answers.map((answer) => ({
          attemptId: attempt.id,
          questionId: answer.questionId,
          selectedAnswers: answer.selectedAnswers,
          isCorrect: answer.isCorrect,
        }))
      );
    }

    // 3. Fetch the full attempt with answers
    const fullAttempt = await tx.query.quizAttempts.findFirst({
      where: eq(quizAttempts.id, attempt.id),
      with: {
        answers: {
          with: {
            question: true,
          },
        },
      },
    });

    return fullAttempt!;
  });
}

// ── updateSpacedRepetition ───────────────────────────────
// SM-2 algorithm update for spaced repetition
// quality: 0-5 (0=complete blackout, 5=perfect response)
export async function updateSpacedRepetition(
  userId: string,
  questionId: string,
  quality: number
) {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  // Get existing record or create defaults
  const existing = await db
    .select()
    .from(spacedRepetition)
    .where(
      and(
        eq(spacedRepetition.userId, userId),
        eq(spacedRepetition.questionId, questionId)
      )
    )
    .limit(1);

  let easeFactor = existing[0]?.easeFactor ?? 2.5;
  let interval = existing[0]?.interval ?? 0;
  let repetitions = existing[0]?.repetitions ?? 0;

  // SM-2 algorithm
  if (q >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response: reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor =
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  // Minimum ease factor is 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  const nextReviewDate = nextReview.toISOString().split("T")[0];

  const [result] = await db
    .insert(spacedRepetition)
    .values({
      userId,
      questionId,
      easeFactor,
      interval,
      repetitions,
      nextReviewDate,
      lastReviewedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [spacedRepetition.userId, spacedRepetition.questionId],
      set: {
        easeFactor,
        interval,
        repetitions,
        nextReviewDate,
        lastReviewedAt: new Date(),
      },
    })
    .returning();

  return result;
}

// ── createNote ───────────────────────────────────────────
// Create a note with optional tags
export async function createNote(
  userId: string,
  data: {
    title: string;
    content?: string;
    domainId?: string;
    topicId?: string;
    tagIds?: string[];
  }
) {
  return db.transaction(async (tx) => {
    const [note] = await tx
      .insert(notes)
      .values({
        userId,
        title: data.title,
        content: data.content ?? "",
        domainId: data.domainId,
        topicId: data.topicId,
      })
      .returning();

    if (data.tagIds && data.tagIds.length > 0) {
      await tx.insert(noteTags).values(
        data.tagIds.map((tagId) => ({
          noteId: note.id,
          tagId,
        }))
      );
    }

    return note;
  });
}

// ── updateNote ───────────────────────────────────────────
// Update an existing note
export async function updateNote(
  noteId: string,
  data: {
    title?: string;
    content?: string;
    domainId?: string | null;
    topicId?: string | null;
  }
) {
  const [result] = await db
    .update(notes)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.domainId !== undefined && { domainId: data.domainId }),
      ...(data.topicId !== undefined && { topicId: data.topicId }),
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId))
    .returning();

  return result;
}

// ── deleteNote ───────────────────────────────────────────
// Delete a note (cascade deletes noteTags)
export async function deleteNote(noteId: string) {
  const [result] = await db
    .delete(notes)
    .where(eq(notes.id, noteId))
    .returning();

  return result;
}

// ── createTag ────────────────────────────────────────────
// Create a new tag for a user
export async function createTag(userId: string, name: string) {
  const [result] = await db
    .insert(tags)
    .values({ userId, name })
    .onConflictDoNothing()
    .returning();

  // If conflict (tag already exists), fetch and return
  if (!result) {
    const existing = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, name)))
      .limit(1);

    return existing[0];
  }

  return result;
}

// ── toggleNoteTag ────────────────────────────────────────
// Add or remove a tag from a note
export async function toggleNoteTag(noteId: string, tagId: string) {
  // Check if the association exists
  const existing = await db
    .select()
    .from(noteTags)
    .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)))
    .limit(1);

  if (existing.length > 0) {
    // Remove the tag
    await db
      .delete(noteTags)
      .where(
        and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId))
      );

    return { action: "removed" as const, noteId, tagId };
  } else {
    // Add the tag
    await db.insert(noteTags).values({ noteId, tagId });

    return { action: "added" as const, noteId, tagId };
  }
}

// ── createStudySession ───────────────────────────────────
// Log a study session
export async function createStudySession(
  userId: string,
  data: {
    topicId?: string;
    durationMinutes: number;
    studiedAt?: Date;
  }
) {
  const [result] = await db
    .insert(studySessions)
    .values({
      userId,
      topicId: data.topicId,
      durationMinutes: data.durationMinutes,
      studiedAt: data.studiedAt ?? new Date(),
    })
    .returning();

  return result;
}

// ── updateStreak ─────────────────────────────────────────
// Update the user's study streak
export async function updateStreak(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  if (!profile) return null;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;

  if (profile.lastStudyDate === today) {
    // Already studied today, no change
    return profile;
  } else if (profile.lastStudyDate === yesterdayStr) {
    // Consecutive day: increment streak
    newStreak = profile.streak + 1;
  } else {
    // Streak broken: reset to 1
    newStreak = 1;
  }

  const newLongestStreak = Math.max(profile.longestStreak, newStreak);

  const [result] = await db
    .update(profiles)
    .set({
      streak: newStreak,
      longestStreak: newLongestStreak,
      lastStudyDate: today,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  return result;
}

// ── generateStudySchedule ────────────────────────────────
// Generate a study schedule based on exam date
// Distributes topics evenly across available days, prioritizing by domain weight
export async function generateStudySchedule(
  userId: string,
  examDate: string
) {
  return db.transaction(async (tx) => {
    // 1. Clear existing schedule for the user
    await tx
      .delete(studySchedule)
      .where(eq(studySchedule.userId, userId));

    // 2. Get all domains with weights and their topics
    const domains = await tx.query.examDomains.findMany({
      orderBy: asc(examDomains.sortOrder),
      with: {
        topics: {
          orderBy: asc(topics.sortOrder),
        },
      },
    });

    // 3. Collect all leaf topics (topics without children or all topics)
    const allTopics: { id: string; domainWeight: number }[] = [];
    for (const domain of domains) {
      for (const topic of domain.topics) {
        allTopics.push({
          id: topic.id,
          domainWeight: domain.weight,
        });
      }
    }

    if (allTopics.length === 0) return [];

    // 4. Calculate available days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
      1,
      Math.floor(
        (exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // 5. Sort topics: higher domain weight first (more important = earlier)
    allTopics.sort((a, b) => b.domainWeight - a.domainWeight);

    // 6. Distribute topics across days
    const scheduleItems: {
      userId: string;
      topicId: string;
      scheduledDate: string;
    }[] = [];

    const topicsPerDay = Math.max(
      1,
      Math.ceil(allTopics.length / totalDays)
    );

    let currentDay = 0;
    for (let i = 0; i < allTopics.length; i++) {
      const dayOffset = Math.min(
        currentDay,
        totalDays - 1
      );
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      scheduleItems.push({
        userId,
        topicId: allTopics[i].id,
        scheduledDate: date.toISOString().split("T")[0],
      });

      // Move to next day after filling current day's quota
      if ((i + 1) % topicsPerDay === 0) {
        currentDay++;
      }
    }

    // 7. Insert schedule items
    if (scheduleItems.length > 0) {
      await tx.insert(studySchedule).values(scheduleItems);
    }

    // 8. Update profile exam date
    await tx
      .update(profiles)
      .set({ examDate, updatedAt: new Date() })
      .where(eq(profiles.id, userId));

    return scheduleItems;
  });
}

// ── createQuestion ───────────────────────────────────────
// Create a user-submitted question
export async function createQuestion(data: {
  topicId: string;
  type?: "multiple_choice" | "multiple_select";
  questionEn: string;
  questionKo?: string;
  optionsEn: string[];
  optionsKo?: string[];
  correctAnswers: number[];
  explanationEn?: string;
  explanationKo?: string;
  difficulty?: number;
  createdBy?: string;
}) {
  const [result] = await db
    .insert(questions)
    .values({
      topicId: data.topicId,
      type: data.type ?? "multiple_choice",
      questionEn: data.questionEn,
      questionKo: data.questionKo ?? "",
      optionsEn: data.optionsEn,
      optionsKo: data.optionsKo ?? [],
      correctAnswers: data.correctAnswers,
      explanationEn: data.explanationEn ?? "",
      explanationKo: data.explanationKo ?? "",
      difficulty: data.difficulty ?? 1,
      createdBy: data.createdBy,
    })
    .returning();

  return result;
}

// ── toggleNotePin ────────────────────────────────────────
// Toggle pinned status on a note
export async function toggleNotePin(noteId: string) {
  const note = await db
    .select({ pinned: notes.pinned })
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);

  if (note.length === 0) return null;

  const [result] = await db
    .update(notes)
    .set({
      pinned: !note[0].pinned,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, noteId))
    .returning();

  return result;
}

// ── deleteTag ────────────────────────────────────────────
// Delete a tag (cascade removes noteTags associations)
export async function deleteTag(tagId: string) {
  const [result] = await db
    .delete(tags)
    .where(eq(tags.id, tagId))
    .returning();

  return result;
}

// ── markScheduleComplete ─────────────────────────────────
// Mark a study schedule item as completed
export async function markScheduleComplete(scheduleId: string) {
  const [result] = await db
    .update(studySchedule)
    .set({ completed: true })
    .where(eq(studySchedule.id, scheduleId))
    .returning();

  return result;
}
