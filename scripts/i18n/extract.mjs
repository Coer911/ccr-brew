// Достаёт все строки с китайскими иероглифами из src (кроме комментариев).
// Выход: scripts/i18n/strings.json — { "<строка>": count }
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const HAN = /\p{Script=Han}/u;
const root = path.resolve('src');
const out = new Map();
const kinds = {};

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) scan(p);
  }
}

export function collect(file, cb) {
  const src = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (n) => {
    const k = n.kind;
    if (k === ts.SyntaxKind.StringLiteral || k === ts.SyntaxKind.NoSubstitutionTemplateLiteral
      || k === ts.SyntaxKind.TemplateHead || k === ts.SyntaxKind.TemplateMiddle
      || k === ts.SyntaxKind.TemplateTail || k === ts.SyntaxKind.JsxText
      || k === ts.SyntaxKind.RegularExpressionLiteral) {
      const text = n.getText(sf);
      if (HAN.test(text)) cb(n, sf, ts.SyntaxKind[k]);
    }
    n.forEachChild(visit);
  };
  visit(sf);
  return sf;
}

function scan(file) {
  collect(file, (n, sf, kind) => {
    kinds[kind] = (kinds[kind] ?? 0) + 1;
    const t = kind === 'JsxText' ? n.getText(sf).trim() : n.getText(sf);
    out.set(t, (out.get(t) ?? 0) + 1);
  });
}

if (process.argv[1].endsWith('extract.mjs')) {
  walk(root);
  const obj = Object.fromEntries([...out.entries()].sort((a, b) => b[1] - a[1]));
  fs.writeFileSync('scripts/i18n/strings.json', JSON.stringify(obj, null, 1));
  console.log('unique', out.size, kinds);
}
