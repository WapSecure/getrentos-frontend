import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeJsonLd } from './jsonLd';

test('a closing script tag in user content cannot break out', () => {
  const out = serializeJsonLd({ description: 'Nice flat</script><script>alert(1)</script>' });
  assert.ok(!out.includes('<'));
  assert.ok(!out.includes('>'));
  assert.deepEqual(JSON.parse(out), { description: 'Nice flat</script><script>alert(1)</script>' });
});

test('ampersands and line separators round-trip', () => {
  const data = { name: 'A & B', note: 'x y z' };
  const out = serializeJsonLd(data);
  assert.ok(!out.includes('&') && !out.includes(' ') && !out.includes(' '));
  assert.deepEqual(JSON.parse(out), data);
});
