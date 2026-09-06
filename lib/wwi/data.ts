import type {
  FactionId,
  WarYear,
  NationId,
  OrderAvailability,
} from './campaign';
export { FACTIONS, NATIONS, YEARS } from './campaign';
export type { FactionId, WarYear } from './campaign';
export type UnitId = 'RIFLE' | 'MG' | 'ARTILLERY' | 'ENGINEER';
export type DoctrineId = 'DEFENSE' | 'ARTILLERY' | 'LOGISTICS' | 'ASSAULT';
export type FormationId = 'INFANTRY' | 'ASSAULT' | 'SUPPORTED' | 'ELITE';
export interface HistoricalInfoData {
  background: string;
  participants: string;
  outcome: string;
  significance: string;
  technology: string;
  source: string;
}
export interface CampaignMissionData {
  id: string;
  name: string;
  english: string;
  year: WarYear;
  faction: FactionId;
  nation: string;
  theatre: string;
  date: string;
  location: string;
  objective: string;
  playable: boolean;
  history: HistoricalInfoData;
}
export const VERDUN: CampaignMissionData = {
  id: 'VERDUN_1916_FR',
  name: '凡爾登戰役',
  english: 'THE DEFENCE OF VERDUN',
  year: 1916,
  faction: 'ENTENTE',
  nation: 'FR',
  theatre: 'WESTERN_FRONT',
  date: '1916.02.21 — 12.18',
  location: '法國 · 凡爾登北部高地',
  playable: true,
  objective: '守住法軍防禦區，抵擋 25 輪攻勢，保護後方交通線。',
  history: {
    background:
      '德軍於 1916 年 2 月 21 日進攻凡爾登，戰鬥在城市北方高地與堡壘地帶持續近十個月。',
    participants: '法國軍隊與德意志帝國軍隊。',
    outcome: '法軍守住凡爾登，並在年底收復多處失地；雙方付出極其沉重的代價。',
    significance: '凡爾登成為一戰消耗戰與法軍防禦意志的象徵。',
    technology:
      '炮兵、機槍、塹壕與後勤運輸深刻影響戰場。法軍採用地平線藍軍服與 Adrian 鋼盔。',
    source: 'https://memorial-verdun.fr/en/ressources/la-bataille-de-verdun',
  },
};
export const ABSTRACTION =
  '遊戲情境：路線、7 處陣地、25 波攻勢、部隊強度與資源收入是戰術抽象，並非歷史規模或精確戰鬥時序。指揮官是抽象玩家職務。';
export const DOCTRINES: Record<
  DoctrineId,
  { name: string; description: string; order: string }
> = {
  DEFENSE: {
    name: '防禦指揮官',
    description: '防線強度 +4；緊急加固恢復 4 點防線。',
    order: '緊急加固',
  },
  ARTILLERY: {
    name: '炮兵指揮官',
    description: '野戰炮射程 +12%；協同炮擊打擊最前方敵群。',
    order: '協同炮擊',
  },
  LOGISTICS: {
    name: '後勤指揮官',
    description: '部署與升級成本 −8%；緊急運輸提供 70 戰地資源。',
    order: '緊急運輸',
  },
  ASSAULT: {
    name: '突擊指揮官',
    description: '步兵與機槍射速 +10%；預備隊在 8 秒內遲滯敵軍。',
    order: '預備隊阻擊',
  },
};
export interface UnitData {
  id: UnitId;
  name: string;
  english: string;
  role: string;
  cost: number;
  damage: number;
  interval: number;
  range: number;
  radius: number;
  art: number;
  availableFromYear: number;
  nation: string;
  nationId: NationId;
  factionId: FactionId;
  variantId: string;
}
export const UNITS: Record<UnitId, UnitData> = {
  RIFLE: {
    id: 'RIFLE',
    name: '步槍陣地',
    english: 'RIFLE SECTION',
    role: '低成本、靈活佈防 · 步槍齊射',
    cost: 100,
    damage: 25,
    interval: 1.2,
    range: 23,
    radius: 0,
    art: 0,
    availableFromYear: 1914,
    nation: 'FR',
    nationId: 'FRANCE',
    factionId: 'ENTENTE',
    variantId: 'FRANCE_RIFLE',
  },
  MG: {
    id: 'MG',
    name: '機槍陣地',
    english: 'MACHINE GUN',
    role: '持續火力、壓制步兵 · 短促連發',
    cost: 120,
    damage: 13,
    interval: 0.38,
    range: 23,
    radius: 0,
    art: 1,
    availableFromYear: 1914,
    nation: 'FR',
    nationId: 'FRANCE',
    factionId: 'ENTENTE',
    variantId: 'FRANCE_MG',
  },
  ARTILLERY: {
    id: 'ARTILLERY',
    name: '野戰炮',
    english: 'FIELD ARTILLERY',
    role: '遠距間接射擊、打擊密集隊形',
    cost: 180,
    damage: 76,
    interval: 3.2,
    range: 35,
    radius: 9,
    art: 2,
    availableFromYear: 1914,
    nation: 'FR',
    nationId: 'FRANCE',
    factionId: 'ENTENTE',
    variantId: 'FRANCE_ARTILLERY',
  },
  ENGINEER: {
    id: 'ENGINEER',
    name: '工兵陣地',
    english: 'ENGINEER POSITION',
    role: '附近 24 範圍：升級 −10%，支援裝填 +8%',
    cost: 100,
    damage: 0,
    interval: 8,
    range: 24,
    radius: 0,
    art: 3,
    availableFromYear: 1914,
    nation: 'FR',
    nationId: 'FRANCE',
    factionId: 'ENTENTE',
    variantId: 'FRANCE_ENGINEER',
  },
};
export const UNIT_IDS = Object.keys(UNITS) as UnitId[];
export type UnitArchetypeData = Pick<
  UnitData,
  | 'id'
  | 'name'
  | 'english'
  | 'role'
  | 'cost'
  | 'damage'
  | 'interval'
  | 'range'
  | 'radius'
>;
// Shared mechanics contain no national artwork or ownership; those live in UNIT_VARIANTS.
export const UNIT_ARCHETYPES = Object.fromEntries(
  UNIT_IDS.map((id) => {
    const { name, english, role, cost, damage, interval, range, radius } =
      UNITS[id];
    return [
      id,
      { id, name, english, role, cost, damage, interval, range, radius },
    ];
  }),
) as Record<UnitId, UnitArchetypeData>;
export interface UnitUpgradeData {
  id: string;
  name: string;
  description: string;
}
export const BRANCHES: Record<UnitId, Record<3 | 5, UnitUpgradeData[]>> = {
  RIFLE: {
    3: [
      {
        id: 'RIFLE_A3',
        name: '精準瞄具',
        description: '傷害 +25%，優先選擇高強度目標。',
      },
      { id: 'RIFLE_B3', name: '熟練裝填', description: '射速 +25%。' },
    ],
    5: [
      {
        id: 'RIFLE_A5',
        name: '集中齊射',
        description: '每第四次射擊追加一發。',
      },
      {
        id: 'RIFLE_B5',
        name: '延伸防線',
        description: '射程 +25%，攻擊額外一個附近目標。',
      },
    ],
  },
  MG: {
    3: [
      { id: 'MG_A3', name: '加強供彈', description: '射速 +25%。' },
      {
        id: 'MG_B3',
        name: '強化陣地',
        description: '傷害 +15%，降低炮擊壓制造成的停火時間。',
      },
    ],
    5: [
      {
        id: 'MG_A5',
        name: '壓制射擊',
        description: '命中使步兵減速 25%，持續 1.5 秒。',
      },
      {
        id: 'MG_B5',
        name: '交叉火力',
        description: '每次攻擊額外一個附近目標，造成 50% 傷害。',
      },
    ],
  },
  ARTILLERY: {
    3: [
      { id: 'ARTILLERY_A3', name: '高爆彈', description: '爆炸半徑 +30%。' },
      {
        id: 'ARTILLERY_B3',
        name: '精準校射',
        description: '直接命中傷害 +35%。',
      },
    ],
    5: [
      {
        id: 'ARTILLERY_A5',
        name: '彈幕射擊',
        description: '每第三次射擊追加兩發炮彈。',
      },
      {
        id: 'ARTILLERY_B5',
        name: '重型彈藥',
        description: '對支援步兵與重大攻勢傷害 +45%。',
      },
    ],
  },
  ENGINEER: {
    3: [
      {
        id: 'ENGINEER_A3',
        name: '工程協調',
        description: '附近陣地升級總折扣提高至 20%。',
      },
      {
        id: 'ENGINEER_B3',
        name: '工事加固',
        description: '附近陣地降低炮擊壓制時間；完成升級恢復 2 防線。',
      },
    ],
    5: [
      {
        id: 'ENGINEER_A5',
        name: '修復網絡',
        description: '每 18 秒恢復 1 防線；支援半徑 +20%。',
      },
      {
        id: 'ENGINEER_B5',
        name: '建造效率',
        description: '附近空位部署成本 −15%；每波額外 8 戰地資源。',
      },
    ],
  },
};
export const UPGRADE_COSTS = [0, 100, 150, 225, 325];
export interface FieldOrderData {
  id: string;
  name: string;
  description: string;
  category: 'SUPPORT' | 'GENERAL' | 'TACTICAL';
  unit?: UnitId;
  availability: OrderAvailability;
}
const orderDefinitions: Omit<FieldOrderData, 'availability'>[] = [
  {
    id: 'FIRE',
    name: '集中炮火',
    description: '野戰炮傷害 +20%。',
    category: 'SUPPORT',
    unit: 'ARTILLERY',
  },
  {
    id: 'BELTS',
    name: '強化供彈',
    description: '機槍射速 +18%。',
    category: 'SUPPORT',
    unit: 'MG',
  },
  {
    id: 'SIGHTS',
    name: '步兵射表',
    description: '步槍射程 +20%，傷害 +15%。',
    category: 'SUPPORT',
    unit: 'RIFLE',
  },
  {
    id: 'ENGINEERS',
    name: '工兵優先',
    description: '有工兵支援的陣地再減少 8% 升級成本。',
    category: 'SUPPORT',
    unit: 'ENGINEER',
  },
  {
    id: 'SPOTTERS',
    name: '炮兵校射',
    description: '野戰炮射程 +18%。',
    category: 'SUPPORT',
    unit: 'ARTILLERY',
  },
  {
    id: 'RESERVE',
    name: '預備隊投入',
    description: '立即補充 100 戰地資源。',
    category: 'GENERAL',
  },
  {
    id: 'WORKS',
    name: '防線加固',
    description: '恢復 4 防線，防線上限 +2。',
    category: 'GENERAL',
  },
  {
    id: 'ECONOMY',
    name: '彈藥節約',
    description: '陣地升級成本 −12%。',
    category: 'GENERAL',
  },
  {
    id: 'SUPPLY',
    name: '交通線維持',
    description: '每波補充資源 +12。',
    category: 'GENERAL',
  },
  {
    id: 'STAFF',
    name: '參謀協調',
    description: '兵種技能冷卻時間 −20%。',
    category: 'GENERAL',
  },
  {
    id: 'COUNTER',
    name: '反攻準備',
    description: '指揮值獲取 +30%。',
    category: 'TACTICAL',
  },
  {
    id: 'TIMING',
    name: '掌握攻勢間隙',
    description: '對整隊階段的重大攻勢傷害 +35%。',
    category: 'TACTICAL',
  },
  {
    id: 'CROSSFIRE',
    name: '交叉掩護',
    description: '鄰近 18 範圍的不同作戰兵種，傷害 +15%。',
    category: 'TACTICAL',
  },
  {
    id: 'BARRAGE',
    name: '徐進彈幕',
    description: '野戰炮命中遲滯敵軍 20%，持續 2 秒。',
    category: 'TACTICAL',
  },
  {
    id: 'RISK',
    name: '前沿火力',
    description: '全體傷害 +25%，防線上限 −4（最低 6）。',
    category: 'TACTICAL',
  },
];
export const ORDERS: FieldOrderData[] = orderDefinitions.map((order) => ({
  ...order,
  availability: { scope: 'UNIVERSAL' },
}));
export const FORMATIONS: Record<
  FormationId,
  {
    name: string;
    role: string;
    hp: number;
    speed: number;
    defense: number;
    resource: number;
    art: number;
  }
> = {
  INFANTRY: {
    name: '德軍步兵分隊',
    role: '步兵',
    hp: 95,
    speed: 2.8,
    defense: 0,
    resource: 10,
    art: 4,
  },
  ASSAULT: {
    name: '德軍突擊分隊',
    role: '快速',
    hp: 72,
    speed: 4,
    defense: 0,
    resource: 12,
    art: 5,
  },
  SUPPORTED: {
    name: '機槍支援分隊',
    role: '支援',
    hp: 225,
    speed: 2,
    defense: 6,
    resource: 20,
    art: 6,
  },
  ELITE: {
    name: '精銳突擊分隊',
    role: '精銳',
    hp: 180,
    speed: 2.7,
    defense: 4,
    resource: 25,
    art: 7,
  },
};
export const TECHNOLOGIES = UNIT_IDS.map((id) => ({
  id,
  nation: 'FR',
  displayName: UNITS[id].name,
  availableFromYear: 1914,
  category: id,
  historicalDescription:
    '一戰步兵、炮兵與工程支援類別；圖像為歷史風格的概括插畫。',
  gameplayEffect: UNITS[id].role,
}));
export type Point = { x: number; y: number };
export const PATHS: Point[][] = [
  [
    { x: 3, y: 22 },
    { x: 24, y: 30 },
    { x: 39, y: 49 },
    { x: 64, y: 49 },
    { x: 78, y: 65 },
    { x: 97, y: 65 },
  ],
  [
    { x: 3, y: 81 },
    { x: 26, y: 72 },
    { x: 39, y: 49 },
    { x: 64, y: 49 },
    { x: 78, y: 65 },
    { x: 97, y: 65 },
  ],
];
export const SLOTS = [
  { x: 21, y: 43, terrain: '壕溝', description: '工事減少炮擊壓制' },
  { x: 24, y: 60, terrain: '壕溝', description: '工事減少炮擊壓制' },
  { x: 41, y: 34, terrain: '高地', description: '野戰炮射程 +12%' },
  {
    x: 49,
    y: 64,
    terrain: '交通壕',
    description: '鄰近多處陣地，適合工程支援',
  },
  { x: 62, y: 33, terrain: '高地', description: '野戰炮射程 +12%' },
  { x: 74, y: 48, terrain: '壕溝', description: '工事減少炮擊壓制' },
  { x: 84, y: 80, terrain: '後方陣地', description: '保護最後一段交通線' },
];
export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function samplePath(progress: number, lane: number): Point {
  const points = PATHS[lane],
    lengths = points.slice(1).map((p, i) => distance(p, points[i]));
  let left =
    Math.max(0, Math.min(1, progress)) * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i]) {
      const t = left / lengths[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    left -= lengths[i];
  }
  return points[points.length - 1];
}
