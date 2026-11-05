import { z } from 'zod';
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jayapura',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const days = (a:string,b:string) => Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=> !isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s,'Tanggal tidak valid');
const txt = z.string().trim().min(1).max(200);
const count=z.number().int().min(0).max(1000000);
export const shipmentSchema=z.object({id:txt,name:txt,mode:z.enum(['Udara','Darat','Kombinasi']),dispatch:date,target:date,arrival:z.union([date,z.literal('')]),note:z.string().max(2000)}).refine(v=>v.target>=v.dispatch && (!v.arrival||v.arrival>=v.dispatch),'Tanggal tiba harus setelah pengiriman').refine(v=>!v.arrival||v.arrival<=today(),'Aktual tiba tidak boleh di masa depan');
export const actionSchema=z.object({id:txt,code:z.enum(['PA-06','PA-08','PA-05','PA-09','PA-07']),task:txt,pic:txt,due:date,status:z.enum(['Belum mulai','Berjalan','Selesai']),note:z.string().max(2000)});
const logisticsFields={targetLeadDays:count.nullable().optional(),projectedLeadDays:count.nullable().optional(),plannedStartDay:count.nullable().optional(),materialReadyDay:count.nullable().optional()};
const auditEntry=z.object({id:txt,decisionDate:z.string().datetime(),reportDate:date,trigger:txt,outcome:txt,owner:txt,evidenceRef:txt,input:z.object({required:count,ready:count,totalRequired:count.nullable().optional(),totalReady:count.nullable().optional(),access:txt,...logisticsFields}),ruleVersion:txt});
const snapshot=z.object({date:date,planned:z.number().min(0).max(100),actual:z.number().min(0).max(100),ready:count,required:count,totalRequired:count.nullable().optional(),totalReady:count.nullable().optional(),access:z.enum(['Mudah','Sedang','Sulit','Sangat sulit']).optional(),waiting:count.optional(),mobilized:z.boolean().optional(),...logisticsFields});
export const projectSchema=z.object({id:txt,name:txt,district:txt,village:txt,pic:txt,access:z.enum(['Mudah','Sedang','Sulit','Sangat sulit']),start:date,end:date,reportDate:date,planned:z.number().min(0).max(100),actual:z.number().min(0).max(100),required:count,ready:count,totalRequired:count.nullable().optional(),totalReady:count.nullable().optional(),waiting:count,mobilized:z.boolean(),note:z.string().max(3000),shipments:z.array(shipmentSchema).max(500),actions:z.array(actionSchema).max(500),history:z.array(snapshot).max(1000),...logisticsFields,decisionLog:z.array(auditEntry).max(2000).optional()}).refine(v=>v.end>=v.start,'Tanggal selesai harus setelah mulai').refine(v=>v.ready<=v.required,'REVIEW REQUIRED: material kritis tersedia melebihi kebutuhan; tinjau jumlah sebelum menyimpan.').refine(v=>v.totalReady==null||v.totalRequired==null||v.totalReady<=v.totalRequired,'REVIEW REQUIRED: material total tersedia melebihi kebutuhan; tinjau jumlah sebelum menyimpan.').refine(v=>v.totalRequired==null||v.required<=v.totalRequired,'Kebutuhan kritis tidak boleh melebihi kebutuhan total').refine(v=>v.totalReady==null||v.ready<=v.totalReady,'Material kritis tersedia tidak boleh melebihi material total tersedia').refine(v=>v.reportDate<=today(),'Tanggal laporan tidak boleh di masa depan');
export const settingsSchema=z.object({readyRed:z.number().min(0).max(100),readyAmber:z.number().min(0).max(100),delayRed:z.number().min(1).max(365),deviationRed:z.number().min(1).max(100),deviationAmber:z.number().min(0).max(100),waitingRed:z.number().min(1).max(365),staleDays:z.number().min(1).max(365)}).refine(v=>v.readyRed<v.readyAmber && v.deviationAmber<v.deviationRed,'Urutan ambang tidak valid');
export const dataSchema=z.object({projects:z.array(projectSchema).max(300),settings:settingsSchema}).refine(v=>new Set(v.projects.map(p=>p.id)).size===v.projects.length,'ID proyek duplikat');
export type Project=z.infer<typeof projectSchema>;export type Shipment=z.infer<typeof shipmentSchema>;export type Action=z.infer<typeof actionSchema>;export type Settings=z.infer<typeof settingsSchema>;export type Data=z.infer<typeof dataSchema>;
export const defaults:Settings={readyRed:80,readyAmber:100,delayRed:7,deviationRed:10,deviationAmber:5,waitingRed:3,staleDays:7};
export const risks=[['RA-01','Ketergantungan transportasi udara',180],['RA-05','Keterlambatan kedatangan MDU',144],['RA-04','Jarak & kondisi akses darat',144],['RA-02','Kapasitas/frekuensi transportasi udara',48],['RA-03','Kompleksitas mobilisasi Wamena–desa',48],['RA-06','Geografis/topografi',48],['RA-07','Gangguan keamanan/eksternal',36],['RA-08','Kinerja mitra kerja',36]] as const;
export const priorities=[['PA-06','Prioritas pengiriman berdasarkan kesulitan akses',964],['PA-08','Monitoring kesiapan material sebelum mobilisasi',868],['PA-05','Pemetaan jalur & titik kritis mobilisasi',705],['PA-09','Sequencing berdasarkan kepastian material',627],['PA-07','Backup skenario transportasi',583.2]] as const;
export function readiness(p:Project){return p.required?100*p.ready/p.required:null}
export function delivery(p:Project,now=today()){const due=p.shipments.filter(s=>s.target<=now||s.arrival);return due.length?100*due.filter(s=>s.arrival && s.arrival<=s.target).length/due.length:null}
export function lead(p:Project){const s=p.shipments.filter(s=>s.arrival);return s.length?s.reduce((a,v)=>a+days(v.arrival,v.dispatch),0)/s.length:null}
export function alerts(p:Project,s:Settings,now=today()) {const out:{level:number;text:string;pa:string}[]=[];const r=readiness(p);const add=(level:number,text:string,pa:string)=>out.push({level,text,pa});
const gate=readinessGate(p);if(gate.status==='DATA BELUM LENGKAP')add(1,'Data material total/kritis belum lengkap atau tidak valid','PA-08');else if(gate.status==='REVIEW REQUIRED')add(2,'Jumlah material perlu ditinjau','PA-08');
if(r===null)add(1,'Kebutuhan material belum diisi','PA-08');else if(p.mobilized&&r<100)add(3,'Tenaga dimobilisasi sebelum material kritis lengkap','PA-08');else if(r<s.readyAmber)add(r<s.readyRed?3:2,`Kesiapan material ${r.toFixed(0)}%`,'PA-08');
const lag=p.planned-p.actual;if(lag>=s.deviationAmber&&lag>0)add(lag>=s.deviationRed?3:2,`Progres tertinggal ${lag.toFixed(1)} poin persentase`,'PA-09');
for(const d of p.shipments){const late=days(d.arrival||now,d.target);if(late>0&&!d.arrival)add(late>=s.delayRed?3:2,`${d.name}: terlambat ${late} hari`,'PA-07');}
if(p.waiting>0)add(p.waiting>=s.waitingRed?3:2,`Menunggu material ${p.waiting} hari`,'PA-06');
if(now>p.end&&p.actual<100)add(3,'Target selesai terlewati','PA-09');
for(const a of p.actions)if(a.status!=='Selesai'&&a.due<now)add(2,`Tindak lanjut melewati tenggat: ${a.task}`,a.code);
if(days(now,p.reportDate)>s.staleDays)add(1,`Laporan belum diperbarui ${days(now,p.reportDate)} hari`,'PA-08');
return out.sort((a,b)=>b.level-a.level);}
export function level(p:Project,s:Settings,now=today()){return Math.max(0,...alerts(p,s,now).map(x=>x.level))}
export const labels=['Terkendali','Perlu data','Waspada','Kritis'];
export function demoProjects():Project[]{const now=today();const dt=(n:number)=>new Date(Date.parse(now+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);return [['Paket contoh A','Yahukimo','Desa simulasi A',72,48,20,13,4,'Sangat sulit'],['Paket contoh B','Pegunungan Bintang','Desa simulasi B',65,58,16,14,1,'Sulit'],['Paket contoh C','Jayawijaya','Desa simulasi C',55,56,24,24,0,'Sedang'],['Paket contoh D','Tolikara','Desa simulasi D',40,40,12,12,0,'Sulit']].map((v,i)=>({id:'demo-'+i,name:String(v[0]),district:String(v[1]),village:String(v[2]),pic:['PIC Logistik A','PIC Konstruksi B','PIC Lapangan C','PIC Logistik D'][i],access:v[8] as Project['access'],start:dt(-45),end:dt(40),reportDate:now,planned:Number(v[3]),actual:Number(v[4]),required:Number(v[5]),ready:Number(v[6]),waiting:Number(v[7]),mobilized:i===0,note:'Data simulasi untuk demonstrasi. Bukan kondisi proyek aktual.',shipments:[{id:'s-'+i,name:'Pengiriman MDU '+(i+1),mode:i===2?'Darat':'Udara',dispatch:dt(-12),target:dt(-4),arrival:i>1?dt(-5):'',note:'Contoh pengiriman'}],actions:[{id:'a-'+i,code:priorities[i][0],task:priorities[i][1],pic:'PIC '+(i+1),due:dt(i===0?-1:5+i),status:i===2?'Selesai':'Berjalan',note:'Simulasi tindak lanjut'}],history:[{date:dt(-21),planned:10,actual:8,ready:2,required:Number(v[5])},{date:dt(-14),planned:25,actual:20,ready:5,required:Number(v[5])},{date:dt(-7),planned:35,actual:30,ready:8,required:Number(v[5])},{date:now,planned:Number(v[3]),actual:Number(v[4]),ready:Number(v[6]),required:Number(v[5])}]}))}

// OT v1.1 / ISS-01: matrix OT-01..03; priority is independent of readiness/status.
// Existing UI vocabulary: Sulit=Tinggi; Sedang=Sedang; Mudah=Rendah.
// Sangat sulit has no explicit oracle in the frozen matrix: do not invent a rule.
export function dispatchPriority(access: string | null | undefined): 'P1' | 'P2' | 'P3' | null {
  switch (access) {
    case 'Sulit': case 'Tinggi': return 'P1';
    case 'Sedang': return 'P2';
    case 'Mudah': case 'Rendah': return 'P3';
    default: return null;
  }
}

// OT v1.2 readiness gate; provisional frozen rule v0.1.
// required/ready retain their historical meaning: CRITICAL items.
export function totalReadiness(p: Pick<Project,'totalRequired'|'totalReady'>) {
  return p.totalRequired != null && p.totalRequired > 0 && p.totalReady != null
    ? 100 * p.totalReady / p.totalRequired : null;
}
export function readinessGate(p: Pick<Project,'required'|'ready'|'totalRequired'|'totalReady'>) {
  const values=[p.required,p.ready,p.totalRequired,p.totalReady];
  if(values.some(v=>v==null||!Number.isFinite(v)||!Number.isInteger(v)||v<0) || p.required<=0 || !p.totalRequired || p.required>p.totalRequired || p.ready>p.totalReady!)
    return {status:'DATA BELUM LENGKAP',reason:'Lengkapi kebutuhan dan ketersediaan material total serta kritis dengan data yang valid.'};
  if(p.ready>p.required || p.totalReady!>p.totalRequired) return {status:'REVIEW REQUIRED',reason:'Jumlah tersedia melebihi kebutuhan. Tinjau sumber data sebelum menyimpan atau mengambil keputusan.'};
  if(p.ready<p.required) return {status:'HOLD',reason:'Material kritis belum 100% siap. Tunda mobilisasi/pelaksanaan sampai prasyarat kritis terpenuhi.'};
  if(p.totalReady!*100 < p.totalRequired*70) return {status:'HOLD',reason:'Kesiapan material total di bawah 70%.'};
  if(p.totalReady!*100 < p.totalRequired*90) return {status:'CONDITIONAL GO',reason:'Material kritis lengkap; material total 70% hingga kurang dari 90%. Pelaksanaan bersyarat dengan pengendalian dan persetujuan penanggung jawab.'};
  return {status:'GO',reason:'Material kritis lengkap dan material total minimal 90%. Tetap verifikasi prasyarat lapangan dan persetujuan penanggung jawab.'};
}

// OT v1.3: threshold v0.1 is unchanged. All day indices use one common H1 origin.
export function logisticsDecision(p:Pick<Project,'targetLeadDays'|'projectedLeadDays'|'plannedStartDay'|'materialReadyDay'>) {
 const valid=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=1000000;
 const hasRatio=valid(p.targetLeadDays)&&p.targetLeadDays>0&&valid(p.projectedLeadDays);
 const hasDates=valid(p.plannedStartDay)&&p.plannedStartDay>=1&&valid(p.materialReadyDay)&&p.materialReadyDay>=1;
 const ratio=hasRatio?p.projectedLeadDays!/p.targetLeadDays!:null;
 const waiting=hasDates?Math.max(0,p.materialReadyDay!-p.plannedStartDay!):null;
 const leadTrigger=hasRatio&&p.projectedLeadDays!*100>p.targetLeadDays!*125;
 const dateTrigger=hasDates&&p.materialReadyDay!>p.plannedStartDay!;
 const contingency=leadTrigger||dateTrigger?'YES':hasRatio&&hasDates?'NO':'DATA BELUM LENGKAP';
 const leadStatus=ratio===null?'DATA BELUM LENGKAP':leadTrigger?'KRITIS':p.projectedLeadDays!>p.targetLeadDays!?'WARNING':'NORMAL';
 const reason=[leadTrigger?'Proyeksi lead time melampaui 125% target.':'',dateTrigger?'Material siap setelah rencana mulai.':''].filter(Boolean).join(' ') || (contingency==='NO'?'Tidak ada pemicu contingency pada input ini.':'Lengkapi target/proyeksi lead time dan hari mulai/kesiapan material.');
 return {ratio,waiting,contingency,leadStatus,reason,complete:hasRatio&&hasDates};
}

// Read views always use the newest snapshot, including after a backdated edit.
export function currentProject(p:Project):Project {
 const h=[...p.history].sort((a,b)=>b.date.localeCompare(a.date))[0];
 if(!h||h.date<=p.reportDate)return p;
 return {...p,reportDate:h.date,planned:h.planned,actual:h.actual,required:h.required,ready:h.ready,
 totalRequired:h.totalRequired??null,totalReady:h.totalReady??null,
 access:h.access??p.access,waiting:h.waiting??p.waiting,mobilized:h.mobilized??p.mobilized,
 targetLeadDays:h.targetLeadDays??null,projectedLeadDays:h.projectedLeadDays??null,
 plannedStartDay:h.plannedStartDay??null,materialReadyDay:h.materialReadyDay??null};
}

export function recordReport(p:Project,previous?:Project,at=new Date().toISOString()):Project {
 const history=[...(previous?.history??p.history).filter(h=>h.date!==p.reportDate),{
 date:p.reportDate,planned:p.planned,actual:p.actual,ready:p.ready,required:p.required,
 totalRequired:p.totalRequired??null,totalReady:p.totalReady??null,access:p.access,
 waiting:p.waiting,mobilized:p.mobilized,targetLeadDays:p.targetLeadDays??null,
 projectedLeadDays:p.projectedLeadDays??null,plannedStartDay:p.plannedStartDay??null,materialReadyDay:p.materialReadyDay??null
 }].sort((a,b)=>a.date.localeCompare(b.date));
 const gate=readinessGate(p),logistics=logisticsDecision(p),id=crypto.randomUUID();
 const contingencyText=logistics.contingency==='YES'?'TRIGGERED — EVALUATION REQUIRED (not execution)':logistics.contingency==='NO'?'NO TRIGGER':'DATA BELUM LENGKAP';
 const entry={id,decisionDate:at,reportDate:p.reportDate,trigger:`Gate ${gate.status}; contingency ${contingencyText}`,
 outcome:`Dispatch ${dispatchPriority(p.access)??'PERLU VALIDASI'}; ${gate.status}; contingency ${contingencyText}`,
 owner:p.pic,evidenceRef:`snapshot:${p.id}:${p.reportDate}:${id}`,ruleVersion:'v0.1',
 input:{required:p.required,ready:p.ready,totalRequired:p.totalRequired??null,totalReady:p.totalReady??null,access:p.access,
 targetLeadDays:p.targetLeadDays??null,projectedLeadDays:p.projectedLeadDays??null,plannedStartDay:p.plannedStartDay??null,materialReadyDay:p.materialReadyDay??null}};
 return currentProject({...p,history,decisionLog:[...(previous?.decisionLog??p.decisionLog??[]),entry]});
}

export function sequenceProjects(projects:Project[]) {
 const rank:Record<string,number>={'GO':0,'CONDITIONAL GO':1,'HOLD':2};
 return projects.map(currentProject).sort((a,b)=>(rank[readinessGate(a).status]??3)-(rank[readinessGate(b).status]??3)||a.name.localeCompare(b.name,'id')||a.id.localeCompare(b.id));
}

export function controlledWorkfronts():Project[] {
 const base=demoProjects()[0];
 return [
 {name:'WF-A',access:'Sulit' as const,totalReady:60,ready:15,targetLeadDays:7,projectedLeadDays:10,plannedStartDay:1,materialReadyDay:5},
 {name:'WF-B',access:'Sedang' as const,totalReady:85,ready:30,targetLeadDays:6,projectedLeadDays:7,plannedStartDay:4,materialReadyDay:4},
 {name:'WF-C',access:'Mudah' as const,totalReady:100,ready:30,targetLeadDays:4,projectedLeadDays:4,plannedStartDay:7,materialReadyDay:1}
 ].map(v=>({...base,...v,id:'controlled-'+v.name,required:30,totalRequired:100,planned:0,actual:0,waiting:0,mobilized:false,history:[],shipments:[],actions:[],decisionLog:[],note:'Simulasi terkontrol matriks OT; bukan data operasional.'}));
}

// Explicit demonstration assumptions: one crew, A=5, B=1, C=3 days,
// all prerequisites satisfied at each material-ready day; no travel/setup delay.
export function simulateSchedule(order:Project[]) {
 const duration:Record<string,number>={'WF-A':5,'WF-B':1,'WF-C':3};let nextDay=1,waiting=0;
 const steps=order.map(p=>{
 const length=duration[p.name],ready=p.materialReadyDay;
 if(!length||ready==null||ready<1)throw Error('Skenario simulasi tidak lengkap');
 const start=Math.max(nextDay,ready),idle=start-nextDay,end=start+length-1;
 waiting+=idle;nextDay=end+1;return {name:p.name,start,end,waiting:idle,duration:length};
 });
 return {steps,waiting,completionDay:nextDay-1};
}
