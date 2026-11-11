import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listingIdFromSegment, listingPath, listingSegment, slugify } from './listingSlug';

const ID = '60a00ee1-74fd-4824-b721-b6c17cea015c';

test('slugify keeps words, drops punctuation and accents', () => {
  assert.equal(
    slugify('2-Bed Apartment · Palm Grove, Surulere'),
    '2-bed-apartment-palm-grove-surulere'
  );
  assert.equal(slugify('Café & Duplex — Lekki Phase 1'), 'cafe-and-duplex-lekki-phase-1');
  assert.equal(slugify('  ★★★  '), '');
  assert.equal(slugify(undefined), '');
});

test('slugify caps length at a word boundary', () => {
  const slug = slugify(
    'Spacious four bedroom fully detached duplex with boys quarters in Lekki Phase One'
  );
  assert.ok(slug.length <= 60, slug);
  assert.ok(!slug.endsWith('-'));
  assert.ok('spacious-four-bedroom-fully-detached-duplex-with-boys-quarters-in'.startsWith(slug));
});

test('listingPath puts readable words before the id', () => {
  assert.equal(
    listingPath('sale', ID, 'Ikoyi Waterfront Apartment'),
    `/buy/ikoyi-waterfront-apartment-${ID}`
  );
  assert.equal(listingPath('shortlet', ID, ''), `/shortlets/${ID}`);
});

test('listingIdFromSegment reads slugged, bare and encoded segments', () => {
  assert.equal(listingIdFromSegment(listingSegment(ID, 'Ikoyi Waterfront Apartment')), ID);
  assert.equal(listingIdFromSegment(ID), ID);
  assert.equal(listingIdFromSegment(`any-words-${ID.toUpperCase()}`), ID);
  assert.equal(listingIdFromSegment('not-a-listing'), 'not-a-listing');
  assert.equal(listingIdFromSegment('%E0%A4%A'), '%E0%A4%A');
});
