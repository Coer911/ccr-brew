// Помечает единицы, которые встречаются ТОЛЬКО в console.* / throw new Error для логов.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { collect } from './extract.mjs';

const units = JSON.parse(fs.readFileSync('scripts/i18n/units.json', 'utf8'));
const byRaw = new Map(units.map((u) => [u.raw, u]));
const visible = new Set();

function inConsole(n) {
  for (let p = n.parent; p; p = p.parent) {
    if (ts.isCallExpression(p)) {
      const e = p.expression;
      if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'console') return true;
    }
    if (ts.isFunctionLike(p) || ts.isBlock(p)) return false;
  }
  return false;
}
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
      collect(p, (n, sf, kind) => {
        const raw = kind === 'JsxText' ? n.getText(sf).trim() : n.getText(sf);
        if (!inConsole(n)) visible.add(raw);
      });
    }
  }
}
walk('src');
for (const u of units) u.visible = visible.has(u.raw);
fs.writeFileSync('scripts/i18n/units.json', JSON.stringify(units));
const v = units.filter((u) => u.visible);
console.log('visible', v.length, 'console-only', units.length - v.length, 'chars', v.map(u=>u.inner).join('').length);
