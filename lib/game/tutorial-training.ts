import { EARTH_TUTORIAL_DUNGEON, type DungeonConfig } from './dungeon-data';
import type { TowerId } from './types';

export function tutorialTraining(day: number): DungeonConfig {
  const towerID: TowerId = day === 2 ? 'EARTH_RAPID_FIRE_TURRET' : 'EARTH_BASIC_AUTO_TURRET';
  return {
    ...EARTH_TUTORIAL_DUNGEON, id: `TRAINING_DAY_${day}`, name: `第 ${day} 日實戰`,
    trainingLoadout: [towerID], topology: 'MERGE', totalWaves: 1,
    startingGold: day === 3 ? 200 : 300, minimumWaveDuration: 16,
    speedMultiplier: 0.38, goldRewardMultiplier: 1,
    waves: [{ wave: 1, boss: day === 5, bossMultiplier: 3.5, groups: day === 5
      ? [{ enemyId: 'EARTH_BOSS', count: 1, interval: 1 }]
      : [{ enemyId: day === 2 ? 'EARTH_RUNNER' : 'EARTH_GRUNT', count: day === 3 ? 12 : 6, interval: 2 }] }],
  };
}
