# Testing Matrix Guide

## Purpose

This guide explains **how to design, structure, and scale test‑matrices for individual LLM‑powered steps** in the agentic workflow (e.g., *AgentConfigInitializer*, *TaskConfigInitializer*, *ScheduleSynthesiser*).  A unified template is provided while leaving space for step‑specific metrics and edge‑cases.

### Why it matters

1. **Unified mental model** – every new step is covered by the same two‑axis pattern, so code‑reviewers and CI pipelines recognise the layout instantly.
2. **Model‑tier transparency** – by grading cases from *easy L‑1* to *hard L‑3*, green‑field basics remain compatible with lightweight models, whereas messy, ambiguous inputs differentiate higher‑tier models.
3. **Repeatable benchmarking** – the **same 3 × 3 x 3 grid** can be rerun after a model is swapped or prompts are revised; the resulting pass/fail counts form a quick performance “slice‑test” for regressions.

### Core pattern

| Axis                       | Meaning                                                                                                                             | Rationale                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Environment complexity** | The amount of surrounding “clutter” the LLM must parse (tools, conflicting metadata, policy warnings…).                             | Small models often succeed only in clean, low‑entropy settings; larger models are expected to degrade gracefully as clutter rises. |
| **Reasoning difficulty**   | The degree of indirection or constraint density in the user prompt (straightforward ask → nested, implicit, multi‑step logic).      | The axis separates rote mapping from genuine reasoning and reveals where each model’s chain‑of‑thought deteriorates.               |

Each axis is split into three levels (`L‑1`, `L‑2`, `L‑3`), resulting in a **3 × 3 grid**.  Every cell should contain at least one minimal assertion:

* *L‑1* is solvable by small frontier‑edge models.
* *L‑3* challenges the strongest production model.

> **Note:** Whether these tests are classified as *unit* or *performance slices* depends on intent.  *L‑1* cases act as classic unit tests (the system must always pass), whereas *L‑2*/*L‑3* cases serve as lightweight benchmarks that expose model‑selection trade‑offs.

The following sections describe how the grid is filled, fixtures are written, and assertion tiers are layered so the suite remains stable across prompt‑wording changes while still catching real regressions.
