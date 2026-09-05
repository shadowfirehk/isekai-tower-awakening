import type { MapTopology } from './battle-depth';
import type { BattlePoint } from './battle-readability';

export const SLOT_LAYOUTS: Record<MapTopology, BattlePoint[]> = {
  WINDING: [{x:18,y:59},{x:30,y:82},{x:43,y:48},{x:58,y:43},{x:72,y:48},{x:84,y:57},{x:54,y:76}],
  MERGE: [{x:18,y:20},{x:18,y:82},{x:38,y:53},{x:54,y:38},{x:69,y:64},{x:84,y:40},{x:66,y:25}],
  PARALLEL: [{x:18,y:23},{x:18,y:77},{x:40,y:23},{x:40,y:77},{x:66,y:40},{x:82,y:58},{x:60,y:78}],
  CORE_SIEGE: [{x:28,y:37},{x:28,y:63},{x:48,y:28},{x:48,y:72},{x:68,y:35},{x:68,y:65},{x:62,y:50}],
};
export function pointDistance(a: BattlePoint, b: BattlePoint) {
  return Math.hypot(a.x-b.x, a.y-b.y);
}
export const towerRangeRadius = (range: number) => Math.min(48, range * 3.5);
export function onShotLine(origin: BattlePoint, target: BattlePoint, candidate: BattlePoint, width = 7) {
  const dx = target.x-origin.x, dy = target.y-origin.y, length = Math.hypot(dx,dy);
  if (length < 0.01) return pointDistance(target,candidate) < width;
  const along = ((candidate.x-origin.x)*dx + (candidate.y-origin.y)*dy)/length;
  const across = Math.abs((candidate.x-origin.x)*dy-(candidate.y-origin.y)*dx)/length;
  return along >= 0 && across <= width;
}
