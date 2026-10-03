import fs from 'node:fs'; import path from 'node:path'; import ts from 'typescript';
const HAN=/\p{Script=Han}/u; const m=new Map();
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.(tsx?|jsx?|mjs)$/.test(e.name)){const sf=ts.createSourceFile(p,fs.readFileSync(p,'utf8'),99,true,e.name.endsWith('x')?4:3);const v=n=>{if((n.kind===ts.SyntaxKind.Identifier||n.kind===ts.SyntaxKind.PrivateIdentifier)&&HAN.test(n.text)){const k=n.text;m.set(k,(m.get(k)||[]).concat(path.relative('src',p)+':'+(sf.getLineAndCharacterOfPosition(n.getStart()).line+1)))}n.forEachChild(v)};v(sf)}}}
walk('src');for(const[k,v]of m)console.log(k,v.length,v.slice(0,3).join(' '));
