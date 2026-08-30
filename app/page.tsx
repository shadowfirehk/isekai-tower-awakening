'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ChevronRight,
  CircleDot,
  Code2,
  Gem,
  Globe2,
  Hexagon,
  LockKeyhole,
  Mail,
  RotateCcw,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  TowerControl,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AwakeningController } from '@/lib/game/awakening-controller';
import { getCareerById } from '@/lib/game/careers';
import { getCareerModifiers, getDefenseMultiplier } from '@/lib/game/passives';
import { advancePreparation, canAwaken, PREPARATION_REQUIRED_DAYS, unlockAwakening } from '@/lib/game/progression';
import { RNGManager } from '@/lib/game/rng-manager';
import { createNewSave, SaveManager } from '@/lib/game/save-manager';
import { GameState, PlayerSave, RealmType } from '@/lib/game/types';

type Stage = 'menu' | 'preparation' | 'charging' | 'candidates' | 'reveal' | 'career';

const NAV_ITEMS = [
  { zh: '戰鬥', en: 'BATTLE', icon: Swords, unlocked: true },
  { zh: '炮台', en: 'TOWER', icon: TowerControl, unlocked: true },
  { zh: '背包', en: 'INVENTORY', icon: Archive, unlocked: false },
  { zh: '世界', en: 'WORLD', icon: Globe2, unlocked: false },
  { zh: '職業', en: 'CAREER', icon: Sparkles, unlocked: true },
];

function playTone(kind: 'click' | 'charge' | 'reveal') {
  try {
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === 'reveal' ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(kind === 'click' ? 420 : kind === 'charge' ? 150 : 260, context.currentTime);
    if (kind === 'reveal') oscillator.frequency.exponentialRampToValueAtTime(920, context.currentTime + .55);
    gain.gain.setValueAtTime(.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + (kind === 'reveal' ? .8 : .12));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === 'reveal' ? .8 : .13));
  } catch {
    // Optional presentation hook. Gameplay remains independent from audio.
  }
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('menu');
  const [save, setSave] = useState<PlayerSave>(() => createNewSave());
  const [toast, setToast] = useState('');
  const [mounted, setMounted] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const career = useMemo(() => getCareerById(save.earthCareer), [save.earthCareer]);
  const modifiers = useMemo(() => getCareerModifiers(save), [save]);
  const awakeningAvailable = canAwaken(save);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const loaded = SaveManager.load();
      setSave(loaded.save);
      setDebugMode(new URLSearchParams(window.location.search).get('dev') === '1');
      if (loaded.warning) setToast(loaded.warning);
      if (loaded.save.earthCareer && !loaded.save.awakeningRevealAcknowledged) setStage('reveal');
      setMounted(true);
    }, 0);
    const toggleDebug = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') setDebugMode(value => !value);
    };
    window.addEventListener('keydown', toggleDebug);
    return () => {
      window.clearTimeout(restore);
      window.removeEventListener('keydown', toggleDebug);
    };
  }, []);

  useEffect(() => {
    if (stage !== 'charging') return;
    const next = window.setTimeout(() => setStage('candidates'), 1800);
    return () => window.clearTimeout(next);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'candidates') return;
    const next = window.setTimeout(() => {
      setStage('reveal');
      playTone('reveal');
    }, 2200);
    return () => window.clearTimeout(next);
  }, [stage]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const persist = useCallback((next: PlayerSave, successMessage?: string) => {
    const result = SaveManager.save(next);
    if (!result.ok) {
      setToast(result.error);
      return false;
    }
    setSave(result.save);
    if (successMessage) setToast(successMessage);
    return true;
  }, []);

  const handleAdvanceDay = () => {
    playTone('click');
    const next = advancePreparation(save);
    persist(next, next.awakeningUnlocked ? 'DAY 05 完成 · 覺醒儀式已解鎖' : `準備進度推進至 DAY ${String(next.preparationDay).padStart(2, '0')}`);
  };

  const openAwakening = () => {
    playTone('click');
    if (career) {
      setStage('career');
      return;
    }
    if (!awakeningAvailable) {
      setToast(`覺醒尚未解鎖 · 還需完成 ${PREPARATION_REQUIRED_DAYS - save.preparationDay} 日準備`);
      return;
    }
    setStage('preparation');
  };

  const beginDraw = useCallback(() => {
    const result = AwakeningController.beginEarthAwakening(save);
    if (!result.ok) {
      setToast(result.error);
      return;
    }
    // The permanent result is already stored before presentation begins.
    setSave(result.save);
    playTone('charge');
    setStage('charging');
  }, [save]);

  const acceptCareer = useCallback(() => {
    const result = AwakeningController.acknowledgeReveal(save);
    if (!result.ok) {
      setToast(result.error);
      return;
    }
    setSave(result.save);
    setStage('menu');
    setToast('永久覺醒完成 · 壁壘意志已啟用');
    playTone('click');
  }, [save]);

  const handleNav = (index: number) => {
    playTone('click');
    const item = NAV_ITEMS[index];
    if (index === 4) {
      if (career) setStage('career');
      else openAwakening();
      return;
    }
    if (!career) {
      setToast(`${item.zh}尚未解鎖 · 請先完成職業覺醒`);
      return;
    }
    if (!item.unlocked) setToast(`${item.zh}將於後續世界進度開放`);
    else setToast(`${item.zh}入口已連線 · Phase 2 尚未實作戰鬥內容`);
  };

  const debugReset = () => {
    const next = SaveManager.reset();
    setSave(next);
    setStage('menu');
    setToast('DEBUG · 本機存檔已重設');
  };

  const debugUnlock = () => persist(unlockAwakening(save), 'DEBUG · 覺醒已解鎖');

  const debugDuplicateRoll = () => {
    const result = RNGManager.rollCareer(RealmType.Earth, save);
    setToast(result.ok ? `DEBUG ERROR · 非預期抽到 ${result.careerId}` : `DEBUG PASS · ${result.error}`);
  };

  const debugRecovery = () => {
    if (!save.earthCareer) {
      setToast('DEBUG · 尚無職業可測試恢復');
      return;
    }
    const persisted = SaveManager.save({ ...save, awakeningRevealAcknowledged: false, currentGameState: GameState.CareerObtained });
    if (!persisted.ok) {
      setToast(persisted.error);
      return;
    }
    window.location.reload();
  };

  if (!mounted) return <main className="loading-screen"><Sparkles /><span>LOADING PLAYER SAVE...</span></main>;

  return (
    <main className={`game-shell ${career ? 'is-awakened' : ''}`}>
      <div className="scene" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="rift-glow" aria-hidden="true" />
      <div className="particle-field" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}</div>

      <header className="topbar">
        <section className="player-card cut-panel" aria-label="玩家資訊">
          <div className="player-mark"><span>01</span></div>
          <div><p className="eyebrow">PLAYER</p><h1>PLAYER #0001</h1><p className="meta"><b>Lv.{save.playerLevel}</b><span>AGE {save.playerAge}</span></p></div>
          <div className="status-tag"><i /> {career ? '已覺醒' : save.awakeningUnlocked ? '可覺醒' : '準備中'}</div>
        </section>
        <section className="resources" aria-label="資源">
          <span><Gem /> {save.materials.toLocaleString()}</span><span><Hexagon /> {save.currency.toLocaleString()}</span>
          <button className="icon-button" aria-label="信箱" onClick={() => setToast('沒有新的異界通訊')}><Mail /></button>
          <button className="icon-button" aria-label="設定" onClick={() => setToast('音效：開啟 · 動畫品質：高')}><Settings /></button>
        </section>
      </header>

      <div className="world-label"><span>WORLD 01</span><strong>EARTH · 地球</strong><small>DIMENSIONAL BREACH / ACTIVE</small></div>

      <section className={`career-panel cut-panel ${career ? 'career-owned' : ''}`} aria-label="職業覺醒">
        <div className="panel-heading"><span>CAREER</span><small>{career ? '永久職業' : '覺醒狀態'}</small></div>
        <div className="career-empty">
          <div className="career-symbol">{career ? <ShieldCheck /> : <Shield />}</div>
          <div><p>{career?.englishName ?? 'UNAWAKENED'}</p><h2>{career?.displayName ?? '職業未覺醒'}</h2><span>{career ? `${career.passiveName} · ACTIVE` : awakeningAvailable ? '命運迴路已準備完成' : `PREPARATION DAY ${String(save.preparationDay).padStart(2, '0')}`}</span></div>
        </div>
        <Button className="awaken-button" size="lg" onClick={openAwakening} aria-disabled={!career && !awakeningAvailable}>
          {career ? <ShieldCheck /> : awakeningAvailable ? <Sparkles /> : <LockKeyhole />}
          <span><b>{career ? '職業' : awakeningAvailable ? '覺醒' : '未解鎖'}</b><small>{career ? 'CAREER UI' : awakeningAvailable ? 'AWAKEN' : 'LOCKED'}</small></span>
        </Button>
      </section>

      <aside className="mission-stack">
        <section className="prep-card cut-panel">
          <div className="radial"><b>{String(save.preparationDay).padStart(2, '0')}</b><span>/ 05</span></div>
          <div className="prep-copy"><p className="eyebrow">PREPARATION</p><h2>{career ? '覺醒儀式完成' : awakeningAvailable ? '覺醒準備完成' : '17歲準備期'}</h2><span className="available">{career ? 'CAREER ACQUIRED' : awakeningAvailable ? 'AWAKENING AVAILABLE' : save.currentGameState}</span></div>
          {!career && !awakeningAvailable && <button className="day-button" onClick={handleAdvanceDay}>完成今日準備 <ChevronRight /></button>}
        </section>
        <section className="quest-card cut-panel">
          <p className="eyebrow">MAIN QUEST <b>主線任務</b></p><h2>{career ? '前往新手副本' : awakeningAvailable ? '完成覺醒儀式' : '完成五日準備'}</h2>
          <p>{career ? '壁壘守衛者，城市防衛線正在等待你。' : awakeningAvailable ? '踏入異界裂隙，接受地球的職業選擇。' : '完成遊戲內準備日，解鎖 17 歲覺醒。'}</p>
          <div className="quest-progress"><span style={{ width: `${career ? 100 : save.preparationDay * 20}%` }} /><b>{career ? '1 / 1' : `${save.preparationDay} / 5`}</b></div>
        </section>
      </aside>

      <nav className="bottom-nav" aria-label="主要導覽">
        {NAV_ITEMS.map((item, index) => { const Icon = item.icon; const locked = !career || !item.unlocked; return <button key={item.en} className={index === 4 ? 'active' : ''} onClick={() => handleNav(index)}><Icon /><span>{item.zh}<small>{item.en}</small></span>{locked && index !== 4 && <em><LockKeyhole /> LOCK</em>}</button>; })}
      </nav>
      <div className="system-line"><span /> GAME STATE <b>{save.currentGameState}</b></div>
      {toast && <output className="toast" aria-live="polite"><CircleDot /> {toast}</output>}

      {debugMode && (
        <aside className="debug-panel" aria-label="開發者工具">
          <p><Code2 /> DEV · PHASE 2</p>
          <dl><div><dt>STATE</dt><dd>{save.currentGameState}</dd></div><div><dt>DAY</dt><dd>{save.preparationDay}/5</dd></div><div><dt>EARTH RNG</dt><dd>{save.earthCareerRngUsed ? 'USED' : 'READY'}</dd></div><div><dt>CAREER</dt><dd>{save.earthCareer ?? 'NONE'}</dd></div><div><dt>DEF MULTI</dt><dd>{getDefenseMultiplier(save).toFixed(2)}×</dd></div></dl>
          <div className="debug-actions"><button onClick={handleAdvanceDay}>+ DAY</button><button onClick={debugUnlock}>UNLOCK</button><button onClick={debugDuplicateRoll}>DUPLICATE TEST</button><button onClick={debugRecovery}>RELOAD RECOVERY</button><button onClick={() => setStage('career')}>CAREER UI</button><button className="danger" onClick={debugReset}><RotateCcw /> RESET SAVE</button></div>
        </aside>
      )}

      {(stage === 'preparation' || stage === 'charging' || stage === 'candidates' || stage === 'reveal') && (
        <section className={`awakening-overlay stage-${stage}`} aria-label="職業覺醒演出">
          <div className="space-layer" aria-hidden="true" /><div className="magic-circle" aria-hidden="true"><i /><i /><i /></div><div className="energy-core" aria-hidden="true" />
          {stage === 'preparation' && <div className="prep-dialog cut-panel"><button className="overlay-close" aria-label="關閉" onClick={() => setStage('menu')}><X /></button><p className="eyebrow">CAREER AWAKENING · EARTH</p><div className="rift-emblem"><Sparkles /></div><h2>命運覺醒</h2><p>結果會先永久保存，之後才播放揭曉演出。地球職業每個存檔僅能取得一次。</p><div className="warning-line"><LockKeyhole /> ONE PERMANENT EARTH CAREER</div><Button className="awaken-button large" onClick={beginDraw}><span><b>啟動職業 RNG</b><small>ENTER THE RIFT</small></span><ChevronRight /></Button></div>}
          {stage === 'charging' && <div className="sequence-copy"><span>RESULT SAVED · PHASE 01</span><h2>裂隙同步中</h2><p>DIMENSIONAL RIFT SYNCHRONIZING</p><div className="sequence-bar"><i /></div></div>}
          {stage === 'candidates' && <div className="candidate-stage"><div className="silhouettes" aria-hidden="true"><i /><i /><i /><i /><i /></div><div className="sequence-copy"><span>PHASE 02</span><h2>命運迴路鎖定</h2><p>DISPLAYING PRE-SAVED CAREER SIGNATURE</p></div></div>}
          {stage === 'reveal' && career && <div className="reveal-stage"><div className="reveal-art" aria-hidden="true" /><div className="reveal-shade" aria-hidden="true" /><div className="reveal-copy"><p className="eyebrow">{career.classification} · AWAKENING COMPLETE</p><span className="english-name">{career.englishName}</span><h2>{career.displayName}</h2><p className="role-line">「{career.description}」</p><div className="ability-grid"><div><small>PASSIVE · {career.passiveName}</small><p>{career.passiveDescription}</p><p>Modifier: DEFENSE_PERCENT +{Math.round((career.modifiers[0]?.value ?? 0) * 100)}%</p></div><div><small>STATUS · MODIFIER PIPELINE</small><p>來源：CAREER</p><p>狀態：ACTIVE</p></div></div><div className="permanent-badge"><ShieldCheck /><span><b>永久覺醒</b><small>EARTH RNG LOCKED</small></span></div><Button className="awaken-button large" onClick={save.awakeningRevealAcknowledged ? () => setStage('menu') : acceptCareer}><span><b>{save.awakeningRevealAcknowledged ? '返回主畫面' : '確認職業'}</b><small>{save.awakeningRevealAcknowledged ? 'RETURN' : 'ACKNOWLEDGE'}</small></span><ChevronRight /></Button></div></div>}
        </section>
      )}

      {stage === 'career' && (
        <section className="career-overlay" aria-label="職業資料庫">
          <div className="career-screen">
            <header><div><p className="eyebrow">CAREER ARCHIVE</p><h2>命運職業檔案</h2></div><button aria-label="關閉職業介面" onClick={() => setStage('menu')}><X /></button></header>
            <div className="realm-tabs"><span className="active">EARTH</span><span>GALAXY · LOCKED</span><span>UNIVERSE · LOCKED</span></div>
            <div className="career-detail">
              <div className="career-art-card"><div /><span>{career ? 'PERMANENT' : 'UNAWAKENED'}</span></div>
              <div className="career-data">
                {career ? <><p className="eyebrow">{career.classification}</p><span className="english-name">{career.englishName}</span><h2>{career.displayName}</h2><p className="career-description">「{career.description}」</p><section><small>CAREER PASSIVE</small><h3>{career.passiveName}</h3><p>{career.passiveDescription}</p></section><section><small>ACTIVE STAT MODIFIERS</small>{modifiers.map(modifier => <p key={`${modifier.sourceId}-${modifier.type}`} className="modifier-row"><span>{modifier.type}</span><b>+{Math.round(modifier.value * 100)}%</b></p>)}</section><div className="career-status"><ShieldCheck /> STATUS · ACTIVE / EARTH RNG · PERMANENTLY USED</div></> : <><p className="eyebrow">EARTH CAREER</p><h2>尚未覺醒</h2><p className="career-description">完成五日準備後，進行唯一一次的地球職業覺醒。</p><Button className="awaken-button" onClick={openAwakening}>前往覺醒</Button></>}
              </div>
            </div>
            <div className="locked-realms"><article><Globe2 /><div><small>REALM 02</small><h3>GALAXY</h3><p>星爆獵殺者資料已保留，玩法尚未開放。</p></div><LockKeyhole /></article><article><CircleDot /><div><small>REALM 03</small><h3>UNIVERSE</h3><p>混沌法則主宰資料已保留，玩法尚未開放。</p></div><LockKeyhole /></article></div>
          </div>
        </section>
      )}
    </main>
  );
}
