import {
  Activity,
  Crown,
  Gauge,
  HeartPulse,
  Shield,
  Sparkles,
  Swords,
  TowerControl,
  Zap,
} from 'lucide-react';
import {
  BOSS_VISUAL_PROFILES,
  ENEMY_VISUAL_PROFILES,
  EnemyRole,
  tierStyleVars,
} from '@/lib/game/visual-config';
import { EarthTierId, EnemyId, TowerId } from '@/lib/game/types';
import { TOWER_CATALOG } from '@/lib/game/towers';

export function TierBadge({ tier }: { tier: EarthTierId }) {
  return (
    <span
      className={`tier-badge tier-${tier.toLowerCase()}`}
      style={tierStyleVars(tier)}
    >
      <Sparkles />
      {tier}
    </span>
  );
}
export function RoleBadge({ kind }: { kind: EnemyRole }) {
  const Icon =
    kind === 'FAST'
      ? Zap
      : kind === 'ARMORED' || kind === 'SHIELDED'
        ? Shield
        : kind === 'REGENERATING'
          ? HeartPulse
          : kind === 'SUPPORT'
            ? Activity
            : kind === 'BOSS'
              ? Crown
              : kind === 'ELITE'
                ? Swords
                : Gauge;
  return (
    <span className={`role-badge role-${kind.toLowerCase()}`}>
      <Icon />
      {kind}
    </span>
  );
}
export function TowerArtwork({
  towerID,
  className = '',
  stars = 1,
  battleLevel = 1,
  branchLv3 = null,
  branchLv5 = null,
  overdrive = false,
  spawning = false,
}: {
  towerID: TowerId;
  className?: string;
  stars?: number;
  battleLevel?: number;
  branchLv3?: string | null;
  branchLv5?: string | null;
  overdrive?: boolean;
  spawning?: boolean;
}) {
  const index = TOWER_CATALOG[towerID].artIndex,
    col = index % 4,
    row = Math.floor(index / 4),
    branch3 = branchLv3?.endsWith('_A') ? 'a' : branchLv3 ? 'b' : 'none',
    branch5 = branchLv5?.endsWith('_A') ? 'a' : branchLv5 ? 'b' : 'none';
  return (
    <span
      className={`tower-artwork ${className} star-${Math.max(1, Math.min(5, stars))} battle-lv-${Math.max(1, Math.min(5, battleLevel))} branch3-${branch3} branch5-${branch5} ${overdrive ? 'visual-overdrive' : ''} ${spawning ? 'visual-spawning' : ''}`}
      style={{ backgroundPosition: `${col * 33.333}% ${row * 50}%` }}
      aria-hidden="true"
    >
      <i className="tower-visual-core" />
      <i className="tower-visual-attachment" />
      <i className="tower-visual-orbit" />
    </span>
  );
}
export function EnemyArtwork({
  enemyID,
  className = '',
}: {
  enemyID: EnemyId;
  className?: string;
}) {
  const index = ENEMY_VISUAL_PROFILES[enemyID].atlasIndex,
    col = index % 4,
    row = Math.floor(index / 4);
  return (
    <span
      className={`enemy-artwork ${className}`}
      style={{ backgroundPosition: `${col * 33.333}% ${row * 25}%` }}
      aria-hidden="true"
    />
  );
}
export function BossArtwork({
  tier,
  className = '',
}: {
  tier: EarthTierId;
  className?: string;
}) {
  const index = BOSS_VISUAL_PROFILES[tier].atlasIndex,
    col = index % 4,
    row = Math.floor(index / 4);
  return (
    <span
      className={`enemy-artwork boss-artwork ${className}`}
      style={{ backgroundPosition: `${col * 33.333}% ${row * 25}%` }}
      aria-hidden="true"
    />
  );
}
export function TowerRole({ towerID }: { towerID: TowerId }) {
  const tower = TOWER_CATALOG[towerID];
  return (
    <span className="tower-role">
      <TowerControl />
      {tower.roleTags.join(' / ')}
    </span>
  );
}
