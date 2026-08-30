'use client';

import { ArrowLeft, Eye, LockKeyhole, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import { EARTH_TIER_IDS, EnemyId, PlayerSave } from '@/lib/game/types';
import { TOWER_CATALOG } from '@/lib/game/towers';
import { BOSS_VISUAL_PROFILES, ENEMY_VISUAL_PROFILES, tierStyleVars } from '@/lib/game/visual-config';
import { BossArtwork, EnemyArtwork, RoleBadge, TierBadge, TowerArtwork } from './visual-ui';

const ENEMY_IDS = Object.keys(ENEMY_VISUAL_PROFILES) as EnemyId[];

export function VisualGallery({save,onBack}:{save:PlayerSave;onBack:()=>void}){
  return <section className="visual-gallery phase-screen" aria-label="地球視覺圖鑑">
    <header className="phase-header gallery-header"><button onClick={onBack}><ArrowLeft/>返回主畫面</button><div><p>EARTH VISUAL CODEX · PRODUCTION GALLERY</p><h1>地球戰線視覺圖鑑</h1></div><span><ScanLine/>RIFT SCAN · ONLINE</span></header>
    <main className="gallery-scroll">
      <section className="gallery-section"><header><div><Sparkles/><span><small>TOWER ARSENAL · 12 FORMS</small><h2>炮塔進化全圖鑑</h2></span></div><em>{save.ownedTowers.length} / 12 DISCOVERED</em></header><div className="gallery-tower-grid">{Object.values(TOWER_CATALOG).map(tower=>{const owned=save.ownedTowers.some(item=>item.towerID===tower.id);return <article key={tower.id} className={`gallery-tower ${owned?'discovered':'undiscovered'}`} style={tierStyleVars(tower.tierID)}><TowerArtwork towerID={tower.id}/><TierBadge tier={tower.tierID}/><footer><b>{tower.name}</b><small>{tower.roleTags.join(' · ')}</small></footer>{!owned&&<i><LockKeyhole/><span>未取得資料</span></i>}</article>})}</div></section>
      <section className="gallery-section"><header><div><Eye/><span><small>RIFTBORN ENEMY ATLAS</small><h2>敵人職能與輪廓辨識</h2></span></div><em>8 COMBAT ROLES</em></header><div className="enemy-gallery-grid">{ENEMY_IDS.map(id=>{const visual=ENEMY_VISUAL_PROFILES[id];return <article key={id}><EnemyArtwork enemyID={id}/><div><RoleBadge kind={visual.role}/><b>{id.replace('EARTH_','')}</b><small>{visual.silhouette} · {visual.movementAnimation}</small></div></article>})}</div><div className="silhouette-test"><span><ScanLine/>SILHOUETTE TEST</span>{ENEMY_IDS.slice(0,7).map(id=><EnemyArtwork key={id} enemyID={id}/>)}</div></section>
      <section className="gallery-section"><header><div><ShieldCheck/><span><small>EARTH BOSS EVOLUTION · 12 TIERS</small><h2>裂界頭目進化譜系</h2></span></div><em>BOSS IDENTITIES</em></header><div className="boss-gallery-grid">{EARTH_TIER_IDS.map(tier=>{const unlocked=save.earthRegion.tierProgress[tier].unlocked,profile=BOSS_VISUAL_PROFILES[tier];return <article key={tier} className={unlocked?'':'locked'} style={tierStyleVars(tier)}><BossArtwork tier={tier}/><TierBadge tier={tier}/><div><b>{profile.name}</b><span>{profile.mechanics.map(role=><RoleBadge key={role} kind={role}/>)}</span><small>{profile.phaseVisuals.join(' → ')}</small></div>{!unlocked&&<i><LockKeyhole/>UNKNOWN THREAT</i>}</article>})}</div></section>
    </main>
  </section>
}
