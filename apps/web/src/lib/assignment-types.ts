// Assignment types
export type AssignmentType = "quiz" | "written" | "flashcard";

// Quiz question types
export type QuestionType = "simple" | "multiple" | "truefalse";

export interface BaseQuestion {
  id: string;
  index: number;
  statement: string;
  correctAnswer: string;
  explanation?: string;
}

export interface SimpleQuestion extends BaseQuestion {
  type: "simple";
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple";
  options: [string, string, string, string]; // Exactly 4 options
  correctAnswer: "a" | "b" | "c" | "d";
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "truefalse";
  correctAnswer: "true" | "false";
}

export type Question =
  | SimpleQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion;

// Quiz assignment content (existing)
export interface AssignmentContent {
  questions: Question[];
}

// File attachment interface (for written assignments)
export interface FileAttachment {
  name: string;
  url: string;
  type: string; // MIME type
  size: number; // File size in bytes
}

// Written assignment content (for teachers creating assignments)
export interface WrittenAssignmentContent {
  instructions: string;
  attachments: FileAttachment[];
}

// Written submission content (for students submitting)
export interface WrittenSubmissionContent {
  files: FileAttachment[];
}

// Flashcard types
export interface Flashcard {
  id: string;
  index: number;
  front: string; // Term or question
  back: string; // Definition or answer
}

export interface FlashcardContent {
  cards: Flashcard[];
}

// Flashcard submission content (tracks completion)
export interface FlashcardSubmissionContent {
  completed: boolean;
  completedAt: string;
}

// Type guards
export function isQuizContent(content: any): content is AssignmentContent {
  return content && Array.isArray(content.questions);
}

export function isWrittenContent(
  content: any
): content is WrittenAssignmentContent {
  return (
    content &&
    typeof content.instructions === "string" &&
    Array.isArray(content.attachments)
  );
}

export function isWrittenSubmission(
  content: any
): content is WrittenSubmissionContent {
  return content && Array.isArray(content.files);
}

export function isFlashcardContent(content: any): content is FlashcardContent {
  return content && Array.isArray(content.cards);
}

export function isFlashcardSubmission(
  content: any
): content is FlashcardSubmissionContent {
  return content && typeof content.completed === "boolean";
}
