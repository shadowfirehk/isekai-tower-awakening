'use client';
import { ArrowLeft, CircleDot, Globe2, LockKeyhole, Shield, ShieldCheck, Sparkles, Swords } from 'lucide-react';
import { CareerData, PlayerSave, StatModifier } from '@/lib/game/types';

interface Props{save:PlayerSave;career:CareerData|null;modifiers:StatModifier[];onBack:()=>void;}
export function CharacterScreen({save,career,modifiers,onBack}:Props){return <section className="character-screen phase-screen" aria-label="角色與職業資料">
  <header className="phase-header character-header"><button onClick={onBack}><ArrowLeft/>返回主畫面</button><div><p>CHARACTER PROFILE · EARTH CAREER</p><h1>覺醒者檔案</h1></div><span><i/>EARTH LINK · ACTIVE</span></header>
  <div className="character-stage"><div className="character-rift"/><div className="character-hero-art" aria-hidden="true"/><div className="character-nameplate"><span>PLAYER #0001</span><h2>{career?.displayName??'未覺醒'}</h2><p>{career?.englishName??'UNAWAKENED'}</p></div><div className="character-level-ring"><small>LEVEL</small><b>{String(save.playerLevel).padStart(2,'0')}</b><span>AGE {save.playerAge}</span></div></div>
  <aside className="character-dossier"><div className="character-id"><ShieldCheck/><span><small>PERMANENT EARTH CAREER</small><h2>{career?.displayName??'職業未覺醒'}</h2><p>{career?.classification??'AWAKENING PENDING'}</p></span><em>SSR / EARTH</em></div><p className="character-lore">「{career?.description??'命運迴路尚未完成。'}」</p>
    <section className="career-passive-v2"><div><Shield/><span><small>CAREER PASSIVE</small><h3>{career?.passiveName??'未啟動'}</h3></span></div><strong>所有炮台防禦 <b>+10%</b></strong><p>{career?.passiveDescription}</p></section>
    <div className="character-stat-matrix"><span><small>REALM</small><b>EARTH</b></span><span><small>CAREER ID</small><b>WALL GUARDIAN</b></span><span><small>DEFENSE LINK</small><b>1.10×</b></span><span><small>STATUS</small><b>PERMANENT</b></span></div>
    <section className="modifier-stack"><header><Sparkles/><span><small>ACTIVE MODIFIERS</small><b>職業加成管線</b></span></header>{modifiers.map(mod=><p key={`${mod.sourceId}-${mod.type}`}><span>{mod.type}</span><em>{mod.source}</em><b>+{Math.round(mod.value*100)}%</b></p>)}</section>
    <div className="realm-slot-list"><article className="active"><Globe2/><span><small>REALM 01</small><b>EARTH · 地球</b></span><em><CircleDot/>ACTIVE</em></article><article><Swords/><span><small>REALM 02</small><b>GALAXY · 銀河</b></span><em><LockKeyhole/>LOCKED</em></article><article><Sparkles/><span><small>REALM 03</small><b>UNIVERSE · 宇宙</b></span><em><LockKeyhole/>LOCKED</em></article></div>
  </aside>
</section>}
