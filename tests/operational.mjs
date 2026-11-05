import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {controlledWorkfronts,logisticsDecision,sequenceProjects,simulateSchedule,recordReport,currentProject,projectSchema,readinessGate,dispatchPriority,risks,priorities,level,defaults} from '../lib/model.ts';
const results=[];
function check(id,expected,actual){assert.deepEqual(actual,expected,id);results.push({id,expected,actual,result:'PASS',evidence:'Automated local logic / React render; not browser UAT'});}
const [a,b,c]=controlledWorkfronts();
assert.notEqual(level({...c,totalReady:null},defaults),0);
assert.notEqual(level({...c,totalRequired:null},defaults),0);
for(const [id,targetLeadDays,projectedLeadDays,plannedStartDay,materialReadyDay,expected] of [['OT-11',10,10,1,1,'NO'],['OT-12',100,101,1,1,'NO'],['OT-13',100,125,1,1,'NO'],['OT-14',100,126,1,1,'YES'],['OT-15',10,10,1,5,'YES']])check(id,expected,logisticsDecision({targetLeadDays,projectedLeadDays,plannedStartDay,materialReadyDay}).contingency);
check('OT-16',['WF-C','WF-B','WF-A'],sequenceProjects([a,b,c]).map(p=>p.name));
assert(Math.abs(logisticsDecision(a).ratio-1.428571)<.01);check('OT-19',1.428571,Number(logisticsDecision(a).ratio.toFixed(6)));
check('OT-20',4,logisticsDecision(a).waiting);
const excess={...c,totalReady:110};check('OT-23','REVIEW REQUIRED',readinessGate(excess).status);const validation=projectSchema.safeParse(excess);assert(!validation.success);assert(validation.error.message.includes('REVIEW REQUIRED'));
const t1=recordReport({...a,reportDate:'2026-10-20',actual:30,planned:40},undefined,'2026-10-20T01:00:00.000Z');
const t2=recordReport({...t1,reportDate:'2026-10-21',actual:45,planned:50,totalReady:95,ready:30},t1,'2026-10-21T01:00:00.000Z');
const backdated=recordReport({...t2,reportDate:'2026-10-19',actual:10,planned:20,totalReady:60,ready:15,targetLeadDays:100,projectedLeadDays:101},t2,'2026-10-22T01:00:00.000Z');
check('OT-26',{date:'2026-10-21',actual:45,totalReady:95,targetLeadDays:7},{date:backdated.reportDate,actual:backdated.actual,totalReady:backdated.totalReady,targetLeadDays:backdated.targetLeadDays});
assert.equal(backdated.history.length,3);assert.equal(backdated.decisionLog.length,3);assert.deepEqual(backdated.decisionLog.slice(0,2),t2.decisionLog);
const e=backdated.decisionLog[2];for(const k of ['decisionDate','trigger','outcome','owner','evidenceRef'])assert(e[k]);assert.equal(e.input.totalReady,60);assert(projectSchema.safeParse(backdated).success);check('OT-27','AUDIT COMPLETE','AUDIT COMPLETE');
const arp=risks.reduce((n,r)=>n+r[2],0),pareto=100*risks.slice(0,6).reduce((n,r)=>n+r[2],0)/arp;check('OT-28',[684,89.47,964],[arp,Number(pareto.toFixed(2)),priorities[0][2]]);
check('OT-29',[['P1','HOLD','YES'],['P2','CONDITIONAL GO','NO'],['P3','GO','NO']],[a,b,c].map(p=>[dispatchPriority(p.access),readinessGate(p).status,logisticsDecision(p).contingency]));
const before=simulateSchedule([a,b,c]),after=simulateSchedule(sequenceProjects([a,b,c]));check('OT-30',[4,0,13,9],[before.waiting,after.waiting,before.completionDay,after.completionDay]);
// Missing values cannot suppress a known positive contingency trigger.
assert.equal(logisticsDecision({}).contingency,'DATA BELUM LENGKAP');
assert.equal(logisticsDecision({targetLeadDays:0,projectedLeadDays:10,plannedStartDay:1,materialReadyDay:1}).contingency,'DATA BELUM LENGKAP');
assert.equal(logisticsDecision({targetLeadDays:100,projectedLeadDays:126}).contingency,'YES');
assert.equal(logisticsDecision({plannedStartDay:1,materialReadyDay:5}).contingency,'YES');
assert.equal(logisticsDecision({targetLeadDays:100,projectedLeadDays:125,plannedStartDay:1,materialReadyDay:1}).leadStatus,'WARNING');
assert.equal(logisticsDecision({targetLeadDays:10,projectedLeadDays:10,plannedStartDay:1,materialReadyDay:1}).leadStatus,'NORMAL');
assert.equal(logisticsDecision({targetLeadDays:10,projectedLeadDays:10,plannedStartDay:5,materialReadyDay:1}).waiting,0);
assert.equal(currentProject({...t2,reportDate:'2026-10-19'}).actual,45);
const dir=new URL('../.operational-check/',import.meta.url);await mkdir(dir,{recursive:true});
try{
 for(const [input,output] of [['../app/dashboard.tsx','dashboard.mjs'],['../lib/model.ts','model.mjs']]){
 const source=(await readFile(new URL(input,import.meta.url),'utf8')).replace("from '../lib/model'","from './model.mjs'");await writeFile(new URL(output,dir),ts.transpileModule(source,{fileName:input,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText);
 }
 const ui=await import(new URL('dashboard.mjs',dir));
 const html=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
 assert(html(ui.LogisticsPanel,{project:a}).includes('1.43'));assert(html(ui.LogisticsPanel,{project:a}).includes('TRIGGERED — EVALUATION REQUIRED'));assert(html(ui.LogisticsPanel,{project:a}).includes('not execution'));
 assert(html(ui.SequencePanel,{projects:[a,b,c]}).includes('WF-C → WF-B → WF-A'));
 const auditHTML=html(ui.DecisionPanel,{project:backdated});assert(auditHTML.includes(e.evidenceRef));assert(auditHTML.includes(e.owner));
 const scenarioHTML=html(ui.ControlledSimulation,{});assert(scenarioHTML.includes('4 → 0 hari'));assert(scenarioHTML.includes('H13 → H9'));assert(scenarioHTML.includes('bukan hasil pengukuran lapangan'));
 await writeFile(new URL('operational-results.json',import.meta.url),JSON.stringify({version:'OT v1.3',timestamp:new Date().toISOString(),results,render:'PASS',browser:'NOT RUN',assumptions:'OT30 durations A5 B1 C3, one crew, no transit, prerequisites met at material-ready day'},null,2));
 console.log('14 remaining OT cases passed local logic checks; operational panels passed React rendering. Browser UAT not run.');
} finally {await rm(dir,{recursive:true,force:true});}
