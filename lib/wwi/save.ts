import { UNIT_IDS, type UnitId, type DoctrineId, type FactionId } from './data';
export const SAVE_KEY = 'wwi-field-command-v8';
export const SAVE_VERSION = 8;
export function permanentBonus(save: WWISave, id: UnitId): number {
  return (save.units[id].level + save.units[id].mark - 2) * 0.05;
}
export interface RunRecord {
  id: string;
  at: string;
  result: 'HELD' | 'LOST';
  waves: number;
  seconds: number;
  earned: number;
  spent: number;
  units: string[];
  orders: string[];
  commands: number;
  reason: string;
}
export interface WWISave {
  saveVersion: 8;
  faction: FactionId;
  doctrine: DoctrineId;
  loadout: UnitId[];
  supplies: number;
  parts: number;
  technology: number;
  units: Record<UnitId, { level: number; mark: number }>;
  cleared: string[];
  bestWave: number;
  receipts: string[];
  history: RunRecord[];
  settings: { sound: boolean };
}
export const newSave = (): WWISave => ({
  saveVersion: 8,
  faction: 'ENTENTE',
  doctrine: 'DEFENSE',
  loadout: ['MG', 'ARTILLERY', 'ENGINEER'],
  supplies: 0,
  parts: 0,
  technology: 0,
  units: {
    RIFLE: { level: 1, mark: 1 },
    MG: { level: 1, mark: 1 },
    ARTILLERY: { level: 1, mark: 1 },
    ENGINEER: { level: 1, mark: 1 },
  },
  cleared: [],
  bestWave: 0,
  receipts: [],
  history: [],
  settings: { sound: false },
});
export function validateSave(raw: unknown): WWISave {
  const s = raw as WWISave;
  if (
    !s ||
    s.saveVersion !== 8 ||
    !['ENTENTE', 'CENTRAL'].includes(s.faction) ||
    !['DEFENSE', 'ARTILLERY', 'LOGISTICS', 'ASSAULT'].includes(s.doctrine)
  )
    throw new Error('戰役存檔格式不符。原始資料已保留。');
  if (
    !Array.isArray(s.loadout) ||
    s.loadout.length !== 3 ||
    new Set(s.loadout).size !== 3 ||
    s.loadout.some((id) => !UNIT_IDS.includes(id))
  )
    throw new Error('編制資料不完整。');
  for (const value of [s.supplies, s.parts, s.technology, s.bestWave])
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('軍需資料無效。');
  for (const id of UNIT_IDS)
    if (
      !s.units?.[id] ||
      !Number.isInteger(s.units[id].level) ||
      s.units[id].level < 1 ||
      s.units[id].level > 5 ||
      !Number.isInteger(s.units[id].mark) ||
      s.units[id].mark < 1 ||
      s.units[id].mark > 3
    )
      throw new Error('兵種存檔無效。');
  if (
    !Array.isArray(s.receipts) ||
    !s.receipts.every((x) => typeof x === 'string') ||
    !Array.isArray(s.cleared) ||
    !Array.isArray(s.history) ||
    !s.history.every(
      (r) =>
        r &&
        typeof r.id === 'string' &&
        ['HELD', 'LOST'].includes(r.result) &&
        Array.isArray(r.units) &&
        Array.isArray(r.orders) &&
        typeof r.seconds === 'number',
    ) ||
    typeof s.settings?.sound !== 'boolean' ||
    s.bestWave > 25
  )
    throw new Error('戰役紀錄無效。');
  return s;
}
export function loadSave(): WWISave {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? validateSave(JSON.parse(raw)) : newSave();
}
export function writeSave(s: WWISave): WWISave {
  validateSave(s);
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  return s;
}
export function settleRun(save: WWISave, run: RunRecord): WWISave {
  if (save.receipts.includes(run.id)) return save;
  const ratio =
    run.result === 'HELD'
      ? 1
      : run.waves >= 20
        ? 0.7
        : run.waves >= 15
          ? 0.5
          : run.waves >= 10
            ? 0.35
            : run.waves >= 5
              ? 0.2
              : 0;
  const first =
    run.result === 'HELD' && !save.cleared.includes('VERDUN_1916_FR');
  return {
    ...save,
    supplies: save.supplies + Math.floor(100 * ratio) + (first ? 80 : 0),
    parts: save.parts + Math.floor(20 * ratio) + (first ? 20 : 0),
    technology:
      save.technology + (run.result === 'HELD' ? 5 : 0) + (first ? 5 : 0),
    bestWave: Math.max(save.bestWave, run.waves),
    cleared: run.result === 'HELD' ? ['VERDUN_1916_FR'] : save.cleared,
    receipts: [...save.receipts, run.id],
    history: [run, ...save.history].slice(0, 30),
  };
}
export function quickResolve(save: WWISave): WWISave {
  if (!save.cleared.includes('VERDUN_1916_FR'))
    throw new Error('必須先完整守住凡爾登戰區。');
  return {
    ...save,
    supplies: save.supplies + 100,
    parts: save.parts + 20,
    technology: save.technology + 5,
  };
}
export function trainUnit(
  save: WWISave,
  id: UnitId,
  kind: 'level' | 'mark',
): WWISave {
  const current = save.units[id],
    cap = kind === 'level' ? 5 : 3;
  if (current[kind] >= cap) throw new Error('已完成此項訓練。');
  const supplies = kind === 'level' ? current.level * 60 : current.mark * 100,
    parts = kind === 'level' ? current.level * 5 : current.mark * 15;
  const technology = kind === 'mark' ? current.mark * 5 : 0;
  if (
    save.supplies < supplies ||
    save.parts < parts ||
    save.technology < technology
  )
    throw new Error(
      `需要 ${supplies} 軍需物資、${parts} 零件、${technology} 技術點。`,
    );
  return {
    ...save,
    supplies: save.supplies - supplies,
    parts: save.parts - parts,
    technology: save.technology - technology,
    units: { ...save.units, [id]: { ...current, [kind]: current[kind] + 1 } },
  };
}
