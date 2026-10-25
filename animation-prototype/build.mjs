import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
for (const file of ['data', 'core', 'render', 'main']) {
  const source = await readFile(new URL(`./src/${file}.ts`, import.meta.url), 'utf8');
  const js = stripTypeScriptTypes(source, { mode: 'strip' }).replace(/[ \t]+$/gm, '');
  await writeFile(new URL(`./dist/${file}.js`, import.meta.url), js);
}
console.log('Built animation-prototype/dist/*.js');
