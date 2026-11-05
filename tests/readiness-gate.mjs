import assert from 'node:assert/strict';
import {demoProjects,readinessGate,totalReadiness,projectSchema} from '../lib/model.ts';
import ts from 'typescript';
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const dir=new URL('../.gate-check/',import.meta.url);await mkdir(dir,{recursive:true});
try{
 for(const [input,output] of [['../app/dashboard.tsx','dashboard.mjs'],['../lib/model.ts','model.mjs']]){
 const source=(await readFile(new URL(input,import.meta.url),'utf8')).replace("from '../lib/model'","from './model.mjs'");
 await writeFile(new URL(output,dir),ts.transpileModule(source,{fileName:input,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText);
 }
 const {GatePanel}=await import(new URL('dashboard.mjs',dir));const results=[];
 const cases=[['OT-04',100,95,30,27,'HOLD'],['OT-05',100,90,30,30,'GO'],['OT-06',100,85,30,30,'CONDITIONAL GO'],['OT-07',100,60,30,30,'HOLD'],['OT-08',10000,6999,30,30,'HOLD'],['OT-09',100,70,30,30,'CONDITIONAL GO'],['OT-10',10000,8999,30,30,'CONDITIONAL GO']];
 for(const [id,totalRequired,totalReady,required,ready,expected] of cases){
 const p={...demoProjects()[0],totalRequired,totalReady,required,ready};assert(projectSchema.safeParse(p).success);
 assert.equal(readinessGate(p).status,expected);assert.equal(totalReadiness(p),100*totalReady/totalRequired);
 const html=renderToStaticMarkup(createElement(GatePanel,{project:p}));assert(html.includes('>'+expected+'</span>'));
 const restored=projectSchema.parse(JSON.parse(JSON.stringify(p)));assert.equal(readinessGate(restored).status,expected);
 results.push({id,expected,actual:readinessGate(p).status,logic:'PASS',render:'PASS',browser:'NOT RUN'});
 }
 const base={...demoProjects()[2],totalRequired:100,totalReady:100,required:30,ready:30};
 for(const change of [{totalRequired:undefined},{totalReady:null},{totalRequired:0},{required:0},{totalReady:-1},{required:101}])assert.equal(readinessGate({...base,...change}).status,'DATA BELUM LENGKAP');
 for(const change of [{ready:31},{totalReady:101}])assert.equal(readinessGate({...base,...change}).status,'REVIEW REQUIRED');
 assert(projectSchema.safeParse(demoProjects()[2]).success);assert.equal(readinessGate(demoProjects()[2]).status,'DATA BELUM LENGKAP');
 for(const change of [{totalReady:-1},{totalReady:101},{required:101},{totalReady:20}])assert(!projectSchema.safeParse({...base,...change}).success);
 await writeFile(new URL('readiness-gate-results.json',import.meta.url),JSON.stringify({version:'OT v1.2',results,legacy:'Preserved; missing total => DATA BELUM LENGKAP',scope:'Local logic, schema and React rendering. Live browser retest pending.'},null,2));console.log(JSON.stringify(results,null,2));
}finally{await rm(dir,{recursive:true,force:true});}
