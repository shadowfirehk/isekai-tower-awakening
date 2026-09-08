'use client';
/* oxlint-disable next/no-img-element -- Static GitHub Pages assets have no image optimization server. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Flag,
  History,
  Pause,
  Play,
  Shield,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { publicAssetPath } from '@/lib/game/asset-path';
import { FieldAudio, type AudioCue } from '@/lib/wwi/audio';
import {
  ABSTRACTION,
  BRANCHES,
  DOCTRINES,
  FACTIONS,
  FORMATIONS,
  ORDERS,
  PATHS,
  SLOTS,
  UNIT_IDS,
  UNITS,
  VERDUN,
  type DoctrineId,
  type FactionId,
  type UnitId,
} from '@/lib/wwi/data';
import {
  loadSave,
  newSave,
  permanentBonus,
  quickResolve,
  settleRun,
  trainUnit,
  writeSave,
  selectCampaign,
  type WWISave,
} from '@/lib/wwi/save';
import { VerdunEngine, type DefensiveUnitRuntime } from '@/lib/wwi/engine';
import {
  FactionSelect,
  CampaignBrowser,
  MissionHeader,
  FactionHistory,
} from './faction-ui';
import {
  VERDUN_SCENARIO,
  VERDUN_SCENARIO_ID,
  VERDUN_WAVE_COUNT,
  assertPlayableScenario,
  nationById,
  activeNations,
  scenarioById,
  battleById,
  type WarYear,
  type BattleScenarioData,
} from '@/lib/wwi/campaign';

const art = publicAssetPath('/wwi/formations.png');
const backdrop = publicAssetPath('/wwi/verdun.png');
const fieldBackdrop = publicAssetPath('/wwi/verdun-field.png');
const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
function Sprite({
  index,
  className = '',
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`ww-sprite ${className}`}
      style={{
        backgroundImage: `url("${art}")`,
        backgroundPosition: `${((index % 4) / 3) * 100}% ${index < 4 ? 0 : 100}%`,
      }}
    />
  );
}
function HistoryPanel() {
  return (
    <div className="ww-history-text">
      <span className="ww-eyebrow">歷史資料 · HISTORICAL</span>
      <h2>凡爾登，1916</h2>
      <p>{VERDUN.history.background}</p>
      <dl>
        <dt>參戰部隊</dt>
        <dd>{VERDUN.history.participants}</dd>
        <dt>歷史結果</dt>
        <dd>{VERDUN.history.outcome}</dd>
        <dt>歷史意義</dt>
        <dd>{VERDUN.history.significance}</dd>
        <dt>軍備與戰術</dt>
        <dd>{VERDUN.history.technology}</dd>
      </dl>
      <a href={VERDUN.history.source} target="_blank" rel="noreferrer">
        資料來源：凡爾登紀念館 ↗
      </a>
      <p className="ww-note">{ABSTRACTION}</p>
    </div>
  );
}

export default function WWIApp() {
  const [save, setSave] = useState<WWISave>(newSave),
    saveRef = useRef(save);
  const [screen, setScreen] = useState<
    | 'HOME'
    | 'CAMPAIGN'
    | 'FACTIONS'
    | 'FACTION_INFO'
    | 'BRIEFING'
    | 'UNITS'
    | 'COMMANDER'
    | 'HISTORY'
    | 'RECORDS'
    | 'BATTLE'
  >('HOME');
  const [message, setMessage] = useState('');
  const faction = save.navigation.selectedFaction;
  const commanderNation = nationById(
    save.navigation.selectedNation ??
      activeNations(faction, save.navigation.selectedYear)[0].id,
  );
  const [loaded, setLoaded] = useState(false),
    [storageBlocked, setStorageBlocked] = useState(false),
    [battleKey, setBattleKey] = useState(0);
  const audio = useRef<FieldAudio | null>(null);
  useEffect(() => {
    const player = new FieldAudio();
    audio.current = player;
    const unlock = () => {
      void player.unlock();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      player.dispose();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    const configure = () =>
      audio.current?.configure(
        save.settings.sound,
        screen !== 'BATTLE',
        !document.hidden,
      );
    configure();
    document.addEventListener('visibilitychange', configure);
    return () => document.removeEventListener('visibilitychange', configure);
  }, [save.settings.sound, screen]);
  const onShot = useCallback((kind: string) => audio.current?.shot(kind), []);
  const onCue = useCallback((cue: AudioCue) => audio.current?.cue(cue), []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const s = loadSave();
        saveRef.current = s;
        setSave(s);
      } catch (e) {
        setMessage(String(e));
        setStorageBlocked(true);
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);
  const commit = useCallback(
    (fn: (s: WWISave) => WWISave) => {
      if (storageBlocked) {
        setMessage('現有存檔讀取失敗；請先備份瀏覽器資料，再處理存檔。');
        return false;
      }
      try {
        const next = writeSave(fn(saveRef.current));
        saveRef.current = next;
        setSave(next);
        return true;
      } catch (e) {
        setMessage(`未能保存：${String(e)}`);
        return false;
      }
    },
    [storageBlocked],
  );
  const navigate = (next: typeof screen, cue: AudioCue = 'NAVIGATE') => {
    setMessage('');
    audio.current?.cue(cue);
    setScreen(next);
  };
  const selectFaction = (id: FactionId) => {
    if (
      !commit((s) =>
        selectCampaign(s, {
          selectedFaction: id,
          selectedNation: null,
          selectedTheatre: 'ALL',
          selectedScenario: null,
        }),
      )
    )
      return;
    navigate('CAMPAIGN', 'CONFIRM');
  };
  const openMission = (scenario: BattleScenarioData) => {
    try {
      const year = Number(scenario.date.slice(0, 4)) as WarYear;
      assertPlayableScenario(
        scenario.scenarioId,
        scenario.playableFaction,
        scenario.playableNation,
        year,
      );
      if (
        !commit((s) =>
          selectCampaign(s, {
            selectedFaction: scenario.playableFaction,
            selectedYear: year,
            selectedNation: scenario.playableNation,
            selectedTheatre: battleById(scenario.battleId).theatre,
            selectedScenario: scenario.scenarioId,
          }),
        )
      )
        return;
      navigate('BRIEFING', 'CONFIRM');
    } catch (error) {
      setMessage(String(error));
    }
  };
  const openVerdun = () => openMission(VERDUN_SCENARIO);
  const start = () => {
    if (!loaded || storageBlocked) return;
    const nav = saveRef.current.navigation;
    try {
      assertPlayableScenario(
        nav.selectedScenario ?? '',
        nav.selectedFaction,
        nav.selectedNation!,
        nav.selectedYear,
      );
    } catch (error) {
      setMessage(String(error));
      return;
    }
    if (!commit((s) => s)) return;
    setBattleKey((k) => k + 1);
    navigate('BATTLE', 'CONFIRM');
  };
  const sound = () => {
    if (
      !commit((s) => ({
        ...s,
        settings: { ...s.settings, sound: !s.settings.sound },
      }))
    )
      return;
    audio.current?.configure(
      saveRef.current.settings.sound,
      screen !== 'BATTLE',
      !document.hidden,
    );
    void audio.current?.unlock().then(() => {
      if (saveRef.current.settings.sound) audio.current?.cue('CONFIRM');
    });
  };
  if (screen === 'BATTLE')
    return (
      <Battle
        key={battleKey}
        save={save}
        commit={commit}
        onExit={() => navigate('CAMPAIGN')}
        onLoadout={openVerdun}
        onUnits={() => navigate('UNITS')}
        onSound={sound}
        onShot={onShot}
        onCue={onCue}
        sound={save.settings.sound}
      />
    );
  return (
    <main
      className="ww-app"
      style={
        {
          '--ww-background': `url("${screen === 'HOME' ? backdrop : publicAssetPath(FACTIONS[faction].art)}")`,
        } as CSSProperties
      }
    >
      <header className="ww-top">
        <button className="ww-brand" onClick={() => navigate('HOME')}>
          <span className="ww-seal">W</span>
          <span>
            西線戰報<small>WORLD WAR I · 1914–1918</small>
          </span>
        </button>
        <div className="ww-top-right">
          <span>
            軍需 {save.supplies} <i /> 零件 {save.parts} <i /> 技術{' '}
            {save.technology}
          </span>
          <button
            aria-label={
              save.settings.sound ? '關閉配樂與音效' : '開啟配樂與音效'
            }
            title="原創司令部配樂、戰場配樂與操作音效"
            aria-pressed={save.settings.sound}
            onClick={sound}
          >
            {save.settings.sound ? (
              <Volume2 size={20} />
            ) : (
              <VolumeX size={20} />
            )}
          </button>
        </div>
      </header>
      {message && (
        <div role="alert" className="ww-message">
          {message}
          <button onClick={() => setMessage('')}>關閉</button>
        </div>
      )}
      {screen === 'HOME' ? (
        <>
          <section className="ww-hero">
            <div className="ww-hero-copy">
              <p className="ww-eyebrow">戰役塔防 / 歷史策略</p>
              <h1>
                第一次
                <br />
                <em>世界大戰</em>
              </h1>
              <p className="ww-years">
                1914 <span /> 1918
              </p>
              <p className="ww-hero-description">
                每一道防線，都是一次抉擇。
                <br />
                在炮火與泥濘之間，守住最後的交通線。
              </p>
              <div className="ww-faction-buttons">
                <button
                  className="ww-primary"
                  disabled={!loaded || storageBlocked}
                  onClick={() => navigate('FACTIONS')}
                >
                  <Flag size={20} />
                  選擇陣營 · 進入戰役
                  <ArrowRight size={20} />
                </button>
                <button
                  disabled={!loaded || storageBlocked}
                  onClick={() => navigate('FACTION_INFO')}
                >
                  陣營說明 <span>參戰時間與歷史</span>
                </button>
              </div>
            </div>
            <div className="ww-hero-caption">
              <span>FRANCE · WESTERN FRONT</span>
              <b>凡爾登防禦區</b>
              <p>1916 · 法軍防禦戰役現已開放</p>
            </div>
          </section>
          <nav className="ww-home-nav">
            {(
              [
                {
                  to: 'UNITS',
                  icon: Target,
                  name: '兵種與軍需',
                  en: 'DEFENSIVE UNITS',
                },
                {
                  to: 'COMMANDER',
                  icon: Shield,
                  name: '指揮官專長',
                  en: 'COMMANDER',
                },
                {
                  to: 'RECORDS',
                  icon: History,
                  name: '戰役紀錄',
                  en: 'FIELD REPORTS',
                },
                {
                  to: 'HISTORY',
                  icon: BookOpen,
                  name: '歷史資料',
                  en: 'HISTORICAL ARCHIVE',
                },
              ] as const
            ).map((n) => (
              <button key={n.to} onClick={() => navigate(n.to)}>
                <n.icon />
                <span>
                  {n.name}
                  <small>{n.en}</small>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
          </nav>
          <footer className="ww-footer">
            歷史風格戰術遊戲 · 法軍凡爾登試玩版{' '}
            <span>守住陣地，不改寫歷史。</span>
          </footer>
        </>
      ) : (
        <section className="ww-document">
          <button className="ww-back" onClick={() => navigate('HOME')}>
            <ArrowLeft size={18} />
            返回司令部
          </button>
          {screen === 'FACTIONS' && (
            <FactionSelect
              onSelect={selectFaction}
              onInfo={() => navigate('FACTION_INFO')}
            />
          )}
          {screen === 'FACTION_INFO' && <FactionHistory />}
          {screen === 'CAMPAIGN' && (
            <CampaignBrowser
              save={save}
              onChange={(patch) => commit((s) => selectCampaign(s, patch))}
              onMission={openMission}
              onSweep={(id) => {
                if (commit((s) => quickResolve(s, id)))
                  setMessage('快速結算完成：100 軍需物資、20 零件、5 技術點。');
              }}
              onFaction={() => navigate('FACTIONS')}
              onInfo={() => navigate('FACTION_INFO')}
            />
          )}
          {screen === 'BRIEFING' && (
            <>
              <MissionHeader scenario={VERDUN_SCENARIO} />
              <div className="ww-briefing">
                <div>
                  <p>{VERDUN.history.background}</p>
                  <h3>本次任務</h3>
                  <p>{VERDUN.objective}</p>
                  <ul>
                    <li>7 處陣地，300 初始戰地資源。</li>
                    <li>選擇 3 種兵種，每種可重複部署。</li>
                    <li>第 5、10、15 輪後選擇戰術命令；第 20 輪為最終攻勢。</li>
                    <li>重大攻勢整隊時，保留火力與指揮命令。</li>
                  </ul>
                  <button onClick={() => navigate('HISTORY')}>
                    閱讀歷史資料
                  </button>
                </div>
                <aside>
                  <Shield />
                  <h3>{DOCTRINES[save.doctrine].name}</h3>
                  <p>{DOCTRINES[save.doctrine].description}</p>
                  <button onClick={() => navigate('COMMANDER')}>
                    調整指揮官專長
                  </button>
                </aside>
              </div>
              <h2>
                作戰編制 <small>{save.loadout.length} / 3 兵種類型</small>
              </h2>
              <p>點擊卡片，將編制中的兵種與預備兵種交換。</p>
              <Loadout save={save} commit={commit} />
              <p className="ww-note">{ABSTRACTION}</p>
              <button
                className="ww-primary"
                disabled={
                  save.loadout.length !== 3 || !loaded || storageBlocked
                }
                onClick={start}
              >
                進入戰壕 · 部署防線 <ArrowRight size={20} />
              </button>
            </>
          )}
          {screen === 'UNITS' && (
            <>
              <p className="ww-eyebrow">法國 · 軍需處</p>
              <h1>兵種與裝備</h1>
              <p>永久訓練提升容錯；本局陣地等級在戰鬥結束後重置。</p>
              <div className="ww-unit-grid">
                {UNIT_IDS.map((id) => (
                  <article className="ww-unit-card" key={id}>
                    <Sprite index={UNITS[id].art} />
                    <span className="ww-eyebrow">{UNITS[id].english}</span>
                    <h2>{UNITS[id].name}</h2>
                    <p>{UNITS[id].role}</p>
                    <p>
                      訓練 {save.units[id].level} / 5 · 裝備 Mk.
                      {['', 'I', 'II', 'III'][save.units[id].mark]}
                    </p>
                    <p>
                      {id === 'ENGINEER' ? '永久支援半徑' : '永久作戰傷害'} +
                      {Math.round(permanentBonus(save, id) * 100)}%
                      <small> · 每次訓練或裝備提升 +5%，最高 +30%</small>
                    </p>
                    <button
                      disabled={save.units[id].level >= 5}
                      onClick={() => commit((s) => trainUnit(s, id, 'level'))}
                    >
                      訓練：{save.units[id].level * 60} 軍需 /{' '}
                      {save.units[id].level * 5} 零件
                    </button>
                    <button
                      disabled={save.units[id].mark >= 3}
                      onClick={() => commit((s) => trainUnit(s, id, 'mark'))}
                    >
                      裝備：{save.units[id].mark * 100} 軍需 /{' '}
                      {save.units[id].mark * 15} 零件 /{' '}
                      {save.units[id].mark * 5} 技術
                    </button>
                  </article>
                ))}
              </div>
              <button className="ww-primary" onClick={openVerdun}>
                前往法軍凡爾登簡報
              </button>
            </>
          )}
          {screen === 'COMMANDER' && (
            <>
              <p className="ww-eyebrow">軍事任命 · 可於戰前更換</p>
              <h1>指揮官專長</h1>
              <p>
                {FACTIONS[faction].name} · {commanderNation.displayNameZhHant} ·
                專長不受國籍限制。
              </p>
              {commanderNation.commanderArt ? (
                <img
                  className="ww-commander-art"
                  src={publicAssetPath(commanderNation.commanderArt)}
                  alt={`${commanderNation.displayNameZhHant}軍官風格示意，非特定史實人物`}
                />
              ) : (
                <p className="ww-note">
                  此國軍官美術未製作，不使用其他國家的制服代替。
                </p>
              )}
              <p className="ww-note">
                {commanderNation.uniformVisualProfile}
                。本版可實際部署的任務仍只有法國凡爾登。
              </p>
              <div className="ww-doctrine-grid">
                {(Object.keys(DOCTRINES) as DoctrineId[]).map((id) => (
                  <button
                    key={id}
                    className={save.doctrine === id ? 'chosen' : ''}
                    onClick={() => commit((s) => ({ ...s, doctrine: id }))}
                  >
                    <Shield />
                    <h2>{DOCTRINES[id].name}</h2>
                    <p>{DOCTRINES[id].description}</p>
                    <b>{save.doctrine === id ? '已任命' : '選擇專長'}</b>
                  </button>
                ))}
              </div>
              <button className="ww-primary" onClick={openVerdun}>
                前往法軍凡爾登簡報
              </button>
            </>
          )}
          {screen === 'HISTORY' && (
            <>
              <button onClick={() => navigate('FACTION_INFO')}>
                陣營說明與參戰時間
              </button>
              <HistoryPanel />
              <button className="ww-primary" onClick={openVerdun}>
                前往法軍凡爾登簡報
              </button>
            </>
          )}
          {screen === 'RECORDS' && (
            <>
              <p className="ww-eyebrow">FIELD REPORTS</p>
              <h1>戰役紀錄</h1>
              <p>最近 30 次部署 · 最高完成 {save.bestWave} 輪</p>
              {!save.history.length ? (
                <p>尚無戰報。完成一場凡爾登部署後，將在此保留編制與命令。</p>
              ) : (
                save.history.map((r) => (
                  <article className="ww-record" key={r.id}>
                    <h3>
                      {r.result === 'HELD' ? '防禦區守住' : '戰區失守'} ·{' '}
                      {r.waves} 輪 · {time(r.seconds)}
                    </h3>
                    <p>
                      {
                        FACTIONS[
                          scenarioById(r.scenarioId ?? VERDUN_SCENARIO_ID)!
                            .playableFaction
                        ].name
                      }{' '}
                      ·{' '}
                      {
                        nationById(
                          scenarioById(r.scenarioId ?? VERDUN_SCENARIO_ID)!
                            .playableNation,
                        ).displayNameZhHant
                      }{' '}
                      · 凡爾登任務
                    </p>
                    <p>
                      收入 {r.earned} / 支出 {r.spent} · 指揮命令 {r.commands}{' '}
                      次
                    </p>
                    <p>{r.units.join('；')}</p>
                    <p>
                      {r.orders
                        .map((id) => ORDERS.find((o) => o.id === id)?.name)
                        .join(' / ')}
                    </p>
                    <p>{r.reason}</p>
                  </article>
                ))
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}

function Loadout({
  save,
  commit,
}: {
  save: WWISave;
  commit: (fn: (s: WWISave) => WWISave) => boolean;
}) {
  // Keep saved loadouts valid: choose the single reserve to swap with one selected unit.
  const [replace, setReplace] = useState<UnitId | null>(null);
  return (
    <>
      <div className="ww-unit-grid ww-loadout">
        {UNIT_IDS.map((id) => (
          <button
            className={`ww-unit-card ${save.loadout.includes(id) ? 'chosen' : ''}`}
            key={id}
            onClick={() => setReplace(id)}
          >
            <Sprite index={UNITS[id].art} />
            <span className="ww-eyebrow">{UNITS[id].english}</span>
            <h3>{UNITS[id].name}</h3>
            <p>{UNITS[id].role}</p>
            <b>
              {save.loadout.includes(id) ? '已編入' : '預備兵種'} ·{' '}
              {UNITS[id].cost} 戰地資源
            </b>
          </button>
        ))}
      </div>
      {replace && (
        <div className="ww-swap">
          <span>
            將「{UNITS[replace].name}」
            {save.loadout.includes(replace) ? '替換為' : '編入，替換'}：
          </span>
          {UNIT_IDS.filter((id) =>
            save.loadout.includes(replace)
              ? !save.loadout.includes(id)
              : save.loadout.includes(id),
          ).map((id) => (
            <button
              key={id}
              onClick={() => {
                commit((s) => ({
                  ...s,
                  loadout: s.loadout.map((u) =>
                    u === (s.loadout.includes(replace) ? replace : id)
                      ? s.loadout.includes(replace)
                        ? id
                        : replace
                      : u,
                  ),
                }));
                setReplace(null);
              }}
            >
              {UNITS[id].name}
            </button>
          ))}
          <button onClick={() => setReplace(null)}>取消</button>
        </div>
      )}
    </>
  );
}

function Battle({
  save,
  commit,
  onExit,
  onLoadout,
  onUnits,
  onSound,
  onShot,
  onCue,
  sound,
}: {
  save: WWISave;
  commit: (fn: (s: WWISave) => WWISave) => boolean;
  onExit: () => void;
  onLoadout: () => void;
  onUnits: () => void;
  onSound: () => void;
  onShot: (kind: string) => void;
  onCue: (cue: AudioCue) => void;
  sound: boolean;
}) {
  const [engine, setEngine] = useState(() => new VerdunEngine(save));
  const [s, setSnapshot] = useState(() => engine.snapshot()),
    [selected, setSelected] = useState<number | null>(null),
    [build, setBuild] = useState<UnitId>(save.loadout[0]);
  const [notice, setNotice] = useState(''),
    [branch, setBranch] = useState<DefensiveUnitRuntime | null>(null),
    [confirmExit, setConfirmExit] = useState(false),
    [history, setHistory] = useState(false);
  const [saved, setSaved] = useState(false),
    session = useRef(''),
    settled = useRef(false),
    lastEffect = useRef(0),
    previousWave = useRef(0),
    previousState = useRef(s.state),
    previousStrength = useRef(s.strength),
    modalWasPaused = useRef(false);
  useEffect(() => {
    session.current = crypto.randomUUID();
    settled.current = false;
    let raf = 0,
      previous = performance.now(),
      lastPaint = 0;
    const loop = (now: number) => {
      engine.tick((now - previous) / 1000);
      previous = now;
      if (now - lastPaint > 45) {
        const snap = engine.snapshot();
        setSnapshot(snap);
        lastPaint = now;
        const shot = snap.effects.find(
          (e) =>
            e.id > lastEffect.current &&
            ['MG', 'RIFLE', 'ARTILLERY'].includes(e.kind),
        );
        if (shot) {
          lastEffect.current = shot.id;
          onShot(shot.kind);
        }
        if (snap.wave > previousWave.current) onCue('WAVE');
        if (snap.strength < previousStrength.current) onCue('BREACH');
        if (snap.state !== previousState.current) {
          if (snap.state === 'ORDERS') onCue('ORDER_OFFER');
          if (snap.state === 'HELD') onCue('VICTORY');
          if (snap.state === 'LOST') onCue('DEFEAT');
        }
        previousWave.current = snap.wave;
        previousStrength.current = snap.strength;
        previousState.current = snap.state;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, onShot, onCue]);
  const terminal = s.state === 'HELD' || s.state === 'LOST';
  useEffect(() => {
    if (!terminal || saved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [terminal, saved]);
  useEffect(() => {
    if (terminal && !settled.current) {
      settled.current = true;
      setSaved(
        commit((prev) => settleRun(prev, engine.record(session.current))),
      );
    }
  }, [terminal, engine, commit]);
  const act = (fn: () => { ok: boolean; error?: string }, cue?: AudioCue) => {
    const result = fn();
    onCue(result.ok ? (cue ?? 'CONFIRM') : 'DENY');
    setNotice(result.ok ? '' : (result.error ?? '操作未完成'));
    setSnapshot(engine.snapshot());
  };
  const selectedUnit = s.positions.find((p) => p.id === selected);
  const retry = () => {
    const next = new VerdunEngine(save);
    setEngine(next);
    setSnapshot(next.snapshot());
    setSelected(null);
    setBranch(null);
    setNotice('');
    setSaved(false);
    setHistory(false);
    lastEffect.current = 0;
    previousWave.current = 0;
    previousState.current = next.snapshot().state;
    previousStrength.current = next.snapshot().strength;
    onCue('CONFIRM');
    window.scrollTo(0, 0);
  };
  const openBranch = () => {
    if (!selectedUnit) return;
    if (selectedUnit.level === 2 || selectedUnit.level === 4) {
      modalWasPaused.current = engine.snapshot().paused;
      if (!s.paused) engine.togglePause();
      setBranch(selectedUnit);
    } else act(() => engine.upgrade(selectedUnit.id), 'UPGRADE');
  };
  const closeBranch = () => {
    setBranch(null);
    if (!modalWasPaused.current && engine.snapshot().paused)
      engine.togglePause();
  };
  const askExit = () => {
    if (terminal) {
      if (saved) onExit();
      return;
    }
    modalWasPaused.current = engine.snapshot().paused;
    if (!s.paused) engine.togglePause();
    setConfirmExit(true);
  };
  const status =
    s.state === 'SETUP'
      ? '部署階段'
      : s.state === 'INTERMISSION'
        ? `補給間歇 ${Math.ceil(s.intermission)} 秒`
        : s.paused
          ? '已暫停'
          : '防線作戰中';
  return (
    <main
      className="ww-battle"
      style={{ '--ww-background': `url("${fieldBackdrop}")` } as CSSProperties}
    >
      <header className="ww-battle-top">
        <button onClick={askExit} aria-label="離開戰場">
          <ArrowLeft />
        </button>
        <div>
          <MissionHeader scenario={VERDUN_SCENARIO} compact />
          <h1>凡爾登防禦區</h1>
        </div>
        <div className="ww-hud-stat">
          <small>攻勢</small>
          <b>
            {String(s.wave).padStart(2, '0')} <em>/ {VERDUN_WAVE_COUNT}</em>
          </b>
        </div>
        <div className="ww-hud-stat">
          <small>防線強度</small>
          <b>
            {Math.ceil(s.strength)} <em>/ {s.maxStrength}</em>
          </b>
        </div>
        <div className="ww-hud-stat resource">
          <small>戰地資源</small>
          <b>{s.resource}</b>
        </div>
        <button
          aria-label="暫停或繼續"
          onClick={() => {
            engine.togglePause();
            onCue('NAVIGATE');
          }}
        >
          {s.paused ? <Play /> : <Pause />}
        </button>
        <button
          onClick={() => {
            engine.toggleSpeed();
            onCue('NAVIGATE');
          }}
        >
          {s.speed}×
        </button>
        <button
          aria-label={sound ? '關閉配樂與音效' : '開啟配樂與音效'}
          title="原創戰場配樂與作戰音效"
          aria-pressed={sound}
          onClick={onSound}
        >
          {sound ? <Volume2 /> : <VolumeX />}
        </button>
      </header>
      <div className="ww-battle-layout">
        <section className="ww-battlefield-wrap">
          <div className="ww-field-status">
            <span>
              {status} · {time(s.time)}
            </span>
            <span>泥地遲滯推進 · 高地利於校射</span>
          </div>
          <div className="ww-battlefield" aria-label="凡爾登戰壕戰場">
            <svg
              className="ww-routes"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {PATHS.map((path, i) => (
                <polyline
                  key={i}
                  points={path.map((p) => `${p.x},${p.y}`).join(' ')}
                />
              ))}
              <ellipse className="mud" cx="36" cy="49" rx="14" ry="25" />
            </svg>
            <span className="ww-spawn top">德軍進路 A</span>
            <span className="ww-spawn bottom">德軍進路 B</span>
            <span className="ww-objective">
              <Flag size={20} />
              交通線
            </span>
            {selectedUnit && (
              <div
                className="ww-range"
                style={{
                  left: `${SLOTS[selectedUnit.slot].x}%`,
                  top: `${SLOTS[selectedUnit.slot].y}%`,
                  width: `${engine.range(selectedUnit) * 2}%`,
                  height: `${engine.range(selectedUnit) * 2}%`,
                }}
              />
            )}
            {SLOTS.map((p, index) => {
              const unit = s.positions.find((u) => u.slot === index);
              return (
                <button
                  key={index}
                  aria-label={
                    unit
                      ? `${UNITS[unit.unit].name} 陣地 ${index + 1}`
                      : `部署陣地 ${index + 1} ${p.terrain}`
                  }
                  className={`ww-position ${unit ? 'occupied' : ''} ${selected === unit?.id ? 'selected' : ''} ${unit?.branches.length ? 'specialized' : ''} ${unit?.branches.some((b) => b.includes('_A')) ? 'branch-a' : ''} ${unit?.branches.some((b) => b.includes('_B')) ? 'branch-b' : ''}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onClick={() => {
                    if (unit) setSelected(unit.id);
                    else {
                      act(() => engine.deploy(index, build), 'DEPLOY');
                      const newUnit = engine
                        .snapshot()
                        .positions.find((u) => u.slot === index);
                      if (newUnit) setSelected(newUnit.id);
                    }
                  }}
                >
                  {unit ? (
                    <>
                      <Sprite index={UNITS[unit.unit].art} />
                      <span className="ww-unit-level">
                        {UNITS[unit.unit].name} · {unit.level}
                        {unit.branches.length > 0
                          ? ' ▰'.repeat(unit.branches.length)
                          : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="ww-slot-number">{index + 1} ＋</span>
                      <small>{p.terrain}</small>
                    </>
                  )}
                </button>
              );
            })}
            {s.formations.map((e) => (
              <div
                key={e.id}
                className={`ww-formation ${e.major ? 'major' : ''} ${e.suppressed > 0 || e.barrageSlow > 0 ? 'suppressed' : ''}`}
                style={{ left: `${e.x}%`, top: `${e.y}%` }}
              >
                <Sprite index={FORMATIONS[e.type].art} />
                {e.major && <Sprite index={7} className="ww-extra-squad" />}
                <span>{e.major ? '重大攻勢' : FORMATIONS[e.type].role}</span>
                <progress max={e.maxHP} value={e.hp} />
              </div>
            ))}
            <svg
              className="ww-effects"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {s.effects.map((e) => {
                const t = e.age / e.duration,
                  x = e.from.x + (e.to.x - e.from.x) * t,
                  y =
                    e.from.y +
                    (e.to.y - e.from.y) * t -
                    (e.kind === 'ARTILLERY' ? Math.sin(t * Math.PI) * 14 : 0);
                return e.kind === 'ARTILLERY' ? (
                  <g key={e.id}>
                    <circle cx={x} cy={y} r=".65" fill="#e9c283" />
                    {t > 0.8 && (
                      <circle
                        cx={e.to.x}
                        cy={e.to.y}
                        r={t * 3.5}
                        fill="#bdb29c"
                        opacity={1 - t}
                      />
                    )}
                  </g>
                ) : e.kind === 'IMPACT' || e.kind === 'REPAIR' ? (
                  <circle
                    key={e.id}
                    cx={e.to.x}
                    cy={e.to.y}
                    r={1 + t * 3}
                    fill="none"
                    stroke={e.kind === 'REPAIR' ? '#d4dcb9' : '#b5a187'}
                    opacity={1 - t}
                    strokeWidth=".4"
                  />
                ) : (
                  <g key={e.id} opacity={1 - t}>
                    <line
                      x1={e.from.x}
                      y1={e.from.y}
                      x2={e.to.x}
                      y2={e.to.y}
                      stroke={e.kind === 'MG' ? '#dcc7a0' : '#ede4cc'}
                      strokeWidth={e.kind === 'MG' ? '.22' : '.13'}
                    />
                    <circle
                      cx={e.from.x}
                      cy={e.from.y}
                      r={e.kind === 'MG' ? '.85' : '.6'}
                      fill="#e8bd72"
                    />
                  </g>
                );
              })}
            </svg>
            {s.paused && <div className="ww-paused-label">戰場已暫停</div>}
          </div>
          <output className="ww-telegraph">
            {notice || s.telegraph || s.notice}
          </output>
          {s.formations.some((e) => e.major) && (
            <div className="ww-assault-status">
              {s.formations
                .filter((e) => e.major)
                .map((e) => (
                  <div key={e.id}>
                    <b>德軍重大攻勢 · 第 {e.phase} 階段</b>
                    <span>
                      {e.stage === 'PREPARATION'
                        ? '炮火準備'
                        : e.stage === 'EXPOSED'
                          ? '重新整隊 · 集中火力時機'
                          : '攻勢推進'}{' '}
                      · {Math.ceil(e.timer)} 秒
                    </span>
                    <progress max={e.maxHP} value={e.hp} />
                  </div>
                ))}
            </div>
          )}
          <div className="ww-command-bar">
            <div>
              <small>指揮值</small>
              <b>{Math.floor(s.command)} / 100</b>
              <progress max={100} value={s.command} />
            </div>
            <button
              disabled={
                !selectedUnit ||
                s.command < 100 ||
                s.disruption > 0 ||
                s.state !== 'ACTIVE'
              }
              onClick={() =>
                selectedUnit &&
                act(() => engine.activateCommand(selectedUnit.id), 'COMMAND')
              }
            >
              戰場指揮
            </button>
            <button
              disabled={
                s.officerCD > 0 || s.disruption > 0 || s.state !== 'ACTIVE'
              }
              onClick={() => act(() => engine.activateOfficer(), 'COMMAND')}
            >
              {DOCTRINES[save.doctrine].order}
              <small>
                {s.officerCD > 0
                  ? `${Math.ceil(s.officerCD)} 秒`
                  : '指揮官命令'}
              </small>
            </button>
            {s.state === 'SETUP' && (
              <button
                className="ww-primary"
                onClick={() => act(() => engine.start(), 'CONFIRM')}
              >
                開始防禦作戰 <Play size={17} />
              </button>
            )}
          </div>
        </section>
        <aside className="ww-field-panel">
          <p className="ww-eyebrow">作戰編制 · {s.positions.length} / 7 陣地</p>
          <h2>部署兵種</h2>
          {save.loadout.map((id) => (
            <button
              className={`ww-build-card ${build === id ? 'chosen' : ''}`}
              key={id}
              onClick={() => {
                setBuild(id);
                onCue('NAVIGATE');
              }}
            >
              <Sprite index={UNITS[id].art} />
              <span>
                <b>{UNITS[id].name}</b>
                <small>{UNITS[id].role}</small>
              </span>
              <strong>{UNITS[id].cost}</strong>
            </button>
          ))}
          <p className="ww-note">選擇兵種 → 點擊空陣地。鄰近工兵可提供折扣。</p>
          {selectedUnit ? (
            <section className="ww-position-details">
              <span className="ww-eyebrow">
                陣地 {selectedUnit.slot + 1} ·{' '}
                {SLOTS[selectedUnit.slot].terrain}
              </span>
              <h2>{UNITS[selectedUnit.unit].name}</h2>
              <p>
                陣地等級 {selectedUnit.level} / 5 · 投資 {selectedUnit.invested}
              </p>
              <p>{SLOTS[selectedUnit.slot].description}</p>
              {selectedUnit.branches.map((id) => (
                <p className="ww-branch-badge" key={id}>
                  {
                    Object.values(BRANCHES[selectedUnit.unit])
                      .flat()
                      .find((b) => b.id === id)?.name
                  }
                </p>
              ))}
              <button
                className="ww-primary"
                disabled={selectedUnit.level === 5 || terminal}
                onClick={openBranch}
              >
                陣地升級{' '}
                {selectedUnit.level < 5
                  ? `· ${engine.upgradeCost(selectedUnit)} 資源`
                  : '已完成'}
              </button>
              <button
                disabled={
                  selectedUnit.skillCD > 0 ||
                  s.state !== 'ACTIVE' ||
                  s.disruption > 0
                }
                onClick={() =>
                  act(
                    () => engine.activateSkill(selectedUnit.id),
                    selectedUnit.unit === 'ENGINEER'
                      ? 'REPAIR'
                      : selectedUnit.unit === 'ARTILLERY'
                        ? 'ARTILLERY_SKILL'
                        : selectedUnit.unit === 'MG'
                          ? 'MG_SKILL'
                          : 'RIFLE_SKILL',
                  )
                }
              >
                {selectedUnit.unit === 'ENGINEER'
                  ? '緊急修復'
                  : selectedUnit.unit === 'ARTILLERY'
                    ? '集中炮擊'
                    : '快速供彈'}{' '}
                ·{' '}
                {selectedUnit.skillCD > 0
                  ? `${Math.ceil(selectedUnit.skillCD)} 秒`
                  : '就緒'}
              </button>
              {selectedUnit.unit !== 'ENGINEER' && (
                <button
                  onClick={() => {
                    engine.setPriority(selectedUnit.id);
                    onCue('NAVIGATE');
                  }}
                >
                  目標：
                  {selectedUnit.priority === 'FIRST' ? '最前方' : '最高強度'}
                </button>
              )}
              <button
                className="ww-muted-button"
                onClick={() => {
                  act(() => engine.sell(selectedUnit.id), 'WITHDRAW');
                  setSelected(null);
                }}
              >
                撤收陣地 · 返還 {Math.floor((selectedUnit.invested * 70) / 100)}
              </button>
            </section>
          ) : (
            <p>選擇已部署的陣地，查看升級、技能與撤收。</p>
          )}
          <details>
            <summary>戰術命令 · {s.orders.length}</summary>
            {s.orders.length ? (
              s.orders.map((id) => (
                <p key={id}>{ORDERS.find((o) => o.id === id)?.name}</p>
              ))
            ) : (
              <p>每 5 輪後由司令部提供三選一命令。</p>
            )}
          </details>
        </aside>
      </div>
      {s.state === 'ORDERS' && (
        <div className="ww-overlay">
          <section className="ww-order-modal">
            <p className="ww-eyebrow">司令部電報 · 第 {s.wave} 輪後</p>
            <h1>選擇戰術命令</h1>
            <p>戰場暫停，選擇一項本次部署的作戰方針。</p>
            <div className="ww-order-grid">
              {s.offers.map((o, i) => (
                <button
                  key={o.id}
                  onClick={() =>
                    act(() => engine.chooseOrder(o.id), 'ORDER_CHOSEN')
                  }
                >
                  <span className="ww-order-number">0{i + 1}</span>
                  <small>
                    {o.category === 'SUPPORT'
                      ? '編制支援'
                      : o.category === 'GENERAL'
                        ? '後勤與工事'
                        : '戰術調整'}
                  </small>
                  <h2>{o.name}</h2>
                  <p>{o.description}</p>
                  <span>採用命令 →</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {branch && (
        <div className="ww-overlay">
          <section className="ww-order-modal">
            <p className="ww-eyebrow">戰地升級 · 等級 {branch.level + 1}</p>
            <h1>選擇陣地專精</h1>
            <div className="ww-order-grid two">
              {BRANCHES[branch.unit][(branch.level + 1) as 3 | 5].map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    const result = engine.upgrade(branch.id, b.id);
                    onCue(result.ok ? 'UPGRADE' : 'DENY');
                    if (result.ok) closeBranch();
                    else setNotice(result.error);
                  }}
                >
                  <h2>{b.name}</h2>
                  <p>{b.description}</p>
                  <b>{engine.upgradeCost(branch)} 戰地資源</b>
                </button>
              ))}
            </div>
            <output>{notice}</output>
            <button onClick={closeBranch}>取消並繼續</button>
          </section>
        </div>
      )}
      {confirmExit && (
        <div className="ww-overlay">
          <section className="ww-order-modal">
            <h2>撤離本次部署？</h2>
            <p>
              本局戰地資源、陣地等級與命令將重置；未結束的部署不發放戰役獎勵。
            </p>
            <button
              onClick={() => {
                setConfirmExit(false);
                if (!modalWasPaused.current && engine.snapshot().paused)
                  engine.togglePause();
              }}
            >
              返回戰場
            </button>
            <button
              onClick={() => {
                onCue('WITHDRAW');
                onExit();
              }}
            >
              確認撤離
            </button>
          </section>
        </div>
      )}
      {terminal && (
        <div className="ww-overlay ww-results-overlay">
          <section className="ww-result">
            <span className="ww-eyebrow">FIELD REPORT · VERDUN 1916</span>
            <MissionHeader scenario={VERDUN_SCENARIO} compact />
            <h1>{s.state === 'HELD' ? '防禦區守住' : '戰區失守'}</h1>
            <p className="ww-result-english">
              {s.state === 'HELD' ? 'POSITION HELD' : 'SECTOR LOST'}
            </p>
            <p>
              {s.state === 'HELD'
                ? '交通線仍在運作。本次防禦任務完成。'
                : s.notice}
            </p>
            <div className="ww-result-stats">
              <span>
                完成攻勢
                <b>
                  {s.clearedWaves} / {VERDUN_WAVE_COUNT}
                </b>
              </span>
              <span>
                作戰時間<b>{time(s.time)}</b>
              </span>
              <span>
                戰地資源支出<b>{s.spent}</b>
              </span>
              <span>
                指揮命令<b>{s.commandUses}</b>
              </span>
            </div>
            <p>
              {saved
                ? '戰報與軍需獎勵已保存。'
                : '存檔未成功，請重試保存後離開。'}
              {!saved && (
                <button
                  onClick={() =>
                    setSaved(
                      commit((prev) =>
                        settleRun(prev, engine.record(session.current)),
                      ),
                    )
                  }
                >
                  重試保存
                </button>
              )}
            </p>
            <p>
              {s.state === 'HELD'
                ? '常規補給：100 軍需、20 零件、5 技術；首次守住另獲額外補給。'
                : `進度補給比例：${s.clearedWaves >= VERDUN_WAVE_COUNT - 2 ? '70' : s.clearedWaves >= 15 ? '50' : s.clearedWaves >= 10 ? '35' : s.clearedWaves >= 5 ? '20' : '0'}%。完整守住戰區才會解鎖快速結算。`}
            </p>
            <div className="ww-result-actions">
              <button className="ww-primary" onClick={retry} disabled={!saved}>
                再次部署
              </button>
              <button onClick={onLoadout} disabled={!saved}>
                調整編制
              </button>
              <button onClick={onUnits} disabled={!saved}>
                升級兵種
              </button>
              <button
                onClick={() => {
                  onCue('NAVIGATE');
                  onExit();
                }}
                disabled={!saved}
              >
                返回戰役地圖
              </button>
            </div>
            {!saved && (
              <button
                onClick={() => {
                  if (
                    window.confirm('本次戰報與獎勵尚未保存。確定放棄並離開？')
                  )
                    onExit();
                }}
              >
                放棄未保存戰報並離開
              </button>
            )}
            <details>
              <summary>本次編制與戰術命令</summary>
              {engine.record('preview').units.map((u, i) => (
                <p key={i}>{u}</p>
              ))}
              <p>
                {s.orders
                  .map((id) => ORDERS.find((o) => o.id === id)?.name)
                  .join(' / ') || '未採用戰術命令'}
              </p>
            </details>
            <button onClick={() => setHistory(!history)}>
              歷史上實際發生了甚麼？
            </button>
            {history && <HistoryPanel />}
            <p className="ww-note">{ABSTRACTION}</p>
          </section>
        </div>
      )}
    </main>
  );
}
