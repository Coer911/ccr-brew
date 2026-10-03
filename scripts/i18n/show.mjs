// node show.mjs <from> <to> — печатает видимые единицы для перевода: id<TAB>inner
import fs from 'node:fs';
const units = JSON.parse(fs.readFileSync('scripts/i18n/units.json', 'utf8')).filter((u) => u.visible);
const [from, to] = process.argv.slice(2).map(Number);
let file = '';
for (const u of units.slice(from, to)) {
  if (u.file !== file) { file = u.file; console.log(`## ${file}`); }
  const k = { StringLiteral: '', JsxText: 'J', TemplateHead: 'T<', TemplateMiddle: 'T=', TemplateTail: 'T>', LastTemplateToken: 'T>', FirstTemplateToken: 'T', NoSubstitutionTemplateLiteral: 'T', RegularExpressionLiteral: 'R' }[u.kind];
  console.log(`${u.id}\t${k}\t${u.inner.replace(/\n/g, '⏎')}`);
}
