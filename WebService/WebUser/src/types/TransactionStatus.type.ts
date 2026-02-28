export type StepStatus = "pending" | "active" | "completed" | "error";

export interface Step {
  label: string;
  description?: string;
  status: StepStatus;
}
