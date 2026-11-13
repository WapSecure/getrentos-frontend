import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CARE_TEMPLATES,
  careTemplateFirstDueDate,
  careTemplateNotes,
  findCareTemplate,
} from '../src/utils/careTemplates.ts';
import { MAINTENANCE_CATEGORY_CODES } from '../src/utils/maintenance.ts';

test('ships the ten Nigerian care routines with unique ids', () => {
  assert.equal(CARE_TEMPLATES.length, 10);
  assert.equal(new Set(CARE_TEMPLATES.map((t) => t.id)).size, 10);
});

test('every template is complete and uses a real category', () => {
  for (const template of CARE_TEMPLATES) {
    assert.ok(template.title.trim(), template.id);
    assert.ok((MAINTENANCE_CATEGORY_CODES as readonly string[]).includes(template.category));
    assert.ok(Number.isInteger(template.frequencyDays) && template.frequencyDays > 0);
    assert.ok(template.checklist.length >= 2, template.id);
    assert.match(template.summary, /^Typically/, template.id);
  }
});

test('copy is plain: no em dashes and no dollar signs', () => {
  const text = JSON.stringify(CARE_TEMPLATES);
  assert.doesNotMatch(text, /—/);
  assert.doesNotMatch(text, /\$/);
});

test('uses the agreed intervals', () => {
  const days = (id: string) => findCareTemplate(id)?.frequencyDays;
  assert.equal(days('generator-servicing'), 90);
  assert.equal(days('fumigation'), 90);
  assert.equal(days('overhead-tank-cleaning'), 182);
  assert.equal(days('borehole-pump-servicing'), 182);
  assert.equal(days('water-treatment-filter-change'), 90);
  assert.equal(days('air-conditioner-servicing'), 90);
  assert.equal(days('drain-clearing'), 365);
  assert.equal(days('roof-inspection'), 365);
  assert.equal(days('fire-extinguisher-check'), 365);
  assert.equal(days('inverter-battery-check'), 182);
  assert.match(findCareTemplate('generator-servicing')!.summary, /150 to 250 running hours/);
  assert.equal(findCareTemplate('nope'), undefined);
});

test('turns the checklist into notes', () => {
  const notes = careTemplateNotes(findCareTemplate('fumigation')!);
  assert.equal(notes.split('\n').length, 3);
  assert.ok(notes.startsWith('- Treat the kitchen'));
});

test('seasonal jobs fall on 1 March before the rains', () => {
  const drains = findCareTemplate('drain-clearing')!;
  assert.equal(careTemplateFirstDueDate(drains, new Date(2027, 0, 15)), '2027-03-01');
  assert.equal(careTemplateFirstDueDate(drains, new Date(2027, 2, 1)), '2027-03-01');
  assert.equal(careTemplateFirstDueDate(drains, new Date(2026, 10, 13)), '2027-03-01');
});

test('other jobs start a week out', () => {
  const generator = findCareTemplate('generator-servicing')!;
  assert.equal(careTemplateFirstDueDate(generator, new Date(2026, 10, 13)), '2026-11-20');
  assert.equal(careTemplateFirstDueDate(generator, new Date(2026, 11, 28)), '2027-01-04');
});
