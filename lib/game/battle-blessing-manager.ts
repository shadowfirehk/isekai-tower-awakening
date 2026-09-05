import {
  ActiveBattleBlessing,
  BATTLE_BLESSINGS,
  BattleBlessingData,
  BuildTag,
  TOWER_AFFINITIES,
} from './battle-depth';
import { TowerId, CareerId, EnemyId } from './types';
import { GOLDEN_BLESSING_IDS } from './battle-depth';

function nextRandom(seed: number) {
  let value = seed | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return { seed: value >>> 0, value: (value >>> 0) / 4294967296 };
}
function chooseWeighted<T>(
  items: T[],
  seed: number,
  weight: (item: T) => number,
) {
  const random = nextRandom(seed),
    total = items.reduce((sum, item) => sum + weight(item), 0);
  let cursor = random.value * Math.max(1, total);
  for (const item of items) {
    cursor -= weight(item);
    if (cursor <= 0) return { item, seed: random.seed };
  }
  return { item: items[items.length - 1], seed: random.seed };
}

export interface BlessingOffer {
  options: BattleBlessingData[];
  seed: number;
}
export const BattleBlessingManager = {
  offer(
    seed: number,
    loadout: TowerId[],
    deployed: TowerId[],
    active: ActiveBattleBlessing[],
    activeSynergyTags: BuildTag[] = [],
    context: {career?:CareerId|null;enemyTypes?:EnemyId[];benchmark?:boolean} = {},
  ): BlessingOffer {
    const affinity = new Set<BuildTag>([
      'GENERAL',
      'OVERDRIVE',
      ...loadout.flatMap((id) => TOWER_AFFINITIES[id]),
      ...deployed.flatMap((id) => TOWER_AFFINITIES[id]),
      ...activeSynergyTags,
      ...(context.career === 'EARTH_WALL_GUARDIAN' ? ['DEFENSE' as const] : []),
      ...(context.enemyTypes?.some(id => ['EARTH_TANK','EARTH_SHIELDED'].includes(id)) ? ['ARMOR_BREAK' as const] : []),
    ]);
    const stacks = new Map(
      active.map((item) => [item.blessingID, item.stacks]),
    );
    const valid = BATTLE_BLESSINGS.filter(
      (item) => (stacks.get(item.blessingID) ?? 0) < item.maxStacks &&
        (!context.benchmark || GOLDEN_BLESSING_IDS.includes(item.blessingID)),
    );
    const picked: BattleBlessingData[] = [];
    let cursor = seed || 0x7f4a7c15;
    const take = (pool: BattleBlessingData[], bonus = 1) => {
      const available = pool.filter(
        (item) => !picked.some((p) => p.blessingID === item.blessingID),
      );
      if (!available.length) return;
      const draw = chooseWeighted(available, cursor, (item) => {
        const matches = deployed.reduce((n,id)=>n + (item.tags.some(tag=>TOWER_AFFINITIES[id].includes(tag)) ? 1 : 0),0);
        const relevance = (item.tags.some((tag) => affinity.has(tag)) ? 3 : 0.6) + Math.min(4,matches);
        const evolution = stacks.has(item.blessingID) ? 2.2 : 1;
        return (
          relevance *
          evolution *
          bonus *
          (item.rarity === 'EPIC' ? 0.72 : item.rarity === 'RARE' ? 1 : 1.15)
        );
      });
      picked.push(draw.item);
      cursor = draw.seed;
    };
    take(
      valid.filter(
        (item) =>
          item.classification === 'BUILD_SUPPORT' &&
          item.tags.some((tag) => affinity.has(tag)),
      ),
      1.5,
    );
    take(valid.filter((item) => item.classification === 'GENERAL_POWER'));
    take(valid.filter((item) => item.classification === 'TRANSFORMER'));
    while (picked.length < Math.min(3,valid.length)) take(valid);
    return { options: picked.slice(0, 3), seed: cursor };
  },
  select(active: ActiveBattleBlessing[], blessingID: string) {
    const data = BATTLE_BLESSINGS.find(
      (item) => item.blessingID === blessingID,
    );
    if (!data) return { ok: false as const, error: '祝福資料不存在。' };
    const current = active.find((item) => item.blessingID === blessingID);
    if (current && current.stacks >= data.maxStacks)
      return { ok: false as const, error: '此祝福已達最高進化。' };
    return {
      ok: true as const,
      active: current
        ? active.map((item) =>
            item.blessingID === blessingID
              ? { ...item, stacks: item.stacks + 1 }
              : item,
          )
        : [...active, { blessingID, stacks: 1 }],
    };
  },
  getData(blessingID: string) {
    return (
      BATTLE_BLESSINGS.find((item) => item.blessingID === blessingID) ?? null
    );
  },
  displayName(active: ActiveBattleBlessing) {
    const data = this.getData(active.blessingID);
    return (
      data?.evolutionNames?.[active.stacks - 1] ??
      `${data?.displayName ?? active.blessingID}${active.stacks > 1 ? ` ×${active.stacks}` : ''}`
    );
  },
};
