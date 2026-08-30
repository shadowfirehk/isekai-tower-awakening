import { CareerData, CareerId, RealmType } from './types';

export const CAREER_CATALOG: Record<CareerId, CareerData> = {
  EARTH_WALL_GUARDIAN: {
    id: 'EARTH_WALL_GUARDIAN',
    displayName: '壁壘守衛者',
    englishName: 'WALL GUARDIAN',
    realm: RealmType.Earth,
    description: '以堅不可摧的防線守護戰場。',
    classification: 'EARTH CAREER',
    passiveName: '壁壘意志',
    passiveDescription: '所有部署炮台防禦 +10%',
    modifiers: [{ type: 'DEFENSE_PERCENT', value: 0.1, source: 'CAREER', sourceId: 'EARTH_WALL_GUARDIAN' }],
    revealVisualId: 'CAREER_WallGuardian',
    tags: ['DEFENSE', 'SUSTAIN', 'AREA_CONTROL'],
    enabled: true,
  },
  GALAXY_STARBURST_HUNTER: {
    id: 'GALAXY_STARBURST_HUNTER',
    displayName: '星爆獵殺者',
    englishName: 'STARBURST HUNTER',
    realm: RealmType.Galaxy,
    description: '銀河領域尚未解鎖。',
    classification: 'GALAXY CAREER',
    passiveName: '未解鎖',
    passiveDescription: '將於銀河篇開放。',
    modifiers: [],
    revealVisualId: 'CAREER_Galaxy_Locked',
    tags: ['LOCKED'],
    enabled: false,
  },
  UNIVERSE_CHAOS_LAW_MASTER: {
    id: 'UNIVERSE_CHAOS_LAW_MASTER',
    displayName: '混沌法則主宰',
    englishName: 'CHAOS LAW MASTER',
    realm: RealmType.Universe,
    description: '宇宙領域尚未解鎖。',
    classification: 'UNIVERSE CAREER',
    passiveName: '未解鎖',
    passiveDescription: '將於宇宙篇開放。',
    modifiers: [],
    revealVisualId: 'CAREER_Universe_Locked',
    tags: ['LOCKED'],
    enabled: false,
  },
};

export function getCareerById(id: CareerId | null | undefined): CareerData | null {
  return id && CAREER_CATALOG[id] ? CAREER_CATALOG[id] : null;
}

export function isCareerId(value: unknown): value is CareerId {
  return typeof value === 'string' && value in CAREER_CATALOG;
}
