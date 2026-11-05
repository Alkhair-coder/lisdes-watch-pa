import assert from 'node:assert/strict';
import {
  BASELINE_WORKFRONTS, evaluateScopeReadiness, evaluateA1Release,
  simulateScopeSchedule, countPrematurePlannedStarts, proposedSequence, HOR2_KEY_ACTIVITIES,
} from '../lib/pa-simulation.ts';

const [wfA,wfB,wfC]=BASELINE_WORKFRONTS;
assert.equal(evaluateScopeReadiness(wfA).status,'HOLD');
assert.equal(evaluateScopeReadiness(wfB).status,'CONDITIONAL GO');
assert.equal(evaluateScopeReadiness(wfC).status,'GO');
assert.equal(evaluateScopeReadiness({mrPct:null,cmrPct:100,ltr:1}).status,'DATA BELUM LENGKAP');
assert.equal(evaluateScopeReadiness({...wfA,ltr:1.43}).contingencyTriggered,true);

const a1Base={mrPct:85,cmrPct:100,ltr:1,readinessRechecked:false,dependenciesVerified:false,approvalGranted:false,contingencyReviewed:false};
assert.equal(evaluateA1Release(a1Base).releaseStatus,'HOLD — RECHECK REQUIRED');
assert.equal(evaluateA1Release({...a1Base,readinessRechecked:true}).releaseStatus,'HOLD — DEPENDENCY NOT VERIFIED');
assert.equal(evaluateA1Release({...a1Base,readinessRechecked:true,dependenciesVerified:true}).releaseStatus,'HOLD — APPROVAL NOT VERIFIED');
const releasable=evaluateA1Release({...a1Base,readinessRechecked:true,dependenciesVerified:true,approvalGranted:true});
assert.equal(releasable.releaseEligible,true);
assert.equal(releasable.releaseStatus,'RELEASE ELIGIBLE — CONDITIONAL GO');
assert.deepEqual(proposedSequence(releasable),['WF-C','WF-B','A-S1*']);
const ltrTrigger=evaluateA1Release({...a1Base,ltr:1.30,readinessRechecked:true,dependenciesVerified:true,approvalGranted:true});
assert.equal(ltrTrigger.gate.contingencyTriggered,true);
assert.equal(ltrTrigger.releaseStatus,'HOLD — CONTINGENCY REVIEW REQUIRED');
assert.equal(evaluateA1Release({...a1Base,ltr:1.30,readinessRechecked:true,dependenciesVerified:true,approvalGranted:true,contingencyReviewed:true}).releaseEligible,true);

const before=simulateScopeSchedule([wfA,wfB,wfC]);
const a1={id:'A-S1',label:'A-S1',mrPct:85,cmrPct:100,ltr:1,plannedStartDay:5,materialReadyDay:5,durationDays:5};
const after=simulateScopeSchedule([wfC,wfB,a1]);
assert.deepEqual([before.waitingDays,before.completionDay],[4,13]);
assert.deepEqual([after.waitingDays,after.completionDay],[0,9]);
assert.equal(countPrematurePlannedStarts([wfA,wfB,wfC]),1);
assert.equal(after.steps.filter(s=>s.startDay<(s.id==='WF-C'?wfC.materialReadyDay:s.id==='WF-B'?wfB.materialReadyDay:a1.materialReadyDay)).length,0);

assert.deepEqual(HOR2_KEY_ACTIVITIES.map(x=>x.code),['PA-06','PA-08','PA-05','PA-09','PA-07']);
assert.deepEqual(HOR2_KEY_ACTIVITIES.map(x=>x.rank),[1,2,3,4,5]);
assert.match(HOR2_KEY_ACTIVITIES[0].activity,/pengiriman MDU.*kesulitan akses.*material kritis/i);
assert.match(HOR2_KEY_ACTIVITIES[4].trigger,/LTR >1,25.*ambang sementara/i);
console.log('PA Logic Baseline v1.1: 23 assertions PASS.');
