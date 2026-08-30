'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive,
  ChevronRight,
  CircleDot,
  Gem,
  Globe2,
  Hexagon,
  LockKeyhole,
  Mail,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  TowerControl,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Stage = 'menu' | 'preparation' | 'charging' | 'candidates' | 'reveal';

const CAREERS = {
  'wall-guardian': {
    id: 'wall-guardian',
    name: '壁壘守衛者',
    englishName: 'WALL GUARDIAN',
    role: '防禦 / 續航 / 清場',
    rarity: 'EARTH CAREER',
    passive: ['地球炮台防禦 +30%', '炮台生命 +25%', '受到傷害減免 15%'],
    talent: '每擊殺 10 隻魔物，觸發炮台回血',
  },
} as const;

type CareerId = keyof typeof CAREERS;
const SAVE_KEY = 'rng-isekai-tower-save-v1';
const PENDING_KEY = 'rng-isekai-tower-pending-v1';

// The presentation only receives a CareerId. It never decides the outcome.
const RNGManager = {
  requestEarthAwakening(): CareerId {
    return 'wall-guardian';
  },
};

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
    // Audio is an optional presentation hook; gameplay must remain unaffected.
  }
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('menu');
  const [careerId, setCareerId] = useState<CareerId | null>(null);
  const [resultId, setResultId] = useState<CareerId | null>(null);
  const [toast, setToast] = useState('');
  const [mounted, setMounted] = useState(false);
  const drawLocked = useRef(false);
  const career = careerId ? CAREERS[careerId] : null;
  const result = resultId ? CAREERS[resultId] : null;

  useEffect(() => {
    const restore = window.setTimeout(() => {
      const saved = localStorage.getItem(SAVE_KEY) as CareerId | null;
      const pending = localStorage.getItem(PENDING_KEY) as CareerId | null;
      if (saved && CAREERS[saved]) setCareerId(saved);
      if (!saved && pending && CAREERS[pending]) {
        setResultId(pending);
        setStage('reveal');
        drawLocked.current = true;
      }
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (stage !== 'charging') return;
    const next = window.setTimeout(() => setStage('candidates'), 2300);
    return () => window.clearTimeout(next);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'candidates') return;
    const next = window.setTimeout(() => {
      setStage('reveal');
      playTone('reveal');
    }, 2800);
    return () => window.clearTimeout(next);
  }, [stage]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const beginDraw = useCallback(() => {
    if (drawLocked.current || careerId) return;
    drawLocked.current = true;
    const id = RNGManager.requestEarthAwakening();
    setResultId(id);
    localStorage.setItem(PENDING_KEY, id);
    playTone('charge');
    setStage('charging');
  }, [careerId]);

  const acceptCareer = useCallback(() => {
    if (!resultId) return;
    localStorage.setItem(SAVE_KEY, resultId);
    localStorage.removeItem(PENDING_KEY);
    setCareerId(resultId);
    setStage('menu');
    setToast('永久覺醒完成 · 職業已寫入命運檔案');
    drawLocked.current = true;
    playTone('click');
  }, [resultId]);

  const handleNav = (index: number) => {
    playTone('click');
    const item = NAV_ITEMS[index];
    if (index === 4) {
      if (careerId) {
        setResultId(careerId);
        setStage('reveal');
      } else setStage('preparation');
      return;
    }
    if (!careerId) {
      setToast(`${item.zh}尚未解鎖 · 請先完成職業覺醒`);
      return;
    }
    if (!item.unlocked) setToast(`${item.zh}將於後續世界進度開放`);
    else setToast(`${item.zh}系統已連線 · 本次展示聚焦主畫面與覺醒流程`);
  };

  if (!mounted) return <main className="loading-screen"><Sparkles /><span>CONNECTING TO EARTH...</span></main>;

  return (
    <main className={`game-shell ${career ? 'is-awakened' : ''}`}>
      <div className="scene" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="rift-glow" aria-hidden="true" />
      <div className="particle-field" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}</div>

      <header className="topbar">
        <section className="player-card cut-panel" aria-label="玩家資訊">
          <div className="player-mark"><span>01</span></div>
          <div>
            <p className="eyebrow">PLAYER</p>
            <h1>星野 悠真</h1>
            <p className="meta"><b>Lv.1</b><span>AGE 17</span></p>
          </div>
          <div className="status-tag"><i /> {career ? '已覺醒' : '未覺醒'}</div>
        </section>

        <section className="resources" aria-label="資源">
          <span><Gem /> 2,460</span>
          <span><Hexagon /> 18,200</span>
          <button className="icon-button" aria-label="信箱" onClick={() => setToast('沒有新的異界通訊')}><Mail /></button>
          <button className="icon-button" aria-label="設定" onClick={() => setToast('音效：開啟 · 動畫品質：高')}><Settings /></button>
        </section>
      </header>

      <div className="world-label">
        <span>WORLD 01</span>
        <strong>EARTH · 地球</strong>
        <small>DIMENSIONAL BREACH / ACTIVE</small>
      </div>

      <section className={`career-panel cut-panel ${career ? 'career-owned' : ''}`} aria-label="職業覺醒">
        <div className="panel-heading"><span>CAREER</span><small>{career ? '永久職業' : '覺醒狀態'}</small></div>
        <div className="career-empty">
          <div className="career-symbol">{career ? <ShieldCheck /> : <Shield />}</div>
          <div>
            <p>{career ? career.englishName : 'UNAWAKENED'}</p>
            <h2>{career ? career.name : '職業未覺醒'}</h2>
            <span>{career ? 'PERMANENT · 永久擁有' : '命運迴路已準備完成'}</span>
          </div>
        </div>
        <Button className="awaken-button" size="lg" onClick={() => { playTone('click'); if (career) handleNav(4); else setStage('preparation'); }}>
          {career ? <ShieldCheck /> : <Sparkles />}
          <span><b>{career ? '查看' : '覺醒'}</b><small>{career ? 'VIEW CAREER' : 'AWAKEN'}</small></span>
        </Button>
      </section>

      <aside className="mission-stack">
        <section className="prep-card cut-panel">
          <div className="radial"><b>05</b><span>/ 05</span></div>
          <div><p className="eyebrow">PREPARATION</p><h2>{career ? '覺醒儀式完成' : '覺醒準備完成'}</h2><span className="available">{career ? 'CAREER ACQUIRED' : 'TUTORIAL AVAILABLE'}</span></div>
        </section>
        <section className="quest-card cut-panel">
          <p className="eyebrow">MAIN QUEST <b>主線任務</b></p>
          <h2>{career ? '前往新手副本' : '完成覺醒儀式'}</h2>
          <p>{career ? '壁壘守衛者，城市防衛線正在等待你。' : '踏入異界裂隙，接受地球的職業選擇。'}</p>
          <div className="quest-progress"><span style={{ width: career ? '100%' : '5%' }} /><b>{career ? '1 / 1' : '0 / 1'}</b></div>
        </section>
      </aside>

      <nav className="bottom-nav" aria-label="主要導覽">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const locked = !career || !item.unlocked;
          return <button key={item.en} className={index === 4 ? 'active' : ''} onClick={() => handleNav(index)}><Icon /><span>{item.zh}<small>{item.en}</small></span>{locked && index !== 4 && <em><LockKeyhole /> LOCK</em>}</button>;
        })}
      </nav>

      <div className="system-line"><span /> RIFT SIGNAL 87.4% <b>ONLINE</b></div>
      {toast && <output className="toast" aria-live="polite"><CircleDot /> {toast}</output>}

      {stage !== 'menu' && (
        <section className={`awakening-overlay stage-${stage}`} aria-label="職業覺醒演出">
          <div className="space-layer" aria-hidden="true" />
          <div className="magic-circle" aria-hidden="true"><i /><i /><i /></div>
          <div className="energy-core" aria-hidden="true" />
          {stage === 'preparation' && (
            <div className="prep-dialog cut-panel">
              <button className="overlay-close" aria-label="關閉" onClick={() => setStage('menu')}><X /></button>
              <p className="eyebrow">CAREER AWAKENING · EARTH</p>
              <div className="rift-emblem"><Sparkles /></div>
              <h2>命運覺醒</h2>
              <p>裂隙將為你選擇唯一的地球職業。結果會永久寫入命運檔案，無法重新抽取。</p>
              <div className="warning-line"><LockKeyhole /> PERMANENT SELECTION</div>
              <Button className="awaken-button large" onClick={beginDraw}><span><b>開始覺醒</b><small>ENTER THE RIFT</small></span><ChevronRight /></Button>
            </div>
          )}
          {stage === 'charging' && (
            <div className="sequence-copy"><span>PHASE 01</span><h2>裂隙同步中</h2><p>DIMENSIONAL RIFT SYNCHRONIZING</p><div className="sequence-bar"><i /></div></div>
          )}
          {stage === 'candidates' && (
            <div className="candidate-stage">
              <div className="silhouettes" aria-hidden="true"><i /><i /><i /><i /><i /></div>
              <div className="sequence-copy"><span>PHASE 02</span><h2>命運迴路鎖定</h2><p>CAREER SIGNATURE DETECTED</p></div>
            </div>
          )}
          {stage === 'reveal' && result && (
            <div className="reveal-stage">
              <div className="reveal-art" aria-hidden="true" />
              <div className="reveal-shade" aria-hidden="true" />
              <div className="reveal-copy">
                <p className="eyebrow">{result.rarity} · AWAKENING COMPLETE</p>
                <span className="english-name">{result.englishName}</span>
                <h2>{result.name}</h2>
                <p className="role-line">{result.role}</p>
                <div className="ability-grid">
                  <div><small>PASSIVE · 守護協定</small>{result.passive.map(line => <p key={line}>{line}</p>)}</div>
                  <div><small>TALENT · 堡壘循環</small><p>{result.talent}</p></div>
                </div>
                <div className="permanent-badge"><ShieldCheck /><span><b>永久覺醒</b><small>PERMANENTLY AWAKENED</small></span></div>
                {careerId ? <Button className="awaken-button large" onClick={() => setStage('menu')}>返回主畫面</Button> : <Button className="awaken-button large" onClick={acceptCareer}><span><b>接受命運</b><small>ACCEPT</small></span><ChevronRight /></Button>}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
