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

export interface AssignmentContent {
  questions: Question[];
}
