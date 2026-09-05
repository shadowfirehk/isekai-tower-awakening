import type { BattleSnapshot } from './battle-engine';
import { BATTLE_BLESSINGS } from './battle-depth';
import { TOWER_CATALOG } from './towers';

export interface RunRecord {
  id:string; at:string; dungeon:string; result:string; wave:number; hint:string;
  metrics:BattleSnapshot['metrics']; blessings:BattleSnapshot['activeBlessings']; synergies:string[];
}
const KEY='rng-isekai-tower-run-history-v78';
export function readRunHistory():RunRecord[] {
  try {const data=JSON.parse(localStorage.getItem(KEY)??'[]'); return Array.isArray(data)?data.filter(r=>r&&typeof r.id==='string'&&r.metrics?.towerUsage).slice(0,30):[];} catch {return [];}
}
export function recordRun(id:string,snapshot:BattleSnapshot) {
  try {
    const history=readRunHistory();
    if(history.some(r=>r.id===id)) return;
    const record:RunRecord={id,at:new Date().toISOString(),dungeon:snapshot.dungeon.id,result:snapshot.state,wave:snapshot.wave,hint:snapshot.defeatHint,metrics:snapshot.metrics,blessings:snapshot.activeBlessings,synergies:snapshot.metrics.synergyActivations};
    localStorage.setItem(KEY,JSON.stringify([record,...history].slice(0,30)));
  } catch { /* Optional experiment history never blocks rewards. */ }
}
export function balanceWarnings(runs:RunRecord[]) {
  if(runs.length<5) return ['至少累積 5 場紀錄後顯示使用率分析。'];
  const wins=runs.filter(r=>r.result==='VICTORY'), warnings:string[]=[];
  for(const [id,data] of Object.entries(TOWER_CATALOG)) {
    const uses=runs.filter(r=>r.metrics.towerUsage[id as keyof typeof TOWER_CATALOG]).length;
    if(!uses) warnings.push(`尚未試用：${data.name}`);
    if(wins.length>=5 && wins.filter(r=>r.metrics.towerUsage[id as keyof typeof TOWER_CATALOG]).length/wins.length>0.8) warnings.push(`勝局使用率超過 80%：${data.name}（僅提示，未自動調弱）`);
  }
  for(const blessing of BATTLE_BLESSINGS)
    if(runs.filter(r=>r.blessings.some(b=>b.blessingID===blessing.blessingID)).length/runs.length>0.8) warnings.push(`祝福選擇集中：${blessing.displayName}`);
  const branchCounts = new Map<string, number>();
  for (const run of runs) for (const id of run.metrics.branchSelections)
    branchCounts.set(id, (branchCounts.get(id) ?? 0) + 1);
  if (branchCounts.size) {
    const least = [...branchCounts.entries()].sort((a,b)=>a[1]-b[1])[0];
    if (least && least[1] <= Math.max(1, runs.length * 0.1)) warnings.push(`分支幾乎未選：${least[0]}（${least[1]} 場）`);
  }
  const synergies=[...new Set(wins.flatMap(r=>r.synergies))];
  for(const id of synergies) if(wins.length>=5&&wins.filter(r=>r.synergies.includes(id)).length/wins.length>0.8) warnings.push(`勝局協同集中：${id}`);
  return warnings;
}
