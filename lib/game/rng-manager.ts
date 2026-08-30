import { CAREER_CATALOG } from './careers';
import { CareerId, PlayerSave, RealmType, RngPool } from './types';

export const RNG_POOLS: Record<RealmType, RngPool> = {
  [RealmType.Earth]: {
    realm: RealmType.Earth,
    entries: [{ careerId: 'EARTH_WALL_GUARDIAN', weight: 100, enabled: true }],
  },
  [RealmType.Galaxy]: {
    realm: RealmType.Galaxy,
    entries: [{ careerId: 'GALAXY_STARBURST_HUNTER', weight: 100, enabled: false }],
  },
  [RealmType.Universe]: {
    realm: RealmType.Universe,
    entries: [{ careerId: 'UNIVERSE_CHAOS_LAW_MASTER', weight: 100, enabled: false }],
  },
};

type RollResult = { ok: true; careerId: CareerId } | { ok: false; error: string };

function rngAlreadyUsed(realm: RealmType, save: PlayerSave): boolean {
  if (realm === RealmType.Earth) return save.earthCareerRngUsed;
  if (realm === RealmType.Galaxy) return save.galaxyCareerRngUsed;
  return save.universeCareerRngUsed;
}

export const RNGManager = {
  rollCareer(realm: RealmType, save: PlayerSave, random = Math.random): RollResult {
    if (!Object.values(RealmType).includes(realm)) return { ok: false, error: '無效的職業領域。' };
    if (rngAlreadyUsed(realm, save)) return { ok: false, error: `${realm} 職業覺醒已永久使用。` };
    const pool = RNG_POOLS[realm];
    const entries = pool.entries.filter(entry => entry.enabled && entry.weight > 0 && CAREER_CATALOG[entry.careerId]?.enabled);
    if (!entries.length) return { ok: false, error: `${realm} 職業池目前沒有可用項目。` };
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.min(Math.max(random(), 0), 0.999999) * totalWeight;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) return { ok: true, careerId: entry.careerId };
    }
    return { ok: true, careerId: entries[entries.length - 1].careerId };
  },
};
