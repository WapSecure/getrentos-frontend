import type { ReactNode } from 'react';

export interface Step {
  title: string;
  body: ReactNode;
}

/** A real sequence, so the numbers carry meaning: what happens first, then next. */
export const StepList = ({ steps }: { steps: Step[] }) => (
  <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
    {steps.map((step, index) => (
      <li key={step.title} className="border-t border-foreground/80 pt-6">
        <p className="label-caps mb-6 tabular-nums text-muted-foreground">
          Step {String(index + 1).padStart(2, '0')}
        </p>
        <h3 className="font-display mb-3 text-[1.5rem] leading-tight font-normal">{step.title}</h3>
        <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{step.body}</p>
      </li>
    ))}
  </ol>
);
