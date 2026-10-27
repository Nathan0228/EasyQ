export type QuestionMode = "binary" | "text";

export type Answer = {
  value: string;
  answeredAt: string;
};

export type Question = {
  id: string;
  question: string;
  mode: QuestionMode;
  note: string;
  createdAt: string;
  answer: Answer | null;
};

export type Backup = {
  format: "easyq-backup";
  version: 1;
  exportedAt: string;
  questions: Question[];
};
