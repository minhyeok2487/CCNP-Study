import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  real,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────
export const topicStatusEnum = pgEnum("topic_status", [
  "not_started",
  "in_progress",
  "completed",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "multiple_select",
]);

// ── profiles ──────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.uid()
  displayName: varchar("display_name", { length: 100 }),
  examDate: date("exam_date"),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(60),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStudyDate: date("last_study_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── exam_domains ──────────────────────────────────────────
export const examDomains = pgTable("exam_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("number").notNull().unique(),
  titleEn: varchar("title_en", { length: 200 }).notNull(),
  titleKo: varchar("title_ko", { length: 200 }).notNull(),
  weight: integer("weight").notNull(), // percentage
  color: varchar("color", { length: 50 }).notNull(),
  sortOrder: integer("sort_order").notNull(),
});

// ── topics ────────────────────────────────────────────────
export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => examDomains.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): any => topics.id, {
      onDelete: "cascade",
    }),
    code: varchar("code", { length: 20 }).notNull(), // e.g., "1.1", "1.1.a"
    titleEn: varchar("title_en", { length: 500 }).notNull(),
    titleKo: varchar("title_ko", { length: 500 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("topics_domain_id_idx").on(table.domainId),
    index("topics_parent_id_idx").on(table.parentId),
  ]
);

// ── user_topic_progress ───────────────────────────────────
export const userTopicProgress = pgTable(
  "user_topic_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    status: topicStatusEnum("status").notNull().default("not_started"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_topic_progress_unique").on(table.userId, table.topicId),
    index("user_topic_progress_user_idx").on(table.userId),
  ]
);

// ── checklist_items ───────────────────────────────────────
export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("checklist_items_topic_idx").on(table.topicId)]
);

// ── user_checklist_progress ───────────────────────────────
export const userChecklistProgress = pgTable(
  "user_checklist_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    checklistItemId: uuid("checklist_item_id")
      .notNull()
      .references(() => checklistItems.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("user_checklist_unique").on(
      table.userId,
      table.checklistItemId
    ),
  ]
);

// ── study_schedule ────────────────────────────────────────
export const studySchedule = pgTable(
  "study_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    scheduledDate: date("scheduled_date").notNull(),
    completed: boolean("completed").notNull().default(false),
  },
  (table) => [
    index("study_schedule_user_date_idx").on(
      table.userId,
      table.scheduledDate
    ),
  ]
);

// ── study_sessions ────────────────────────────────────────
export const studySessions = pgTable(
  "study_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    topicId: uuid("topic_id").references(() => topics.id, {
      onDelete: "set null",
    }),
    durationMinutes: integer("duration_minutes").notNull(),
    studiedAt: timestamp("studied_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("study_sessions_user_idx").on(table.userId)]
);

// ── questions ─────────────────────────────────────────────
export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    type: questionTypeEnum("type").notNull().default("multiple_choice"),
    questionEn: text("question_en").notNull(),
    questionKo: text("question_ko").notNull().default(""),
    optionsEn: text("options_en").array().notNull(), // JSON array of options
    optionsKo: text("options_ko").array().notNull().default([]),
    correctAnswers: integer("correct_answers").array().notNull(), // indices
    explanationEn: text("explanation_en").notNull().default(""),
    explanationKo: text("explanation_ko").notNull().default(""),
    difficulty: integer("difficulty").notNull().default(1), // 1-5
    createdBy: uuid("created_by"), // null = system
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("questions_topic_idx").on(table.topicId)]
);

// ── quiz_attempts ─────────────────────────────────────────
export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    mode: varchar("mode", { length: 50 }).notNull(), // topic, weak, spaced, mixed
    domainId: uuid("domain_id").references(() => examDomains.id),
    topicId: uuid("topic_id").references(() => topics.id),
    totalQuestions: integer("total_questions").notNull(),
    correctCount: integer("correct_count").notNull().default(0),
    timeTakenSeconds: integer("time_taken_seconds"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("quiz_attempts_user_idx").on(table.userId)]
);

// ── quiz_answers ──────────────────────────────────────────
export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    selectedAnswers: integer("selected_answers").array().notNull(),
    isCorrect: boolean("is_correct").notNull(),
  },
  (table) => [index("quiz_answers_attempt_idx").on(table.attemptId)]
);

// ── spaced_repetition ─────────────────────────────────────
export const spacedRepetition = pgTable(
  "spaced_repetition",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    easeFactor: real("ease_factor").notNull().default(2.5),
    interval: integer("interval").notNull().default(0), // days
    repetitions: integer("repetitions").notNull().default(0),
    nextReviewDate: date("next_review_date").notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("spaced_repetition_unique").on(table.userId, table.questionId),
    index("spaced_repetition_next_review_idx").on(
      table.userId,
      table.nextReviewDate
    ),
  ]
);

// ── notes ─────────────────────────────────────────────────
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    content: text("content").notNull().default(""),
    domainId: uuid("domain_id").references(() => examDomains.id),
    topicId: uuid("topic_id").references(() => topics.id),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notes_user_idx").on(table.userId),
    index("notes_domain_idx").on(table.domainId),
  ]
);

// ── tags ──────────────────────────────────────────────────
export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
  },
  (table) => [uniqueIndex("tags_user_name_unique").on(table.userId, table.name)]
);

// ── note_tags ─────────────────────────────────────────────
export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("note_tags_unique").on(table.noteId, table.tagId)]
);

// ── Relations ─────────────────────────────────────────────

export const examDomainsRelations = relations(examDomains, ({ many }) => ({
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  domain: one(examDomains, {
    fields: [topics.domainId],
    references: [examDomains.id],
  }),
  parent: one(topics, {
    fields: [topics.parentId],
    references: [topics.id],
    relationName: "topicParent",
  }),
  children: many(topics, { relationName: "topicParent" }),
  questions: many(questions),
  checklistItems: many(checklistItems),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
}));

export const quizAttemptsRelations = relations(
  quizAttempts,
  ({ many, one }) => ({
    answers: many(quizAnswers),
    domain: one(examDomains, {
      fields: [quizAttempts.domainId],
      references: [examDomains.id],
    }),
    topic: one(topics, {
      fields: [quizAttempts.topicId],
      references: [topics.id],
    }),
  })
);

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizAnswers.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(questions, {
    fields: [quizAnswers.questionId],
    references: [questions.id],
  }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  domain: one(examDomains, {
    fields: [notes.domainId],
    references: [examDomains.id],
  }),
  topic: one(topics, {
    fields: [notes.topicId],
    references: [topics.id],
  }),
  noteTags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, {
    fields: [noteTags.noteId],
    references: [notes.id],
  }),
  tag: one(tags, {
    fields: [noteTags.tagId],
    references: [tags.id],
  }),
}));

export const checklistItemsRelations = relations(
  checklistItems,
  ({ one }) => ({
    topic: one(topics, {
      fields: [checklistItems.topicId],
      references: [topics.id],
    }),
  })
);

// ── Types ─────────────────────────────────────────────────
export type Profile = typeof profiles.$inferSelect;
export type ExamDomain = typeof examDomains.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type StudyScheduleItem = typeof studySchedule.$inferSelect;
