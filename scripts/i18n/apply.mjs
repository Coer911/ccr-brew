// Подставляет переводы из scripts/i18n/ru/*.tsv (id<TAB>перевод, ⏎ = перевод строки)
// во все вхождения строки в src. Одинаковая строка → одинаковый перевод везде,
// поэтому сравнения и регулярки в логике остаются согласованными.
import fs from 'node:fs';
import path from 'node:path';
import { collect } from './extract.mjs';

const units = JSON.parse(fs.readFileSync('scripts/i18n/units.json', 'utf8'));
const ru = new Map();
for (const f of fs.readdirSync('scripts/i18n/ru').filter((f) => f.endsWith('.tsv')).sort()) {
  for (const line of fs.readFileSync(path.join('scripts/i18n/ru', f), 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const tab = line.indexOf('\t');
    if (tab < 0) throw new Error(`${f}: нет TAB: ${line}`);
    ru.set(Number(line.slice(0, tab)), line.slice(tab + 1).replace(/⏎/g, '\n'));
  }
}
const byRaw = new Map();
for (const u of units) if (ru.has(u.id)) byRaw.set(u.raw, { u, t: ru.get(u.id) });

const escQ = (s, q) => s.replace(new RegExp(`(?<!\\\\)${q}`, 'g'), `\\${q}`);
const escT = (s) => s.replace(/(?<!\\)`/g, '\\`').replace(/(?<!\\)\$\{/g, '\\${');

function render(raw, kind, t) {
  switch (kind) {
    case 'StringLiteral': return raw[0] + escQ(t.replace(/\n/g, '\\n'), raw[0]) + raw[0];
    case 'NoSubstitutionTemplateLiteral': case 'FirstTemplateToken': return '`' + escT(t) + '`';
    case 'TemplateHead': return '`' + escT(t) + '${';
    case 'TemplateMiddle': return '}' + escT(t) + '${';
    case 'TemplateTail': case 'LastTemplateToken': return '}' + escT(t) + '`';
    case 'JsxText': {
      if (/[{}<>]/.test(t)) throw new Error(`JSX-текст с {}<>: ${t}`);
      return raw.match(/^\s*/)[0] + t + raw.match(/\s*$/)[0];
    }
    case 'RegularExpressionLiteral': return t;
  }
  throw new Error(kind);
}

let files = 0, reps = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
      const edits = [];
      const sf = collect(p, (n, sf, kind) => {
        const raw = n.getText(sf);
        const hit = byRaw.get(kind === 'JsxText' ? raw.trim() : raw);
        if (hit) edits.push([n.getStart(sf), n.end, render(raw, kind, hit.t)]);
      });
      if (!edits.length) continue;
      let s = sf.text;
      for (const [a, b, r] of edits.sort((x, y) => y[0] - x[0])) s = s.slice(0, a) + r + s.slice(b);
      fs.writeFileSync(p, s);
      files++; reps += edits.length;
    }
  }
}
walk('src');
const missing = units.filter((u) => u.visible && !ru.has(u.id)).length;
console.log(`переведено единиц ${byRaw.size}, замен ${reps} в ${files} файлах, видимых без перевода: ${missing}`);
