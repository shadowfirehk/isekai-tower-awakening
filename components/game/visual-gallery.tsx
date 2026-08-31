'use client';

import {
  ArrowLeft,
  Crosshair,
  Eye,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TowerControl,
  Zap,
} from 'lucide-react';
import { EARTH_TIER_IDS, EnemyId, PlayerSave, TowerId } from '@/lib/game/types';
import { TOWER_CATALOG } from '@/lib/game/towers';
import {
  BATTLE_ENVIRONMENT_PROFILES,
  BOSS_VISUAL_PROFILES,
  ENEMY_VISUAL_PROFILES,
  TOWER_VISUAL_PROFILES,
  tierStyleVars,
} from '@/lib/game/visual-config';
import {
  BossArtwork,
  EnemyArtwork,
  RoleBadge,
  TierBadge,
  TowerArtwork,
} from './visual-ui';

const ENEMY_IDS = Object.keys(ENEMY_VISUAL_PROFILES) as EnemyId[];
const TOWER_IDS = Object.keys(TOWER_CATALOG) as TowerId[];

export function VisualGallery({
  save,
  onBack,
}: {
  save: PlayerSave;
  onBack: () => void;
}) {
  return (
    <section className="visual-gallery phase-screen" aria-label="地球視覺圖鑑">
      <header className="phase-header gallery-header">
        <button onClick={onBack}>
          <ArrowLeft />
          返回主畫面
        </button>
        <div>
          <p>EARTH VISUAL CODEX · PRODUCTION GALLERY</p>
          <h1>地球戰線視覺圖鑑</h1>
        </div>
        <span>
          <ScanLine />
          RIFT SCAN · ONLINE
        </span>
      </header>
      <main className="gallery-scroll">
        <section className="gallery-section battle-environment-gallery">
          <header>
            <div>
              <Crosshair />
              <span>
                <small>BATTLE ENVIRONMENT FAMILIES · 4</small>
                <h2>地球戰場環境系統</h2>
              </span>
            </div>
            <em>GAMEPLAY LANE · 7 NODES</em>
          </header>
          <div className="environment-gallery-grid">
            {Object.values(BATTLE_ENVIRONMENT_PROFILES).map((environment) => (
              <article key={environment.environmentID}>
                <div
                  style={{
                    backgroundImage: `url('${environment.background}')`,
                    backgroundPosition: environment.backgroundPosition,
                  }}
                >
                  <i className="gallery-lane" />
                  {Array.from({ length: 7 }, (_, index) => (
                    <b key={index} style={{ left: `${13 + index * 12}%` }} />
                  ))}
                </div>
                <footer>
                  <span>
                    <small>{environment.family}</small>
                    <strong>{environment.displayName}</strong>
                  </span>
                  <em>{environment.lightingProfile}</em>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className="gallery-section">
          <header>
            <div>
              <Sparkles />
              <span>
                <small>TOWER ARSENAL · 12 FORMS</small>
                <h2>炮塔進化全圖鑑</h2>
              </span>
            </div>
            <em>{save.ownedTowers.length} / 12 DISCOVERED</em>
          </header>
          <div className="gallery-tower-grid">
            {Object.values(TOWER_CATALOG).map((tower) => {
              const owned = save.ownedTowers.some(
                (item) => item.towerID === tower.id,
              );
              return (
                <article
                  key={tower.id}
                  className={`gallery-tower ${owned ? 'discovered' : 'undiscovered'}`}
                  style={tierStyleVars(tower.tierID)}
                >
                  <TowerArtwork towerID={tower.id} />
                  <TierBadge tier={tower.tierID} />
                  <footer>
                    <b>{tower.name}</b>
                    <small>{tower.roleTags.join(' · ')}</small>
                  </footer>
                  {!owned && (
                    <i>
                      <LockKeyhole />
                      <span>未取得資料</span>
                    </i>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="gallery-section tower-state-gallery">
          <header>
            <div>
              <TowerControl />
              <span>
                <small>STAR · BATTLE LEVEL · BRANCH VISUAL MATRIX</small>
                <h2>12 塔戰鬥狀態檢視</h2>
              </span>
            </div>
            <em>1★ → 3★ BRANCH A → 5★ BRANCH B + OD</em>
          </header>
          <div className="tower-state-grid">
            {TOWER_IDS.map((towerID) => {
              const profile = TOWER_VISUAL_PROFILES[towerID];
              return (
                <article key={towerID}>
                  <div>
                    <span>
                      <TowerArtwork towerID={towerID} stars={1} />
                      <small>1★ · BL1</small>
                    </span>
                    <span>
                      <TowerArtwork
                        towerID={towerID}
                        stars={3}
                        battleLevel={3}
                        branchLv3={`${towerID}_BL3_3_A`}
                      />
                      <small>3★ · A</small>
                    </span>
                    <span>
                      <TowerArtwork
                        towerID={towerID}
                        stars={5}
                        battleLevel={5}
                        branchLv3={`${towerID}_BL3_3_A`}
                        branchLv5={`${towerID}_BL5_5_B`}
                        overdrive
                      />
                      <small>5★ · B · OD</small>
                    </span>
                  </div>
                  <b>{TOWER_CATALOG[towerID].name}</b>
                  <small>{profile.attackVFX}</small>
                </article>
              );
            })}
          </div>
          <div className="tower-silhouette-test">
            <span>
              <ScanLine /> TOWER SILHOUETTE TEST
            </span>
            {TOWER_IDS.map((towerID) => (
              <TowerArtwork
                key={towerID}
                towerID={towerID}
                className="tower-silhouette"
              />
            ))}
          </div>
        </section>

        <section className="gallery-section battle-vfx-gallery">
          <header>
            <div>
              <Zap />
              <span>
                <small>DEPLOYMENT · ATTACK · OVERDRIVE</small>
                <h2>戰鬥辨識與特效校驗</h2>
              </span>
            </div>
            <em>READABILITY PASS</em>
          </header>
          <div>
            <article className="gallery-node-preview">
              <button className="deploy-slot deployment-node affordable">
                <i className="node-circuit" />
                <TowerControl />
                <small>DEPLOY</small>
              </button>
              <span>生產部署節點</span>
            </article>
            {['single', 'aoe', 'chain'].map((pattern) => (
              <article key={pattern} className="gallery-vfx-preview">
                <i className={`projectile pattern-${pattern}`} />
                <span>{pattern.toUpperCase()} ATTACK</span>
              </article>
            ))}
            <article className="gallery-od-preview">
              <TowerArtwork
                towerID="EARTH_SOVEREIGN_END_TURRET"
                stars={5}
                battleLevel={5}
                overdrive
              />
              <span>SOVEREIGN OVERDRIVE</span>
            </article>
          </div>
        </section>

        <section className="gallery-section">
          <header>
            <div>
              <Eye />
              <span>
                <small>RIFTBORN ENEMY ATLAS</small>
                <h2>敵人職能與輪廓辨識</h2>
              </span>
            </div>
            <em>8 COMBAT ROLES</em>
          </header>
          <div className="enemy-gallery-grid">
            {ENEMY_IDS.map((id) => {
              const visual = ENEMY_VISUAL_PROFILES[id];
              return (
                <article key={id}>
                  <EnemyArtwork enemyID={id} />
                  <div>
                    <RoleBadge kind={visual.role} />
                    <b>{id.replace('EARTH_', '')}</b>
                    <small>
                      {visual.silhouette} · {visual.movementAnimation}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="silhouette-test">
            <span>
              <ScanLine />
              SILHOUETTE TEST
            </span>
            {ENEMY_IDS.slice(0, 7).map((id) => (
              <EnemyArtwork key={id} enemyID={id} />
            ))}
          </div>
        </section>

        <section className="gallery-section">
          <header>
            <div>
              <ShieldCheck />
              <span>
                <small>EARTH BOSS EVOLUTION · 12 TIERS</small>
                <h2>裂界頭目進化譜系</h2>
              </span>
            </div>
            <em>BOSS IDENTITIES</em>
          </header>
          <div className="boss-gallery-grid">
            {EARTH_TIER_IDS.map((tier) => {
              const unlocked = save.earthRegion.tierProgress[tier].unlocked,
                profile = BOSS_VISUAL_PROFILES[tier];
              return (
                <article
                  key={tier}
                  className={unlocked ? '' : 'locked'}
                  style={tierStyleVars(tier)}
                >
                  <BossArtwork tier={tier} />
                  <TierBadge tier={tier} />
                  <div>
                    <b>{profile.name}</b>
                    <span>
                      {profile.mechanics.map((role) => (
                        <RoleBadge key={role} kind={role} />
                      ))}
                    </span>
                    <small>{profile.phaseVisuals.join(' → ')}</small>
                  </div>
                  {!unlocked && (
                    <i>
                      <LockKeyhole />
                      UNKNOWN THREAT
                    </i>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </section>
  );
}
