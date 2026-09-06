/* oxlint-disable next/no-img-element -- Static GitHub Pages assets have no image optimization server. */
import { ArrowRight, Compass, Shield, LockKeyhole } from 'lucide-react';
import { publicAssetPath } from '@/lib/game/asset-path';
import {
  FACTIONS,
  NATIONS,
  YEARS,
  THEATRES,
  SCENARIOS,
  HISTORY_SOURCES,
  activeNations,
  nationById,
  battleById,
  type BattleScenarioData,
  type CampaignNavigation,
  type FactionId,
} from '@/lib/wwi/campaign';
import type { WWISave } from '@/lib/wwi/save';

export function FactionMark({ faction }: { faction: FactionId }) {
  return (
    <span
      className="ww-faction-mark"
      title="遊戲陣營識別符號，非歷史旗幟"
      aria-label={`${FACTIONS[faction].name}遊戲識別符號`}
    >
      {faction === 'ENTENTE' ? <Shield /> : <Compass />}
    </span>
  );
}
export function FactionSelect({
  onSelect,
  onInfo,
}: {
  onSelect: (id: FactionId) => void;
  onInfo: () => void;
}) {
  return (
    <>
      <p className="ww-eyebrow">CAMPAIGN ARCHIVE · 1914–1918</p>
      <h1>選擇陣營</h1>
      <p>同一場戰爭，不同的作戰視角。只有法軍凡爾登任務已開放。</p>
      <div className="ww-faction-grid">
        {(['ENTENTE', 'CENTRAL_POWERS'] as FactionId[]).map((id) => (
          <article
            key={id}
            className={`ww-faction-card ${id === 'ENTENTE' ? 'entente' : 'central'}`}
          >
            <img
              src={publicAssetPath(FACTIONS[id].art)}
              alt={
                id === 'ENTENTE'
                  ? '法軍凡爾登戰區歷史風格插畫'
                  : '德軍野戰指揮所歷史風格插畫'
              }
              width="1536"
              height="1024"
            />
            <div className="ww-faction-copy">
              <div className="ww-faction-title">
                <FactionMark faction={id} />
                <div>
                  <p className="ww-eyebrow">{FACTIONS[id].english}</p>
                  <h2>{FACTIONS[id].name}</h2>
                </div>
              </div>
              <p>{FACTIONS[id].description}</p>
              <p className="ww-nation-line">
                {NATIONS.filter((n) => n.factionId === id)
                  .map((n) => n.displayNameZhHant)
                  .join(' · ')}
              </p>
              <span className="ww-stamp">
                {id === 'ENTENTE'
                  ? '法國 · 凡爾登可遊玩'
                  : '戰役架構已開放 · 任務未開放'}
              </span>
              <button className="ww-primary" onClick={() => onSelect(id)}>
                {id === 'ENTENTE' ? '進入協約國戰役' : '查看同盟國戰役架構'}
                <ArrowRight size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="ww-note">
        盾形與羅盤為遊戲識別符號，並非歷史陣營旗幟。插畫分別代表法軍與德軍，不代表所有成員國制服。
      </p>
      <button onClick={onInfo}>陣營說明與參戰時間</button>
    </>
  );
}
export function MissionHeader({
  scenario,
  compact = false,
}: {
  scenario: BattleScenarioData;
  compact?: boolean;
}) {
  const b = battleById(scenario.battleId);
  return (
    <div className={`ww-mission-header ${compact ? 'compact' : ''}`}>
      <p className="ww-eyebrow">
        {scenario.date.slice(0, 4)} · {THEATRES[b.theatre]}
      </p>
      {!compact && <h1>{scenario.displayName}</h1>}
      <div className="ww-versus">
        <span>
          <b>{FACTIONS[scenario.playableFaction].name}</b> ·{' '}
          {nationById(scenario.playableNation).displayNameZhHant}
        </span>
        <small>VS</small>
        <span>
          <b>{FACTIONS[scenario.opposingFaction].name}</b> ·{' '}
          {scenario.opposingNations
            .map((id) => nationById(id).displayNameZhHant)
            .join('、')}
        </span>
      </div>
      {!compact && (
        <p>
          {b.startDate} — {b.endDate} · {b.location}
        </p>
      )}
    </div>
  );
}
export function CampaignBrowser({
  save,
  onChange,
  onMission,
  onSweep,
  onFaction,
  onInfo,
}: {
  save: WWISave;
  onChange: (patch: Partial<CampaignNavigation>) => void;
  onMission: (scenario: BattleScenarioData) => void;
  onSweep: (id: string) => void;
  onFaction: () => void;
  onInfo: () => void;
}) {
  const nav = save.navigation,
    faction = nav.selectedFaction,
    year = nav.selectedYear;
  const nationPool = NATIONS.filter((n) => n.factionId === faction),
    active = activeNations(faction, year);
  const pool = SCENARIOS.filter(
    (s) => s.playableFaction === faction && s.date.startsWith(String(year)),
  );
  const theatres = [
    ...new Set(pool.map((s) => battleById(s.battleId).theatre)),
  ];
  const shown = pool.filter(
    (s) =>
      (!nav.selectedNation || s.playableNation === nav.selectedNation) &&
      (nav.selectedTheatre === 'ALL' ||
        battleById(s.battleId).theatre === nav.selectedTheatre),
  );
  return (
    <div
      className={`ww-faction-browser ${faction === 'ENTENTE' ? 'entente' : 'central'}`}
    >
      <div className="ww-document-heading">
        <div>
          <p className="ww-eyebrow">{FACTIONS[faction].english}</p>
          <h1>{FACTIONS[faction].name}戰役</h1>
          <p>
            {faction === 'ENTENTE'
              ? '法軍凡爾登已開放，其他情境仍在規劃。'
              : '以下為戰役規劃資料，目前沒有可進入的同盟國任務。'}
          </p>
        </div>
        <button onClick={onFaction}>切換陣營</button>
      </div>
      <nav className="ww-year-nav" aria-label="戰役年份">
        {YEARS.map((y) => (
          <button
            key={y}
            aria-pressed={year === y}
            className={year === y ? 'active' : ''}
            onClick={() =>
              onChange({
                selectedYear: y,
                selectedScenario: null,
                selectedTheatre: 'ALL',
              })
            }
          >
            {y}
            <small>
              {y === 1916 && faction === 'ENTENTE' ? '凡爾登開放' : '戰役規劃'}
            </small>
          </button>
        ))}
      </nav>
      <div className="ww-campaign-controls">
        <label>
          戰線{' '}
          <select
            aria-label="篩選戰線"
            value={nav.selectedTheatre}
            onChange={(e) =>
              onChange({
                selectedTheatre: e.target
                  .value as CampaignNavigation['selectedTheatre'],
                selectedScenario: null,
              })
            }
          >
            <option value="ALL">全部戰線</option>
            {theatres.map((id) => (
              <option key={id} value={id}>
                {THEATRES[id]}
              </option>
            ))}
          </select>
        </label>
        <label>
          任務國家{' '}
          <select
            aria-label="篩選任務國家"
            value={nav.selectedNation ?? ''}
            onChange={(e) =>
              onChange({
                selectedNation: (e.target.value ||
                  null) as CampaignNavigation['selectedNation'],
                selectedScenario: null,
              })
            }
          >
            <option value="">全部國家</option>
            {active.map((n) => (
              <option value={n.id} key={n.id}>
                {n.displayNameZhHant}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onInfo}>陣營說明</button>
      </div>
      <div className="ww-mission-grid">
        {shown.map((s) => {
          const b = battleById(s.battleId),
            cleared =
              save.campaignProgressByFaction[faction][s.scenarioId]?.cleared;
          return (
            <article
              className={`ww-mission-card ${s.implemented ? 'available' : 'locked'}`}
              key={s.scenarioId}
            >
              <MissionHeader scenario={s} compact />
              <h2>{s.displayName}</h2>
              <p>
                {b.startDate} — {b.endDate}
              </p>
              <p>{s.objective}</p>
              <span className="ww-stamp">
                {s.implemented
                  ? cleared
                    ? '防禦區已守住'
                    : '可進入戰役'
                  : '未開放'}
              </span>
              {s.implemented ? (
                <button className="ww-primary" onClick={() => onMission(s)}>
                  閱讀作戰簡報
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button disabled>
                  <LockKeyhole size={16} />
                  任務尚未開放
                </button>
              )}
              {s.implemented && cleared && (
                <button onClick={() => onSweep(s.scenarioId)}>
                  快速結算 · 後勤補給
                </button>
              )}
              <details>
                <summary>歷史資料與情境範圍</summary>
                <p>
                  {b.broadOutcome} {b.significance}
                </p>
                <p>{s.gameplayAbstractionNote}</p>
                <a
                  href={b.historicalSources[0]}
                  target="_blank"
                  rel="noreferrer"
                >
                  歷史資料來源 ↗
                </a>
              </details>
            </article>
          );
        })}
      </div>
      {!shown.length && (
        <div className="ww-empty">
          <h2>此篩選下尚無規劃任務</h2>
          <p>歷史參戰不代表本版已有該國戰役。</p>
          <button
            onClick={() =>
              onChange({
                selectedNation: null,
                selectedTheatre: 'ALL',
                selectedScenario: null,
              })
            }
          >
            顯示此年份全部規劃
          </button>
        </div>
      )}
      <section className="ww-nation-status">
        <h2>{year} · 國家狀態</h2>
        <p>
          「參戰」表示該年曾參戰；實際任務仍檢查完整日期。戰役開放狀態另列。
        </p>
        <div className="ww-nation-grid">
          {nationPool.map((n) => {
            const wasActive = active.some((a) => a.id === n.id),
              available = pool.some(
                (s) => s.playableNation === n.id && s.implemented,
              );
            return (
              <details className="ww-nation-card" key={n.id}>
                <summary>
                  <b>{n.displayNameZhHant}</b>
                  <span>
                    {wasActive
                      ? n.allianceStatus === 'ASSOCIATED_POWER'
                        ? '協同參戰'
                        : '參戰'
                      : n.activeFromYear > year
                        ? '未參戰'
                        : '已退出戰爭'}
                  </span>
                  <small>{available ? '凡爾登任務已開放' : '戰役未開放'}</small>
                </summary>
                <p>
                  {n.warEntryDate} — {n.warExitDate}
                </p>
                <p>{n.historicalSummary}</p>
                <p className="ww-note">{n.uniformVisualProfile}</p>
                <a
                  href={n.historicalSources.at(-1)}
                  target="_blank"
                  rel="noreferrer"
                >
                  歷史來源 ↗
                </a>
              </details>
            );
          })}
        </div>
        <p className="ww-note">
          俄羅斯帝國條目保留 1914–1917 俄國作戰脈絡，不把 1917
          年革命後政權稱作帝國，也不列為 1918 年正常參戰國。
        </p>
      </section>
      <p className="ww-note">{FACTIONS[faction].ending}</p>
    </div>
  );
}
export function FactionHistory() {
  return (
    <div className="ww-history-text">
      <p className="ww-eyebrow">HISTORICAL · FACTIONS</p>
      <h1>陣營說明</h1>
      <h2>協約國</h2>
      <p>
        法國、英國、俄羅斯帝國為早期核心；比利時、塞爾維亞、義大利與美國等在不同時間共同作戰。遊戲的戰役分組不等同每一國的條約身分。
      </p>
      <h2>同盟國</h2>
      <p>
        德意志帝國與奧匈帝國為核心；鄂圖曼帝國於 1914 年秋、保加利亞於 1915
        年參戰。兩方均以歷史軍事視角呈現，不區分英雄或反派。
      </p>
      <a href={HISTORY_SOURCES.overview} target="_blank" rel="noreferrer">
        國家陸軍博物館：第一次世界大戰 ↗
      </a>
      <h2>美國的協同國身分</h2>
      <p>
        {nationById('UNITED_STATES').historicalSummary} 對德宣戰日期為 1917 年 4
        月 6 日，因此不會出現在 1916 年凡爾登參戰名單。
      </p>
      <a href={HISTORY_SOURCES.usa} target="_blank" rel="noreferrer">
        美國國務院歷史辦公室：協同參戰身分 ↗
      </a>
      <h2>日期，而非固定國籍標籤</h2>
      <p>{nationById('ITALY').historicalSummary}</p>
      <p>{nationById('RUSSIAN_EMPIRE').historicalSummary}</p>
      <a href={HISTORY_SOURCES.russia} target="_blank" rel="noreferrer">
        俄國停戰與布列斯特—立陶夫斯克條約 ↗
      </a>
      <p className="ww-note">
        參戰起點依宣戰／受侵或直接作戰日期；結束以相關停戰生效日作日級截點，不代表正式和平條約日期。跨年戰役在導覽按開始年份歸檔。未開放是遊戲製作狀態，不是歷史上未參戰。
      </p>
    </div>
  );
}
