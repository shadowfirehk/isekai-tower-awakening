import { EarthTierId, MaterialId, TowerId, EARTH_TIER_IDS } from './types';

export interface EarthTierConfig {
  id: EarthTierId;
  order: number;
  name: string;
  englishName: string;
  dungeonName: string;
  bossName: string;
  bossTrait: string;
  hpMultiplier: number;
  defenseMultiplier: number;
  speedMultiplier: number;
  recommendedPower: number;
  deploymentCap: number;
  materialID: MaterialId;
  standardReward: number;
  towerReward: TowerId | null;
}

const NAMES: Record<EarthTierId, [string, string]> = {
  NORMAL: ['普通', 'NORMAL'], RARE: ['罕見', 'RARE'], SCARCE: ['稀有', 'SCARCE'], EPIC: ['史詩', 'EPIC'],
  LEGENDARY: ['傳說', 'LEGENDARY'], MYTHIC: ['神話', 'MYTHIC'], SECRET: ['秘密', 'SECRET'], KING: ['王', 'KING'],
  EMPEROR: ['皇', 'EMPEROR'], VENERABLE: ['尊', 'VENERABLE'], SAINT: ['聖', 'SAINT'], SOVEREIGN: ['帝', 'SOVEREIGN'],
};
const HP = [1, 1.8, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
const DEF = [1, 1.15, 1.3, 1.5, 1.75, 2, 2.3, 2.65, 3.05, 3.5, 4, 4.6];
const SPEED = [1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.12, 1.14, 1.16, 1.18, 1.2, 1.22];
const REWARDS = [50, 60, 70, 80, 90, 100, 110, 125, 140, 160, 180, 200];
const BOSSES = ['裂界巨獸', '疾界獵獸', '紫晶破城獸', '界障巨像', '不滅裂獸', '神墮巨獸', '無相裂界者', '裂界王獸', '赤皇殲界獸', '至尊界靈', '墮聖界使', '帝界終焉獸'];
const TRAITS = ['重甲', '高速突進', '菁英狂化', '爆裂護盾', '雷霆再生', '雙階段裁決', '秘影支援', '王權護盾', '皇威三階段', '至尊再生', '聖域庇護', '帝境四相'];
const MATERIALS: MaterialId[] = EARTH_TIER_IDS.map(id => `EARTH_${id}_MATERIAL` as MaterialId);
const NEXT_TOWERS: Array<TowerId | null> = [
  'EARTH_RAPID_FIRE_TURRET', 'EARTH_ARMOR_PIERCING_TURRET', 'EARTH_BLAST_TURRET', 'EARTH_THUNDER_TURRET',
  'EARTH_DIVINE_JUDGMENT_TURRET', 'EARTH_PHANTOM_TURRET', 'EARTH_KING_AUTHORITY_TURRET', 'EARTH_EMPEROR_ANNIHILATION_TURRET',
  'EARTH_VENERABLE_TURRET', 'EARTH_SAINT_DOMAIN_TURRET', 'EARTH_SOVEREIGN_END_TURRET', null,
];

export const EARTH_TIER_CONFIGS = Object.fromEntries(EARTH_TIER_IDS.map((id, order) => [id, {
  id, order, name: NAMES[id][0], englishName: NAMES[id][1], dungeonName: `${NAMES[id][0]}階地脈試煉`,
  bossName: BOSSES[order], bossTrait: TRAITS[order], hpMultiplier: HP[order], defenseMultiplier: DEF[order],
  speedMultiplier: SPEED[order], recommendedPower: Math.round(120 * HP[order]),
  deploymentCap: order <= 3 ? 4 : order <= 6 ? 5 : 6, materialID: MATERIALS[order],
  standardReward: REWARDS[order], towerReward: NEXT_TOWERS[order],
}])) as Record<EarthTierId, EarthTierConfig>;

export function getEarthTier(id: EarthTierId) { return EARTH_TIER_CONFIGS[id]; }
export function getNextEarthTier(id: EarthTierId): EarthTierId | null { return EARTH_TIER_IDS[EARTH_TIER_CONFIGS[id].order + 1] ?? null; }
export function getPreviousEarthTier(id: EarthTierId): EarthTierId | null { return EARTH_TIER_IDS[EARTH_TIER_CONFIGS[id].order - 1] ?? null; }
