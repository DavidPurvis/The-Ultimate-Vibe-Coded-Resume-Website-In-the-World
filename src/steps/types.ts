/** The contract every step renderer implements: mount(ctx), with everything owned by ctx.scope. */
import type { CaseEvent } from '../domain/events';
import type { CaseState } from '../domain/case';
import type { MountContext } from '../runtime/lifecycle';
import type { ModalityProfile } from '../runtime/modality';

export interface StepContext extends MountContext {
  readonly modality: ModalityProfile;
  readonly caseNumber: string;
  /** The step was entered by the visitor's action (not restored on load): move focus. */
  readonly userInitiated: boolean;
  state(): CaseState;
  /** Called when the state changes but the step stays the same. Removed with the scope. */
  subscribe(fn: (next: CaseState, prev: CaseState) => void): void;
  dispatch(e: CaseEvent): void;
  /** The step's processing delay (seeded, inside BUDGET). Rejects if the step is disposed. */
  processing(): Promise<void>;
  /** A bounded wait (clamped to the climax budget). Rejects if the step is disposed. */
  wait(ms: number): Promise<void>;
  announce(text: string): void;
  setHeading(text: string): void;
  focusHeading(): void;
}

export interface StepModule {
  mount(ctx: StepContext): void | Promise<void>;
}
