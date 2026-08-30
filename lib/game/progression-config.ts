import { MaterialReward } from './types';

export const PROGRESSION_CONFIG = {
  levelScalingPerLevel: 0.05,
  starScalingPerStar: 0.25,
  maxTowerLevel: 10,
  maxTowerStars: 5,
  levelCosts: {
    NORMAL: [20, 40, 60, 80, 100, 120, 140, 160, 180],
  },
  starCosts: {
    NORMAL: [
      [{ materialID: 'EARTH_STAR_CORE', amount: 1 }, { materialID: 'EARTH_BASIC_MATERIAL', amount: 100 }],
      [{ materialID: 'EARTH_STAR_CORE', amount: 2 }, { materialID: 'EARTH_BASIC_MATERIAL', amount: 200 }],
      [{ materialID: 'EARTH_STAR_CORE', amount: 3 }, { materialID: 'EARTH_BASIC_MATERIAL', amount: 400 }],
      [{ materialID: 'EARTH_STAR_CORE', amount: 5 }, { materialID: 'EARTH_BASIC_MATERIAL', amount: 800 }],
    ] as MaterialReward[][],
  },
  tutorialRewards: {
    standard: [{ materialID: 'EARTH_BASIC_MATERIAL', amount: 50 }],
    firstClearBonus: [{ materialID: 'EARTH_BASIC_MATERIAL', amount: 100 }, { materialID: 'EARTH_STAR_CORE', amount: 1 }],
  } as { standard: MaterialReward[]; firstClearBonus: MaterialReward[] },
} as const;
