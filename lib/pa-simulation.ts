/**
 * PA Logic Baseline v1.1 — isolated, client-side HOR2 implementation scenario.
 * This module is intentionally separate from the operational D1 project schema.
 * No result from this simulation is persisted to the production database.
 */
export type GateStatus = 'GO' | 'CONDITIONAL GO' | 'HOLD' | 'DATA BELUM LENGKAP' | 'REVIEW REQUIRED';
export type ReleaseStatus = 'RELEASE ELIGIBLE — GO' | 'RELEASE ELIGIBLE — CONDITIONAL GO' | 'HOLD — RECHECK REQUIRED' | 'HOLD — DEPENDENCY NOT VERIFIED' | 'HOLD — APPROVAL NOT VERIFIED' | 'HOLD — CONTINGENCY REVIEW REQUIRED' | 'HOLD — READINESS GATE';

export interface Hor2KeyActivity {
  rank: number;
  code: 'PA-06' | 'PA-08' | 'PA-05' | 'PA-09' | 'PA-07';
  activity: string;
  trigger: string;
  proposedEvidence: string;
}

/** HOR2 priorities already validated for PA Logic Baseline v1.1. */
export const HOR2_KEY_ACTIVITIES: Hor2KeyActivity[] = [
  {
    rank: 1, code: 'PA-06',
    activity: 'Memprioritaskan pengiriman MDU berdasarkan tingkat kesulitan akses dan kebutuhan material kritis.',
    trigger: 'Sebelum pengiriman serta saat kondisi akses atau kebutuhan material berubah.',
    proposedEvidence: 'Matriks prioritas MDU dan rencana pengiriman per lingkup.',
  },
  {
    rank: 2, code: 'PA-08',
    activity: 'Memantau dan memverifikasi kesiapan material sebelum mobilisasi tim.',
    trigger: 'Sebelum mobilisasi crew dan setiap pembaruan status material.',
    proposedEvidence: 'Checklist MR/CMR dan catatan verifikasi sebelum mobilisasi.',
  },
  {
    rank: 3, code: 'PA-05',
    activity: 'Memetakan rute pengiriman dan titik mobilisasi yang kritis.',
    trigger: 'Sebelum pengiriman atau ketika rute dan akses mengalami perubahan.',
    proposedEvidence: 'Peta rute, titik serah terima, dan daftar kendala akses.',
  },
  {
    rank: 4, code: 'PA-09',
    activity: 'Menyusun urutan pekerjaan berdasarkan kepastian dan kesiapan material.',
    trigger: 'Saat penyusunan atau revisi jadwal dan ketika status readiness material berubah.',
    proposedEvidence: 'Daftar urutan kandidat per workfront beserta dasar keputusan.',
  },
  {
    rank: 5, code: 'PA-07',
    activity: 'Mengevaluasi skenario transportasi cadangan untuk risiko keterlambatan material.',
    trigger: 'Saat LTR >1,25 (ambang sementara) atau risiko keterlambatan material meningkat.',
    proposedEvidence: 'Catatan evaluasi opsi, persetujuan, dan bukti eksekusi yang dicatat terpisah.',
  },
];

export interface ScopeReadinessInput {
  mrPct: number | null; // total material readiness
  cmrPct: number | null; // critical material readiness
  ltr: number | null;  // projected / target lead time ratio
}

export interface ScopeReadinessResult {
  status: GateStatus;
  reason: string;
  contingencyTriggered: boolean | null;
}

export interface A1ReleaseInput extends ScopeReadinessInput {
  readinessRechecked: boolean;
  dependenciesVerified: boolean;
  approvalGranted: boolean;
  contingencyReviewed: boolean;
}

export interface A1ReleaseResult {
  gate: ScopeReadinessResult;
  releaseEligible: boolean;
  releaseStatus: ReleaseStatus;
  reason: string;
}

export interface WorkfrontScenario {
  id: 'WF-A' | 'WF-B' | 'WF-C' | 'A-S1';
  label: string;
  mrPct: number;
  cmrPct: number;
  ltr: number;
  plannedStartDay: number;
  materialReadyDay: number;
  durationDays: number;
}

export interface ScheduleStep {
  id: string;
  startDay: number;
  endDay: number;
  waitingDays: number;
  durationDays: number;
}

export interface ScheduleResult {
  steps: ScheduleStep[];
  waitingDays: number;
  completionDay: number;
}

export const BASELINE_WORKFRONTS: WorkfrontScenario[] = [
  { id: 'WF-A', label: 'WF-A • Akses Tinggi (full scope)', mrPct: 60, cmrPct: 50, ltr: 1.43, plannedStartDay: 1, materialReadyDay: 5, durationDays: 5 },
  { id: 'WF-B', label: 'WF-B • Akses Sedang', mrPct: 85, cmrPct: 100, ltr: 1.17, plannedStartDay: 4, materialReadyDay: 4, durationDays: 1 },
  { id: 'WF-C', label: 'WF-C • Akses Rendah', mrPct: 100, cmrPct: 100, ltr: 1.00, plannedStartDay: 7, materialReadyDay: 1, durationDays: 3 },
];

/** v0.1 provisional readiness gate applied at the scope being evaluated. */
export function evaluateScopeReadiness(input: ScopeReadinessInput): ScopeReadinessResult {
  const { mrPct, cmrPct, ltr } = input;
  const validPct = (v: number | null): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;
  const validLtr = (v: number | null): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  const contingencyTriggered = validLtr(ltr) ? ltr > 1.25 : null;

  if (!validPct(mrPct) || !validPct(cmrPct) || !validLtr(ltr)) {
    return { status: 'DATA BELUM LENGKAP', reason: 'MR, CMR, dan LTR untuk lingkup ini harus diisi dengan nilai yang valid.', contingencyTriggered };
  }
  if (cmrPct < 100) {
    return { status: 'HOLD', reason: 'CMR belum 100%; material kritis yang menjadi prasyarat lingkup belum lengkap.', contingencyTriggered };
  }
  if (mrPct < 70) {
    return { status: 'HOLD', reason: 'MR berada di bawah 70%; kesiapan material total belum memadai.', contingencyTriggered };
  }
  if (mrPct < 90) {
    return { status: 'CONDITIONAL GO', reason: 'CMR 100% dan MR 70%–<90%; hanya lingkup terverifikasi dengan kontrol dan persetujuan yang dapat dipertimbangkan.', contingencyTriggered };
  }
  return { status: 'GO', reason: 'CMR 100% dan MR ≥90%; tetap verifikasi prasyarat lapangan dan persetujuan.', contingencyTriggered };
}

/** A-S1 is a sub-workfront, not a declaration that WF-A full scope is ready. */
export function evaluateA1Release(input: A1ReleaseInput): A1ReleaseResult {
  const gate = evaluateScopeReadiness(input);
  if (!input.readinessRechecked) {
    return { gate, releaseEligible: false, releaseStatus: 'HOLD — RECHECK REQUIRED', reason: 'MR/CMR belum ditandai telah direcheck untuk lingkup A-S1.' };
  }
  if (gate.status === 'DATA BELUM LENGKAP' || gate.status === 'REVIEW REQUIRED' || gate.status === 'HOLD') {
    return { gate, releaseEligible: false, releaseStatus: 'HOLD — READINESS GATE', reason: gate.reason };
  }
  if (!input.dependenciesVerified) {
    return { gate, releaseEligible: false, releaseStatus: 'HOLD — DEPENDENCY NOT VERIFIED', reason: 'Dependensi pekerjaan A-S1 belum diverifikasi.' };
  }
  if (!input.approvalGranted) {
    return { gate, releaseEligible: false, releaseStatus: 'HOLD — APPROVAL NOT VERIFIED', reason: 'Persetujuan pelepasan lingkup A-S1 belum dikonfirmasi.' };
  }
  if (gate.contingencyTriggered && !input.contingencyReviewed) {
    return { gate, releaseEligible: false, releaseStatus: 'HOLD — CONTINGENCY REVIEW REQUIRED', reason: 'LTR >1,25 memicu evaluasi contingency. Trigger bukan bukti transport alternatif telah dijalankan.' };
  }
  if (gate.status === 'CONDITIONAL GO') {
    return { gate, releaseEligible: true, releaseStatus: 'RELEASE ELIGIBLE — CONDITIONAL GO', reason: 'A-S1 dapat dipertimbangkan untuk pelepasan terbatas dengan kontrol dan persetujuan; WF-A full scope tetap HOLD.' };
  }
  return { gate, releaseEligible: true, releaseStatus: 'RELEASE ELIGIBLE — GO', reason: 'A-S1 memenuhi gate simulasi; pelepasan tetap dibatasi pada lingkup yang telah diverifikasi.' };
}

/** One-crew, no-transit-delay schedule used only for the illustrative comparison. */
export function simulateScopeSchedule(order: WorkfrontScenario[]): ScheduleResult {
  let nextDay = 1;
  let waitingDays = 0;
  const steps = order.map((scope) => {
    if (!Number.isInteger(scope.durationDays) || scope.durationDays < 1 || !Number.isInteger(scope.materialReadyDay) || scope.materialReadyDay < 1) {
      throw new Error(`Durasi/material-ready day tidak valid untuk ${scope.id}`);
    }
    const startDay = Math.max(nextDay, scope.materialReadyDay);
    const waiting = startDay - nextDay;
    const endDay = startDay + scope.durationDays - 1;
    waitingDays += waiting;
    nextDay = endDay + 1;
    return { id: scope.id, startDay, endDay, waitingDays: waiting, durationDays: scope.durationDays };
  });
  return { steps, waitingDays, completionDay: nextDay - 1 };
}

export function countPrematurePlannedStarts(scopes: WorkfrontScenario[]): number {
  return scopes.filter((scope) => scope.plannedStartDay < scope.materialReadyDay).length;
}

export function proposedSequence(a1: A1ReleaseResult): string[] {
  const base = ['WF-C', 'WF-B'];
  return a1.releaseEligible ? [...base, 'A-S1*'] : [...base, 'A-S1 (HOLD)'];
}

export function contingencyLabel(triggered: boolean | null): string {
  if (triggered === null) return 'DATA BELUM LENGKAP';
  return triggered ? 'TRIGGERED — EVALUATION REQUIRED (not execution)' : 'NO TRIGGER';
}
