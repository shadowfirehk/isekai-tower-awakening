import { FinalTowerStats, TargetingMode } from './types';

export interface TargetableEnemy {
  runtimeId: number;
  progress: number;
  hp: number;
  maxHP: number;
  state: 'ALIVE' | 'DYING' | 'DEAD';
}

export function selectTarget<T extends TargetableEnemy>(enemies: T[], towerProgress: number, range: number, mode: TargetingMode): T | null {
  const candidates = enemies.filter(enemy => enemy.state === 'ALIVE' && Math.abs(enemy.progress - towerProgress) <= range / 20);
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    if (mode === 'FIRST') return b.progress - a.progress;
    if (mode === 'LAST') return a.progress - b.progress;
    if (mode === 'NEAREST') return Math.abs(a.progress - towerProgress) - Math.abs(b.progress - towerProgress);
    if (mode === 'FARTHEST') return Math.abs(b.progress - towerProgress) - Math.abs(a.progress - towerProgress);
    if (mode === 'STRONGEST') return b.hp - a.hp;
    return a.hp - b.hp;
  });
  return sorted[0] ?? null;
}

export interface DamageSnapshot {
  attack: number;
  critChance: number;
  critDamage: number;
  accuracy: number;
  penetration: number;
}

export function makeDamageSnapshot(stats: FinalTowerStats): DamageSnapshot {
  return {
    attack: stats.attack,
    critChance: stats.critChance,
    critDamage: stats.critDamage,
    accuracy: stats.accuracy,
    penetration: stats.penetration,
  };
}

export function resolveDamage(snapshot: DamageSnapshot, defense: number, random = Math.random) {
  if (random() > snapshot.accuracy) return { damage: 0, critical: false, missed: true };
  const effectiveDefense = Math.max(0, defense - snapshot.penetration);
  const critical = random() < snapshot.critChance;
  const raw = snapshot.attack * (critical ? snapshot.critDamage : 1);
  return { damage: raw * (100 / (100 + effectiveDefense)), critical, missed: false };
}
