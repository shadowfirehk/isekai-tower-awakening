export type FactionId = 'ENTENTE' | 'CENTRAL_POWERS';
export type WarYear = 1914 | 1915 | 1916 | 1917 | 1918;
export const YEARS: WarYear[] = [1914, 1915, 1916, 1917, 1918];
export type NationId =
  | 'FRANCE'
  | 'UNITED_KINGDOM'
  | 'RUSSIAN_EMPIRE'
  | 'BELGIUM'
  | 'SERBIA'
  | 'ITALY'
  | 'UNITED_STATES'
  | 'GERMAN_EMPIRE'
  | 'AUSTRIA_HUNGARY'
  | 'OTTOMAN_EMPIRE'
  | 'BULGARIA';
export type AllianceStatus =
  | 'ENTENTE_MEMBER'
  | 'ASSOCIATED_POWER'
  | 'CENTRAL_POWER'
  | 'NEUTRAL'
  | 'FORMER_BELLIGERENT';
export type TheatreId =
  | 'WESTERN_FRONT'
  | 'EASTERN_FRONT'
  | 'ITALIAN_FRONT'
  | 'GALLIPOLI';
export const THEATRES: Record<TheatreId, string> = {
  WESTERN_FRONT: '西線',
  EASTERN_FRONT: '東線',
  ITALIAN_FRONT: '義大利戰線',
  GALLIPOLI: '加里波利',
};
export interface FactionData {
  id: FactionId;
  name: string;
  english: string;
  description: string;
  ending: string;
  art: string;
  mark: 'shield-map' | 'compass-map';
}
export const FACTIONS: Record<FactionId, FactionData> = {
  ENTENTE: {
    id: 'ENTENTE',
    name: '協約國',
    english: 'ENTENTE POWERS',
    description:
      '以法國、英國、俄羅斯帝國為早期核心，其他國家陸續加入或協同作戰。',
    ending: '1918 年 11 月 11 日西線停戰。',
    art: '/wwi/verdun.png',
    mark: 'shield-map',
  },
  CENTRAL_POWERS: {
    id: 'CENTRAL_POWERS',
    name: '同盟國',
    english: 'CENTRAL POWERS',
    description: '以德意志帝國、奧匈帝國為核心，鄂圖曼帝國與保加利亞其後參戰。',
    ending: '1918 年同盟國相繼退出戰爭；不將歷史敗局改寫為征服結局。',
    art: '/wwi/central-command.png',
    mark: 'compass-map',
  },
};
export const HISTORY_SOURCES = {
  timeline: 'https://ww1.nam.ac.uk/timeline/',
  overview: 'https://www.nam.ac.uk/explore/first-world-war',
  usa: 'https://history.state.gov/departmenthistory/short-history/war',
  usaEntry:
    'https://history.state.gov/historicaldocuments/frus1917Supp01v01/d240',
  russia:
    'https://encyclopedia.1914-1918-online.net/article/brest-litovsk-treaty-of/',
  bulgaria:
    'https://encyclopedia.1914-1918-online.net/article/ferdinand-i-tsar-of-bulgaria/',
  armistices:
    'https://encyclopedia.1914-1918-online.net/article/the-military-collapse-of-the-central-powers/',
  verdun: 'https://memorial-verdun.fr/en/ressources/la-bataille-de-verdun',
};
export interface NationData {
  id: NationId;
  displayNameZhHant: string;
  displayNameEn: string;
  factionId: FactionId;
  allianceStatus: AllianceStatus;
  warEntryDate: string;
  warExitDate: string;
  politicalEndDate: string | null;
  activeFromYear: WarYear;
  activeToYear: WarYear;
  flagAsset: string | null;
  emblemAsset: string | null;
  mapAccentStyle: string;
  uniformVisualProfile: string;
  unitVisualProfile: string;
  commanderVisualProfile: string;
  commanderArt: string | null;
  historicalSummary: string;
  historicalSources: string[];
  playable: boolean;
  campaignAvailable: boolean;
}
type NationRow = [
  NationId,
  string,
  string,
  FactionId,
  string,
  string,
  string,
  string,
];
const nationRows: NationRow[] = [
  [
    'FRANCE',
    '法國',
    'France',
    'ENTENTE',
    '1914-08-03',
    '1918-11-11',
    '1916 地平線藍軍服／Adrian 鋼盔',
    '1914 年德國對法國宣戰；本版開放法軍凡爾登防禦情境。',
  ],
  [
    'UNITED_KINGDOM',
    '英國',
    'United Kingdom',
    'ENTENTE',
    '1914-08-04',
    '1918-11-11',
    '卡其色軍服；依年份配置裝備',
    '英國於德軍入侵比利時後參戰。英帝國與自治領部隊的詳細編制留待相應戰役。',
  ],
  [
    'RUSSIAN_EMPIRE',
    '俄羅斯帝國',
    'Russian Empire',
    'ENTENTE',
    '1914-08-01',
    '1917-12-15',
    '俄軍卡其軍服；1917 政權轉型須分期',
    '此索引保留俄國 1914–1917 參戰脈絡；帝制於 1917 年 3 月終結，其後不再稱帝國政府。蘇俄於 1917-12-15 停戰，1918-03-03 簽訂布列斯特—立陶夫斯克條約。',
  ],
  [
    'BELGIUM',
    '比利時',
    'Belgium',
    'ENTENTE',
    '1914-08-04',
    '1918-11-11',
    '比利時軍服，依戰期區分',
    '原為中立國，德軍入侵後抵抗；陣營分組不等於原有協約條約成員資格。',
  ],
  [
    'SERBIA',
    '塞爾維亞',
    'Serbia',
    'ENTENTE',
    '1914-07-28',
    '1918-11-11',
    '塞爾維亞軍服／傳統軍帽',
    '奧匈對塞爾維亞宣戰；本土被占不等於退出戰爭，軍隊後於薩洛尼卡戰線作戰。',
  ],
  [
    'ITALY',
    '義大利',
    'Italy',
    'ENTENTE',
    '1915-05-23',
    '1918-11-04',
    '灰綠色軍服，依戰期區分',
    '1914 年保持中立；1915-05-23 對奧匈宣戰，不能以戰前三國同盟推定其一戰陣營。對德宣戰則在 1916 年。',
  ],
  [
    'UNITED_STATES',
    '美國',
    'United States',
    'ENTENTE',
    '1917-04-06',
    '1918-11-11',
    '美軍橄欖褐制服，1917 年後',
    '美國以「協同國／Associated Power」身分參戰，並非原有協約條約體系中的完全同等成員。',
  ],
  [
    'GERMAN_EMPIRE',
    '德意志帝國',
    'German Empire',
    'CENTRAL_POWERS',
    '1914-08-01',
    '1918-11-11',
    '德軍野戰灰；帽盔依年份區分',
    '德國於 1914 年對俄、法宣戰。1918 年帝制終結，11 月 11 日停戰。',
  ],
  [
    'AUSTRIA_HUNGARY',
    '奧匈帝國',
    'Austria-Hungary',
    'CENTRAL_POWERS',
    '1914-07-28',
    '1918-11-04',
    '奧匈灰藍／野戰灰制服',
    '1914 年對塞爾維亞宣戰；維拉朱斯蒂停戰協定於 1918-11-03 簽署、11-04 生效。',
  ],
  [
    'OTTOMAN_EMPIRE',
    '鄂圖曼帝國',
    'Ottoman Empire',
    'CENTRAL_POWERS',
    '1914-10-29',
    '1918-10-31',
    '鄂圖曼卡其軍服與特有軍帽',
    '以 1914-10-29 黑海襲擊作參戰起點，並非簽盟約即參戰。穆德洛斯停戰於 1918-10-30 簽署、次日生效。',
  ],
  [
    'BULGARIA',
    '保加利亞',
    'Bulgaria',
    'CENTRAL_POWERS',
    '1915-10-14',
    '1918-09-30',
    '保加利亞軍服與帽徽輪廓',
    '1915-10-14 對塞爾維亞宣戰。薩洛尼卡停戰於 1918-09-29 簽署、次日生效。',
  ],
];
export const NATIONS: NationData[] = nationRows.map(
  ([id, zh, en, factionId, entry, exit, uniform, summary]) => ({
    id,
    displayNameZhHant: zh,
    displayNameEn: en,
    factionId,
    allianceStatus:
      id === 'UNITED_STATES'
        ? 'ASSOCIATED_POWER'
        : factionId === 'ENTENTE'
          ? 'ENTENTE_MEMBER'
          : 'CENTRAL_POWER',
    warEntryDate: entry,
    warExitDate: exit,
    activeFromYear: Number(entry.slice(0, 4)) as WarYear,
    activeToYear: Number(exit.slice(0, 4)) as WarYear,
    politicalEndDate: id === 'RUSSIAN_EMPIRE' ? '1917-03-15' : null,
    flagAsset: null,
    emblemAsset: null,
    mapAccentStyle: factionId === 'ENTENTE' ? 'blue-gray' : 'field-gray',
    uniformVisualProfile: uniform,
    unitVisualProfile: `${id}_FIELD_UNITS`,
    commanderVisualProfile: `${id}_OFFICER`,
    commanderArt:
      id === 'FRANCE'
        ? FACTIONS.ENTENTE.art
        : id === 'GERMAN_EMPIRE'
          ? FACTIONS.CENTRAL_POWERS.art
          : null,
    historicalSummary: summary,
    historicalSources: [
      HISTORY_SOURCES.timeline,
      ...(id === 'UNITED_STATES'
        ? [HISTORY_SOURCES.usa, HISTORY_SOURCES.usaEntry]
        : id === 'RUSSIAN_EMPIRE'
          ? [HISTORY_SOURCES.russia]
          : factionId === 'CENTRAL_POWERS'
            ? [HISTORY_SOURCES.armistices]
            : []),
    ],
    playable: id === 'FRANCE',
    campaignAvailable: id === 'FRANCE',
  }),
);
export const nationById = (id: NationId) => NATIONS.find((n) => n.id === id)!;
export function validDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
  );
}
export function isNationActiveOnDate(id: NationId, date: string): boolean {
  const nation = nationById(id);
  return (
    !!nation &&
    validDate(date) &&
    date >= nation.warEntryDate &&
    date < (nation.politicalEndDate ?? nation.warExitDate)
  );
}
export function nationStatusOnDate(id: NationId, date: string): AllianceStatus {
  const n = nationById(id);
  if (!n || !validDate(date) || date < n.warEntryDate) return 'NEUTRAL';
  return isNationActiveOnDate(id, date)
    ? n.allianceStatus
    : 'FORMER_BELLIGERENT';
}
export function activeNations(faction: FactionId, year: WarYear) {
  return NATIONS.filter(
    (n) =>
      n.factionId === faction &&
      n.warEntryDate <= `${year}-12-31` &&
      (n.politicalEndDate ?? n.warExitDate) > `${year}-01-01`,
  );
}
export interface HistoricalBattleData {
  battleId: string;
  officialName: string;
  displayNameZhHant: string;
  startDate: string;
  endDate: string;
  location: string;
  theatre: TheatreId;
  participatingNations: NationId[];
  broadOutcome: string;
  significance: string;
  historicalSources: string[];
}
type BattleRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  TheatreId,
  NationId[],
  string,
  string,
];
const battleRows: BattleRow[] = [
  [
    'MARNE_1914',
    '第一次馬恩河戰役',
    'First Battle of the Marne',
    '1914-09-05',
    '1914-09-12',
    '法國馬恩河',
    'WESTERN_FRONT',
    ['FRANCE', 'UNITED_KINGDOM', 'GERMAN_EMPIRE'],
    '德軍推進受阻。',
    '西線轉入長期對峙。',
  ],
  [
    'YPRES_1914',
    '第一次伊普爾戰役',
    'First Battle of Ypres',
    '1914-10-19',
    '1914-11-22',
    '比利時伊普爾',
    'WESTERN_FRONT',
    ['FRANCE', 'UNITED_KINGDOM', 'BELGIUM', 'GERMAN_EMPIRE'],
    '協約國守住通往海峽港口的防線。',
    '早期機動戰逐漸轉為塹壕戰。',
  ],
  [
    'TANNENBERG_1914',
    '坦能堡戰役',
    'Battle of Tannenberg',
    '1914-08-26',
    '1914-08-30',
    '東普魯士',
    'EASTERN_FRONT',
    ['RUSSIAN_EMPIRE', 'GERMAN_EMPIRE'],
    '俄軍遭重大挫敗。',
    '東線早期重要戰役。',
  ],
  [
    'GALLIPOLI_1915',
    '加里波利戰役',
    'Gallipoli Campaign',
    '1915-04-25',
    '1916-01-09',
    '加里波利半島',
    'GALLIPOLI',
    ['UNITED_KINGDOM', 'FRANCE', 'OTTOMAN_EMPIRE'],
    '協約國撤出半島。',
    '此節點採陸戰登陸至撤離期間，海軍作戰早於此日期。',
  ],
  [
    'YPRES_1915',
    '第二次伊普爾戰役',
    'Second Battle of Ypres',
    '1915-04-22',
    '1915-05-25',
    '比利時伊普爾',
    'WESTERN_FRONT',
    ['UNITED_KINGDOM', 'FRANCE', 'BELGIUM', 'GERMAN_EMPIRE'],
    '戰線局部改變，未形成戰略突破。',
    '毒氣危害為此戰的歷史背景，未製作新機制。',
  ],
  [
    'GORLICE_1915',
    '戈爾利采－塔爾努夫攻勢',
    'Gorlice–Tarnów Offensive',
    '1915-05-02',
    '1915-06-22',
    '加利西亞',
    'EASTERN_FRONT',
    ['GERMAN_EMPIRE', 'AUSTRIA_HUNGARY', 'RUSSIAN_EMPIRE'],
    '德奧聯軍突破俄軍防線。',
    '本節點範圍止於收復倫貝格，不涵蓋整段俄軍大撤退。',
  ],
  [
    'VERDUN_1916',
    '凡爾登戰役',
    'Battle of Verdun',
    '1916-02-21',
    '1916-12-18',
    '法國凡爾登',
    'WESTERN_FRONT',
    ['FRANCE', 'GERMAN_EMPIRE'],
    '法軍守住凡爾登，年底收復部分失地。',
    '消耗戰與後勤的重要例證。',
  ],
  [
    'SOMME_1916',
    '索姆河戰役',
    'Battle of the Somme',
    '1916-07-01',
    '1916-11-18',
    '法國索姆河',
    'WESTERN_FRONT',
    ['UNITED_KINGDOM', 'FRANCE', 'GERMAN_EMPIRE'],
    '協約國有限推進，雙方損失沉重。',
    '聯合作戰與消耗戰的重要案例。',
  ],
  [
    'ARRAS_1917',
    '阿拉斯戰役',
    'Battle of Arras',
    '1917-04-09',
    '1917-05-16',
    '法國阿拉斯',
    'WESTERN_FRONT',
    ['UNITED_KINGDOM', 'GERMAN_EMPIRE'],
    '初期進展未轉成決定性突破。',
    '西線攻防持續。',
  ],
  [
    'PASSCHENDAELE_1917',
    '帕森達勒戰役',
    'Third Battle of Ypres',
    '1917-07-31',
    '1917-11-10',
    '比利時伊普爾',
    'WESTERN_FRONT',
    ['UNITED_KINGDOM', 'FRANCE', 'BELGIUM', 'GERMAN_EMPIRE'],
    '協約國取得有限地面進展。',
    '泥濘與炮火深刻影響作戰。',
  ],
  [
    'CAMBRAI_1917',
    '康布雷戰役',
    'Battle of Cambrai',
    '1917-11-20',
    '1917-12-07',
    '法國康布雷',
    'WESTERN_FRONT',
    ['UNITED_KINGDOM', 'GERMAN_EMPIRE'],
    '英軍突破後遭德軍反擊。',
    '集中運用坦克的重要戰例；本版不新增坦克。',
  ],
  [
    'CAPORETTO_1917',
    '卡波雷托戰役',
    'Battle of Caporetto',
    '1917-10-24',
    '1917-11-10',
    '伊松佐河戰區',
    'ITALIAN_FRONT',
    ['ITALY', 'GERMAN_EMPIRE', 'AUSTRIA_HUNGARY'],
    '義軍撤退至皮亞韋河一帶。',
    '義大利戰線的重要轉折；日期採英國國家陸軍博物館年表範圍。',
  ],
  [
    'MICHAEL_1918',
    '米夏埃爾作戰',
    'Operation Michael',
    '1918-03-21',
    '1918-04-05',
    '法國西線',
    'WESTERN_FRONT',
    ['UNITED_KINGDOM', 'FRANCE', 'GERMAN_EMPIRE'],
    '德軍推進但未取得決定性勝利。',
    '1918 春季攻勢的一部分。',
  ],
  [
    'MARNE_1918',
    '第二次馬恩河戰役',
    'Second Battle of the Marne',
    '1918-07-15',
    '1918-08-06',
    '法國馬恩河',
    'WESTERN_FRONT',
    ['FRANCE', 'UNITED_KINGDOM', 'UNITED_STATES', 'ITALY', 'GERMAN_EMPIRE'],
    '德軍攻勢被遏止，協約國反擊。',
    '西線主動權轉移。',
  ],
  [
    'HUNDRED_DAYS_1918',
    '百日攻勢',
    'Hundred Days Offensive',
    '1918-08-08',
    '1918-11-11',
    '法國與比利時西線',
    'WESTERN_FRONT',
    ['FRANCE', 'UNITED_KINGDOM', 'UNITED_STATES', 'BELGIUM', 'GERMAN_EMPIRE'],
    '協約國持續推進，西線最終停戰。',
    '戰爭末期的一系列攻勢，並非單日戰鬥。',
  ],
];
export const HISTORICAL_BATTLES: HistoricalBattleData[] = battleRows.map(
  ([
    battleId,
    zh,
    en,
    startDate,
    endDate,
    location,
    theatre,
    participatingNations,
    broadOutcome,
    significance,
  ]) => ({
    battleId,
    displayNameZhHant: zh,
    officialName: en,
    startDate,
    endDate,
    location,
    theatre,
    participatingNations,
    broadOutcome,
    significance,
    historicalSources: [
      battleId === 'VERDUN_1916'
        ? HISTORY_SOURCES.verdun
        : HISTORY_SOURCES.timeline,
    ],
  }),
);
export const battleById = (id: string) =>
  HISTORICAL_BATTLES.find((b) => b.battleId === id)!;
export type UnitArchetypeId = 'RIFLE' | 'MG' | 'ARTILLERY' | 'ENGINEER';
export interface BattleScenarioData {
  scenarioId: string;
  battleId: string;
  displayName: string;
  date: string;
  playableFaction: FactionId;
  playableNation: NationId;
  opposingFaction: FactionId;
  opposingNations: NationId[];
  objective: string;
  unitLoadoutRules: { count: number; archetypes: UnitArchetypeId[] } | null;
  waveConfiguration: { id: 'VERDUN_25'; count: 25 } | null;
  gameplayAbstractionNote: string;
  rewardConfig: { supplies: number; parts: number; technology: number } | null;
  implemented: boolean;
}
export const VERDUN_SCENARIO_ID = 'VERDUN_1916_FRANCE_DEFENSE';
type ScenarioRow = [string, NationId, string, string?];
const scenarioRows: ScenarioRow[] = [
  ['MARNE_1914', 'FRANCE', '支援防線與反擊'],
  ['YPRES_1914', 'UNITED_KINGDOM', '守住港口進路'],
  ['GALLIPOLI_1915', 'UNITED_KINGDOM', '建立登陸場'],
  ['YPRES_1915', 'UNITED_KINGDOM', '維持防線'],
  ['VERDUN_1916', 'FRANCE', '守住法軍防禦區，抵擋 25 輪攻勢，保護後方交通線。'],
  ['SOMME_1916', 'UNITED_KINGDOM', '推進防禦地帶'],
  ['ARRAS_1917', 'UNITED_KINGDOM', '支援春季攻勢'],
  ['PASSCHENDAELE_1917', 'UNITED_KINGDOM', '維持泥地交通線'],
  ['CAMBRAI_1917', 'UNITED_KINGDOM', '協調突破與固守'],
  ['MICHAEL_1918', 'UNITED_KINGDOM', '抵擋德軍春季攻勢', '春季攻勢防禦'],
  ['MARNE_1918', 'FRANCE', '遏止攻勢與反擊'],
  ['HUNDRED_DAYS_1918', 'FRANCE', '推進與維持補給'],
  ['TANNENBERG_1914', 'GERMAN_EMPIRE', '東線機動與包圍'],
  ['MARNE_1914', 'GERMAN_EMPIRE', '維持交通與攻勢'],
  ['GORLICE_1915', 'GERMAN_EMPIRE', '協調德奧聯軍突破'],
  ['GALLIPOLI_1915', 'OTTOMAN_EMPIRE', '防守半島登陸區'],
  ['VERDUN_1916', 'GERMAN_EMPIRE', '進攻法軍防禦地帶'],
  ['SOMME_1916', 'GERMAN_EMPIRE', '抵擋英法攻勢'],
  ['CAPORETTO_1917', 'AUSTRIA_HUNGARY', '協調德奧聯軍攻勢'],
  ['MICHAEL_1918', 'GERMAN_EMPIRE', '組織春季攻勢'],
  ['MARNE_1918', 'GERMAN_EMPIRE', '維持進攻與交通'],
  ['HUNDRED_DAYS_1918', 'GERMAN_EMPIRE', '撤退與後衛防禦', '戰爭末期防禦'],
];
export const SCENARIOS: BattleScenarioData[] = scenarioRows.map(
  ([battleId, playableNation, objective, name]) => {
    const battle = battleById(battleId),
      playableFaction = nationById(playableNation).factionId;
    const implemented =
      battleId === 'VERDUN_1916' && playableNation === 'FRANCE';
    return {
      scenarioId: implemented
        ? VERDUN_SCENARIO_ID
        : `${battleId}_${playableNation}`,
      battleId,
      displayName: name ?? battle.displayNameZhHant,
      date: battle.startDate,
      playableFaction,
      playableNation,
      opposingFaction:
        playableFaction === 'ENTENTE' ? 'CENTRAL_POWERS' : 'ENTENTE',
      opposingNations: battle.participatingNations.filter(
        (id) => nationById(id).factionId !== playableFaction,
      ),
      objective,
      unitLoadoutRules: implemented
        ? { count: 3, archetypes: ['RIFLE', 'MG', 'ARTILLERY', 'ENGINEER'] }
        : null,
      waveConfiguration: implemented ? { id: 'VERDUN_25', count: 25 } : null,
      gameplayAbstractionNote: implemented
        ? '7 處陣地、25 波與戰地資源是遊戲抽象，不是歷史戰鬥時序。'
        : '規劃資料；未製作波次、部隊數值或獎勵。',
      rewardConfig: implemented
        ? { supplies: 100, parts: 20, technology: 5 }
        : null,
      implemented,
    };
  },
);
export const scenarioById = (id: string) =>
  SCENARIOS.find((s) => s.scenarioId === id);
export const VERDUN_SCENARIO = scenarioById(VERDUN_SCENARIO_ID)!;
export function scenarioErrors(s: BattleScenarioData): string[] {
  const battle = battleById(s.battleId),
    errors: string[] = [];
  if (
    !battle ||
    !validDate(s.date) ||
    s.date < battle.startDate ||
    s.date > battle.endDate
  )
    return ['戰役日期無效'];
  if (s.playableFaction === s.opposingFaction || !s.opposingNations.length)
    errors.push('敵我陣營無效');
  for (const [id, faction] of [
    [s.playableNation, s.playableFaction],
    ...s.opposingNations.map((id) => [id, s.opposingFaction]),
  ] as [NationId, FactionId][]) {
    if (
      !isNationActiveOnDate(id, s.date) ||
      nationById(id)?.factionId !== faction ||
      !battle.participatingNations.includes(id)
    )
      errors.push(`${id} 不符合此日期、陣營或戰役參戰名單`);
  }
  return errors;
}
export function assertPlayableScenario(
  id: string,
  faction: FactionId,
  nation: NationId,
  year: WarYear,
) {
  const s = scenarioById(id);
  if (!s || !s.implemented || !s.waveConfiguration || !s.rewardConfig)
    throw new Error('此戰役尚未開放。');
  if (
    s.playableFaction !== faction ||
    s.playableNation !== nation ||
    Number(s.date.slice(0, 4)) !== year ||
    scenarioErrors(s).length
  )
    throw new Error('陣營、國家或日期不符合本次任務。');
  return s;
}
export interface CampaignNavigation {
  selectedFaction: FactionId;
  selectedYear: WarYear;
  selectedNation: NationId | null;
  selectedTheatre: TheatreId | 'ALL';
  selectedScenario: string | null;
}
export function normalizeNavigation(
  raw: Partial<CampaignNavigation>,
): CampaignNavigation {
  const selectedFaction =
    raw.selectedFaction === 'CENTRAL_POWERS' ? 'CENTRAL_POWERS' : 'ENTENTE';
  const selectedYear = YEARS.includes(raw.selectedYear as WarYear)
    ? (raw.selectedYear as WarYear)
    : 1916;
  const pool = SCENARIOS.filter(
    (s) =>
      s.playableFaction === selectedFaction &&
      Number(s.date.slice(0, 4)) === selectedYear,
  );
  const selectedNation = activeNations(selectedFaction, selectedYear).some(
    (n) => n.id === raw.selectedNation,
  )
    ? raw.selectedNation!
    : null;
  const selectedTheatre = pool.some(
    (s) => battleById(s.battleId).theatre === raw.selectedTheatre,
  )
    ? (raw.selectedTheatre as TheatreId)
    : 'ALL';
  const selectedScenario =
    pool.find(
      (s) =>
        s.scenarioId === raw.selectedScenario &&
        (!selectedNation || s.playableNation === selectedNation) &&
        (selectedTheatre === 'ALL' ||
          battleById(s.battleId).theatre === selectedTheatre),
    )?.scenarioId ?? null;
  return {
    selectedFaction,
    selectedYear,
    selectedNation,
    selectedTheatre,
    selectedScenario,
  };
}
export interface NationUnitVariantData {
  id: string;
  archetypeId: UnitArchetypeId;
  nationId: NationId;
  factionId: FactionId;
  availableFromDate: string;
  artAsset: string | null;
  atlasIndex: number | null;
  uniformProfile: string;
  audioProfile: string | null;
  implemented: boolean;
}
export const UNIT_VARIANTS: NationUnitVariantData[] = NATIONS.flatMap((n) =>
  (['RIFLE', 'MG', 'ARTILLERY', 'ENGINEER'] as UnitArchetypeId[]).map(
    (archetypeId, atlasIndex) => ({
      id: `${n.id}_${archetypeId}`,
      archetypeId,
      nationId: n.id,
      factionId: n.factionId,
      availableFromDate: n.warEntryDate,
      artAsset: n.id === 'FRANCE' ? '/wwi/formations.png' : null,
      atlasIndex: n.id === 'FRANCE' ? atlasIndex : null,
      uniformProfile: n.uniformVisualProfile,
      audioProfile: n.id === 'FRANCE' ? 'PROCEDURAL_FR' : null,
      implemented: n.id === 'FRANCE',
    }),
  ),
);
export function unitVariantForScenario(
  unit: UnitArchetypeId,
  scenario: BattleScenarioData,
) {
  return UNIT_VARIANTS.find(
    (v) =>
      v.archetypeId === unit &&
      v.nationId === scenario.playableNation &&
      v.factionId === scenario.playableFaction &&
      v.implemented &&
      v.availableFromDate <= scenario.date,
  );
}
export type OrderAvailability =
  | { scope: 'UNIVERSAL' }
  | { scope: 'FACTION'; factionId: FactionId }
  | { scope: 'NATION'; nationId: NationId };
export function orderAvailable(
  availability: OrderAvailability,
  scenario: BattleScenarioData,
) {
  return (
    availability.scope === 'UNIVERSAL' ||
    (availability.scope === 'FACTION'
      ? availability.factionId === scenario.playableFaction
      : availability.nationId === scenario.playableNation)
  );
}
