import assert from 'node:assert/strict';
import { test } from 'node:test';

const { escapeHtml, fromTags, toTags } = await import('@/utils/tag-converter');

test('escapeHtml escapes markup but keeps quote markers at line starts', () => {
  assert.equal(escapeHtml('<b>&</b>'), '&lt;b&gt;&amp;&lt;/b&gt;');
  assert.equal(escapeHtml('> quoted\n> again'), '> quoted\n> again');
});

test('unknown emoji codes are left as typed', () => {
  assert.equal(fromTags('see :not-an-emoji: here'), 'see :not-an-emoji: here');
});

test('a user tag survives the editor round trip with its level and gender', () => {
  const tag = "<tag data-tag='Alice-5-female'></tag>";
  const html = fromTags(tag);
  assert.match(html, /permission-female permission-lv-5/);
  assert.equal(toTags(html), tag);
});

test('a user tag without level or gender falls back to the defaults', () => {
  assert.equal(toTags(fromTags("<tag data-tag='Bob'></tag>")), "<tag data-tag='Bob-2-male'></tag>");
});

test('embedded videos convert to tags and back', () => {
  for (const tag of ["<yt data-yt='abc123'></yt>", "<tw data-tw='somechannel'></tw>", "<kick data-kick='someone'></kick>"]) {
    assert.equal(toTags(fromTags(tag)), tag);
  }
});

test('empty paragraphs from the editor are dropped', () => {
  assert.equal(toTags('<p>hi</p><p></p>'), '<p>hi</p>');
});
