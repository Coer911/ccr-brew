// Строит scripts/i18n/units.json: [{id, raw, inner, kind, file}] — по первому вхождению.
import fs from 'node:fs';
import path from 'node:path';
import { collect } from './extract.mjs';

const units = new Map();
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
      collect(p, (n, sf, kind) => {
        const raw = n.getText(sf);
        const key = kind === 'JsxText' ? raw.trim() : raw;
        if (units.has(key)) return;
        units.set(key, { id: units.size, kind, raw: key, inner: innerOf(key, kind), file: path.relative('src', p) });
      });
    }
  }
}
export function innerOf(raw, kind) {
  switch (kind) {
    case 'StringLiteral': return raw.slice(1, -1);
    case 'NoSubstitutionTemplateLiteral': case 'FirstTemplateToken': return raw.slice(1, -1);
    case 'TemplateHead': return raw.slice(1, -2);
    case 'TemplateMiddle': return raw.slice(1, -2);
    case 'TemplateTail': case 'LastTemplateToken': return raw.slice(1, -1);
    case 'JsxText': return raw;
    case 'RegularExpressionLiteral': return raw;
  }
}
walk('src');
fs.writeFileSync('scripts/i18n/units.json', JSON.stringify([...units.values()], null, 0));
console.log(units.size);
