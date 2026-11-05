import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../PA_Logic_v1.1_Sandbox_Preview.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/i);
assert.ok(match, 'standalone preview script exists');

class MockElement {
  constructor(id, attrs = '') {
    this.id = id;
    this.value = '';
    this.checked = /\bchecked\b/.test(attrs);
    this.textContent = '';
    this.innerHTML = '';
    this.className = '';
    this.listeners = {};
    this.classes = new Set((attrs.match(/class="([^"]+)"/)?.[1] || '').split(/\s+/).filter(Boolean));
    this.classList = {
      toggle: (name, force) => {
        const enabled = force === undefined ? !this.classes.has(name) : Boolean(force);
        if (enabled) this.classes.add(name); else this.classes.delete(name);
        return enabled;
      },
      contains: name => this.classes.has(name),
    };
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}

const elements = new Map();
for (const m of html.matchAll(/<([a-z0-9-]+)\b([^>]*?)\bid="([^"]+)"([^>]*)>/gi)) {
  const id = m[3];
  const attrs = `${m[2]} ${m[4]}`;
  const el = new MockElement(id, attrs);
  const value = attrs.match(/\bvalue="([^"]*)"/i);
  if (value) el.value = value[1];
  elements.set(id, el);
}
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new MockElement(id));
    return elements.get(id);
  },
  createElement() { return new MockElement('created'); },
};
const context = {
  document,
  URL: {createObjectURL: () => 'blob:mock', revokeObjectURL: () => {}},
  Blob: class BlobMock {},
  Intl,
  Number,
  Math,
  Array,
  console,
  setTimeout: () => 0,
};
vm.runInNewContext(match[1], context, {timeout: 3000});

const get = id => elements.get(id);
assert.match(get('releaseBadge').textContent, /HOLD — RECHECK REQUIRED/);
assert.match(get('ka-status-PA-06').textContent, /pengiriman aktual belum diuji/i);
assert.match(get('ka-status-PA-08').textContent, /HOLD — RECHECK REQUIRED/);
assert.match(get('ka-status-PA-05').textContent, /Data rute aktual belum dimasukkan/i);
assert.match(get('ka-status-PA-09').textContent, /A-S1 belum dilepas/i);
assert.match(get('ka-status-PA-07').textContent, /bukan bukti transportasi alternatif dieksekusi/i);

get('recheck').checked = true;
get('dependencies').checked = true;
get('approval').checked = true;
context.render();
assert.match(get('releaseBadge').textContent, /RELEASE ELIGIBLE — CONDITIONAL GO/);
assert.match(get('ka-status-PA-09').textContent, /Urutan kandidat tersedia/);

get('ltr').value = '1.30';
get('contingencyReviewed').checked = false;
context.render();
assert.match(get('releaseBadge').textContent, /HOLD — CONTINGENCY REVIEW REQUIRED/);
get('contingencyReviewed').checked = true;
context.render();
assert.match(get('releaseBadge').textContent, /RELEASE ELIGIBLE — CONDITIONAL GO/);

get('contingencyFlag').checked = false;
context.render();
assert.match(get('ka-status-PA-07').textContent, /Flag evaluasi skenario = 0/);
console.log('Standalone HTML preview smoke: 12 assertions PASS.');
