import { useState } from 'react'
import './App.css'
import { BLUEPRINTS } from './data/blueprints'
import { MISSIONS } from './data/missions'
import { SCIENTISTS } from './data/scientists'
import { SOLO_GOALS } from './data/soloGoals'
import type { BuildingType, MissionSlot, ScientistId } from './data/types'
import { LSS_SEQUENCE } from './data/types'
import type { GameState } from './engine/game'
import {
  ambiguity,
  beginLacerdaTurn,
  colonyLevelUp,
  newGame,
  recordBlueprint,
  recordBlueprintUsed,
  recordConstruction,
  recordContract,
  recordScientist,
  recordTech,
  reportIllegalAction,
  shuttlePhase,
  toggleGoalRequirement,
} from './engine/game'
import type { Step } from './engine/turn'
import { BUILDING_LABEL } from './engine/turn'
import { useGameStore } from './store'

const BUILDINGS = Object.keys(BUILDING_LABEL) as BuildingType[]

function HexLogo() {
  return (
    <svg className="hexlogo" viewBox="0 0 24 24" aria-hidden="true">
      <polygon
        points="12 1.5 21.1 6.75 21.1 17.25 12 22.5 2.9 17.25 2.9 6.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="4.2" fill="var(--rust)" />
    </svg>
  )
}

function Brand({ sub }: { sub: string }) {
  return (
    <div className="brand">
      <HexLogo />
      <span className="brand-name">ON MARS</span>
      <span className="brand-sub">{sub}</span>
    </div>
  )
}

function FooterSmallPrint() {
  return (
    <>
      <small>State auto-saves to this browser. Use Undo to revert an applied action.</small>
      <small className="disclaimer">
        Unofficial fan companion for solo play. Not affiliated with or endorsed by
        Eagle-Gryphon Games or Vital Lacerda. No game art or rules text is reproduced — you
        need your own copy of On Mars.
      </small>
      <small className="footer-meta">
        v{__APP_VERSION__} ·{' '}
        <a href="https://github.com/ianpogi5/on-mars-solo" target="_blank" rel="noreferrer">
          Source &amp; issues on GitHub
        </a>
      </small>
    </>
  )
}

function Setup({ onStart }: { onStart: (s: GameState) => void }) {
  const [slots, setSlots] = useState<Record<MissionSlot, number>>({ A: 1, B: 4, C: 8 })
  const [goal, setGoal] = useState(SOLO_GOALS[0].id)

  const valid = new Set(Object.values(slots)).size === 3

  return (
    <div className="panel setup">
      <Brand sub="MISSION BRIEFING" />
      <h1>On Mars Solo — Setup</h1>
      <p className="hint">
        Set up a 2-player game. Lacerda gets no Private Goals; his Bot starts on the Mine icon in
        the Progress area. Shuffle the First Colonist tiles for his starting Turn Order space; the
        Shuttle starts on the red space on his side.
      </p>
      {(['A', 'B', 'C'] as const).map((slot) => (
        <label key={slot}>
          Mission {slot}
          <select
            value={slots[slot]}
            onChange={(e) => setSlots({ ...slots, [slot]: Number(e.target.value) })}
          >
            {MISSIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.required.p2}× · +{m.rewardCrystals} Crystal
              </option>
            ))}
          </select>
        </label>
      ))}
      <label>
        Solo Goal
        <select value={goal} onChange={(e) => setGoal(e.target.value as typeof goal)}>
          {SOLO_GOALS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} ({x.level})
            </option>
          ))}
        </select>
      </label>
      {!valid && <p className="warn">Pick three different Missions.</p>}
      <button
        className="big"
        disabled={!valid}
        onClick={() => onStart(newGame({ seed: Date.now() >>> 0, missions: slots, soloGoalId: goal }))}
      >
        Start game
      </button>
    </div>
  )
}

type Dialog =
  | 'none'
  | 'occupied'
  | 'shuttle'
  | 'record-blueprint'
  | 'use-blueprint'
  | 'record-construction'
  | 'record-scientist'
  | 'record-contract'
  | 'ambiguity'

export default function App() {
  const store = useGameStore()
  const [steps, setSteps] = useState<Step[]>([])
  const [dialog, setDialog] = useState<Dialog>('none')

  if (!store.state) {
    return (
      <>
        <Setup onStart={(s) => store.apply(s)} />
        <footer>
          <FooterSmallPrint />
        </footer>
      </>
    )
  }
  const g = store.state
  const l = g.lacerda

  const run = (result: { state: GameState; steps: Step[] }) => {
    store.apply(result.state)
    setSteps(result.steps)
    setDialog('none')
  }
  const applyAndClose = (next: GameState) => {
    store.apply(next)
    setDialog('none')
  }

  const goal = SOLO_GOALS.find((x) => x.id === g.soloGoalId)!
  const unusedBlueprints = l.blueprints.filter((id) => !l.usedBlueprints.includes(id))

  return (
    <div className="layout">
      <header>
        <Brand sub="SOLO CONSOLE" />
        <div className="chips">
          <span className="chip primary">
            Colony <b>L{g.colonyLevel}</b>
          </span>
          <span className="chip primary">
            Lacerda in <b>{l.location === 'orbit' ? 'Orbit' : 'the Colony'}</b>
          </span>
          <span className="chip primary">
            Crystals{' '}
            <b>
              {l.crystals}/{l.depotCapacity}
            </b>
          </span>
          <span className="chip primary">
            Bot → <b>{BUILDING_LABEL[LSS_SEQUENCE[l.botSequenceIndex]]}</b>
          </span>
        </div>
        <div className="chips dim">
          <span className="chip">
            Blueprints {l.blueprints.length} ({l.usedBlueprints.length} used)
          </span>
          <span className="chip">Scientists {l.scientists.length}</span>
          <span className="chip">Contracts {l.contractOP.length}</span>
          <span className="chip">Techs {l.techCount}</span>
          <span className="chip">Shelters {l.shelters}</span>
          <span className="chip">Ships {l.ships}</span>
          <span className="chip">Bots {l.bots}</span>
        </div>
      </header>

      <main className="panel">
        {dialog === 'none' && (
          <>
            <div className="actions">
              <button className="big" onClick={() => setDialog('occupied')}>
                Lacerda’s turn
              </button>
              <button onClick={() => setDialog('shuttle')}>Shuttle phase</button>
              <button onClick={() => run(colonyLevelUp(g))}>Colony leveled up</button>
              <button onClick={() => setDialog('ambiguity')}>Resolve ambiguity</button>
            </div>
            {steps.length > 0 && (
              <>
                <ol className="steps">
                  {steps.map((s, i) => (
                    <li key={i}>{s.text}</li>
                  ))}
                </ol>
                <div className="actions">
                  <button className="big" onClick={() => setSteps([])}>
                    Done
                  </button>
                  <button onClick={() => run(reportIllegalAction(g))}>Not possible → Rover</button>
                </div>
                <div className="actions">
                  <button onClick={() => setDialog('record-blueprint')}>+ Blueprint</button>
                  <button onClick={() => setDialog('use-blueprint')} disabled={unusedBlueprints.length === 0}>
                    Blueprint used
                  </button>
                  <button onClick={() => setDialog('record-construction')}>+ Built</button>
                  <button onClick={() => setDialog('record-scientist')} disabled={l.scientists.length >= 2}>
                    + Scientist
                  </button>
                  <button onClick={() => setDialog('record-contract')}>+ Contract</button>
                  <button onClick={() => store.apply(recordTech(g))}>+ Tech</button>
                </div>
              </>
            )}
          </>
        )}

        {dialog === 'occupied' && (
          <>
            <h2>Colonists already on the action Lacerda will use?</h2>
            <p className="hint">Count yours and his on that action’s slots — he pays 1 Crystal each.</p>
            <div className="actions">
              {[0, 1, 2, 3, 4].map((n) => (
                <button key={n} className="big" onClick={() => run(beginLacerdaTurn(g, n))}>
                  {n}
                </button>
              ))}
            </div>
          </>
        )}

        {dialog === 'shuttle' && (
          <>
            <h2>How many Turn Order spaces are still free?</h2>
            <div className="actions">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} className="big" onClick={() => run(shuttlePhase(g, n))}>
                  {n}
                </button>
              ))}
            </div>
          </>
        )}

        {dialog === 'record-blueprint' && (
          <>
            <h2>Which Blueprint did Lacerda take?</h2>
            <div className="actions wrap">
              {BLUEPRINTS.filter((b) => !l.blueprints.includes(b.id)).map((b) => (
                <button
                  key={b.id}
                  onClick={() => applyAndClose(recordBlueprint(g, b.id, b.gainOnObtain === '1 Crystal'))}
                >
                  {b.id}. {b.name} · L{b.level} · {BUILDING_LABEL[b.upgrades]}
                </button>
              ))}
            </div>
          </>
        )}

        {dialog === 'use-blueprint' && (
          <>
            <h2>Which Blueprint did he use?</h2>
            <div className="actions wrap">
              {unusedBlueprints.map((id) => {
                const b = BLUEPRINTS.find((x) => x.id === id)!
                return (
                  <button key={id} onClick={() => applyAndClose(recordBlueprintUsed(g, id))}>
                    {b.id}. {b.name}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {dialog === 'record-construction' && (
          <>
            <h2>Which Building did Lacerda construct?</h2>
            <div className="actions wrap">
              {BUILDINGS.map((b) => (
                <button key={b} onClick={() => applyAndClose(recordConstruction(g, b))}>
                  {BUILDING_LABEL[b]}
                </button>
              ))}
            </div>
          </>
        )}

        {dialog === 'record-scientist' && (
          <>
            <h2>Which Scientist did Lacerda hire?</h2>
            <div className="actions wrap">
              {SCIENTISTS.filter((s) => !l.scientists.includes(s.id)).map((s) => (
                <button key={s.id} onClick={() => applyAndClose(recordScientist(g, s.id as ScientistId))}>
                  {s.name}
                </button>
              ))}
            </div>
          </>
        )}

        {dialog === 'record-contract' && (
          <>
            <h2>Which Contract type did Lacerda take?</h2>
            <p className="hint">He always prefers the higher OP: Upgrade (12) over Deliver (9).</p>
            <div className="actions">
              <button className="big" onClick={() => applyAndClose(recordContract(g, 12))}>
                Upgrade (12 OP)
              </button>
              <button className="big" onClick={() => applyAndClose(recordContract(g, 9))}>
                Deliver (9 OP)
              </button>
            </div>
          </>
        )}

        {dialog === 'ambiguity' && (
          <>
            <h2>How many tied options?</h2>
            <p className="hint">Number the choices on the table left to right, then tap.</p>
            <div className="actions">
              {([2, 3] as const).map((n) => (
                <button
                  key={n}
                  className="big"
                  onClick={() => {
                    const labels = Array.from({ length: n }, (_, i) => `Option ${i + 1}`)
                    const r = ambiguity(g, labels)
                    store.apply(r.state)
                    setSteps(r.steps)
                    setDialog('none')
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}

        {dialog !== 'none' && (
          <div className="actions">
            <button onClick={() => setDialog('none')}>Cancel</button>
          </div>
        )}
      </main>

      <aside className="panel">
        <h3>Solo Goal: {goal.name}</h3>
        <ul className="goal">
          {goal.requirements.map((r, i) => (
            <li key={r}>
              <label className={g.goalChecked[i] ? 'done' : undefined}>
                <input
                  type="checkbox"
                  checked={!!g.goalChecked[i]}
                  onChange={() => store.apply(toggleGoalRequirement(g, i))}
                />
                <span>{r}</span>
              </label>
            </li>
          ))}
        </ul>
        <h3>Action history ({g.log.length})</h3>
        <ul className="log">
          {[...g.log].reverse().map((e, i) => (
            <li key={g.log.length - i}>
              <b>T{e.turn}</b> {e.text}
            </li>
          ))}
        </ul>
      </aside>

      <footer>
        <div className="actions">
          <button onClick={store.undo} disabled={!store.canUndo}>
            ↩ Undo
          </button>
          <button onClick={store.redo} disabled={!store.canRedo}>
            ↪ Redo
          </button>
          <button
            onClick={() => {
              if (confirm('Abandon this game?')) store.reset()
            }}
          >
            New game
          </button>
        </div>
        <FooterSmallPrint />
      </footer>
    </div>
  )
}
