// Ключи объектов, записанные иероглифами без кавычек. Перевод совпадает с переводом
// тех же слов в строках, иначе obj['Зерно'] не найдёт obj.咖啡豆.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const MAP = {
  水果类: 'Фрукты', 花香类: 'Цветочные', 甜味类: 'Сладкие', 坚果类: 'Орехи', 香料类: 'Пряности',
  茶类: 'Чай', 烟草类: 'Табак и дерево', 口感类: 'Текстура', 其他: 'Другое',
  养豆期: 'Отдых', 赏味期: 'Лучший период', 衰退期: 'Угасание', 在途: 'В пути', 冷冻: 'Заморожено',
  极浅: 'Очень светлая', 浅度: 'Светлая', 中浅: 'Светло-средняя', 中度: 'Средняя', 中深: 'Средне-тёмная', 深度: 'Тёмная',
  咖啡豆: 'Зерно', 方案: 'Рецепт', 注水: 'Пролив', 记录: 'Записать', 冲煮: 'Заварка', 笔记: 'Заметки',
  中心注水: 'Пролив в центр', 绕圈注水: 'Пролив по кругу', 添加冰块: 'Добавить лёд',
  萃取浓缩: 'Экстракция', 饮料: 'Напиток', 等待: 'Ожидание',
};
const isIdent = (s) => /^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(s);
const left = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|jsx?|mjs)$/.test(e.name)) continue;
    const src = fs.readFileSync(p, 'utf8');
    const sf = ts.createSourceFile(p, src, ts.ScriptTarget.Latest, true, e.name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const edits = [];
    const visit = (n) => {
      if (ts.isIdentifier(n) && Object.hasOwn(MAP, n.text)) {
        const ru = MAP[n.text];
        const par = n.parent;
        const start = n.getStart(sf);
        if (ts.isPropertyAccessExpression(par) && par.name === n) {
          // x.咖啡豆 → x['Зерно'] (или x.Зерно)
          const dot = src.lastIndexOf('.', start);
          edits.push(isIdent(ru) ? [start, n.end, ru] : [dot, n.end, `['${ru}']`]);
        } else if ((ts.isPropertyAssignment(par) || ts.isPropertySignature(par) || ts.isMethodDeclaration(par)) && par.name === n) {
          edits.push([start, n.end, isIdent(ru) ? ru : `'${ru}'`]);
        } else {
          left.push(`${path.relative('src', p)}: ${n.text} (${ts.SyntaxKind[par.kind]})`);
        }
      }
      n.forEachChild(visit);
    };
    visit(sf);
    if (!edits.length) continue;
    let s = src;
    for (const [a, b, r] of edits.sort((x, y) => y[0] - x[0])) s = s.slice(0, a) + r + s.slice(b);
    fs.writeFileSync(p, s);
  }
}
walk('src');
console.log(left.length ? 'не тронуто:\n' + left.join('\n') : 'все ключи переведены');
