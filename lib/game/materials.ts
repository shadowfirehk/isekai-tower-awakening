import { EARTH_TIER_IDS, MaterialData, MaterialId, RealmType } from './types';

export const EARTH_BASIC_MATERIAL = 'EARTH_BASIC_MATERIAL' as const satisfies MaterialId;
export const EARTH_STAR_CORE = 'EARTH_STAR_CORE' as const satisfies MaterialId;
export const EARTH_TIER_MATERIAL_IDS = EARTH_TIER_IDS.map(tier => `EARTH_${tier}_MATERIAL` as MaterialId);
const TIER_NAMES = ['普通','罕見','稀有','史詩','傳說','神話','秘密','王','皇','尊','聖','帝'];

const tierMaterials = Object.fromEntries(EARTH_TIER_MATERIAL_IDS.map((id,index) => [id, {
  id, displayName:`${TIER_NAMES[index]}地源結晶`, description:`由${TIER_NAMES[index]}階地脈凝結的炮塔強化素材。`,
  realm:RealmType.Earth, rarity:index >= 4 ? 'RARE' : 'COMMON', icon:'CRYSTAL', category:'TOWER_LEVEL',
  maxStack:Number.MAX_SAFE_INTEGER, tags:['EARTH','UPGRADE','LEVEL',EARTH_TIER_IDS[index]],
} satisfies MaterialData]));

export const MATERIAL_DATABASE = {
  EARTH_BASIC_MATERIAL: { id:'EARTH_BASIC_MATERIAL', displayName:'地源碎片', description:'新手試煉取得的基礎地脈素材。', realm:RealmType.Earth, rarity:'COMMON', icon:'CRYSTAL', category:'TOWER_LEVEL', maxStack:Number.MAX_SAFE_INTEGER, tags:['EARTH','TUTORIAL'] },
  ...tierMaterials,
  EARTH_STAR_CORE: { id:'EARTH_STAR_CORE', displayName:'地源星核', description:'凝縮的地球核心，用於所有地球炮塔升星。', realm:RealmType.Earth, rarity:'RARE', icon:'STAR_CORE', category:'TOWER_STAR', maxStack:Number.MAX_SAFE_INTEGER, tags:['EARTH','UPGRADE','STAR'] },
} as Record<MaterialId,MaterialData>;

export function getMaterialData(id: MaterialId) { return MATERIAL_DATABASE[id]; }
