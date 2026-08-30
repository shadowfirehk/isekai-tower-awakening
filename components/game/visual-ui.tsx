import { Activity, Crown, Gauge, HeartPulse, Shield, Sparkles, Swords, TowerControl, Zap } from 'lucide-react';
import { BOSS_VISUAL_PROFILES, ENEMY_VISUAL_PROFILES, EnemyRole, tierStyleVars } from '@/lib/game/visual-config';
import { EarthTierId, EnemyId, TowerId } from '@/lib/game/types';
import { TOWER_CATALOG } from '@/lib/game/towers';

export function TierBadge({tier}:{tier:EarthTierId}){return <span className={`tier-badge tier-${tier.toLowerCase()}`} style={tierStyleVars(tier)}><Sparkles/>{tier}</span>}
export function RoleBadge({kind}:{kind:EnemyRole}){const Icon=kind==='FAST'?Zap:kind==='ARMORED'||kind==='SHIELDED'?Shield:kind==='REGENERATING'?HeartPulse:kind==='SUPPORT'?Activity:kind==='BOSS'?Crown:kind==='ELITE'?Swords:Gauge;return <span className={`role-badge role-${kind.toLowerCase()}`}><Icon/>{kind}</span>}
export function TowerArtwork({towerID,className=''}:{towerID:TowerId;className?:string}){const index=TOWER_CATALOG[towerID].artIndex,col=index%4,row=Math.floor(index/4);return <span className={`tower-artwork ${className}`} style={{backgroundPosition:`${col*33.333}% ${row*50}%`}} aria-hidden="true"/>} 
export function EnemyArtwork({enemyID,className=''}:{enemyID:EnemyId;className?:string}){const index=ENEMY_VISUAL_PROFILES[enemyID].atlasIndex,col=index%4,row=Math.floor(index/4);return <span className={`enemy-artwork ${className}`} style={{backgroundPosition:`${col*33.333}% ${row*25}%`}} aria-hidden="true"/>} 
export function BossArtwork({tier,className=''}:{tier:EarthTierId;className?:string}){const index=BOSS_VISUAL_PROFILES[tier].atlasIndex,col=index%4,row=Math.floor(index/4);return <span className={`enemy-artwork boss-artwork ${className}`} style={{backgroundPosition:`${col*33.333}% ${row*25}%`}} aria-hidden="true"/>} 
export function TowerRole({towerID}:{towerID:TowerId}){const tower=TOWER_CATALOG[towerID];return <span className="tower-role"><TowerControl/>{tower.roleTags.join(' / ')}</span>}
