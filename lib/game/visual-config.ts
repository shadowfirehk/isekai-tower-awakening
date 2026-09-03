import { publicAssetPath } from './asset-path';
import { EarthTierId, EnemyId, EARTH_TIER_IDS, TowerId } from './types';

export interface TierVisualStyle {
  tier: EarthTierId;
  accent: string;
  accentSoft: string;
  frameMaterial: string;
  glow: string;
  particles: string;
  badgeStyle: string;
  revealVFXID: string;
}
const COLORS = [
  ['#73dfff', '#153c50'],
  ['#5dffe4', '#104c4b'],
  ['#b78cff', '#3b2454'],
  ['#e16cff', '#521d59'],
  ['#ffcf62', '#55351c'],
  ['#ff6c68', '#5b1c27'],
  ['#a879ff', '#2d174e'],
  ['#5da0ff', '#172e65'],
  ['#ff584c', '#631a1c'],
  ['#efe6ff', '#4b3864'],
  ['#d7ffff', '#285e69'],
  ['#f7df87', '#28252c'],
];
export const TIER_VISUAL_STYLES = Object.fromEntries(
  EARTH_TIER_IDS.map((tier, index) => [
    tier,
    {
      tier,
      accent: COLORS[index][0],
      accentSoft: COLORS[index][1],
      frameMaterial:
        index < 3
          ? 'RIFT_ALLOY'
          : index < 7
            ? 'ARCANE_CRYSTAL'
            : index < 9
              ? 'ROYAL_GOLD'
              : index < 11
                ? 'ASCENDANT_GLASS'
                : 'VOID_GOLD',
      glow: index < 4 ? 'SOFT' : index < 9 ? 'BLOOM' : 'CELESTIAL',
      particles:
        index < 3
          ? 'SPARK'
          : index < 7
            ? 'SHARD'
            : index < 10
              ? 'RUNE'
              : 'ORBIT',
      badgeStyle: index >= 11 ? 'SOVEREIGN' : index >= 7 ? 'ROYAL' : 'ANGULAR',
      revealVFXID: `VFX_TIER_${tier}_REVEAL`,
    },
  ]),
) as Record<EarthTierId, TierVisualStyle>;

export type EnemyRole =
  | 'NORMAL'
  | 'FAST'
  | 'ARMORED'
  | 'ELITE'
  | 'SHIELDED'
  | 'REGENERATING'
  | 'SUPPORT'
  | 'BOSS';
export interface EnemyVisualProfile {
  id: string;
  enemyId: EnemyId;
  role: EnemyRole;
  atlasIndex: number;
  movementAnimation: string;
  hitVFX: string;
  deathVFX: string;
  spawnVFX: string;
  baseReachVFX: string;
  visualScale: number;
  visualFamily: 'RIFTBORN';
  silhouette: string;
  coreGlow: string;
}
export const ENEMY_VISUAL_PROFILES: Record<EnemyId, EnemyVisualProfile> = {
  EARTH_GRUNT: {
    id: 'VIS_RIFTBORN_GRUNT',
    enemyId: 'EARTH_GRUNT',
    role: 'NORMAL',
    atlasIndex: 0,
    movementAnimation: 'AGGRESSIVE_RUN',
    hitVFX: 'CORE_FLASH',
    deathVFX: 'RIFT_DISSOLVE',
    spawnVFX: 'RIFT_CRACK',
    baseReachVFX: 'CLAW_SLASH',
    visualScale: 1,
    visualFamily: 'RIFTBORN',
    silhouette: 'BALANCED_BIPED',
    coreGlow: 'CYAN',
  },
  EARTH_RUNNER: {
    id: 'VIS_RIFTBORN_RUNNER',
    enemyId: 'EARTH_RUNNER',
    role: 'FAST',
    atlasIndex: 1,
    movementAnimation: 'QUADRUPED_DASH',
    hitVFX: 'CORE_FLASH_FAST',
    deathVFX: 'SLIDE_DISSOLVE',
    spawnVFX: 'RIFT_CRACK',
    baseReachVFX: 'ENERGY_LEAP',
    visualScale: 0.9,
    visualFamily: 'RIFTBORN',
    silhouette: 'THIN_TRIANGLE',
    coreGlow: 'CYAN',
  },
  EARTH_TANK: {
    id: 'VIS_RIFTBORN_TANK',
    enemyId: 'EARTH_TANK',
    role: 'ARMORED',
    atlasIndex: 2,
    movementAnimation: 'HEAVY_WALK',
    hitVFX: 'ARMOR_SPARK',
    deathVFX: 'HEAVY_COLLAPSE',
    spawnVFX: 'RIFT_CRACK_HEAVY',
    baseReachVFX: 'HEAVY_SMASH',
    visualScale: 1.55,
    visualFamily: 'RIFTBORN',
    silhouette: 'WIDE_BLOCK',
    coreGlow: 'VIOLET',
  },
  EARTH_SHIELDED: {
    id: 'VIS_RIFTBORN_SHIELD',
    enemyId: 'EARTH_SHIELDED',
    role: 'SHIELDED',
    atlasIndex: 3,
    movementAnimation: 'CONTROLLED_MARCH',
    hitVFX: 'SHIELD_IMPACT',
    deathVFX: 'BARRIER_SHATTER',
    spawnVFX: 'RIFT_CRACK_HEX',
    baseReachVFX: 'SHIELD_RAM',
    visualScale: 1.25,
    visualFamily: 'RIFTBORN',
    silhouette: 'SYMMETRIC_SHELL',
    coreGlow: 'WHITE_BLUE',
  },
  EARTH_REGENERATOR: {
    id: 'VIS_RIFTBORN_REGEN',
    enemyId: 'EARTH_REGENERATOR',
    role: 'REGENERATING',
    atlasIndex: 4,
    movementAnimation: 'ORGANIC_CRAWL',
    hitVFX: 'TISSUE_FLASH',
    deathVFX: 'ORGANIC_DISINTEGRATE',
    spawnVFX: 'BIO_RIFT',
    baseReachVFX: 'TENDRIL_STRIKE',
    visualScale: 1.2,
    visualFamily: 'RIFTBORN',
    silhouette: 'TENDRIL_BODY',
    coreGlow: 'GREEN_GOLD',
  },
  EARTH_SUPPORT: {
    id: 'VIS_RIFTBORN_SUPPORT',
    enemyId: 'EARTH_SUPPORT',
    role: 'SUPPORT',
    atlasIndex: 5,
    movementAnimation: 'HOVER',
    hitVFX: 'RING_FLASH',
    deathVFX: 'RING_EXPLOSION',
    spawnVFX: 'ORBITAL_RIFT',
    baseReachVFX: 'SUPPORT_PULSE',
    visualScale: 1.05,
    visualFamily: 'RIFTBORN',
    silhouette: 'ORBITAL_SMALL',
    coreGlow: 'VIOLET',
  },
  EARTH_ELITE: {
    id: 'VIS_RIFTBORN_ELITE',
    enemyId: 'EARTH_ELITE',
    role: 'ELITE',
    atlasIndex: 6,
    movementAnimation: 'ELITE_CHARGE',
    hitVFX: 'ELITE_CORE_FLASH',
    deathVFX: 'ELITE_SHARD_BURST',
    spawnVFX: 'ELITE_RIFT',
    baseReachVFX: 'ELITE_IMPACT',
    visualScale: 1.35,
    visualFamily: 'RIFTBORN',
    silhouette: 'HORNED_HALO',
    coreGlow: 'GOLD',
  },
  EARTH_BOSS: {
    id: 'VIS_RIFTBORN_BOSS',
    enemyId: 'EARTH_BOSS',
    role: 'BOSS',
    atlasIndex: 8,
    movementAnimation: 'DELIBERATE_FLOAT',
    hitVFX: 'BOSS_CORE_FLASH',
    deathVFX: 'BOSS_DIMENSIONAL_COLLAPSE',
    spawnVFX: 'BOSS_RIFT',
    baseReachVFX: 'BOSS_IMPACT',
    visualScale: 3,
    visualFamily: 'RIFTBORN',
    silhouette: 'MAJOR_THREAT',
    coreGlow: 'TIER',
  },
};

export interface BossVisualProfile {
  tier: EarthTierId;
  name: string;
  atlasIndex: number;
  hpFrameStyle: string;
  mechanics: EnemyRole[];
  phaseVisuals: string[];
  warningVFX: string;
  spawnVFX: string;
  deathVFX: string;
}
const BOSS_NAMES = [
  '裂界巨獸',
  '疾界獵獸',
  '紫晶破城獸',
  '界障巨像',
  '不滅裂獸',
  '神墮巨獸',
  '無相裂界者',
  '裂界王獸',
  '赤皇殲界獸',
  '至尊界靈',
  '墮聖界使',
  '帝界終焉獸',
];
export const BOSS_VISUAL_PROFILES = Object.fromEntries(
  EARTH_TIER_IDS.map((tier, index) => [
    tier,
    {
      tier,
      name: BOSS_NAMES[index],
      atlasIndex: 8 + index,
      hpFrameStyle:
        index === 11
          ? 'VOID_GOLD_ORBITAL'
          : index >= 7
            ? 'ROYAL_TIER'
            : 'STANDARD_TIER',
      mechanics:
        index === 0
          ? ['ARMORED']
          : index === 1
            ? ['FAST']
            : index === 2
              ? ['ELITE', 'ARMORED']
              : index === 3
                ? ['SHIELDED']
                : index === 4
                  ? ['REGENERATING']
                  : index === 5
                    ? ['SHIELDED', 'ELITE']
                    : index === 6
                      ? ['SUPPORT']
                      : index >= 9
                        ? ['ELITE', 'SHIELDED', 'REGENERATING']
                        : ['ELITE', 'ARMORED'],
      phaseVisuals:
        index === 11
          ? ['SHELL_CLOSED', 'VOID_REVEAL', 'ORBIT_OPEN']
          : index >= 5
            ? ['BASE', 'AWAKENED']
            : ['BASE'],
      warningVFX: `VFX_BOSS_WARNING_${tier}`,
      spawnVFX: `VFX_RIFT_SPAWN_${tier}`,
      deathVFX:
        index === 11 ? 'VFX_SOVEREIGN_DISSOLUTION' : 'VFX_BOSS_DISSOLVE',
    },
  ]),
) as Record<EarthTierId, BossVisualProfile>;
export function tierStyleVars(tier: EarthTierId) {
  const style = TIER_VISUAL_STYLES[tier];
  return {
    '--tier-accent': style.accent,
    '--tier-soft': style.accentSoft,
  } as React.CSSProperties;
}

export type BattleEnvironmentFamily =
  | 'EARTH_DEFENSE_CITY'
  | 'CRYSTAL_CORRUPTION'
  | 'RIFT_DOMINION'
  | 'TRANSCENDENT_EARTH';

export interface BattleEnvironmentProfile {
  environmentID: string;
  family: BattleEnvironmentFamily;
  displayName: string;
  background: string;
  backgroundPosition: string;
  midground: string;
  foreground: string;
  pathVisual: string;
  deploymentSlotStyle: string;
  spawnPortalStyle: string;
  baseVisual: string;
  ambientVFX: string;
  bossAtmosphereProfile: string;
  musicID: string;
  lightingProfile: string;
}

const ENVIRONMENT_ATLAS = publicAssetPath(
  '/assets/earth-battle-environment-atlas-v1.webp',
);
export const BATTLE_ENVIRONMENT_PROFILES: Record<
  BattleEnvironmentFamily,
  BattleEnvironmentProfile
> = {
  EARTH_DEFENSE_CITY: {
    environmentID: 'ENV_EARTH_DEFENSE_CITY',
    family: 'EARTH_DEFENSE_CITY',
    displayName: '地球防衛都市',
    background: ENVIRONMENT_ATLAS,
    backgroundPosition: '0% 0%',
    midground: 'COASTAL_CITY_DEFENSE',
    foreground: 'ELEVATED_DEFENSE_ROAD',
    pathVisual: 'CYAN_DEFENSE_CORRIDOR',
    deploymentSlotStyle: 'HOLO_HEX_CYAN',
    spawnPortalStyle: 'BLUE_RIFT_GATE',
    baseVisual: 'EARTH_CORE_CITADEL',
    ambientVFX: 'CITY_RIFT_SPARKS',
    bossAtmosphereProfile: 'SKY_RIFT_SURGE',
    musicID: 'BGM_EARTH_DEFENSE',
    lightingProfile: 'DAYLIGHT_CYAN_RIM',
  },
  CRYSTAL_CORRUPTION: {
    environmentID: 'ENV_CRYSTAL_CORRUPTION',
    family: 'CRYSTAL_CORRUPTION',
    displayName: '晶化侵蝕區',
    background: ENVIRONMENT_ATLAS,
    backgroundPosition: '100% 0%',
    midground: 'CRYSTAL_RESEARCH_RUINS',
    foreground: 'FRACTURED_INDUSTRIAL_ROAD',
    pathVisual: 'MAGENTA_CORRUPTED_LANE',
    deploymentSlotStyle: 'ARCANE_HEX_VIOLET',
    spawnPortalStyle: 'CRYSTAL_ROOT_RIFT',
    baseVisual: 'RESEARCH_BARRIER_CORE',
    ambientVFX: 'FLOATING_SHARDS_FOG',
    bossAtmosphereProfile: 'CRYSTAL_STORM',
    musicID: 'BGM_CRYSTAL_CORRUPTION',
    lightingProfile: 'VIOLET_FOG_RIM',
  },
  RIFT_DOMINION: {
    environmentID: 'ENV_RIFT_DOMINION',
    family: 'RIFT_DOMINION',
    displayName: '裂界支配領',
    background: ENVIRONMENT_ATLAS,
    backgroundPosition: '0% 100%',
    midground: 'ROYAL_FLOATING_ARCHITECTURE',
    foreground: 'IMPOSSIBLE_GEOMETRY_BRIDGE',
    pathVisual: 'ROYAL_ENERGY_CAUSEWAY',
    deploymentSlotStyle: 'ROYAL_GOLD_NODE',
    spawnPortalStyle: 'DOMINION_GATE',
    baseVisual: 'RIFT_RESISTANCE_NEXUS',
    ambientVFX: 'ORBITAL_RUNES_DEBRIS',
    bossAtmosphereProfile: 'DOMINION_SKY_LOCK',
    musicID: 'BGM_RIFT_DOMINION',
    lightingProfile: 'ROYAL_BLUE_GOLD_RIM',
  },
  TRANSCENDENT_EARTH: {
    environmentID: 'ENV_TRANSCENDENT_EARTH',
    family: 'TRANSCENDENT_EARTH',
    displayName: '超越地球',
    background: ENVIRONMENT_ATLAS,
    backgroundPosition: '100% 100%',
    midground: 'FLOATING_EARTH_FRAGMENTS',
    foreground: 'VOID_GOLD_SACRED_PLATFORM',
    pathVisual: 'BLACK_WHITE_GOLD_AXIS',
    deploymentSlotStyle: 'CELESTIAL_ORBIT_NODE',
    spawnPortalStyle: 'SOVEREIGN_FRACTURE',
    baseVisual: 'TRANSCENDENT_EARTH_CORE',
    ambientVFX: 'COSMIC_PARTICLE_REVERSE',
    bossAtmosphereProfile: 'SOVEREIGN_PHASE_SKY',
    musicID: 'BGM_TRANSCENDENT_EARTH',
    lightingProfile: 'CELESTIAL_HIGH_CONTRAST',
  },
};

export function getEnvironmentFamily(tier: EarthTierId | null) {
  if (!tier || tier === 'NORMAL' || tier === 'RARE')
    return 'EARTH_DEFENSE_CITY' as const;
  if (['SCARCE', 'EPIC', 'LEGENDARY'].includes(tier))
    return 'CRYSTAL_CORRUPTION' as const;
  if (['MYTHIC', 'SECRET', 'KING', 'EMPEROR'].includes(tier))
    return 'RIFT_DOMINION' as const;
  return 'TRANSCENDENT_EARTH' as const;
}

export function getBattleEnvironmentProfile(tier: EarthTierId | null) {
  return BATTLE_ENVIRONMENT_PROFILES[getEnvironmentFamily(tier)];
}

export interface TowerVisualProfile {
  towerID: TowerId;
  baseVisual: string;
  star3VisualAdditions: string;
  star5VisualAdditions: string;
  battleLv3BranchAVisual: string;
  battleLv3BranchBVisual: string;
  battleLv5BranchAVisual: string;
  battleLv5BranchBVisual: string;
  idleVFX: string;
  attackVFX: string;
  skillVFX: string;
  overdriveVFX: string;
  spawnVFX: string;
}

const TOWER_IDS: TowerId[] = [
  'EARTH_BASIC_AUTO_TURRET',
  'EARTH_RAPID_FIRE_TURRET',
  'EARTH_ARMOR_PIERCING_TURRET',
  'EARTH_BLAST_TURRET',
  'EARTH_THUNDER_TURRET',
  'EARTH_DIVINE_JUDGMENT_TURRET',
  'EARTH_PHANTOM_TURRET',
  'EARTH_KING_AUTHORITY_TURRET',
  'EARTH_EMPEROR_ANNIHILATION_TURRET',
  'EARTH_VENERABLE_TURRET',
  'EARTH_SAINT_DOMAIN_TURRET',
  'EARTH_SOVEREIGN_END_TURRET',
];

export const TOWER_VISUAL_PROFILES = Object.fromEntries(
  TOWER_IDS.map((towerID, index) => [
    towerID,
    {
      towerID,
      baseVisual: `TOWER_ATLAS_${index}`,
      star3VisualAdditions: `STAR3_FLOATING_PARTS_${index}`,
      star5VisualAdditions: `STAR5_ORBIT_FRAME_${index}`,
      battleLv3BranchAVisual: `BL3_A_ATTACHMENT_${index}`,
      battleLv3BranchBVisual: `BL3_B_ATTACHMENT_${index}`,
      battleLv5BranchAVisual: `BL5_A_ENHANCEMENT_${index}`,
      battleLv5BranchBVisual: `BL5_B_ENHANCEMENT_${index}`,
      idleVFX: `VFX_IDLE_${index}`,
      attackVFX: `VFX_ATTACK_${index}`,
      skillVFX: `VFX_SKILL_${index}`,
      overdriveVFX: `VFX_OVERDRIVE_${index}`,
      spawnVFX: `VFX_SUMMON_${index}`,
    },
  ]),
) as Record<TowerId, TowerVisualProfile>;
