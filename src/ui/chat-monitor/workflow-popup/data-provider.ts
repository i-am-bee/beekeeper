import { WorkflowStep, WorkflowStepStatus } from "./dto.js";

export class WorkflowStepsDataProvider {
  private steps: Map<number, WorkflowStep>;
  private lastNo = 0;

  constructor() {
    this.steps = new Map<number, WorkflowStep>();
  }

  private addStep(step: WorkflowStep): void {
    this.steps.set(step.no, step);
  }

  private updateStep(step: WorkflowStep): void {
    if (this.steps.has(step.no)) {
      this.steps.set(step.no, step);
    }
  }

  getSteps(): WorkflowStep[] {
    return Array.from(this.steps.values()).sort((a, b) => a.no - b.no);
  }

  clearSteps(): void {
    this.steps.clear();
  }

  reduce(step: WorkflowStep): WorkflowStep[] {
    const existingStep = this.steps.get(step.no);
    if (existingStep) {
      this.updateStep({
        ...existingStep,
        ...step,
      });
    } else {
      this.addStep({ ...step, no: ++this.lastNo });
    }
    return this.getSteps();
  }

  tableData(): string[][] {
    return [
      ...this.getSteps().map((s) => [
        `\t${this.mapStatusIcon(s.status)}\t${s.no}. ${s.step}`,
        s.resource,
      ]),
    ];
  }

  mapStatusIcon(status: WorkflowStepStatus) {
    switch (status) {
      case "pending":
        return "○";
      case "initialized":
        return "●";
      case "running":
        return "▶";
      case "completed":
        return "✔";
      case "failed":
        return "✖";
    }
  }
}
