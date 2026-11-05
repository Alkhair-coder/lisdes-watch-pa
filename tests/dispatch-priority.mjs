import assert from 'node:assert/strict';
import {dispatchPriority, demoProjects, defaults, level} from '../lib/model.ts';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdir, rm, writeFile, readFile} from 'node:fs/promises';
const dir=new URL('../.ot-check/',import.meta.url);
await mkdir(dir,{recursive:true});
try {
  for(const [input,output] of [['../app/dashboard.tsx','dashboard.mjs'],['../lib/model.ts','model.mjs']]) {
    const source=(await readFile(new URL(input,import.meta.url),'utf8')).replace("from '../lib/model'","from './model.mjs'");
    const result=ts.transpileModule(source,{fileName:input,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});
    await writeFile(new URL(output,dir),result.outputText);
  }
  const {ProjectTable}=await import(new URL('dashboard.mjs',dir));
  const results=[];
  for(const [id,access,expected] of [['OT-01','Sulit','P1'],['OT-02','Sedang','P2'],['OT-03','Mudah','P3']]) {
    const p={...demoProjects()[2],access};
    assert.equal(dispatchPriority(access),expected);
    const html=renderToStaticMarkup(createElement(ProjectTable,{projects:[p],settings:defaults,onOpen:()=>{}}));
    assert(html.includes('Material/Dispatch Priority'));
    assert(html.includes(`<strong>${expected}</strong>`));
    assert(html.includes(`Akses: ${access}`));
    // Priority persists across serialization and is independent of risk status.
    assert.equal(dispatchPriority(JSON.parse(JSON.stringify(p)).access),expected);
    const critical={...p,mobilized:true,ready:0};
    assert.equal(level(critical,defaults),3);
    assert.equal(dispatchPriority(critical.access),expected);
    results.push({test:id,input:access,expected,actual:dispatchPriority(access),unit:'PASS',server_rendered_table:'PASS',browser_retest:'NOT RUN'});
  }
  for(const v of [null,undefined,'','Tidak diketahui','Sangat sulit'])assert.equal(dispatchPriority(v),null);
  assert.equal(dispatchPriority('Tinggi'),'P1');assert.equal(dispatchPriority('Rendah'),'P3');
  const report={build:'OT v1.1 / ISS-01',results,scope:'Function and server-rendered component tests only; no live browser persistence or acceptance sign-off.',unmapped:'Sangat sulit requires rule validation; no implicit P3 fallback.'};
  await writeFile(new URL('./dispatch-priority-results.json',import.meta.url),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {await rm(dir,{recursive:true,force:true});}
