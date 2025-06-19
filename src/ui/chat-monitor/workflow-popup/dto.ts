export type WorkflowStepStatus =
  | "pending"
  | "initialized"
  | "running"
  | "completed"
  | "failed";

export interface WorkflowStep {
  no: number;
  step: string;
  status: WorkflowStepStatus;
  resource: string;
}

export interface WorkflowStepInput extends Omit<WorkflowStep, "no"> {}
