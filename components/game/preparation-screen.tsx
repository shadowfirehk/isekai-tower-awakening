'use client';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Crosshair,
  FlaskConical,
  Shield,
  Sparkles,
  Swords,
  TowerControl,
  Wrench,
  Zap,
} from 'lucide-react';
import { PlayerSave } from '@/lib/game/types';

const MILESTONES = [
  {
    day: 1,
    actor: '岩崎 葵',
    role: 'TOWER ENGINEER',
    icon: Wrench,
    title: '部署訓練',
    dialogue:
      '「炮塔不是擺得越多越好。把火力放在路徑交會點，先建立可調整的陣形。」',
    action: '完成部署模擬',
    lesson: '部署槽與路徑距離會影響每種炮塔的價值。',
  },
  {
    day: 2,
    actor: '林澄博士',
    role: 'RIFT RESEARCHER',
    icon: FlaskConical,
    title: '敵情辨識',
    dialogue:
      '「疾行、重甲、護盾。先讀輪廓，再決定 FIRST 或 STRONGEST 鎖定。」',
    action: '完成敵情掃描',
    lesson: 'Runner 需要連射；Tank 與 Armor Boss 適合貫穿。',
  },
  {
    day: 3,
    actor: '神代 隼人',
    role: 'FRONTLINE COMMANDER',
    icon: Swords,
    title: '炮塔成長',
    dialogue:
      '「一次有效強化，勝過十次沒有目的的重複作戰。把素材投向你的核心流派。」',
    action: '完成強化演算',
    lesson: '星級 3★／5★會出現更強的能量環與覺醒效果。',
  },
  {
    day: 4,
    actor: '御影 零',
    role: 'RIVAL HUNTER',
    icon: Zap,
    title: '主動技能',
    dialogue: '「別看到 READY 就按。真正的獵人，會把爆發留給最需要的六秒。」',
    action: '完成技能時機測驗',
    lesson: '每座炮塔一個技能；技能與 Overdrive 的時機會改變戰果。',
  },
  {
    day: 5,
    actor: '艾莉西亞',
    role: 'EARTH ARC SIGNAL',
    icon: Sparkles,
    title: 'Boss 模擬',
    dialogue:
      '「警告不是裝飾。護盾、裝甲、弱點窗——看懂訊號，你才能守到最後。」',
    action: '完成頭目模擬',
    lesson: 'Wave 5 後會出現三選一祝福，建立本次戰鬥流派。',
  },
];

export function PreparationScreen({
  save,
  onBack,
  onComplete,
}: {
  save: PlayerSave;
  onBack: () => void;
  onComplete: () => void;
}) {
  const index = Math.min(4, save.preparationDay),
    current = MILESTONES[index],
    complete = save.preparationDay >= 5,
    Icon = current.icon;
  return (
    <section className="preparation-screen phase-screen">
      <header className="phase-header">
        <button onClick={onBack}>
          <ArrowLeft />
          返回主畫面
        </button>
        <div>
          <p>FIVE-DAY FIELD PREPARATION · PHASE 7.5</p>
          <h1>地球防線實戰準備</h1>
        </div>
        <span>
          {complete
            ? 'TRAINING COMPLETE'
            : `DAY ${String(index + 1).padStart(2, '0')} / 05`}
        </span>
      </header>
      <main className="training-layout">
        <nav className="training-road">
          {MILESTONES.map((item, itemIndex) => {
            const ItemIcon = item.icon,
              state =
                itemIndex < save.preparationDay
                  ? 'complete'
                  : itemIndex === index && !complete
                    ? 'active'
                    : 'locked';
            return (
              <article className={state} key={item.day}>
                <i>{state === 'complete' ? <Check /> : <ItemIcon />}</i>
                <span>
                  <small>
                    DAY {String(item.day).padStart(2, '0')} · {item.role}
                  </small>
                  <b>{item.title}</b>
                </span>
                <em>{state.toUpperCase()}</em>
              </article>
            );
          })}
        </nav>
        <section className="training-mission">
          <div className="training-scan">
            <div className="training-hero" />
            <i />
            <Crosshair />
          </div>
          <article className="transmission-card">
            <header>
              <Icon />
              <span>
                <small>{current.role}</small>
                <h2>{current.actor}</h2>
              </span>
              <em>LIVE COMMS</em>
            </header>
            <blockquote>{current.dialogue}</blockquote>
            <div className="training-objective">
              <Shield />
              <span>
                <small>TACTICAL LESSON</small>
                <b>{current.lesson}</b>
              </span>
            </div>
            {complete ? (
              <button className="primary-action" onClick={onBack}>
                <Check />
                全部準備完成 · 返回主畫面
              </button>
            ) : (
              <button className="primary-action" onClick={onComplete}>
                <TowerControl />
                {current.action}
                <ChevronRight />
              </button>
            )}
          </article>
        </section>
      </main>
    </section>
  );
}
