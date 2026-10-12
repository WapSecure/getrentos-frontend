'use client';

import { useId, useState, type FormEvent } from 'react';
import {
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  NumberInput,
  Select,
} from '@getrentos/ui';
import type { LandAreaUnit } from '@/types/land';
import { LAND_AREA_UNIT_LABELS } from '@/types/land';
import type { LandPlot, LandPlotInput, LandPlotUpdateInput } from '@/types/landDeveloper';
import { plotLabel } from './labels';

interface PlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing this plot; omit to add one. */
  plot?: LandPlot | null;
  isSaving: boolean;
  onCreate: (input: LandPlotInput) => void;
  onUpdate: (plotId: string, input: LandPlotUpdateInput) => void;
}

const UNIT_OPTIONS = (Object.keys(LAND_AREA_UNIT_LABELS) as LandAreaUnit[]).map((unit) => ({
  value: unit,
  label: LAND_AREA_UNIT_LABELS[unit],
}));

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const PlotForm = ({
  plot,
  isSaving,
  onCreate,
  onUpdate,
  onCancel,
}: Omit<PlotFormDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) => {
  const id = useId();
  const editing = Boolean(plot);
  const [plotNumber, setPlotNumber] = useState(plot?.plotNumber ?? '');
  const [block, setBlock] = useState(plot?.block ?? '');
  const [areaValue, setAreaValue] = useState(plot ? String(plot.areaValue) : '');
  const [areaUnit, setAreaUnit] = useState<LandAreaUnit>(plot?.areaUnit ?? 'SQUARE_METERS');
  const [price, setPrice] = useState(plot?.price ?? 0);
  const [isCorner, setIsCorner] = useState(plot?.isCorner ?? false);
  const [tags, setTags] = useState((plot?.tags ?? []).join(', '));

  const tagList = parseTags(tags);
  const area = Number(areaValue);
  const errors = {
    plotNumber: !editing && plotNumber.trim().length === 0 ? 'Required.' : undefined,
    area: !editing && !(area >= 0.01) ? 'Enter the plot size.' : undefined,
    price: price < 1 ? 'Enter the asking price.' : undefined,
    tags:
      tagList.length > 20
        ? 'At most 20 tags.'
        : tagList.some((tag) => tag.length > 40)
          ? 'Each tag must be 40 characters or fewer.'
          : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    if (plot) {
      onUpdate(plot.id, { price, isCorner, tags: tagList });
    } else {
      onCreate({
        plotNumber: plotNumber.trim(),
        ...(block.trim() ? { block: block.trim() } : {}),
        areaValue: area,
        areaUnit,
        price,
        isCorner,
        ...(tagList.length ? { tags: tagList } : {}),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plot number" htmlFor={`${id}-number`} required={!editing}>
          <Input
            id={`${id}-number`}
            value={plotNumber}
            maxLength={40}
            disabled={editing}
            onChange={(event) => setPlotNumber(event.target.value)}
          />
        </Field>
        <Field label="Block" htmlFor={`${id}-block`}>
          <Input
            id={`${id}-block`}
            value={block}
            maxLength={40}
            disabled={editing}
            onChange={(event) => setBlock(event.target.value)}
          />
        </Field>
        <Field label="Size" htmlFor={`${id}-area`} required={!editing} error={errors.area}>
          <NumberInput
            id={`${id}-area`}
            value={areaValue}
            disabled={editing}
            onValueChange={setAreaValue}
          />
        </Field>
        <Field label="Unit">
          <Select
            value={areaUnit}
            onValueChange={(value) => setAreaUnit(value as LandAreaUnit)}
            options={UNIT_OPTIONS}
            disabled={editing}
            ariaLabel="Area unit"
          />
        </Field>
      </div>
      {editing && (
        <p className="text-xs text-muted-foreground">
          A plot&apos;s number, block and size are fixed once it is created.
        </p>
      )}
      <Field label="Asking price" htmlFor={`${id}-price`} required error={errors.price}>
        <CurrencyInput
          id={`${id}-price`}
          prefix="₦"
          value={price}
          onValueChange={setPrice}
          placeholder="0"
        />
      </Field>
      <Field
        label="Tags"
        htmlFor={`${id}-tags`}
        hint="Comma separated, e.g. road-facing, close to gate."
        error={errors.tags}
      >
        <Input id={`${id}-tags`} value={tags} onChange={(event) => setTags(event.target.value)} />
      </Field>
      <label htmlFor={`${id}-corner`} className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox id={`${id}-corner`} checked={isCorner} onCheckedChange={setIsCorner} />
        Corner plot
      </label>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!valid} isLoading={isSaving}>
          {editing ? 'Save plot' : 'Add plot'}
        </Button>
      </div>
    </form>
  );
};

/** Add one plot, or change the price, tags or corner flag of an unsold one. */
export const PlotFormDialog = ({ open, onOpenChange, plot, ...rest }: PlotFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogTitle className="text-lg font-semibold text-foreground">
        {plot ? `Edit ${plotLabel(plot)}` : 'Add a plot'}
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        {plot
          ? 'Only available or withheld plots can be changed.'
          : 'Plots go on sale when the estate is published.'}
      </DialogDescription>
      <PlotForm
        key={plot?.id ?? 'new'}
        plot={plot}
        {...rest}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);
