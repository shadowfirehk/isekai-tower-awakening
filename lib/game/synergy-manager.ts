import { BuildTag, TOWER_SYNERGIES } from './battle-depth';
import { TowerId } from './types';

export const SynergyManager = {
  evaluate(deployed: TowerId[]) {
    const set = new Set(deployed);
    return TOWER_SYNERGIES.filter((synergy) =>
      synergy.requiredTowerIDs.every((id) => set.has(id)),
    );
  },
  tags(deployed: TowerId[]): BuildTag[] {
    return [...new Set(this.evaluate(deployed).flatMap((item) => item.tags))];
  },
};
