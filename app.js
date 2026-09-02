(() => {
'use strict';

/* =========================================================
   Reef Marine Control v74
   Núcleo reconstruido: una única fuente de verdad química.
   - Método activo = mantenimiento continuo (Xepta o Manual)
   - Correcciones puntuales KH/Ca/Mg disponibles en AMBOS métodos
   - Objetivos del acuario fijos e independientes de la sal
   ========================================================= */

const APP_VERSION = 74;
const DAY = 86400000;
const STORAGE_REGISTRY = 'reef-marine-control-aquariums-v71';
const STORAGE_ACTIVE = 'reef-marine-control-active-aquarium-v71';
const LEGACY_STATE_KEY = 'reef-marine-control-state-v71-legacy';
const stateKey = id => `reef-marine-control-state-v71:${id}`;
const backupKey = id => `${stateKey(id)}:backup-v71`;

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const num = v => {
  const s=String(v??'').trim().replace(',','.');
  if(!s) return NaN;
  return Number(s);
};
const finite = v => Number.isFinite(Number(v));
const nf = (n,d=1) => Number(n).toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const isoNow = () => new Date().toISOString();
const localNow = () => {
  const d=new Date(), p=n=>String(n).padStart(2,'0');
  return {date:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`,time:`${p(d.getHours())}:${p(d.getMinutes())}`};
};
const sortByTs = arr => [...(arr||[])].sort((a,b)=>{
  const dt=+new Date(a.ts)-+new Date(b.ts);
  if(dt) return dt;
  return +new Date(a.recordedAt||a.ts)-+new Date(b.recordedAt||b.ts);
});
const validTs = ts => Number.isFinite(+new Date(ts));

function sgToPpt(sg){
  const n=Number(sg);
  if(!Number.isFinite(n)||n<1||n>1.05)return NaN;
  return (n-1)*35/0.026; // anclado a 1.026 ≈ 35 ppt
}
function pointValueText(key,m){
  if(key==='sal'&&Number.isFinite(Number(m?.salRawSg)))return nf(Number(m.salRawSg),3);
  return nf(Number(m?.[key]),PARAM_LIMITS[key]?.decimals??1);
}
function measurementText(key,m){
  if(!m||!Number.isFinite(Number(m[key])))return '—';
  if(key==='sal'&&Number.isFinite(Number(m.salRawSg)))return `${nf(Number(m.salRawSg),3)} S.G.`;
  const rule=PARAM_LIMITS[key];
  return `${nf(Number(m[key]),rule.decimals)} ${rule.unit}`;
}

/* ---------- Constantes fijas facilitadas por el usuario ---------- */
const TARGETS = Object.freeze({
  kh:Object.freeze({label:'KH',unit:'dKH',range:[8.0,8.3],decimals:1}),
  ca:Object.freeze({label:'Calcio',unit:'ppm',range:[420,430],decimals:0}),
  mg:Object.freeze({label:'Magnesio',unit:'ppm',target:1380,decimals:0}),
  no3:Object.freeze({label:'NO₃',unit:'ppm',range:[5,10],decimals:1}),
  po4:Object.freeze({label:'PO₄',unit:'ppm',range:[0.04,0.07],decimals:2}),
  sal:Object.freeze({label:'Salinidad',unit:'ppt',target:35,tolerance:0.1,decimals:1})
});
const KH_SETPOINT = 8.2;
const SALINITY_SETPOINT = 35;

/* Composición del agua NUEVA Xepta a 33 ppt. Nunca define objetivos del acuario. */
const XEPTA_BALANCED_REEF_SALT_33 = Object.freeze({
  salinity:33,
  kh:Object.freeze([7.9,8.5]),
  ca:Object.freeze([420,440]),
  mg:Object.freeze([1320,1350])
});

/* Reef Balance Next Ready Pack: mantenimiento 1:1:1. */
const BALLING = Object.freeze({
  kh:Object.freeze({product:'kh',unitsPerMlAt100L:0.1,unit:'dKH'}), // 10 ml -> +1 dKH /100 L
  ca:Object.freeze({product:'ca',unitsPerMlAt100L:0.6,unit:'ppm'}), // 10 ml -> +6 ppm /100 L
  trace:Object.freeze({product:'trace',mgQuantified:false})
});

/* Productos de corrección puntual. */
const CORRECTION_RULES = Object.freeze({
  kh:Object.freeze({
    label:'KH',supplement:'Xepta KH+',amountUnit:'g',valueUnit:'dKH',
    referenceAmount:5,referenceEffect:1.5,referenceVolume:100,
    amountDecimals:2,valueDecimals:1,min:3,max:15,
    dailyMaxDelta:null,dailyMaxAmountPer100L:null
  }),
  ca:Object.freeze({
    label:'Ca',supplement:'Aquaforest Ca Plus',amountUnit:'ml',valueUnit:'ppm',
    referenceAmount:10,referenceEffect:15,referenceVolume:100,
    amountDecimals:1,valueDecimals:0,min:100,max:800,
    dailyMaxDelta:30, /* deriva exacta de 20 ml/100 L/día y 15 ppm por 10 ml */
    dailyMaxAmountPer100L:20
  }),
  mg:Object.freeze({
    label:'Mg',supplement:'Aquaforest Mg Plus',amountUnit:'ml',valueUnit:'ppm',
    referenceAmount:10,referenceEffect:7.5,referenceVolume:100,
    amountDecimals:1,valueDecimals:0,min:500,max:2500,
    dailyMaxDelta:50,dailyMaxAmountPer100L:null
  })
});

const PARAM_LIMITS = Object.freeze({
  kh:{min:3,max:15,unit:'dKH',decimals:1,freshDays:7,color:'#4d9de0'},
  ca:{min:100,max:800,unit:'ppm',decimals:0,freshDays:14,color:'#2dc6bc'},
  mg:{min:500,max:2500,unit:'ppm',decimals:0,freshDays:14,color:'#91c453'},
  no3:{min:0,max:500,unit:'ppm',decimals:2,freshDays:14,color:'#ff9279'},
  po4:{min:0,max:10,unit:'ppm',decimals:3,freshDays:14,color:'#9b81e1'},
  sal:{min:20,max:50,unit:'ppt',decimals:1,freshDays:7,color:'#6698f4'}
});

const PUMP = Object.freeze({
  model:'D-D H2Ocean P4 Pro',
  programmableMinMl:0.1,
  programmableMaxMl:9999,
  stepMl:0.1,
  minDosesPerDay:1,
  maxDosesPerDay:24,
  accuracyRelative:0.005
});
const MIN_ACTION_SCORE=55;

const defaultState = () => ({
  schemaVersion:APP_VERSION,
  settings:{
    volume:0,
    khGoal:KH_SETPOINT,
    salinityGoal:SALINITY_SETPOINT,
    maintenanceMethod:'manual',
    khDoses:6,otherDoses:3,
    khDoseWindowStart:'00:00',khDoseWindowEnd:'00:00',
    otherDoseWindowStart:'00:30',otherDoseWindowEnd:'00:30',
    testUncertainty:{kh:0.15,ca:5,mg:15}
  },
  doses:{kh:0,ca:0,trace:0},
  inventory:{
    kh:0,ca:0,trace:0,
    capacityKh:0,capacityCa:0,capacityTrace:0,
    khSetAt:null,caSetAt:null,traceSetAt:null
  },
  measurements:[],events:[],parameterCorrections:[],
  doseHistory:[],volumeHistory:[],maintenanceMethodHistory:[],
  mathMeta:{version:APP_VERSION,structuredHistoryStart:null,proposedPumpProgram:null},
  dataImports:{}
});

/* ---------- Perfiles y persistencia ---------- */
function loadRegistry(){
  try{
    const r=JSON.parse(localStorage.getItem(STORAGE_REGISTRY)||'[]');
    return Array.isArray(r)?r.filter(x=>x&&x.id&&x.name):[];
  }catch(_){return []}
}
function saveRegistry(r){localStorage.setItem(STORAGE_REGISTRY,JSON.stringify(r))}
let registry=loadRegistry();
if(!registry.length){registry=[{id:'principal',name:'Acuario principal',createdAt:isoNow()}];saveRegistry(registry)}
let ACTIVE_ID=localStorage.getItem(STORAGE_ACTIVE)||registry[0].id;
if(!registry.some(x=>x.id===ACTIVE_ID))ACTIVE_ID=registry[0].id;
localStorage.setItem(STORAGE_ACTIVE,ACTIVE_ID);

function safeParse(raw){try{return raw?JSON.parse(raw):null}catch(_){return null}}
function loadState(){
  const key=stateKey(ACTIVE_ID);
  if(ACTIVE_ID==='principal'&&!localStorage.getItem(key)&&localStorage.getItem(LEGACY_STATE_KEY)){
    localStorage.setItem(key,localStorage.getItem(LEGACY_STATE_KEY));
  }
  const primary=safeParse(localStorage.getItem(key));
  if(primary)return primary;
  const backup=safeParse(localStorage.getItem(backupKey(ACTIVE_ID)));
  if(backup){runtimeAlerts.push({level:'warning',text:'Se recuperó automáticamente una copia de seguridad local porque el estado principal no era legible.'});return backup}
  return defaultState();
}
const runtimeAlerts=[];
let state=loadState();

function earliestTs(){return sortByTs(state.measurements)[0]?.ts||isoNow()}
function normalizeState(){
  const d=defaultState();
  state=(state&&typeof state==='object')?state:{};
  state.schemaVersion=APP_VERSION;
  state.settings={...d.settings,...(state.settings||{})};
  /* Objetivos declarados fijos e inamovibles. */
  state.settings.khGoal=KH_SETPOINT;
  state.settings.salinityGoal=SALINITY_SETPOINT;
  if(!['xepta','manual'].includes(state.settings.maintenanceMethod))state.settings.maintenanceMethod='manual';
  state.settings.testUncertainty={...d.settings.testUncertainty,...(state.settings.testUncertainty||{})};
  for(const k of ['measurements','events','parameterCorrections','doseHistory','volumeHistory','maintenanceMethodHistory']){
    if(!Array.isArray(state[k]))state[k]=[];
  }
  state.doses={...d.doses,...(state.doses||{})};
  state.inventory={...d.inventory,...(state.inventory||{})};
  state.mathMeta={...d.mathMeta,...(state.mathMeta||{}),version:APP_VERSION};
  state.dataImports=state.dataImports||{};

  /* Migración de correcciones estructuradas antiguas. */
  state.events.filter(e=>e.type==='parameterCorrection'&&e.parameter&&finite(e.effectUnits)).forEach(e=>{
    if(state.parameterCorrections.some(c=>c.id===e.correctionId))return;
    const id=e.correctionId||`legacy-pc-${+new Date(e.ts)}-${e.parameter}`;
    e.correctionId=id;
    state.parameterCorrections.push({
      id,ts:e.ts,parameter:e.parameter,current:finite(e.current)?Number(e.current):null,
      target:finite(e.target)?Number(e.target):null,desiredTarget:finite(e.target)?Number(e.target):null,
      delta:Number(e.effectUnits),effectUnits:Number(e.effectUnits),effectUnit:e.effectUnit||CORRECTION_RULES[e.parameter]?.valueUnit,
      supplement:e.supplement||null,amount:finite(e.amount)?Number(e.amount):null,amountUnit:e.amountUnit||null,
      volume:finite(e.volume)?Number(e.volume):null,applied:e.applied!==false,
      appliedAt:e.recordedAt||e.ts,source:'migrated-event',theoreticalEffect:true
    });
  });
  state.parameterCorrections=sortByTs(state.parameterCorrections);

  if(!state.maintenanceMethodHistory.length){
    state.maintenanceMethodHistory=[{ts:earliestTs(),method:state.settings.maintenanceMethod,assumed:true,source:'migration'}];
  }
  if(!state.volumeHistory.length){
    state.volumeHistory=[{ts:earliestTs(),volume:Number(state.settings.volume||0),assumed:true,source:'migration'}];
  }
  if(!state.doseHistory.length){
    state.doseHistory=[{
      ts:earliestTs(),kh:Number(state.doses.kh||0),ca:Number(state.doses.ca||0),trace:Number(state.doses.trace||0),
      khDoses:Number(state.settings.khDoses||1),otherDoses:Number(state.settings.otherDoses||1),
      khWindowStart:state.settings.khDoseWindowStart,khWindowEnd:state.settings.khDoseWindowEnd,
      otherWindowStart:state.settings.otherDoseWindowStart,otherWindowEnd:state.settings.otherDoseWindowEnd,
      assumed:true,scheduleAssumed:true,source:'migration'
    }];
  }
  state.maintenanceMethodHistory=sortByTs(state.maintenanceMethodHistory);
  state.volumeHistory=sortByTs(state.volumeHistory);
  state.doseHistory=sortByTs(state.doseHistory);

  /* Los registros manualUses de versiones antiguas son ambiguos: se conservan
     en almacenamiento, pero v69 NO los usa para inferir química. */
  if(Array.isArray(state.manualUses)&&state.manualUses.length){
    state.mathMeta.legacyManualUsesPresent=true;
  }
  window.state=state;
}
normalizeState();

function persist(){
  const key=stateKey(ACTIVE_ID),payload=JSON.stringify(state);
  try{
    const previous=localStorage.getItem(key);
    if(previous)localStorage.setItem(backupKey(ACTIVE_ID),previous);
    localStorage.setItem(key,payload);
    const verify=localStorage.getItem(key);
    if(verify!==payload||!safeParse(verify))throw new Error('verificación de escritura fallida');
    return true;
  }catch(err){
    runtimeAlerts.push({level:'critical',text:`No se pudo guardar de forma verificable en el dispositivo: ${err.message||err}`});
    showToast('Error al guardar. Revisa almacenamiento del navegador.');
    return false;
  }
}

/* Conserva el histórico que ya formaba parte de v68 en una instalación nueva. */

function importBundledHistoryOnce(){
  const importId='reef-history-corrected-2026-09-02-v74';
  if(ACTIVE_ID!=='principal'||state.dataImports.historicalMeasurements===importId)return;

  /* Histórico corregido facilitado por el usuario. Todas las lecturas de
     salinidad originales son 1.025 S.G.; se conserva el valor bruto y se
     convierte internamente a ppt solo para los cálculos que trabajan en ppt. */
  const rows=[
    ['2026-05-08T12:00:00',5.0,0.00,7.7,1440,420,1.025],
    ['2026-05-18T12:00:00',5.0,0.00,8.3,1440,425,1.025],
    ['2026-05-26T12:00:00',3.5,0.00,8.0,1440,420,1.025],
    ['2026-05-28T12:00:00',3.2,0.00,7.0,1440,425,1.025],
    ['2026-06-08T12:00:00',5.0,0.03,7.7,1380,410,1.025],
    ['2026-06-22T12:00:00',5.0,0.25,7.7,1320,420,1.025],
    ['2026-07-08T12:00:00',7.5,0.25,8.6,1290,425,1.025],
    ['2026-07-14T12:00:00',7.5,0.03,8.6,1290,380,1.025],
    ['2026-07-24T12:00:00',7.5,0.03,7.3,1400,425,1.025],
    ['2026-07-31T12:00:00',7.5,0.03,7.3,1380,420,1.025],
    ['2026-08-06T12:00:00',10.0,0.03,7.3,1410,440,1.025],
    ['2026-08-25T12:00:00',10.0,0.10,7.3,1380,440,1.025],
    ['2026-09-01T12:00:00',25.0,1.00,7.7,1305,415,1.025],
    ['2026-09-02T12:00:00',10.0,1.00,7.3,1320,420,1.025]
  ];

  const bundled=rows.map(([ts,no3,po4,kh,mg,ca,salSg])=>({
    ts,kh,mg,ca,no3,po4,
    sal:sgToPpt(salSg),
    salRawSg:salSg,
    source:'user-historical-import',
    historicalContextIncomplete:true
  }));

  /* Sustituye únicamente el histórico precargado de versiones anteriores.
     Las mediciones creadas por el usuario se conservan intactas. */
  const userMeasurements=state.measurements.filter(m=>m.source!=='user-historical-import');
  state.measurements=sortByTs([...userMeasurements,...bundled]);

  const first=bundled[0].ts;
  if(!Number(state.settings.volume))state.settings.volume=75;
  if(!state.volumeHistory.length){
    state.volumeHistory=[{ts:first,volume:Number(state.settings.volume||75),assumed:false,source:'user-historical-import'}];
  }
  if(!state.maintenanceMethodHistory.length){
    state.maintenanceMethodHistory=[{ts:first,method:'manual',assumed:false,source:'user-historical-import'}];
  }else if(!state.maintenanceMethodHistory.some(h=>+new Date(h.ts)<=+new Date(first))){
    state.maintenanceMethodHistory.push({ts:first,method:'manual',assumed:false,source:'user-historical-import'});
    state.maintenanceMethodHistory=sortByTs(state.maintenanceMethodHistory);
  }
  if(!state.doseHistory.length){
    state.doseHistory=[{ts:first,kh:0,ca:0,trace:0,khDoses:6,otherDoses:3,khWindowStart:'00:00',khWindowEnd:'00:00',otherWindowStart:'00:30',otherWindowEnd:'00:30',assumed:false,scheduleAssumed:false,source:'manual-no-continuous-dosing'}];
  }
  state.mathMeta.structuredHistoryStart=first;
  state.mathMeta.historicalContextIncomplete=true;
  state.dataImports.historicalMeasurements=importId;
  persist();
}
importBundledHistoryOnce();
normalizeState();

/* ---------- Historial temporal ---------- */
function snapshotAt(history,ts){
  const t=+new Date(ts);
  return sortByTs(history).filter(e=>+new Date(e.ts)<=t).at(-1)||null;
}
function volumeInfoAt(ts){
  const s=snapshotAt(state.volumeHistory,ts);
  if(s&&Number(s.volume)>0)return {volume:Number(s.volume),assumed:!!s.assumed,known:!s.assumed,ts:s.ts};
  const v=Number(state.settings.volume||0);
  return {volume:v,assumed:true,known:false,ts:null};
}
const volumeAt=ts=>Number(volumeInfoAt(ts).volume||0);
function methodAt(ts){return snapshotAt(state.maintenanceMethodHistory,ts)?.method||state.settings.maintenanceMethod||'manual'}
function doseSnapshotAt(ts){return snapshotAt(state.doseHistory,ts)}
function recordVolume(ts,v,source='settings'){
  state.volumeHistory.push({ts,volume:Number(v),assumed:false,source});state.volumeHistory=sortByTs(state.volumeHistory);
}
function recordMethod(ts,method,source='user-physical-confirmed'){
  state.maintenanceMethodHistory.push({ts,method,assumed:false,source});state.maintenanceMethodHistory=sortByTs(state.maintenanceMethodHistory);
}
function recordDose(ts,changes,source='physical-confirmed'){
  const base=doseSnapshotAt(ts)||state.doses;
  state.doseHistory.push({
    ts,kh:Number(base.kh||0),ca:Number(base.ca||0),trace:Number(base.trace||0),
    khDoses:Number(state.settings.khDoses||1),otherDoses:Number(state.settings.otherDoses||1),
    khWindowStart:state.settings.khDoseWindowStart,khWindowEnd:state.settings.khDoseWindowEnd,
    otherWindowStart:state.settings.otherDoseWindowStart,otherWindowEnd:state.settings.otherDoseWindowEnd,
    assumed:false,scheduleAssumed:false,source,...changes
  });
  state.doseHistory=sortByTs(state.doseHistory);
}

/* ---------- Mediciones, correcciones y proyecciones ---------- */
function latestRealMeasurement(param,{excludeBaseline=true}={}){
  return sortByTs(state.measurements)
    .filter(m=>finite(m[param])&&(!excludeBaseline||m.source!=='correctionBaseline')).at(-1)||null;
}
function latestAnyMeasurement(){return sortByTs(state.measurements).at(-1)||null}
function measurementConfirmsCorrection(m,c){
  if(!m||!c||!finite(m[c.parameter])||m.source==='correctionBaseline')return false;
  const mt=+new Date(m.ts),ct=+new Date(c.ts);
  if(mt>ct)return true;if(mt<ct)return false;
  return finite(+new Date(m.recordedAt))&&finite(+new Date(c.appliedAt))&&+new Date(m.recordedAt)>+new Date(c.appliedAt);
}
function pendingCorrectionFor(param){
  const c=sortByTs(state.parameterCorrections).filter(x=>x.applied!==false&&x.parameter===param).at(-1);
  if(!c)return null;
  return state.measurements.some(m=>measurementConfirmsCorrection(m,c))?null:c;
}
function temporalCompare(aTs,aRecorded,bTs,bRecorded){
  const a=+new Date(aTs),b=+new Date(bTs);if(a<b)return -1;if(a>b)return 1;
  const ar=aRecorded?+new Date(aRecorded):NaN,br=bRecorded?+new Date(bRecorded):NaN;
  if(Number.isFinite(ar)&&Number.isFinite(br)){if(ar<br)return -1;if(ar>br)return 1;return 0}
  return null;
}
function waterReplacementValue(event,param){
  const map={kh:'newKh',ca:'newCa',mg:'newMg',no3:'newNo3',po4:'newPo4',sal:'newSal'};
  const n=Number(event?.[map[param]]);return Number.isFinite(n)?n:null;
}
function measurementBefore(param,boundaryTs,boundaryRecordedAt=null){
  return sortByTs(state.measurements).filter(m=>finite(m[param])&&m.source!=='correctionBaseline').filter(m=>{
    const c=temporalCompare(m.ts,m.recordedAt,boundaryTs,boundaryRecordedAt);
    return c===-1||(c===0&&boundaryRecordedAt===null);
  }).at(-1)||null;
}
function correctionBetween(param,base,boundaryTs,boundaryRecordedAt=null){
  return state.parameterCorrections.some(c=>{
    if(c.applied===false||c.parameter!==param)return false;
    const after=temporalCompare(c.ts,c.appliedAt||c.recordedAt,base.ts,base.recordedAt);
    const before=temporalCompare(c.ts,c.appliedAt||c.recordedAt,boundaryTs,boundaryRecordedAt);
    return (after===1||after===null)&&(before===-1||before===0||before===null);
  });
}
function projectParamThroughWaterChanges(param,at=Date.now(),boundaryRecordedAt=null){
  const boundaryTs=typeof at==='number'?new Date(at).toISOString():at;
  if(!validTs(boundaryTs))return {known:false,reason:'fecha inválida'};
  const base=measurementBefore(param,boundaryTs,boundaryRecordedAt);
  if(!base)return {known:false,reason:'sin medición previa'};
  const ageDays=Math.max(0,(+new Date(boundaryTs)-+new Date(base.ts))/DAY);
  const staleBase=ageDays>(PARAM_LIMITS[param]?.freshDays||7);
  if(correctionBetween(param,base,boundaryTs,boundaryRecordedAt)){
    return {known:false,reason:'corrección pendiente/intermedia: requiere medición real',base,staleBase,ageDays};
  }
  const waters=sortByTs(state.events).filter(e=>e.type==='water').filter(e=>{
    const after=temporalCompare(e.ts,e.recordedAt,base.ts,base.recordedAt);
    const before=temporalCompare(e.ts,e.recordedAt,boundaryTs,boundaryRecordedAt);
    return after===1&&(before===-1||before===0||(before===null&&boundaryRecordedAt===null));
  });
  if(!waters.length)return {known:true,estimated:false,value:Number(base[param]),base,events:[],staleBase,ageDays,lastTs:base.ts};
  let value=Number(base[param]);const used=[];
  for(const e of waters){
    const replacement=waterReplacementValue(e,param),liters=Number(e.liters),vol=Number(e.systemVolume||volumeAt(e.ts));
    if(!Number.isFinite(replacement))return {known:false,reason:`falta ${param.toUpperCase()} del agua nueva`,base,events:used,incompleteEvent:e,staleBase,ageDays};
    if(!(liters>0&&vol>0&&liters<vol))return {known:false,reason:'volumen de cambio no modelable',base,events:used,incompleteEvent:e,staleBase,ageDays};
    const f=liters/vol,before=value;value=before*(1-f)+replacement*f;used.push({event:e,before,replacement,fraction:f,after:value});
  }
  return {known:true,estimated:true,value,base,events:used,lastEvent:waters.at(-1),lastTs:waters.at(-1).ts,staleBase,ageDays};
}

function currentParamSnapshot(){
  const data={},meta={};
  for(const key of Object.keys(PARAM_LIMITS)){
    const last=latestRealMeasurement(key);
    if(!last)continue;
    const pending=pendingCorrectionFor(key);
    const projection=!pending?projectParamThroughWaterChanges(key,Date.now()):null;
    const ageDays=Math.max(0,(Date.now()-+new Date(last.ts))/DAY);
    if(projection?.known&&projection.estimated){
      data[key]=Number(projection.value);meta[key]={ts:projection.lastTs,measured:Number(last[key]),sourceMeasurementTs:last.ts,ageDays,waterEstimated:true,stale:false,pending:false,baseStale:projection.staleBase};
    }else{
      data[key]=Number(last[key]);
      const waterAfter=state.events.some(e=>e.type==='water'&&+new Date(e.ts)>+new Date(last.ts));
      meta[key]={ts:last.ts,measured:Number(last[key]),ageDays,waterEstimated:false,stale:ageDays>PARAM_LIMITS[key].freshDays,pending:!!pending||(waterAfter&&projection&&!projection.known),pendingReason:pending?'correction':projection?.reason||null};
    }
  }
  return {data,meta};
}

function targetRangeFor(key){
  if(TARGETS[key]?.range)return [...TARGETS[key].range];
  if(key==='mg'){
    const u=Math.max(1,Number(state.settings.testUncertainty?.mg||15));
    return [TARGETS.mg.target-u,TARGETS.mg.target+u];
  }
  if(key==='sal')return [TARGETS.sal.target-TARGETS.sal.tolerance,TARGETS.sal.target+TARGETS.sal.tolerance];
  return [NaN,NaN];
}
function evaluateChemistry(){
  const snap=currentParamSnapshot(),rows=[];
  for(const key of ['kh','ca','mg','no3','po4','sal']){
    const def=TARGETS[key],m=snap.meta[key]||null;
    const value=finite(snap.data[key])?Number(snap.data[key]):null;
    const [lo,hi]=targetRangeFor(key);
    let stateName='missing',label='Sin medir';
    if(value!==null){
      if(m?.pending){stateName='pending';label='Pendiente de medición'}
      else if(m?.stale){stateName='stale';label='Dato antiguo'}
      else if(value<lo){stateName='low';label='Bajo'}
      else if(value>hi){stateName='high';label='Alto'}
      else {stateName='correct';label='Correcto'}
    }
    rows.push({key,labelParam:def.label,unit:def.unit,value,target:[lo,hi],state:stateName,label,decimals:def.decimals,meta:m,estimated:!!m?.waterEstimated});
  }
  return {rows,snapshot:snap};
}

function correctionAmount(rule,delta,volume){
  return rule.referenceAmount*(Number(volume)/rule.referenceVolume)*(Number(delta)/rule.referenceEffect);
}
function calculateCorrection(parameter,current,target,volume){
  const r=CORRECTION_RULES[parameter];
  const desiredDelta=Number(target)-Number(current);
  if(!r||!(Number(volume)>0)||!Number.isFinite(desiredDelta)||desiredDelta<=0)return null;
  const totalAmount=correctionAmount(r,desiredDelta,volume);
  let appliedDelta=desiredDelta;
  if(Number.isFinite(r.dailyMaxDelta))appliedDelta=Math.min(desiredDelta,r.dailyMaxDelta);
  let appliedAmount=correctionAmount(r,appliedDelta,volume);
  if(Number.isFinite(r.dailyMaxAmountPer100L)){
    appliedAmount=Math.min(appliedAmount,r.dailyMaxAmountPer100L*volume/100);
    appliedDelta=appliedAmount/r.referenceAmount*(r.referenceVolume/volume)*r.referenceEffect;
  }
  const minDays=Number.isFinite(r.dailyMaxDelta)?Math.ceil(desiredDelta/r.dailyMaxDelta):1;
  return {parameter,rule:r,current:Number(current),target:Number(target),volume:Number(volume),desiredDelta,totalAmount,appliedDelta,appliedAmount,appliedTarget:Number(current)+appliedDelta,minDays,limited:appliedDelta<desiredDelta-1e-9};
}

/* ---------- Motor de consumo Balling ---------- */
function parseClockMinutes(v,fallback='00:00'){
  const m=String(v||fallback).match(/^(\d{1,2}):(\d{2})$/);if(!m)return 0;
  return clamp(Number(m[1])*60+Number(m[2]),0,1439);
}
function scheduleForProduct(snap,product){
  const kh=product==='kh';return {count:clamp(parseInt(kh?snap.khDoses:snap.otherDoses)||1,1,24),start:kh?(snap.khWindowStart||'00:00'):(snap.otherWindowStart||'00:30'),end:kh?(snap.khWindowEnd||'00:00'):(snap.otherWindowEnd||'00:30'),assumed:!!snap.scheduleAssumed};
}
function scheduledTimes(startMs,endMs,s){
  if(!(endMs>startMs))return [];
  const start=parseClockMinutes(s.start),end=parseClockMinutes(s.end);let duration=end-start;if(duration<=0)duration+=1440;
  const spacing=duration*60000/s.count;const first=new Date(startMs);first.setHours(0,0,0,0);first.setDate(first.getDate()-1);const last=new Date(endMs);last.setHours(0,0,0,0);last.setDate(last.getDate()+1);
  const out=[];for(let day=+first;day<=+last;day+=DAY){const anchor=day+start*60000;for(let i=0;i<s.count;i++){const t=anchor+i*spacing;if(t>startMs&&t<=endMs)out.push(t)}}return out.sort((a,b)=>a-b);
}
function doseMlBetween(product,start,end){
  const a=+new Date(start),b=+new Date(end);if(!(b>a))return {ml:0,known:false,assumed:true,count:0};
  const bounds=[a,b];state.doseHistory.forEach(h=>{const t=+new Date(h.ts);if(t>a&&t<b)bounds.push(t)});state.maintenanceMethodHistory.forEach(h=>{const t=+new Date(h.ts);if(t>a&&t<b)bounds.push(t)});const u=[...new Set(bounds.sort((x,y)=>x-y))];
  let ml=0,count=0,assumed=false;
  for(let i=0;i<u.length-1;i++){
    const s=u[i],e=u[i+1],probe=new Date(s+1).toISOString();if(methodAt(probe)!=='xepta')continue;
    const snap=doseSnapshotAt(probe);if(!snap)return {ml,known:false,assumed:true,count};
    const daily=Math.max(0,Number(snap[product]||0)),sch=scheduleForProduct(snap,product),times=scheduledTimes(s,e,sch);
    ml+=times.length*(daily/sch.count);count+=times.length;assumed ||= !!snap.assumed||sch.assumed;
  }
  return {ml,known:true,assumed,count};
}
function chemicalAdditionUnits(param,start,end){
  const chem=BALLING[param];if(!chem)return {units:0,known:false,assumed:false};
  const a=+new Date(start),b=+new Date(end);const bounds=[a,b];
  state.doseHistory.forEach(h=>{const t=+new Date(h.ts);if(t>a&&t<b)bounds.push(t)});state.volumeHistory.forEach(h=>{const t=+new Date(h.ts);if(t>a&&t<b)bounds.push(t)});state.maintenanceMethodHistory.forEach(h=>{const t=+new Date(h.ts);if(t>a&&t<b)bounds.push(t)});
  const u=[...new Set(bounds.sort((x,y)=>x-y))];let units=0,assumed=false,totalMl=0;
  for(let i=0;i<u.length-1;i++){
    const s=u[i],e=u[i+1],probe=new Date(s+1).toISOString(),vInfo=volumeInfoAt(probe);if(!(vInfo.volume>0))return {units,known:false,assumed:true,totalMl};assumed ||= vInfo.assumed;
    if(methodAt(probe)==='xepta'){
      const d=doseMlBetween(chem.product,new Date(s).toISOString(),new Date(e).toISOString());if(!d.known)return {units,known:false,assumed:true,totalMl};
      units+=d.ml*chem.unitsPerMlAt100L*100/vInfo.volume;totalMl+=d.ml;assumed ||= d.assumed;
    }
  }
  return {units,known:true,assumed,totalMl};
}
function salinityAt(ts,maxAge=7){
  const t=+new Date(ts),rows=sortByTs(state.measurements).filter(m=>finite(m.sal)&&+new Date(m.ts)<=t);const m=rows.at(-1);if(!m)return {known:false,value:null,ageDays:Infinity,direct:false};
  const age=(t-+new Date(m.ts))/DAY;return age<=maxAge?{known:true,value:Number(m.sal),ageDays:age,direct:m.ts===ts,ts:m.ts}:{known:false,value:null,ageDays:age,direct:false,ts:m.ts};
}
function interventionsBetween(param,start,end){
  const a=+new Date(start),b=+new Date(end);const items=[];
  state.parameterCorrections.filter(c=>c.applied!==false&&c.parameter===param&&+new Date(c.ts)>a&&+new Date(c.ts)<b).forEach(c=>items.push({type:'correction',ts:c.ts,delta:Number(c.delta||0),record:c}));
  state.events.filter(e=>e.type==='water'&&+new Date(e.ts)>a&&+new Date(e.ts)<b).forEach(e=>items.push({type:'water',ts:e.ts,event:e}));
  return items.sort((x,y)=>+new Date(x.ts)-+new Date(y.ts));
}
function methodChangeBetween(start,end){const a=+new Date(start),b=+new Date(end);return state.maintenanceMethodHistory.some(h=>+new Date(h.ts)>a&&+new Date(h.ts)<b)}
function endpointAmbiguous(start,end){
  const mins=[Math.floor(+new Date(start)/60000),Math.floor(+new Date(end)/60000)];
  return state.events.some(e=>['water','parameterCorrection','maintenanceMethod','pumpProgram'].includes(e.type)&&mins.includes(Math.floor(+new Date(e.ts)/60000)));
}
function buildConsumptionIntervals(param){
  if(!BALLING[param])return [];
  const ms=sortByTs(state.measurements).filter(m=>finite(m[param]));const out=[];const structured=+new Date(state.mathMeta.structuredHistoryStart||0);
  for(let i=1;i<ms.length;i++){
    const a=ms[i-1],b=ms[i],days=(+new Date(b.ts)-+new Date(a.ts))/DAY;
    if(structured&&+new Date(a.ts)<structured)continue;
    if(days<0.5||days>(param==='ca'?14:7))continue;
    if(methodChangeBetween(a.ts,b.ts)||endpointAmbiguous(a.ts,b.ts))continue;
    if(state.events.some(e=>e.type==='correction'&&+new Date(e.ts)>+new Date(a.ts)&&+new Date(e.ts)<+new Date(b.ts)))continue;
    const interventions=interventionsBetween(param,a.ts,b.ts);
    let alpha=Number(a[param]),beta=0,cursor=a.ts,known=true,assumed=false,waterModeled=0,correctionCount=0,totalAdded=0;
    for(const it of interventions){
      const add=chemicalAdditionUnits(param,cursor,it.ts);if(!add.known){known=false;break}alpha+=add.units;totalAdded+=add.units;assumed ||= add.assumed;beta-=(+new Date(it.ts)-+new Date(cursor))/DAY;
      if(it.type==='correction'){alpha+=it.delta;totalAdded+=it.delta;correctionCount++}
      else{
        const e=it.event,rep=waterReplacementValue(e,param),liters=Number(e.liters),vol=Number(e.systemVolume||volumeAt(e.ts));
        if(!Number.isFinite(rep)||!(liters>0&&vol>0&&liters<vol)){known=false;break}
        const f=liters/vol;alpha=(1-f)*alpha+f*rep;beta=(1-f)*beta;waterModeled++;
      }
      cursor=it.ts;
    }
    if(!known)continue;
    const add=chemicalAdditionUnits(param,cursor,b.ts);if(!add.known)continue;alpha+=add.units;totalAdded+=add.units;assumed ||= add.assumed;beta-=(+new Date(b.ts)-+new Date(cursor))/DAY;
    const modelDays=-beta;if(!(modelDays>0))continue;
    let consumption=(alpha-Number(b[param]))/modelDays,normalized=false,salinityAssumed=false;
    if(!waterModeled){
      const sa=finite(a.sal)?{known:true,value:Number(a.sal),direct:true}:salinityAt(a.ts),sb=finite(b.sal)?{known:true,value:Number(b.sal),direct:true}:salinityAt(b.ts);
      if(sa.known&&sb.known&&Math.abs(sb.value-sa.value)<=1){
        /* Corrige el componente de concentración/dilución. */
        const startN=Number(a[param])*SALINITY_SETPOINT/sa.value;
        const endN=Number(b[param])*SALINITY_SETPOINT/sb.value;
        const mean=(sa.value+sb.value)/2;
        const addedN=totalAdded*SALINITY_SETPOINT/mean;
        consumption=(startN+addedN-endN)/days;normalized=true;salinityAssumed=!sa.direct||!sb.direct;
      }else salinityAssumed=true;
    }
    if(!Number.isFinite(consumption))continue;
    if(consumption<(param==='kh'?-1.5:-60)||consumption>(param==='kh'?5:120))continue;
    out.push({startTs:a.ts,endTs:b.ts,days,modelDays,consumption,depletion:consumption*modelDays,assumed,normalized,salinityAssumed,waterModeled,correctionCount});
  }
  return out;
}
function median(a){if(!a.length)return NaN;const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}
function testUncertainty(param){const d={kh:.15,ca:5,mg:15};const n=Number(state.settings.testUncertainty?.[param]);return n>0?n:d[param]}
function robustConsumption(param){
  const raw=buildConsumptionIntervals(param);if(!raw.length)return {value:null,score:0,label:'baja',raw:[],used:[],sigma:null,fullyNormalized:false,assumed:false,salinityAssumed:false,method:'Mediana robusta'};
  /* Para decisiones físicas usamos la cola más reciente que no arrastra un
     intervalo de cambio de agua sin normalización. */
  let start=0;for(let i=0;i<raw.length;i++)if(!raw[i].normalized)start=i+1;
  let used=raw.slice(start);if(!used.length)used=raw.slice(-1);
  const vals=used.map(r=>r.consumption),med=median(vals),mad=median(vals.map(v=>Math.abs(v-med))),sigmaData=Number.isFinite(mad)?1.4826*mad:0;
  const floor=median(used.map(r=>Math.SQRT2*testUncertainty(param)/Math.max(.25,r.days)));const sigma=Math.max(sigmaData,Number.isFinite(floor)?floor:0);let filtered=used.filter(r=>Math.abs(r.consumption-med)<=Math.max(param==='kh'?.1:1.5,3*sigma));if(filtered.length)used=filtered;
  const value=Math.max(0,median(used.map(r=>r.consumption)));const first=+new Date(used[0].startTs),last=+new Date(used.at(-1).endTs),span=(last-first)/DAY,age=(Date.now()-last)/DAY;
  const assumed=used.some(r=>r.assumed),salAss=used.some(r=>r.salinityAssumed),corr=used.reduce((s,r)=>s+r.correctionCount,0),waters=used.reduce((s,r)=>s+r.waterModeled,0),fullyNormalized=used.every(r=>r.normalized);
  const rel=sigma/Math.max(Math.abs(value),param==='kh'?.15:4);let score=0;score+=Math.min(35,used.length*9);score+=30*(1-clamp(rel/.4,0,1));score+=Math.min(25,span/(param==='ca'?14:7)*25);score+=10*(1-clamp((age-2)/12,0,1));if(assumed)score-=15;if(salAss)score-=8;if(corr)score-=Math.min(15,corr*5);if(waters)score-=Math.min(10,waters*3);if(used.length===1)score=Math.min(score,30);score=clamp(Math.round(score),0,100);
  const label=score>=75?'alta':score>=50?'media':'baja';const sal=salinityAt(isoNow());const physicalValue=fullyNormalized&&sal.known?value*sal.value/SALINITY_SETPOINT:null;const physicalSigma=fullyNormalized&&sal.known?sigma*sal.value/SALINITY_SETPOINT:null;
  return {value,physicalValue,physicalSigma,score,label,raw,used,sigma,fullyNormalized,assumed,salinityAssumed:salAss,correctionCount:corr,waterModeled:waters,spanDays:span,method:'Mediana robusta'};
}
function maintenanceDoseFromKh(consumption){
  const vol=Number(state.settings.volume||0);if(!(vol>0)||!Number.isFinite(consumption))return null;
  const rc=robustConsumption('kh');const physical=Number.isFinite(rc.physicalValue)?rc.physicalValue:null;if(!Number.isFinite(physical))return null;
  return physical*vol/(BALLING.kh.unitsPerMlAt100L*100);
}
function splitProgram(daily,count){
  count=clamp(parseInt(count)||1,1,24);const units=Math.round(daily/PUMP.stepMl),minU=Math.ceil(PUMP.programmableMinMl/PUMP.stepMl-1e-9),maxU=Math.floor(PUMP.programmableMaxMl/PUMP.stepMl+1e-9);
  if(units<count*minU)return {ok:false,reason:`${count} repartos requieren al menos ${nf(count*PUMP.programmableMinMl,1)} ml/día.`};if(units>count*maxU)return {ok:false,reason:'El total diario supera lo programable con ese reparto.'};
  const base=Math.floor(units/count),rem=units%count,low=base*PUMP.stepMl,high=(base+1)*PUMP.stepMl;return {ok:true,total:units*PUMP.stepMl,text:rem===0?`${count} × ${nf(low,1)} ml`:`${count-rem} × ${nf(low,1)} ml + ${rem} × ${nf(high,1)} ml`};
}
function pumpProgram(raw){
  if(!Number.isFinite(raw))return {ok:false,value:null,reason:'Sin cálculo'};if(raw<=0)return {ok:true,value:0,kh:{ok:true,text:'—'},other:{ok:true,text:'—'}};
  const value=Math.round(raw/PUMP.stepMl)*PUMP.stepMl,kh=splitProgram(value,state.settings.khDoses),other=splitProgram(value,state.settings.otherDoses);if(!kh.ok)return {ok:false,value,reason:kh.reason,kh,other};if(!other.ok)return {ok:false,value,reason:other.reason,kh,other};return {ok:true,value,kh,other,tolerance:value*PUMP.accuracyRelative};
}
function recentMeasurementInfo(param,days){const m=latestRealMeasurement(param);if(!m)return {known:false,ageDays:Infinity};const age=(Date.now()-+new Date(m.ts))/DAY;return {known:age<=days,ageDays:age,measurement:m}}
function currentProgram(){return {kh:Number(state.doses.kh||0),ca:Number(state.doses.ca||0),trace:Number(state.doses.trace||0)}}
const sameDose=(a,b,t=.049)=>Math.abs(Number(a)-Number(b))<=t;
function estimateBalancedDose(){
  if(state.settings.maintenanceMethod!=='xepta')return {manual:true,actionable:false,program:null,score:0,label:'—',source:'Corrección Manual activa · no existe mantenimiento continuo Balling.',warning:''};
  const volume=Number(state.settings.volume||0);if(!(volume>0))return {actionable:false,program:null,score:0,label:'baja',source:'Configura el volumen neto real.',warning:''};
  const kh=robustConsumption('kh'),ca=robustConsumption('ca'),sal=salinityAt(isoNow()),khFresh=recentMeasurementInfo('kh',7),caFresh=recentMeasurementInfo('ca',14),khPending=pendingCorrectionFor('kh'),caPending=pendingCorrectionFor('ca');
  const raw=maintenanceDoseFromKh(kh.value);if(!Number.isFinite(raw))return {actionable:false,program:null,raw:null,score:kh.score,label:kh.label,source:kh.value===null?'Necesita suficientes mediciones estructuradas de KH.':'Falta salinidad reciente y/o intervalos normalizados para convertir el consumo a dosis física.',warning:'',kh,ca};
  const pump=pumpProgram(Math.max(0,raw));let score=kh.score,warning=pump.reason||'',source=`KH controla el mantenimiento: ${nf(Number.isFinite(kh.physicalValue)?kh.physicalValue:kh.value,2)} dKH/día.`;let caDrift=null,caTolerance=null;
  const complete=sal.known&&khFresh.known&&caFresh.known&&!khPending&&!caPending&&!kh.assumed&&!kh.salinityAssumed&&kh.fullyNormalized&&ca.value!==null&&ca.score>=MIN_ACTION_SCORE&&!ca.assumed&&!ca.salinityAssumed&&ca.fullyNormalized;
  let actionable=score>=MIN_ACTION_SCORE&&pump.ok&&complete;
  if(pump.value!==null&&ca.value!==null){
    const caPhysical=Number.isFinite(ca.physicalValue)?ca.physicalValue:null;caDrift=Number.isFinite(caPhysical)?pump.value*60/volume-caPhysical:null;
    if(ca.score>=MIN_ACTION_SCORE&&Number.isFinite(caDrift)){
      caTolerance=Math.max(.5,2*Math.max(0,Number(ca.physicalSigma??ca.sigma??0)));
      if(Math.abs(caDrift)>caTolerance){actionable=false;score=clamp(Math.min(score,ca.score)-10,0,100);warning=`El 1:1:1 predice deriva de Ca ${caDrift>=0?'+':''}${nf(caDrift,1)} ppm/día (tolerancia ±${nf(caTolerance,1)}). Repite KH y Ca antes de cambiar el programa.`;source='KH calcula la dosis común, pero Ca no valida todavía el equilibrio.'}
      else {score=clamp(Math.round(score+Math.min(10,ca.score/10)),0,100);source=`KH calcula la dosis común y Ca la valida: deriva prevista ${caDrift>=0?'+':''}${nf(caDrift,1)} ppm/día.`;actionable=score>=MIN_ACTION_SCORE&&pump.ok&&complete}
    }
  }
  if(!complete){const missing=[];if(!sal.known)missing.push('salinidad reciente');if(!khFresh.known)missing.push('KH reciente');if(!caFresh.known)missing.push('Ca reciente');if(khPending)missing.push('KH pendiente tras corrección');if(caPending)missing.push('Ca pendiente tras corrección');if(!kh.fullyNormalized||kh.assumed||kh.salinityAssumed)missing.push('intervalos KH totalmente documentados');if(ca.value===null||ca.score<MIN_ACTION_SCORE||!ca.fullyNormalized||ca.assumed||ca.salinityAssumed)missing.push('validación fiable de Ca');const w=`No se autoriza cambio físico: falta ${missing.join(', ')}.`;warning=warning?`${warning} ${w}`:w;actionable=false}
  const label=score>=75?'alta':score>=50?'media':'baja';return {raw,program:pump.value,score,label,actionable,source,warning,kh,ca,caDrift,caTolerance,pump,physicalDataComplete:complete};
}
function latestKhTs(){return latestRealMeasurement('kh')?.ts||null}
function updatePumpProposal(result){
  state.mathMeta.proposedPumpProgram ||= null;
  const before=JSON.stringify(state.mathMeta.proposedPumpProgram);
  let out=null;
  if(state.settings.maintenanceMethod!=='xepta'||!result.actionable||!Number.isFinite(result.program)){
    state.mathMeta.proposedPumpProgram=null;
  }else{
    const p=Number(result.program),cur=currentProgram();
    if(sameDose(cur.kh,p)&&sameDose(cur.ca,p)&&sameDose(cur.trace,p)){
      state.mathMeta.proposedPumpProgram=null;out={matchesActive:true,program:p};
    }else{
      const latest=latestKhTs(),old=state.mathMeta.proposedPumpProgram;
      if(!old||Math.abs(Number(old.program)-p)>PUMP.stepMl/2+.001){
        state.mathMeta.proposedPumpProgram={program:p,firstMeasurementTs:latest,confirmedBySecondMeasurement:false,createdAt:isoNow()};
      }else{
        if(latest&&old.firstMeasurementTs&&+new Date(latest)>+new Date(old.firstMeasurementTs))old.confirmedBySecondMeasurement=true;
        old.program=p;
      }
      out=state.mathMeta.proposedPumpProgram;
    }
  }
  if(before!==JSON.stringify(state.mathMeta.proposedPumpProgram))persist();
  return out;
}

/* ---------- Inventario Balling ---------- */
function stockFor(product,capKey){
  const inv=state.inventory,setAt=inv[`${product}SetAt`]||isoNow(),base=Number(inv[product]||0),used=doseMlBetween(product,setAt,isoNow()),remaining=Math.max(0,base-(used.known?used.ml:0)),cap=Math.max(1,Number(inv[capKey]||base||1)),pct=clamp(remaining/cap*100,0,100),daily=Math.max(0,Number(state.doses[product]||0));return {remaining,pct,days:daily>0?Math.floor(remaining/daily):Infinity,known:used.known};
}

/* ---------- UI básica ---------- */
function showToast(text){
  const el=$('#toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>el.classList.remove('show'),2300);
}
window.toast=showToast;
function switchView(name){
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.target===name));
  const app=$('.app');if(app)app.scrollTop=0;requestAnimationFrame(drawAllCharts);if(name==='history')renderHistory();if(name==='dose')renderDosing();
}
window.switchView=switchView;
$$('.nav-btn').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.target)));
$('#menuBtn')?.addEventListener('click',()=>switchView('settings'));

function formatRelative(ts){
  if(!ts)return 'sin datos';const d=new Date(ts),days=Math.floor((Date.now()-+d)/DAY);if(days===0)return `hoy ${d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`;if(days===1)return 'ayer';return d.toLocaleDateString('es-ES',{day:'2-digit',month:'short'});
}
function statusTargetText(row){
  if(row.key==='mg')return `objetivo ${nf(TARGETS.mg.target,0)} ppm · ±${nf(state.settings.testUncertainty.mg,0)} por incertidumbre`;
  if(row.key==='sal')return `objetivo ${nf(SALINITY_SETPOINT,1)} ppt`;
  return `${nf(row.target[0],row.decimals)}–${nf(row.target[1],row.decimals)} ${row.unit}`;
}
function statusText(row){
  if(row.state==='missing')return 'Sin medir';if(row.state==='pending')return 'Pendiente de medición';if(row.state==='stale')return 'Dato antiguo';if(row.state==='correct')return row.estimated?'≈ Correcto':'✓ Correcto';return `${row.estimated?'≈ ':''}${row.state==='low'?'↓ Bajo':'↑ Alto'}`;
}
function renderChemEvaluation(){
  const card=$('#manualSmartEvalCard');if(!card)return;card.hidden=false;card.style.display='';
  const ev=evaluateChemistry(),list=$('#manualEvalList'),summary=$('#manualEvalSummary'),ctx=$('#manualEvalContext');
  if(ctx)ctx.innerHTML=`Objetivos fijos del acuario: <strong>KH 8,0–8,3</strong> · <strong>Ca 420–430</strong> · <strong>Mg 1380</strong> · <strong>NO₃ 5–10</strong> · <strong>PO₄ 0,04–0,07</strong> · <strong>35 ppt</strong>. No se escalan con la composición de la sal.`;
  if(list)list.innerHTML=ev.rows.map(r=>{
    const shown=r.value===null?'Sin medición':`${r.estimated?'≈':''}${nf(r.value,r.decimals)} ${r.unit}`;
    return `<div class="manual-eval-row" data-param="${r.key}"><div class="manual-eval-param"><strong>${shown}</strong></div><div class="manual-eval-target">${statusTargetText(r)}</div><div class="manual-eval-status ${r.state}">${statusText(r)}</div></div>`;
  }).join('');
  const measured=ev.rows.filter(r=>r.state!=='missing'),correct=measured.filter(r=>r.state==='correct').length,off=measured.filter(r=>['low','high'].includes(r.state)).length,pending=measured.filter(r=>r.state==='pending').length,stale=measured.filter(r=>r.state==='stale').length;
  if(summary)summary.innerHTML=`<span class="eval-summary-chip">${measured.length} con dato</span><span class="eval-summary-chip">✓ ${correct} correctos</span>${off?`<span class="eval-summary-chip">⚠ ${off} fuera</span>`:''}${pending?`<span class="eval-summary-chip">⏳ ${pending} pendientes</span>`:''}${stale?`<span class="eval-summary-chip">◷ ${stale} antiguos</span>`:''}`;
  return ev;
}

function renderHome(){
  const ev=evaluateChemistry(),kh=ev.rows.find(r=>r.key==='kh'),last=latestRealMeasurement('kh'),cons=robustConsumption('kh'),balling=estimateBalancedDose();
  $('#homeGoalLabel').textContent='Objetivo';$('#homeGoal').textContent='8,0–8,3';$('#homeGoalUnit').textContent='dKH';$('#measureGoal').textContent='8,2';
  $('#homeKh').textContent=kh?.value===null?'—':`${kh.estimated?'≈':''}${nf(kh.value,1)}`;$('#khState').textContent=kh?statusText(kh):'—';$('#lastMeasured').textContent=last?formatRelative(last.ts):'sin mediciones';
  $('#consumption').textContent=cons.value===null?'—':nf(Number.isFinite(cons.physicalValue)?cons.physicalValue:cons.value,2);$('#consumptionMeta').textContent=cons.value===null?'Sin intervalos estructurados suficientes':`modelo ${cons.label} · ${cons.score}/100${cons.correctionCount?` · ${cons.correctionCount} corrección(es) descontadas`:''}`;
  if(state.settings.maintenanceMethod==='xepta'){$('#homeMaintenanceLabel').textContent='Dosis calculada';$('#dailyDose').textContent=Number.isFinite(balling.program)?nf(balling.program,1):'—';$('#homeMaintenanceUnit').textContent='ml/día'}else{$('#homeMaintenanceLabel').textContent='Mantenimiento';$('#dailyDose').textContent='Manual';$('#homeMaintenanceUnit').textContent=''}
  const pending=state.parameterCorrections.filter(c=>c.applied!==false&&pendingCorrectionFor(c.parameter)?.id===c.id);const pcs=$('#homeCorrectionState');if(pcs){pcs.hidden=!pending.length;pcs.textContent=pending.length?`⏳ ${pending.map(c=>`${CORRECTION_RULES[c.parameter].label} +${nf(c.delta,CORRECTION_RULES[c.parameter].valueDecimals)}`).join(' · ')} · mide de nuevo antes de otra corrección`:';'}
  const important=ev.rows.filter(r=>['low','high','pending'].includes(r.state));const pill=$('#statusPill');if(pill)pill.textContent=important.length?'⚠ Revisar parámetros':ev.rows.some(r=>r.state==='stale')?'◷ Datos antiguos':'☺ Parámetros en objetivo';
  $('#manualKhRangeLegend').hidden=false;
}

function renderDosing(){
  const method=state.settings.maintenanceMethod,manual=method==='manual';const select=$('#methodSelect');if(select&&select.value!==method)select.value=method;
  $('#methodDescription').textContent=manual
    ?'Sin mantenimiento continuo. Las correcciones puntuales KH/Ca/Mg siguen disponibles y se registran como intervenciones independientes.'
    :'Mantenimiento Xepta Reef Balance Next 1:1:1. Las correcciones puntuales KH/Ca/Mg siguen disponibles sin desactivar Balling; el motor las descuenta al estimar consumo.';
  $('#ballingDoseContent').hidden=manual;$('#ballingDoseContent').style.display=manual?'none':'';$('#manualMaintenanceCard').hidden=!manual;$('#manualMaintenanceCard').style.display=manual?'':'none';$$('.balling-settings-field,.balling-settings-card').forEach(el=>{el.hidden=manual;el.style.display=manual?'none':''});
  const correctionShortcut=$('#alwaysCorrectionBtn');
  if(correctionShortcut){correctionShortcut.hidden=manual;correctionShortcut.style.display=manual?'none':'';}
  $('#doseKicker').textContent=manual?'Mantenimiento manual':'Balling 1:1:1';
  const result=estimateBalancedDose(),proposal=updatePumpProposal(result),cur=currentProgram();
  if(manual)return;
  $('#autoDoseDaily').textContent=Number.isFinite(result.program)?nf(result.program,1):'—';$('#autoDoseConfidence').textContent=result.label||'—';$('#autoDoseSource').textContent=result.source||'';
  const warn=$('#autoDoseWarning');if(warn){warn.hidden=!result.warning;warn.textContent=result.warning||''}
  const balanced=sameDose(cur.kh,cur.ca)&&sameDose(cur.kh,cur.trace);$('#autoDoseCurrent').textContent=balanced?`Programa físico activo: ${nf(cur.kh,1)} ml/día en KH, Ca y Trazas.`:'Programa físico no balanceado detectado: revisa la dosificadora.';
  $('#pumpProgramOutput').textContent=Number.isFinite(result.program)?`${nf(result.program,1)} ml/día · 1:1:1`:'—';
  const txt=Number.isFinite(result.program)?`${nf(result.program,1)} ml/día`:'— ml/día';$('#khDoseCard').textContent=txt;$('#caDoseCard').textContent=txt;$('#traceDoseCard').textContent=txt;$('#khDoseSplit').textContent=result.pump?.kh?.text||'—';$('#caDoseSplit').textContent=result.pump?.other?.text||'—';$('#traceDoseSplit').textContent=result.pump?.other?.text||'—';
  $('#khRecommendedDose').textContent=Number.isFinite(result.raw)?`${nf(result.raw,2)} ml/día teóricos`:'—';$('#khRecommendedMeta').textContent=result.kh?.value===null?'Necesita tendencia KH modelable':`${nf(Number.isFinite(result.kh.physicalValue)?result.kh.physicalValue:result.kh.value,2)} dKH/día · calidad ${result.kh.label} (${result.kh.score}/100)`;
  if(result.ca?.value===null){$('#caControlState').textContent='Sin tendencia';$('#caRecommendedMeta').textContent='Ca necesita una ventana temporal suficiente; nunca genera una dosis independiente.'}else{$('#caControlState').textContent=result.ca.score<MIN_ACTION_SCORE?'Datos débiles':Number.isFinite(result.caDrift)&&Math.abs(result.caDrift)<=Number(result.caTolerance||Infinity)?'Compatible':'Revisar';$('#caRecommendedMeta').textContent=`Consumo Ca ${nf(Number.isFinite(result.ca.physicalValue)?result.ca.physicalValue:result.ca.value,1)} ppm/día · deriva 1:1:1 ${Number.isFinite(result.caDrift)?`${result.caDrift>=0?'+':''}${nf(result.caDrift,1)} ppm/día`:'—'}.`}
  const badge=$('#autoDoseBadge');badge.textContent=result.actionable?(proposal?.confirmedBySecondMeasurement?'Listo para confirmar':'Confirmando con otra medición'):'Esperando datos';badge.className=`auto-dose-badge ${result.actionable?'ready':'blocked'}`;
  const btn=$('#confirmPumpProgramBtn'),hint=$('#pumpProgramConfirmHint');const can=!!proposal?.confirmedBySecondMeasurement&&Number.isFinite(proposal.program)&&result.actionable&&!proposal.matchesActive;btn.hidden=!can;btn.disabled=!can;if(can)btn.textContent=`✓ Ya programé ${nf(proposal.program,1)} ml/día en los 3 canales`;
  if(hint)hint.textContent=proposal?.confirmedBySecondMeasurement?'La recomendación ha sido repetida por una medición posterior. Confirma solo después de programarla físicamente.':proposal?'Se requiere una nueva medición independiente que confirme la misma recomendación antes de habilitar el cambio físico.':'Una recomendación nunca cambia la dosificadora por sí sola.';
  updateInventoryUI();
}

function renderHistory(){
  const days=$('.tab.active')?.dataset.days||'all';const d=days==='all'?null:Number(days);drawHistoryCharts(d);
  for(const key of ['ca','mg','no3','po4','sal']){
    const m=latestRealMeasurement(key),rule=PARAM_LIMITS[key],capital=key==='sal'?'Salinidad':key.toUpperCase();const latestEl=$(`#${key}ChartLatest`);if(latestEl)latestEl.textContent=m?measurementText(key,m):'—';const stats=$(`#${key}ChartStats`);if(stats)stats.textContent=m?`Último dato: ${formatRelative(m.ts)}`:'Sin datos en este periodo';
  }
  const defs=[['ca','histCa','histCaMeta'],['mg','histMg','histMgMeta'],['no3','histNo3','histNo3Meta'],['po4','histPo4','histPo4Meta'],['sal','histSal','histSalMeta']];defs.forEach(([k,id,mid])=>{const m=latestRealMeasurement(k),r=PARAM_LIMITS[k];$(`#${id}`).textContent=m?measurementText(k,m):'—';$(`#${mid}`).textContent=m?formatRelative(m.ts):'Sin dato'});$('#historyParamMeta').textContent=latestAnyMeasurement()?`Última entrada ${formatRelative(latestAnyMeasurement().ts)}`:'Sin datos';
  const ev=evaluateChemistry(),off=ev.rows.filter(r=>['low','high'].includes(r.state)),pending=ev.rows.filter(r=>r.state==='pending'),cons=robustConsumption('kh');const lines=[];if(off.length)lines.push(`<strong>Fuera de objetivo:</strong> ${off.map(r=>`${r.labelParam} ${r.label.toLowerCase()}`).join(' · ')}.`);else lines.push('<strong>Objetivos:</strong> los parámetros actuales con datos recientes no muestran desviaciones de los rangos fijos.');if(pending.length)lines.push(`<strong>Pendiente de medición:</strong> ${pending.map(r=>r.labelParam).join(', ')}.`);lines.push(`<strong>Consumo KH:</strong> ${cons.value===null?'sin suficientes intervalos estructurados':`${nf(Number.isFinite(cons.physicalValue)?cons.physicalValue:cons.value,2)} dKH/día · calidad ${cons.label} (${cons.score}/100)`}.`);lines.push('<strong>Reef Balance Next:</strong> Trace se mantiene 1:1:1, pero nunca se convierte a ppm de Mg ni sustituye una corrección específica de Mg.');$('#insights').innerHTML=lines.map(x=>`<div class="insight">${x}</div>`).join('');
  renderEvents();
}
function renderEvents(){
  const el=$('#eventList'),labels={water:'💧',parameterCorrection:'🎯',correctionCancelled:'↩️',maintenanceMethod:'🔄',pumpProgram:'🧪',volumeChange:'📐',scheduleChange:'🕒',inventoryChange:'🧴',balling:'🧴'};const items=sortByTs(state.events).reverse().slice(0,30);el.innerHTML=items.length?items.map(e=>{const cancelled=e.type==='parameterCorrection'&&e.applied===false,canCancel=e.type==='parameterCorrection'&&e.applied!==false&&e.correctionId;return `<div class="event ${cancelled?'cancelled':''}"><div class="action-ico" style="width:38px;height:38px;font-size:18px">${labels[e.type]||'•'}</div><div><div class="what">${escapeHtml(e.detail||e.type)}${cancelled?' · REGISTRO ANULADO':''}</div><div class="when">${new Date(e.ts).toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div></div>${canCancel?`<div class="event-action-wrap"><button class="event-cancel-btn" onclick="RMC.cancelCorrection('${e.correctionId}')">Anular registro</button></div>`:''}</div>`}).join(''):'<div class="small">Sin eventos registrados.</div>';
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

/* ---------- Gráficas ---------- */
function chartTarget(key){return TARGETS[key]?targetRangeFor(key):null}

function drawChart(canvas,key,days=null,maxPoints=null){
  if(!canvas)return;
  const ctx=canvas.getContext('2d'),dpr=Math.max(1,window.devicePixelRatio||1),w=canvas.clientWidth||320,h=canvas.clientHeight||180;
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  let data=sortByTs(state.measurements).filter(m=>finite(m[key]));
  if(days){const cut=Date.now()-days*DAY;data=data.filter(m=>+new Date(m.ts)>=cut)}
  if(maxPoints&&data.length>maxPoints)data=data.slice(-maxPoints);
  if(!data.length){ctx.fillStyle='#6e7f98';ctx.font='12px sans-serif';ctx.fillText('Sin datos en este periodo',14,36);return}
  const pad={l:38,r:10,t:18,b:24},vals=data.map(m=>Number(m[key])),target=chartTarget(key),extra=target?target:[];
  let min=Math.min(...vals,...extra),max=Math.max(...vals,...extra);
  const span=Math.max(max-min,key==='po4'?.08:key==='kh'?.8:key==='sal'?1:key==='no3'?5:key==='ca'?40:100);
  min-=span*.18;max+=span*.18;if(key==='po4')min=Math.max(0,min);if(key==='no3')min=Math.max(0,min);
  const first=+new Date(data[0].ts),last=+new Date(data.at(-1).ts),x=t=>pad.l+(w-pad.l-pad.r)*((+new Date(t)-first)/(last-first||1)),y=v=>pad.t+(h-pad.t-pad.b)*(1-(v-min)/(max-min||1));
  ctx.font='10px sans-serif';ctx.strokeStyle='rgba(100,130,150,.18)';ctx.fillStyle='#6e7f98';
  for(let i=0;i<5;i++){
    const v=min+(max-min)*i/4,yy=y(v);
    ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();
    ctx.fillText(nf(v,PARAM_LIMITS[key].decimals),2,yy+3);
  }
  if(target){const lo=y(target[1]),hi=y(target[0]);ctx.fillStyle='rgba(91,211,201,.12)';ctx.fillRect(pad.l,lo,w-pad.l-pad.r,hi-lo)}
  ctx.strokeStyle=PARAM_LIMITS[key].color;ctx.lineWidth=2.2;ctx.beginPath();
  data.forEach((m,i)=>{const xx=x(m.ts),yy=y(Number(m[key]));i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});
  ctx.stroke();
  data.forEach(m=>{
    const xx=x(m.ts),yy=y(Number(m[key]));
    ctx.fillStyle=PARAM_LIMITS[key].color;ctx.beginPath();ctx.arc(xx,yy,3.1,0,Math.PI*2);ctx.fill();
  });
  const relevant=state.events.filter(e=>+new Date(e.ts)>=first&&+new Date(e.ts)<=last&&(e.type==='water'||(e.type==='parameterCorrection'&&e.parameter===key)||['pumpProgram','maintenanceMethod'].includes(e.type)));
  for(const e of relevant){ctx.strokeStyle=e.type==='water'?'#22a9b7':e.type==='parameterCorrection'?'#d95563':'#78a52e';const xx=x(e.ts);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xx,pad.t);ctx.lineTo(xx,h-pad.b);ctx.stroke()}

  const drawn=[];
  data.forEach((m,idx)=>{
    const xx=x(m.ts),yy=y(Number(m[key]));
    const label=pointValueText(key,m);
    ctx.font='bold 9px sans-serif';
    const textW=ctx.measureText(label).width;
    const diameter=Math.max(24,textW+10);
    let bx=xx-diameter/2,by=yy-diameter-8;
    bx=Math.max(pad.l,Math.min(w-pad.r-diameter,bx));
    by=Math.max(pad.t-2,Math.min(h-pad.b-diameter-4,by));
    let tries=0;
    while(drawn.some(r=>!(bx+diameter<r.x||bx>r.x+r.w||by+diameter<r.y||by>r.y+r.h)) && tries<4){
      by=Math.min(h-pad.b-diameter-4,by+diameter+4);
      tries++;
    }
    // Conector sutil entre el punto temporal y su lectura.
    ctx.strokeStyle='rgba(166,143,218,.48)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(xx,yy-3);ctx.lineTo(xx,by+diameter);ctx.stroke();
    // Círculo pastel con lectura turquesa fuerte.
    ctx.save();
    ctx.shadowColor='rgba(0,158,168,.12)';ctx.shadowBlur=4;ctx.shadowOffsetY=1;
    ctx.fillStyle='#F1E9FF';ctx.strokeStyle='#D2C2F3';ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.arc(bx+diameter/2,by+diameter/2,diameter/2,0,Math.PI*2);
    ctx.fill();ctx.stroke();
    ctx.restore();
    ctx.fillStyle='#009EA8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,bx+diameter/2,by+diameter/2+0.5);
    ctx.textAlign='start';ctx.textBaseline='alphabetic';
    drawn.push({x:bx,y:by,w:diameter,h:diameter});
  });

  ctx.fillStyle='#6e7f98';ctx.font='10px sans-serif';
  const labels=Math.min(5,data.length);
  for(let i=0;i<labels;i++){
    const idx=Math.round(i*(data.length-1)/(labels-1||1)),d=new Date(data[idx].ts);
    ctx.fillText(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,x(data[idx].ts)-16,h-5)
  }
}
function drawHistoryCharts(days){drawChart($('#historyChart'),'kh',days);drawChart($('#caHistoryChart'),'ca',days);drawChart($('#mgHistoryChart'),'mg',days);drawChart($('#no3HistoryChart'),'no3',days);drawChart($('#po4HistoryChart'),'po4',days);drawChart($('#salHistoryChart'),'sal',days)}
function drawAllCharts(){requestAnimationFrame(()=>{drawChart($('#homeChart'),'kh',null,7);const d=$('.tab.active')?.dataset.days;drawHistoryCharts(d&&d!=='all'?Number(d):null)})}
window.addEventListener('resize',drawAllCharts);
$$('.tab').forEach(b=>b.addEventListener('click',()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderHistory()}));
/* ---------- Medición ---------- */
const optionalInputs=['caInput','mgInput','no3Input','po4Input','salInput'];
function setupMeasurementInputs(){
  ['khInput',...optionalInputs].forEach(id=>{const el=$(`#${id}`);if(!el)return;el.dataset.userEdited='0';el.addEventListener('focus',()=>{if(el.value==='0')requestAnimationFrame(()=>el.select())});el.addEventListener('input',()=>{el.dataset.userEdited='1';renderDraftEvaluation()})});
}
function resetMeasurementForm(){const n=localNow();$('#measureDate').value=n.date;$('#measureTime').value=n.time;['khInput',...optionalInputs].forEach(id=>{const el=$(`#${id}`);if(el){el.value='0';el.dataset.userEdited='0'}})}
function renderDraftEvaluation(){
  const card=$('#manualSmartEvalCard'),list=$('#manualEvalList'),summary=$('#manualEvalSummary'),ctx=$('#manualEvalContext');
  if(!card||!list)return;
  const base=evaluateChemistry(),map={kh:'khInput',ca:'caInput',mg:'mgInput',no3:'no3Input',po4:'po4Input',sal:'salInput'};
  let hasDraft=false;
  const rows=base.rows.map(r=>{
    const el=$(`#${map[r.key]}`);if(!el||el.dataset.userEdited!=='1')return {...r,draft:false};
    const v=num(el.value);if(!Number.isFinite(v))return {...r,draft:false};hasDraft=true;
    const [lo,hi]=targetRangeFor(r.key);let stateName=v<lo?'low':v>hi?'high':'correct';
    return {...r,value:v,state:stateName,label:stateName==='correct'?'Correcto':stateName==='low'?'Bajo':'Alto',estimated:false,draft:true};
  });
  if(!hasDraft){renderChemEvaluation();return}
  card.hidden=false;card.style.display='';
  if(ctx)ctx.innerHTML='<strong>Vista previa de la medición:</strong> los valores que estás escribiendo se evalúan sin modificar el historial hasta pulsar Guardar. Objetivos fijos: KH 8,0–8,3 · Ca 420–430 · Mg 1380 · NO₃ 5–10 · PO₄ 0,04–0,07 · 35 ppt.';
  list.innerHTML=rows.map(r=>{const shown=r.value===null?'Sin medición':`${r.draft?'✎ ':r.estimated?'≈':''}${nf(r.value,r.decimals)} ${r.unit}`;return `<div class="manual-eval-row" data-param="${r.key}"><div class="manual-eval-param"><strong>${shown}</strong></div><div class="manual-eval-target">${statusTargetText(r)}</div><div class="manual-eval-status ${r.state}">${r.draft?'Borrador · ':''}${statusText(r)}</div></div>`}).join('');
  const measured=rows.filter(r=>r.state!=='missing'),correct=measured.filter(r=>r.state==='correct').length,off=measured.filter(r=>['low','high'].includes(r.state)).length,drafts=rows.filter(r=>r.draft).length;
  if(summary)summary.innerHTML=`<span class="eval-summary-chip">✎ ${drafts} borrador${drafts===1?'':'es'}</span><span class="eval-summary-chip">✓ ${correct} correctos</span>${off?`<span class="eval-summary-chip">⚠ ${off} fuera</span>`:''}`;
}
function saveMeasurement(full){
  const kh=num($('#khInput').value);if(!Number.isFinite(kh)||kh<PARAM_LIMITS.kh.min||kh>PARAM_LIMITS.kh.max){showToast('Introduce un KH válido (3–15 dKH)');return false}
  const date=$('#measureDate').value,time=$('#measureTime').value||'00:00';if(!date){showToast('Selecciona una fecha');return false}const ts=`${date}T${time}`;if(!validTs(ts)){showToast('Fecha u hora no válida');return false}if(+new Date(ts)>Date.now()+300000){showToast('La medición no puede estar en el futuro');return false}
  const m={ts,kh,recordedAt:isoNow(),source:'user-measurement',maintenanceMethod:state.settings.maintenanceMethod};
  if(full){const defs=[['caInput','ca'],['mgInput','mg'],['no3Input','no3'],['po4Input','po4'],['salInput','sal']];for(const [id,key] of defs){const el=$(`#${id}`);if(!el||el.dataset.userEdited!=='1')continue;const v=num(el.value),r=PARAM_LIMITS[key];if(!Number.isFinite(v)||v<r.min||v>r.max){showToast(`${TARGETS[key].label} fuera del rango admitido (${r.min}–${r.max} ${r.unit})`);return false}m[key]=v}}
  const idx=state.measurements.findIndex(x=>x.ts===ts);if(idx>=0)state.measurements[idx]={...state.measurements[idx],...m};else state.measurements.push(m);state.measurements=sortByTs(state.measurements);if(!state.mathMeta.structuredHistoryStart)state.mathMeta.structuredHistoryStart=ts;persist();resetMeasurementForm();updateUI();showMeasurementSaved(idx>=0);switchView('home');return true;
}
function showMeasurementSaved(updated){let box=$('#measureSaveConfirm');if(!box){box=document.createElement('div');box.id='measureSaveConfirm';box.className='measure-save-confirm';box.innerHTML='<div class="save-check">✓</div><strong></strong><small>Datos guardados y modelo recalculado</small>';document.body.appendChild(box)}box.querySelector('strong').textContent=updated?'Medición actualizada':'Medición guardada';box.classList.remove('show');void box.offsetWidth;box.classList.add('show');setTimeout(()=>box.classList.remove('show'),2200)}
$('#saveMeasurement')?.addEventListener('click',()=>saveMeasurement(true));$('#saveKhOnly')?.addEventListener('click',()=>saveMeasurement(false));

/* ---------- Modal de eventos ---------- */
function openEventModal(type=null){
  const modal=$('#eventModal');if(!modal)return;modal.classList.add('open');const d=new Date(),tz=d.getTimezoneOffset()*60000;$('#eventDate').value=new Date(d-tz).toISOString().slice(0,16);if(type){$('#eventType').value=type}refreshEventFields();resetCorrectionConfirmation();
}
function closeEventModal(){$('#eventModal')?.classList.remove('open')}
window.openEventModal=openEventModal;window.closeEventModal=closeEventModal;window.openMaintenanceEvent=type=>openEventModal(type);
$('#eventModal')?.addEventListener('click',e=>{if(e.target.id==='eventModal')closeEventModal()});
function refreshEventFields(){
  const type=$('#eventType').value;$$('.event-water-field').forEach(el=>el.classList.toggle('is-visible',type==='water'));$$('.event-param-correction-field').forEach(el=>el.classList.toggle('is-visible',type==='parameterCorrection'));$$('.event-product-field').forEach(el=>el.style.display='none');
  $('#saveEvent').textContent=type==='parameterCorrection'?'Aplicar corrección':'Guardar evento';if(type==='parameterCorrection')renderCorrectionForm();
  const balling=$('#eventType option[value="balling"]');if(balling){balling.disabled=state.settings.maintenanceMethod!=='xepta';balling.hidden=state.settings.maintenanceMethod!=='xepta';if(type==='balling'&&balling.disabled){$('#eventType').value='water';refreshEventFields()}}
}
$('#eventType')?.addEventListener('change',refreshEventFields);
function correctionPlaceholder(param){return param==='kh'?['7,2','8,2']:param==='ca'?['410','425']:['1320','1380']}
function correctionVolumeInfo(){return volumeInfoAt($('#eventDate').value||isoNow())}
function renderCorrectionForm(){
  const param=$('#eventCorrectionParameter').value||'kh',r=CORRECTION_RULES[param],vInfo=correctionVolumeInfo(),v=Number(vInfo.volume||0),current=num($('#eventCorrectionCurrent').value),target=num($('#eventCorrectionTarget').value),pending=pendingCorrectionFor(param),last=latestRealMeasurement(param),ph=correctionPlaceholder(param);
  $('#eventCorrectionCurrentLabel').textContent=`Nivel actual (${r.valueUnit})`;$('#eventCorrectionTargetLabel').textContent=`Nivel objetivo (${r.valueUnit})`;$('#eventCorrectionCurrent').placeholder=`Ej.: ${ph[0]}`;$('#eventCorrectionTarget').placeholder=`Ej.: ${ph[1]}`;$('#eventCorrectionVolume').value=v>0?`${nf(v,0)} L${vInfo.assumed?' · estimado':' · histórico'}`:'Sin configurar';$('#eventCorrectionLatestHint').textContent=last?`Última medición: ${nf(Number(last[param]),r.valueDecimals)} ${r.valueUnit}. Introduce el valor real justo antes de corregir.`:'Introduce el valor medido justo antes de corregir.';
  const safety=$('#eventCorrectionSafety');safety.hidden=true;safety.textContent='';
  if(pending){$('#eventCorrectionDelta').textContent='Pendiente';$('#eventCorrectionResult').textContent='Nueva medición requerida';$('#eventCorrectionFormula').textContent=`Ya existe una corrección de ${r.label} aplicada y sin confirmar por una medición posterior.`;$('#eventCorrectionReference').textContent='';safety.hidden=false;safety.textContent='Bloqueo de seguridad: mide de nuevo antes de otra corrección del mismo parámetro.';return null}
  $('#eventCorrectionReference').textContent=`Referencia fija: ${nf(r.referenceAmount,0)} ${r.amountUnit} → +${nf(r.referenceEffect,param==='kh'?1:1)} ${r.valueUnit} en ${r.referenceVolume} L.`;
  if(!(v>0)){ $('#eventCorrectionDelta').textContent='—';$('#eventCorrectionResult').textContent='Configura el volumen';$('#eventCorrectionFormula').textContent='El cálculo usa el volumen neto histórico en la fecha elegida.';return null }
  if(!Number.isFinite(current)||!Number.isFinite(target)){ $('#eventCorrectionDelta').textContent='—';$('#eventCorrectionResult').textContent='—';$('#eventCorrectionFormula').textContent='Introduce el nivel actual y el nivel objetivo.';return null }
  if(current<r.min||current>r.max||target<r.min||target>r.max){$('#eventCorrectionDelta').textContent='Fuera de rango';$('#eventCorrectionResult').textContent='—';$('#eventCorrectionFormula').textContent=`Valores admitidos: ${r.min}–${r.max} ${r.valueUnit}.`;return null}
  if(target<=current){$('#eventCorrectionDelta').textContent=`${nf(target-current,r.valueDecimals)} ${r.valueUnit}`;$('#eventCorrectionResult').textContent='—';$('#eventCorrectionFormula').textContent=target===current?'El valor ya coincide con el objetivo.':'Estos productos solo se calculan para aumentar el parámetro.';return null}
  const c=calculateCorrection(param,current,target,v);$('#eventCorrectionDelta').textContent=`+${nf(c.desiredDelta,r.valueDecimals)} ${r.valueUnit}`;
  if(c.limited){$('#eventCorrectionResult').textContent=`Aplicar ahora: ${nf(c.appliedAmount,r.amountDecimals)} ${r.amountUnit} · total teórico ${nf(c.totalAmount,r.amountDecimals)} ${r.amountUnit}`;safety.hidden=false;safety.textContent=param==='ca'?`Límite Ca Plus aplicado: máximo ${nf(r.dailyMaxAmountPer100L*v/100,1)} ml hoy (${nf(c.appliedDelta,0)} ppm). Corrección total mínima: ${c.minDays} días. Tras esta aplicación debes volver a medir antes de continuar.`:`Límite Mg aplicado: máximo +${nf(r.dailyMaxDelta,0)} ppm hoy. Aplicar ${nf(c.appliedAmount,1)} ml ahora; mínimo ${c.minDays} días y nueva medición antes del siguiente tramo.`}
  else $('#eventCorrectionResult').textContent=`${nf(c.appliedAmount,r.amountDecimals)} ${r.amountUnit} · ${r.supplement}`;
  $('#eventCorrectionFormula').textContent=`${r.supplement}: ${nf(r.referenceAmount,0)} ${r.amountUnit} × (${nf(v,0)} / ${r.referenceVolume}) × (${nf(c.appliedDelta,r.valueDecimals)} / ${nf(r.referenceEffect,param==='kh'?1:1)}) = ${nf(c.appliedAmount,r.amountDecimals)} ${r.amountUnit}${c.limited?` (tramo seguro de hoy; objetivo final ${nf(target,r.valueDecimals)} ${r.valueUnit})`:''}.`;
  return c;
}
function resetCorrectionConfirmation(){const b=$('#saveEvent');if(b){b.dataset.confirmSignature='';if($('#eventType')?.value==='parameterCorrection')b.textContent='Aplicar corrección'}}
['eventCorrectionCurrent','eventCorrectionTarget'].forEach(id=>$(`#${id}`)?.addEventListener('input',()=>{resetCorrectionConfirmation();renderCorrectionForm()}));$('#eventCorrectionParameter')?.addEventListener('change',()=>{$('#eventCorrectionCurrent').value='';$('#eventCorrectionTarget').value='';resetCorrectionConfirmation();renderCorrectionForm()});$('#eventDate')?.addEventListener('change',()=>{resetCorrectionConfirmation();if($('#eventType').value==='parameterCorrection')renderCorrectionForm()});
function baselineMeasurement(c,ts){
  const tol=c.parameter==='kh'?.051:.51,existing=state.measurements.find(m=>m.ts===ts);if(existing&&finite(existing[c.parameter])){const p=Number(existing[c.parameter]);if(Math.abs(p-c.current)>tol)return {ok:false,message:`Ya existe una medición de ${c.rule.label} a esa hora (${nf(p,c.rule.valueDecimals)}). Usa ese valor o cambia la fecha.`};return {ok:true}}
  if(existing){existing[c.parameter]=c.current;existing.source=existing.source||'correctionBaseline';existing.recordedAt=existing.recordedAt||isoNow()}else state.measurements.push({ts,[c.parameter]:c.current,recordedAt:isoNow(),source:'correctionBaseline'});return {ok:true};
}
function saveCorrectionEvent(){
  const c=renderCorrectionForm(),ts=$('#eventDate').value;if(!ts||!validTs(ts)){showToast('Selecciona fecha y hora válida');return}if(+new Date(ts)>Date.now()+300000){showToast('La corrección no puede estar en el futuro');return}if(!c){showToast('Revisa los datos de la corrección');return}
  if(pendingCorrectionFor(c.parameter)){showToast(`Mide de nuevo ${c.rule.label} antes de otra corrección`);return}
  const sig=[c.parameter,ts,c.current,c.target,c.appliedAmount].join('|'),btn=$('#saveEvent');if(btn.dataset.confirmSignature!==sig){btn.dataset.confirmSignature=sig;btn.textContent=`Confirmar: ya añadí ${nf(c.appliedAmount,c.rule.amountDecimals)} ${c.rule.amountUnit}`;showToast('Pulsa de nuevo solo después de aplicar físicamente esa cantidad');return}
  const base=baselineMeasurement(c,ts);if(!base.ok){resetCorrectionConfirmation();showToast(base.message);return}
  const id=`pc-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,note=$('#eventDetail').value.trim(),method=state.settings.maintenanceMethod;
  const rec={id,ts,parameter:c.parameter,current:c.current,target:c.appliedTarget,desiredTarget:c.target,desiredDelta:c.desiredDelta,delta:c.appliedDelta,effectUnits:c.appliedDelta,effectUnit:c.rule.valueUnit,supplement:c.rule.supplement,amount:c.appliedAmount,totalAmount:c.totalAmount,amountUnit:c.rule.amountUnit,volume:c.volume,limitedByDailyMax:c.limited,minDays:c.minDays,theoreticalEffect:true,applied:true,appliedAt:isoNow(),maintenanceMethodAtApplication:method,source:'user-applied'};
  state.parameterCorrections.push(rec);state.parameterCorrections=sortByTs(state.parameterCorrections);state.events.push({ts,type:'parameterCorrection',correctionId:id,parameter:c.parameter,current:c.current,target:c.appliedTarget,desiredTarget:c.target,effectUnits:c.appliedDelta,effectUnit:c.rule.valueUnit,supplement:c.rule.supplement,amount:c.appliedAmount,amountUnit:c.rule.amountUnit,volume:c.volume,limitedByDailyMax:c.limited,applied:true,maintenanceMethodAtApplication:method,recordedAt:isoNow(),detail:`${c.rule.label}: ${nf(c.current,c.rule.valueDecimals)} → ${nf(c.appliedTarget,c.rule.valueDecimals)} ${c.rule.valueUnit} · +${nf(c.appliedDelta,c.rule.valueDecimals)} · ${nf(c.appliedAmount,c.rule.amountDecimals)} ${c.rule.amountUnit} ${c.rule.supplement}${c.limited?` · objetivo final ${nf(c.target,c.rule.valueDecimals)} · tramo diario seguro`:''}${method==='xepta'?' · Balling 1:1:1 continúa activo':''}${note?` · ${note}`:''}`});
  state.mathMeta.proposedPumpProgram=null;persist();closeEventModal();updateUI();showToast(`Corrección registrada · ${c.rule.label} +${nf(c.appliedDelta,c.rule.valueDecimals)} ${c.rule.valueUnit}`);
}
function saveWaterEvent(){
  const ts=$('#eventDate').value;if(!ts||!validTs(ts)){showToast('Selecciona fecha y hora');return}if(+new Date(ts)>Date.now()+300000){showToast('El cambio de agua no puede estar en el futuro');return}const liters=num($('#eventWaterLiters').value),vol=volumeAt(ts);if(!(liters>0)){showToast('Indica el volumen real cambiado');return}if(!(vol>0)){showToast('Configura primero el volumen neto');return}if(liters>=vol){showToast('El volumen cambiado debe ser menor que el volumen del sistema');return}
  const defs=[['eventWaterKh','newKh','kh'],['eventWaterCa','newCa','ca'],['eventWaterMg','newMg','mg'],['eventWaterNo3','newNo3','no3'],['eventWaterPo4','newPo4','po4'],['eventWaterSal','newSal','sal']],e={saveId:`water-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,ts,type:'water',liters,systemVolume:vol,recordedAt:isoNow()};let count=0;
  for(const [id,k,p] of defs){const el=$(`#${id}`);if(!el||String(el.value).trim()==='')continue;const v=num(el.value),r=PARAM_LIMITS[p];if(!Number.isFinite(v)||v<r.min||v>r.max){showToast(`${TARGETS[p].label} del agua nueva fuera de rango`);return}e[k]=v;count++}
  const note=$('#eventDetail').value.trim();e.detail=note||`Cambio de agua · ${nf(liters,0)} L${count?` · ${count} parámetros del agua nueva`:''}`;state.events.push(e);if(!persist())return;closeEventModal();updateUI();showToast('Cambio de agua guardado y aplicado a la línea temporal');
}
function saveGenericEvent(){
  const type=$('#eventType').value,ts=$('#eventDate').value;if(!ts||!validTs(ts)){showToast('Selecciona fecha y hora');return}if(type==='balling'&&state.settings.maintenanceMethod!=='xepta'){showToast('La preparación Balling solo se registra cuando Xepta está activo');return}const detail=$('#eventDetail').value.trim()||(type==='balling'?'Nueva preparación Reef Balance Next':'Evento');state.events.push({ts,type,detail,recordedAt:isoNow()});persist();closeEventModal();updateUI();showToast('Evento registrado');
}
$('#saveEvent')?.addEventListener('click',e=>{e.preventDefault();const type=$('#eventType').value;if(type==='parameterCorrection')saveCorrectionEvent();else if(type==='water')saveWaterEvent();else saveGenericEvent()});

/* ---------- Método de mantenimiento ---------- */
function switchMaintenanceMethod(method){
  if(!['xepta','manual'].includes(method))return;const old=state.settings.maintenanceMethod;if(old===method){renderDosing();return}const ok=window.confirm(method==='manual'?'Confirma solo si YA has detenido físicamente la dosificación continua 1:1:1 en la H2Ocean. Las correcciones puntuales seguirán disponibles.':'Confirma solo si YA has preparado la H2Ocean para volver a Reef Balance Next. La dosis arrancará en 0 hasta que el modelo proponga y tú confirmes un programa.');if(!ok){$('#methodSelect').value=old;return}
  const ts=isoNow();state.settings.maintenanceMethod=method;recordMethod(ts,method);state.doses={kh:0,ca:0,trace:0};recordDose(ts,{kh:0,ca:0,trace:0},method==='manual'?'method-manual-stop':'method-xepta-restart');state.mathMeta.proposedPumpProgram=null;state.events.push({ts,type:'maintenanceMethod',method,confirmedPhysical:true,recordedAt:isoNow(),detail:`Método físicamente confirmado → ${method==='xepta'?'Xepta Reef Balance Next':'Corrección Manual'}${method==='xepta'?' · dosis 1:1:1 inicia en 0 hasta nueva confirmación':''}`});persist();updateUI();showToast(method==='manual'?'Mantenimiento manual activo':'Xepta Reef Balance Next activo');
}
$('#methodSelect')?.addEventListener('change',()=>switchMaintenanceMethod($('#methodSelect').value));
function confirmPumpProgram(){
  const result=estimateBalancedDose(),p=state.mathMeta.proposedPumpProgram;if(!p?.confirmedBySecondMeasurement||!result.actionable||!Number.isFinite(result.program)||Math.abs(result.program-p.program)>.051){showToast('La recomendación todavía no está confirmada por dos mediciones independientes');return}const amount=Number(p.program),ok=window.confirm(`Confirma únicamente si YA has programado físicamente ${nf(amount,1)} ml/día en KH Part, Calcium Part y Trace Part (1:1:1).`);if(!ok)return;const ts=isoNow();state.doses={kh:amount,ca:amount,trace:amount};recordDose(ts,{kh:amount,ca:amount,trace:amount},'pump-program-physical-confirmed');state.events.push({ts,type:'pumpProgram',dailyDose:amount,recordedAt:isoNow(),detail:`Programa H2Ocean físicamente confirmado · ${nf(amount,1)} ml/día por componente · 1:1:1`});state.mathMeta.proposedPumpProgram=null;persist();updateUI();showToast('Programa 1:1:1 confirmado y registrado');
}
$('#confirmPumpProgramBtn')?.addEventListener('click',confirmPumpProgram);

/* ---------- Ajustes / inventario / backup ---------- */
function syncSettingsInputs(){
  $('#netVolume').value=Number(state.settings.volume||0)||'';$('#goalKhSetting').value='8.2';$('#goalKhSetting').readOnly=true;$('#salinityGoalSetting').value='35.0';$('#salinityGoalSetting').readOnly=true;$('#manualSalinityGoalField').hidden=false;$('#manualSalinityGoalField').style.display='';
  $('#khDosesPerDay').value=state.settings.khDoses;$('#otherDosesPerDay').value=state.settings.otherDoses;$('#khDoseWindowStart').value=state.settings.khDoseWindowStart;$('#khDoseWindowEnd').value=state.settings.khDoseWindowEnd;$('#otherDoseWindowStart').value=state.settings.otherDoseWindowStart;$('#otherDoseWindowEnd').value=state.settings.otherDoseWindowEnd;$('#testKhUncertainty').value=state.settings.testUncertainty.kh;$('#testCaUncertainty').value=state.settings.testUncertainty.ca;$('#testMgUncertainty').value=state.settings.testUncertainty.mg;
}
function saveSettings(){
  const volume=num($('#netVolume').value),khU=num($('#testKhUncertainty').value),caU=num($('#testCaUncertainty').value),mgU=num($('#testMgUncertainty').value),kd=parseInt($('#khDosesPerDay').value),od=parseInt($('#otherDosesPerDay').value),khStart=$('#khDoseWindowStart').value||'00:00',khEnd=$('#khDoseWindowEnd').value||'00:00',otherStart=$('#otherDoseWindowStart').value||'00:30',otherEnd=$('#otherDoseWindowEnd').value||'00:30';if(!(volume>0)||!(khU>0&&khU<=2&&caU>0&&caU<=100&&mgU>0&&mgU<=200)){showToast('Revisa volumen y precisión de pruebas');return}if(!(kd>=1&&kd<=24&&od>=1&&od<=24)){showToast('Los repartos deben estar entre 1 y 24');return}
  const old={...state.settings},ts=isoNow(),scheduleChanged=Number(old.khDoses)!==kd||Number(old.otherDoses)!==od||old.khDoseWindowStart!==khStart||old.khDoseWindowEnd!==khEnd||old.otherDoseWindowStart!==otherStart||old.otherDoseWindowEnd!==otherEnd;if(scheduleChanged&&state.settings.maintenanceMethod==='xepta'&&!window.confirm('Has cambiado repartos/horarios. Confirma solo si YA están programados físicamente así en la H2Ocean.')){syncSettingsInputs();showToast('Cambios no guardados');return}
  if(Math.abs(Number(old.volume||0)-volume)>.0001){recordVolume(ts,volume);state.events.push({ts,type:'volumeChange',oldVolume:Number(old.volume||0),newVolume:volume,recordedAt:isoNow(),detail:`Volumen neto: ${nf(Number(old.volume||0),0)} → ${nf(volume,0)} L`})}
  state.settings={...state.settings,volume,khGoal:KH_SETPOINT,salinityGoal:SALINITY_SETPOINT,khDoses:kd,otherDoses:od,khDoseWindowStart:khStart,khDoseWindowEnd:khEnd,otherDoseWindowStart:otherStart,otherDoseWindowEnd:otherEnd,testUncertainty:{kh:khU,ca:caU,mg:mgU}};
  if(scheduleChanged){state.events.push({ts,type:'scheduleChange',khDoses:kd,otherDoses:od,khStart,khEnd,otherStart,otherEnd,recordedAt:isoNow(),detail:`Reparto ${state.settings.maintenanceMethod==='xepta'?'H2Ocean confirmado':'guardado para futuro'} · KH ${kd} · Ca/Trazas ${od}`});if(state.settings.maintenanceMethod==='xepta')recordDose(ts,{kh:state.doses.kh,ca:state.doses.ca,trace:state.doses.trace},'schedule-physical-confirmed')}
  persist();updateUI();showToast('Configuración guardada');
}
$('#saveSettings')?.addEventListener('click',saveSettings);
function updateInventoryUI(){
  const defs=[['kh','capacityKh'],['ca','capacityCa'],['trace','capacityTrace']];for(const [p,cap] of defs){const s=stockFor(p,cap),pre=p;const set=(id,t)=>{const e=$(`#${id}`);if(e)e.textContent=t};set(`${pre}Remaining`,`${nf(s.remaining,0)} ml`);set(`${pre}Percent`,`${nf(s.pct,0)}%`);set(`${pre}Days`,Number.isFinite(s.days)?`${s.days} días`:'—');set(`${pre}DoseRemainingLine`,`${nf(s.remaining,0)} ml`);set(`${pre}DosePercentLine`,`${nf(s.pct,0)}% del bote`);set(`${pre}DoseDaysLine`,Number.isFinite(s.days)?`${s.days} días`:'—');const bar=$(`#${pre}Progress`);if(bar)bar.style.width=`${s.pct}%`;const fill=$(`#${pre}DoseFill`);if(fill)fill.style.width=`${s.pct}%`}
}
function saveInventory(){
  const vals={kh:num($('#khInvSetting').value),ca:num($('#caInvSetting').value),trace:num($('#traceInvSetting').value)};if(Object.values(vals).some(v=>!Number.isFinite(v)||v<0)){showToast('Revisa el inventario');return}const ts=isoNow();for(const p of ['kh','ca','trace']){state.inventory[p]=vals[p];state.inventory[`${p}SetAt`]=ts;const capKey=p==='kh'?'capacityKh':p==='ca'?'capacityCa':'capacityTrace';state.inventory[capKey]=Math.max(Number(state.inventory[capKey]||0),vals[p])}state.events.push({ts,type:'inventoryChange',recordedAt:isoNow(),detail:`Inventario Balling actualizado · KH ${nf(vals.kh,0)} ml · Ca ${nf(vals.ca,0)} ml · Trazas ${nf(vals.trace,0)} ml`});persist();updateUI();showToast('Inventario actualizado')
}
$('#saveInventory')?.addEventListener('click',saveInventory);

function ensureBackupControls(){
  const card=$('#aquariumProfileCard');if(!card||$('#exportBackupBtn'))return;const box=document.createElement('div');box.className='rmc-backup-actions';box.innerHTML='<button class="quick-btn secondary" id="exportBackupBtn" type="button">Exportar copia JSON</button><button class="quick-btn secondary" id="importBackupBtn" type="button">Importar copia JSON</button><input id="importBackupFile" type="file" accept="application/json,.json" hidden><div class="small">La copia incluye mediciones, eventos, correcciones, dosis, volumen y configuración del acuario activo.</div>';card.appendChild(box);$('#exportBackupBtn').addEventListener('click',exportBackup);$('#importBackupBtn').addEventListener('click',()=>$('#importBackupFile').click());$('#importBackupFile').addEventListener('change',importBackupFile);
}
function exportBackup(){const payload={app:'Reef Marine Control',version:APP_VERSION,exportedAt:isoNow(),aquarium:registry.find(x=>x.id===ACTIVE_ID),state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Reef_Marine_Control_${ACTIVE_ID}_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importBackupFile(ev){const file=ev.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const p=JSON.parse(reader.result);const incoming=p?.state||p;if(!incoming||!Array.isArray(incoming.measurements)||!Array.isArray(incoming.events))throw new Error('estructura no reconocida');if(!window.confirm('Esto sustituirá el estado del acuario activo por la copia seleccionada. ¿Continuar?'))return;state=incoming;normalizeState();persist();updateUI();showToast('Copia importada correctamente')}catch(err){showToast(`Copia no válida: ${err.message}`)}};reader.readAsText(file)}

/* ---------- Perfiles ---------- */
function renderProfiles(){const sel=$('#aquariumProfileSelect');if(!sel)return;sel.innerHTML=registry.map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('');sel.value=ACTIVE_ID}
$('#aquariumProfileSelect')?.addEventListener('change',e=>{const id=e.target.value;if(!registry.some(x=>x.id===id))return;localStorage.setItem(STORAGE_ACTIVE,id);location.reload()});
$('#createAquariumProfile')?.addEventListener('click',()=>{const name=window.prompt('Nombre del nuevo acuario:','Nuevo acuario');if(!name?.trim())return;const id=`aq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;registry.push({id,name:name.trim(),createdAt:isoNow()});saveRegistry(registry);localStorage.setItem(STORAGE_ACTIVE,id);localStorage.setItem(stateKey(id),JSON.stringify(defaultState()));location.reload()});

/* ---------- Alertas reales ---------- */
function computeAlerts(){
  const a=[...runtimeAlerts],ev=evaluateChemistry();if(!(Number(state.settings.volume)>0))a.push({level:'critical',text:'Volumen neto sin configurar: no se permiten cálculos de dosis/corrección.'});
  ev.rows.forEach(r=>{if(r.state==='low'||r.state==='high')a.push({level:r.key==='sal'||r.key==='kh'?'warning':'info',text:`${r.labelParam}: ${statusText(r)} (${r.value===null?'—':nf(r.value,r.decimals)} ${r.unit}; ${statusTargetText(r)}).`});if(r.state==='pending')a.push({level:'warning',text:`${r.labelParam}: pendiente de una medición real después de una intervención.`})});
  const pending=state.parameterCorrections.filter(c=>c.applied!==false&&pendingCorrectionFor(c.parameter)?.id===c.id);pending.forEach(c=>a.push({level:'warning',text:`Corrección de ${CORRECTION_RULES[c.parameter].label} aplicada: mide de nuevo antes de otra corrección${['kh','ca'].includes(c.parameter)&&state.settings.maintenanceMethod==='xepta'?' o de cambiar el programa Balling':''}.`}));
  if(state.settings.maintenanceMethod==='xepta'){
    const cur=currentProgram();if(!(sameDose(cur.kh,cur.ca)&&sameDose(cur.kh,cur.trace)))a.push({level:'critical',text:'El programa Balling registrado no está en relación 1:1:1.'});const r=estimateBalancedDose();if(r.warning)a.push({level:'info',text:r.warning});for(const [p,cap] of [['kh','capacityKh'],['ca','capacityCa'],['trace','capacityTrace']]){const s=stockFor(p,cap);if(s.pct<=10&&Number(state.inventory[p])>0)a.push({level:'warning',text:`Inventario ${p.toUpperCase()} bajo: ${nf(s.pct,0)}%.`})}
  }
  if(state.mathMeta.legacyManualUsesPresent)a.push({level:'info',text:'Existen intervenciones antiguas “manualUses” ambiguas. Se conservan por compatibilidad, pero v69 no las utiliza para decisiones automáticas.'});
  return a;
}
function ensureAlertModal(){let m=$('#rmcAlertsModal');if(m)return m;m=document.createElement('div');m.id='rmcAlertsModal';m.className='modal-backdrop';m.innerHTML='<div class="modal rmc-alert-modal"><div class="modal-head"><h2>Avisos del acuario</h2><button class="close-btn" id="closeAlertsBtn">×</button></div><div id="rmcAlertList" class="rmc-alert-list"></div></div>';document.body.appendChild(m);$('#closeAlertsBtn').addEventListener('click',()=>m.classList.remove('open'));m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});return m}
function showAlerts(){const m=ensureAlertModal(),a=computeAlerts(),list=$('#rmcAlertList');list.innerHTML=a.length?a.map(x=>`<div class="rmc-alert-item ${x.level}">${x.level==='critical'?'⛔':x.level==='warning'?'⚠️':'ℹ️'} <span>${escapeHtml(x.text)}</span></div>`).join(''):'<div class="rmc-alert-empty">✓ No hay avisos activos con los datos actuales.</div>';m.classList.add('open')}
$('#bellBtn')?.addEventListener('click',showAlerts);
function renderBell(){const n=computeAlerts().filter(x=>x.level!=='info').length,b=$('#bellBtn');if(!b)return;b.dataset.count=String(n);b.setAttribute('aria-label',n?`${n} avisos`:'Sin avisos críticos')}

/* ---------- Cancelación segura de un registro de corrección ---------- */
function cancelCorrection(id){const c=state.parameterCorrections.find(x=>x.id===id);if(!c||c.applied===false){showToast('El registro ya está anulado');return}const ok=window.confirm('Anula este registro SOLO si la dosis NO llegó a aplicarse físicamente o el registro es erróneo. Si el producto sí se añadió al acuario, NO lo anules porque el cálculo de consumo quedaría falseado. ¿Confirmas que el registro es erróneo/no aplicado?');if(!ok)return;c.applied=false;c.cancelledAt=isoNow();const e=state.events.find(x=>x.type==='parameterCorrection'&&x.correctionId===id);if(e)e.applied=false;state.events.push({ts:isoNow(),type:'correctionCancelled',correctionId:id,parameter:c.parameter,recordedAt:isoNow(),detail:`Registro de corrección anulado · ${CORRECTION_RULES[c.parameter].label} · declarado no aplicado/erróneo`});state.mathMeta.proposedPumpProgram=null;persist();updateUI();showToast('Registro de corrección anulado')}

/* ---------- Burbujas decorativas ligeras ---------- */
function addBubbles(){const root=$('.ocean-ambient');if(!root||root.dataset.v69)return;root.dataset.v69='1';for(let i=0;i<34;i++){const b=document.createElement('i');b.className=`bubble ${['nano','micro','tiny','mini','medium'][i%5]} ${['tint-turquoise','tint-green','tint-purple'][i%3]}`;b.style.left=`${3+(i*37)%94}%`;b.style.top=`${4+(i*53)%92}%`;b.style.setProperty('--dur',`${8+(i*17)%70/10}s`);b.style.setProperty('--drift',`${(i%2?1:-1)*(4+(i*11)%12)}px`);b.style.animationDelay=`-${(i*13)%9}s`;root.appendChild(b)}}

/* ---------- UI global ---------- */
function updateUI(){
  normalizeState();syncSettingsInputs();renderProfiles();ensureBackupControls();renderChemEvaluation();renderHome();renderDosing();renderHistory();renderBell();drawAllCharts();
}
window.updateUI=updateUI;

/* ---------- PWA ---------- */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service Worker',err)))}

/* ---------- API pública / pruebas deterministas ---------- */
window.RMC={
  version:APP_VERSION,get state(){return state},updateUI,switchView,openEventModal,closeEventModal,cancelCorrection,
  constants:{TARGETS,XEPTA_BALANCED_REEF_SALT_33,BALLING,CORRECTION_RULES,SALINITY_SETPOINT,KH_SETPOINT,PUMP},
  math:{calculateCorrection,correctionAmount,projectParamThroughWaterChanges,evaluateChemistry,buildConsumptionIntervals,robustConsumption,estimateBalancedDose,volumeAt,methodAt,pendingCorrectionFor},
  _test:{
    mix:(before,replacement,liters,volume)=>before*(1-liters/volume)+replacement*(liters/volume),
    replaceState:s=>{state=s;normalizeState();persist();updateUI()},defaultState
  }
};

/* Inicio */
addBubbles();setupMeasurementInputs();resetMeasurementForm();
/* Añade NO3/PO4 al agua nueva si el HTML procede de v68. */
(function ensureWaterNutrients(){const grid=$('.water-chemistry-grid');if(!grid||$('#eventWaterNo3'))return;const a=document.createElement('div');a.className='field';a.innerHTML='<label>NO₃ agua nueva (ppm)</label><input id="eventWaterNo3" inputmode="decimal" placeholder="Medido, opcional">';const b=document.createElement('div');b.className='field';b.innerHTML='<label>PO₄ agua nueva (ppm)</label><input id="eventWaterPo4" inputmode="decimal" placeholder="Medido, opcional">';grid.insertBefore(a,grid.lastElementChild);grid.insertBefore(b,grid.lastElementChild)})();
/* Botón de corrección disponible en ambos métodos. */
(function ensureCorrectionShortcut(){const card=$('.maintenance-method-card');if(!card||$('#alwaysCorrectionBtn'))return;const b=document.createElement('button');b.id='alwaysCorrectionBtn';b.type='button';b.className='quick-btn secondary';b.style.marginTop='10px';b.textContent='＋ Corrección puntual KH / Ca / Mg';b.addEventListener('click',()=>openEventModal('parameterCorrection'));card.appendChild(b)})();
updateUI();

})();
