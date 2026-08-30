import { MaterialData, MaterialId, RealmType } from './types';

export const EARTH_BASIC_MATERIAL = 'EARTH_BASIC_MATERIAL' as const satisfies MaterialId;
export const EARTH_STAR_CORE = 'EARTH_STAR_CORE' as const satisfies MaterialId;

export const MATERIAL_DATABASE: Record<MaterialId, MaterialData> = {
  EARTH_BASIC_MATERIAL: {
    id: 'EARTH_BASIC_MATERIAL',
    displayName: '地源碎片',
    description: '蘊含地脈能量的基礎素材，用於提升炮台等級。',
    realm: RealmType.Earth,
    rarity: 'COMMON',
    icon: 'CRYSTAL',
    category: 'TOWER_LEVEL',
    maxStack: Number.MAX_SAFE_INTEGER,
    tags: ['EARTH', 'UPGRADE', 'LEVEL'],
  },
  EARTH_STAR_CORE: {
    id: 'EARTH_STAR_CORE',
    displayName: '地源星核',
    description: '凝縮的地球核心，用於推進炮台星級。',
    realm: RealmType.Earth,
    rarity: 'RARE',
    icon: 'STAR_CORE',
    category: 'TOWER_STAR',
    maxStack: Number.MAX_SAFE_INTEGER,
    tags: ['EARTH', 'UPGRADE', 'STAR'],
  },
};

export function getMaterialData(id: MaterialId) {
  return MATERIAL_DATABASE[id];
}
