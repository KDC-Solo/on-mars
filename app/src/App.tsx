import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import './App.css'
import { BLUEPRINTS } from './data/blueprints'
import { MISSIONS } from './data/missions'
import { SCIENTISTS } from './data/scientists'
import { SOLO_GOALS } from './data/soloGoals'
import { CONTRACTS } from './data/contracts'
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
import type { BoardCounts } from './engine/scoring'
import { EMPTY_BOARD, LIVING_QUARTERS_OP, scoreLacerda, scorePlayer, verdict } from './engine/scoring'
import type { ScoreBreakdown } from './engine/scoring'
import type { Step } from './engine/turn'
import { BUILDING_LABEL } from './engine/turn'
import { cues, setSoundEnabled, soundEnabled } from './sound'
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

function useConsoleToggles() {
  const [theme, setTheme] = useState(() => localStorage.getItem('om-theme') ?? 'dark')
  const [sound, setSound] = useState(soundEnabled)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('om-theme', theme)
  }, [theme])

  const toggles = (
    <span className="toggles">
      <button
        className="icon-btn"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Day-side view' : 'Night-side view'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
      <button
        className="icon-btn"
        aria-label="Toggle sound"
        title={sound ? 'Mute console' : 'Unmute console'}
        onClick={() => {
          setSoundEnabled(!sound)
          setSound(!sound)
          if (!sound) cues.tick()
        }}
      >
        {sound ? '🔊' : '🔇'}
      </button>
    </span>
  )
  return toggles
}

function Brand({ sub, right }: { sub: string; right?: ReactNode }) {
  return (
    <div className="brand">
      <HexLogo />
      <span className="brand-name">ON MARS</span>
      <span className="brand-sub">{sub}</span>
      {right && <span className="brand-right">{right}</span>}
    </div>
  )
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <label className="num">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </label>
  )
}

function ScoreTable({ title, score }: { title: string; score: ScoreBreakdown }) {
  return (
    <div className="scorecard">
      <h3>{title}</h3>
      <table className="scoretable">
        <tbody>
          {score.lines.map((x) => (
            <tr key={x.label}>
              <td>{x.label}</td>
              <td className="op">{x.op}</td>
            </tr>
          ))}
          <tr className="total">
            <td>Total</td>
            <td className="op">{score.total}</td>
          </tr>
        </tbody>
      </table>
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
        <a href="https://github.com/KDC-Solo/on-mars" target="_blank" rel="noreferrer">
          Source &amp; issues on GitHub
        </a>
      </small>
    </>
  )
}

/** Instruction screens of the guided setup (the solo deltas from Rulebook p. 22, paraphrased). */
const SETUP_GUIDE: { title: string; items: string[] }[] = [
  {
    title: 'The table',
    items: [
      'Set up On Mars as a standard 2-player game — you take one seat, Lacerda takes the other.',
      'Give Lacerda a color: player board, Colonists, Rover, Shuttle marker and Bots, placed exactly as for a human opponent.',
      'Deal the Mission cards to slots A, B and C as usual — you will tell the app which ones landed where in a moment.',
    ],
  },
  {
    title: 'Lacerda’s corner',
    items: [
      'Lacerda gets no Private Goal cards — return his to the box. You keep yours as normal.',
      'Leave the 12 solo cards in the box: the app is his deck and reveals, discards and reshuffles for you.',
      'Skip his resource tokens too. The app tracks his Crystals — he starts with 0 and his Depot caps him at 6. His Bots wait on his player board.',
    ],
  },
  {
    title: 'His Bot on the Mine',
    items: [
      'Place one of Lacerda’s Bots on the Mine icon in the Progress area.',
      'That marker tracks his build sequence — Mine, Generator, Water Extractor, Greenhouse, Oxygen Condenser, then around again. The console header mirrors it as “Bot →”.',
    ],
  },
  {
    title: 'Turn order & Shuttle',
    items: [
      'Shuffle the First Colonist tiles and draw one at random: it sets Lacerda’s starting Turn Order space.',
      'Place his Shuttle marker on the red space on his side. Lacerda begins the game in Orbit.',
    ],
  },
]

function Setup({ onStart, toggles }: { onStart: (s: GameState) => void; toggles: ReactNode }) {
  const [slots, setSlots] = useState<Record<MissionSlot, number>>({ A: 1, B: 4, C: 8 })
  const [goal, setGoal] = useState(SOLO_GOALS[0].id)
  /** 0 = quick one-screen setup; 1..totalSteps = guided walkthrough. */
  const [step, setStep] = useState(0)

  const missionStep = SETUP_GUIDE.length + 1
  const goalStep = SETUP_GUIDE.length + 2
  const totalSteps = SETUP_GUIDE.length + 3

  const valid = new Set(Object.values(slots)).size === 3
  const goalCard = SOLO_GOALS.find((x) => x.id === goal)!
  const start = () => onStart(newGame({ seed: Date.now() >>> 0, missions: slots, soloGoalId: goal }))
  const go = (n: number) => {
    setStep(n)
    cues.tick()
  }

  const missionSelects = (['A', 'B', 'C'] as const).map((slot) => (
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
  ))

  if (step === 0) {
    return (
      <div className="panel setup">
        <Brand sub="MISSION BRIEFING" right={toggles} />
        <h1>On Mars Solo — Setup</h1>
        <p className="hint">
          First game against the bot, or want a checklist? The walkthrough covers every solo
          setup difference one screen at a time.
        </p>
        <button className="big" onClick={() => go(1)}>
          Guided setup
        </button>
        <h3>Quick setup</h3>
        <p className="hint">
          Set up a 2-player game. Lacerda gets no Private Goals; his Bot starts on the Mine icon in
          the Progress area. Shuffle the First Colonist tiles for his starting Turn Order space; the
          Shuttle starts on the red space on his side.
        </p>
        {missionSelects}
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
        <button className="big" disabled={!valid} onClick={start}>
          Start game
        </button>
      </div>
    )
  }

  return (
    <div className="panel setup">
      <Brand sub="MISSION BRIEFING" right={toggles} />
      <h1>On Mars Solo — Setup</h1>
      <p className="wizard-progress">
        Guided setup · step {step} of {totalSteps}
      </p>

      {step <= SETUP_GUIDE.length && (
        <>
          <h2>{SETUP_GUIDE[step - 1].title}</h2>
          <ol className="steps">
            {SETUP_GUIDE[step - 1].items.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
        </>
      )}

      {step === missionStep && (
        <>
          <h2>Missions</h2>
          <p className="hint">Which Mission card landed in each slot?</p>
          {missionSelects}
          {!valid && <p className="warn">Pick three different Missions.</p>}
        </>
      )}

      {step === goalStep && (
        <>
          <h2>Your Solo Goal</h2>
          <p className="hint">Pick the Goal you will play against, or let the app deal one.</p>
          <div className="goal-pick">
            {SOLO_GOALS.map((x) => (
              <button
                key={x.id}
                className={x.id === goal ? 'on' : undefined}
                onClick={() => {
                  setGoal(x.id)
                  cues.tick()
                }}
              >
                {x.name}
                <span className="lvl">{x.level}</span>
              </button>
            ))}
          </div>
          <div className="actions">
            <button
              onClick={() => {
                setGoal(SOLO_GOALS[Math.floor(Math.random() * SOLO_GOALS.length)].id)
                cues.reveal()
              }}
            >
              🎲 Deal a random Goal
            </button>
          </div>
          <h3>{goalCard.name} — to win you must:</h3>
          <ul className="goal-reqs">
            {goalCard.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}

      {step === totalSteps && (
        <>
          <h2>Launch check</h2>
          <ul className="review">
            {(['A', 'B', 'C'] as const).map((slot) => (
              <li key={slot}>
                Mission {slot} <b>{MISSIONS.find((m) => m.id === slots[slot])!.name}</b>
              </li>
            ))}
            <li>
              Solo Goal{' '}
              <b>
                {goalCard.name} ({goalCard.level})
              </b>
            </li>
          </ul>
          <p className="hint">
            Lacerda starts in Orbit with 0 of 6 Crystals and his Bot on the Mine — the console
            header should match after launch. Undo is always one tap away.
          </p>
        </>
      )}

      <div className="actions">
        <button onClick={() => go(step - 1)}>← Back</button>
        {step < totalSteps ? (
          <button className="big" disabled={step === missionStep && !valid} onClick={() => go(step + 1)}>
            Next →
          </button>
        ) : (
          <button
            className="big"
            disabled={!valid}
            onClick={() => {
              start()
              cues.done()
            }}
          >
            Start game
          </button>
        )}
      </div>
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
  | 'report'

type ContractMark = 'completed' | 'failed'

interface ReportInputs {
  lTrack: number
  lTech: number
  lCubes: number
  pTrack: number
  pCubes: number
  pTech: number
  pShips: number
  pB1: number
  pB3: number
  pU1: number
  pU3: number
  pContracts: Record<number, ContractMark>
  pColonists: number
  pScientists: ScientistId[]
  board: BoardCounts
}

const EMPTY_REPORT: ReportInputs = {
  lTrack: 0,
  lTech: 0,
  lCubes: 0,
  pTrack: 0,
  pCubes: 0,
  pTech: 0,
  pShips: 0,
  pB1: 0,
  pB3: 0,
  pU1: 0,
  pU3: 0,
  pContracts: {},
  pColonists: 0,
  pScientists: [],
  board: EMPTY_BOARD,
}

const RESOURCE_LABEL: Record<string, string> = {
  mineral: 'Minerals',
  battery: 'Batteries',
  water: 'Water',
  plant: 'Plants',
  oxygen: 'Oxygen',
}

function contractLabel(c: (typeof CONTRACTS)[number]): string {
  if (c.type === 'upgrade') return `${BUILDING_LABEL[c.building]} complex ≥ 4`
  const parts = Object.entries(c.requires.resources).map(([r, n]) => `${n} ${RESOURCE_LABEL[r]}`)
  if (c.requires.crystals) parts.unshift(`${c.requires.crystals} Crystals`)
  return parts.join(' + ')
}

export default function App() {
  const store = useGameStore()
  const [steps, setSteps] = useState<Step[]>([])
  const [dialog, setDialog] = useState<Dialog>('none')
  const [report, setReport] = useState<ReportInputs>(EMPTY_REPORT)
  const toggles = useConsoleToggles()

  if (!store.state) {
    return (
      <>
        <Setup onStart={(s) => store.apply(s)} toggles={toggles} />
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
    cues.tick()
  }

  const goal = SOLO_GOALS.find((x) => x.id === g.soloGoalId)!
  const unusedBlueprints = l.blueprints.filter((id) => !l.usedBlueprints.includes(id))

  return (
    <div className="layout">
      <header>
        <Brand sub="SOLO CONSOLE" right={toggles} />
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
              <button
                onClick={() => {
                  run(colonyLevelUp(g))
                  cues.levelUp()
                }}
              >
                Colony leveled up
              </button>
              <button onClick={() => setDialog('ambiguity')}>Resolve ambiguity</button>
              <button onClick={() => setDialog('report')}>Final scoring</button>
            </div>
            {steps.length > 0 && (
              <>
                <ol className="steps">
                  {steps.map((s, i) => (
                    <li key={i}>{s.text}</li>
                  ))}
                </ol>
                <div className="actions">
                  <button
                    className="big"
                    onClick={() => {
                      setSteps([])
                      cues.done()
                    }}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      run(reportIllegalAction(g))
                      cues.error()
                    }}
                  >
                    Not possible → Rover
                  </button>
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
                <button
                  key={n}
                  className="big"
                  onClick={() => {
                    run(beginLacerdaTurn(g, n))
                    cues.reveal()
                  }}
                >
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
                <button
                  key={n}
                  className="big"
                  onClick={() => {
                    run(shuttlePhase(g, n))
                    cues.done()
                  }}
                >
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

        {dialog === 'report' && (
          <div className="report">
            <h2>Mission Report — Final Scoring</h2>
            <p className="hint">
              Enter what the app can’t see on the table. Both totals update live; everything
              Lacerda’s tracker already knows is filled in automatically.
            </p>

            <h3>Advanced Buildings on Mars (any player’s, by type)</h3>
            <div className="numgrid">
              {BUILDINGS.map((b) => (
                <Num
                  key={b}
                  label={BUILDING_LABEL[b]}
                  value={report.board[b]}
                  onChange={(n) => setReport({ ...report, board: { ...report.board, [b]: n } })}
                />
              ))}
            </div>

            <div className="report-cols">
              <div>
                <h3>Lacerda — table facts</h3>
                <div className="numgrid">
                  <Num label="OP track" value={report.lTrack} onChange={(n) => setReport({ ...report, lTrack: n })} />
                  <Num label="Tech OP (Lab columns)" value={report.lTech} onChange={(n) => setReport({ ...report, lTech: n })} />
                  <Num label="Progress cubes (0–5)" value={report.lCubes} onChange={(n) => setReport({ ...report, lCubes: n })} />
                </div>
              </div>
              <div>
                <h3>You — table facts</h3>
                <div className="numgrid">
                  <Num label="OP track" value={report.pTrack} onChange={(n) => setReport({ ...report, pTrack: n })} />
                  <Num label="Tech OP (Lab columns)" value={report.pTech} onChange={(n) => setReport({ ...report, pTech: n })} />
                  <Num label="Progress cubes (0–5)" value={report.pCubes} onChange={(n) => setReport({ ...report, pCubes: n })} />
                  <Num label="Ships in Hangar" value={report.pShips} onChange={(n) => setReport({ ...report, pShips: n })} />
                  <Num label="Built L1 Blueprints" value={report.pB1} onChange={(n) => setReport({ ...report, pB1: n })} />
                  <Num label="Built L3 Blueprints" value={report.pB3} onChange={(n) => setReport({ ...report, pB3: n })} />
                  <Num label="Unbuilt L1 Blueprints" value={report.pU1} onChange={(n) => setReport({ ...report, pU1: n })} />
                  <Num label="Unbuilt L3 Blueprints" value={report.pU3} onChange={(n) => setReport({ ...report, pU3: n })} />
                </div>
                <h3>Colonists</h3>
                <p className="hint">Tap the number printed next to your highest Colonist in the Living Quarters.</p>
                <div className="chips">
                  {LIVING_QUARTERS_OP.map((v) => (
                    <button
                      key={v}
                      className={report.pColonists === v ? 'chip pick on' : 'chip pick'}
                      onClick={() => setReport({ ...report, pColonists: v })}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <h3>Your Earth Contracts</h3>
                <p className="hint">Tap a Contract you hold to cycle: not yours → completed ✓ → failed ✗.</p>
                <div className="chips">
                  {CONTRACTS.map((c) => {
                    const mark = report.pContracts[c.id]
                    const next: ContractMark | undefined =
                      mark === undefined ? 'completed' : mark === 'completed' ? 'failed' : undefined
                    return (
                      <button
                        key={c.id}
                        className={`chip pick ${mark === 'completed' ? 'on' : mark === 'failed' ? 'off' : ''}`}
                        onClick={() => {
                          const pContracts = { ...report.pContracts }
                          if (next === undefined) delete pContracts[c.id]
                          else pContracts[c.id] = next
                          setReport({ ...report, pContracts })
                        }}
                      >
                        {mark === 'completed' ? '✓ ' : mark === 'failed' ? '✗ ' : ''}#{c.id} {contractLabel(c)} (
                        {mark === 'failed' ? c.opFailed : `+${c.opComplete}`})
                      </button>
                    )
                  })}
                </div>
                <h3>Your Scientists</h3>
                <div className="chips">
                  {SCIENTISTS.filter((s) => !l.scientists.includes(s.id)).map((s) => (
                    <label key={s.id} className="chip pick">
                      <input
                        type="checkbox"
                        checked={report.pScientists.includes(s.id)}
                        onChange={() =>
                          setReport({
                            ...report,
                            pScientists: report.pScientists.includes(s.id)
                              ? report.pScientists.filter((x) => x !== s.id)
                              : [...report.pScientists, s.id],
                          })
                        }
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {(() => {
              const lScore = scoreLacerda(l, {
                trackOP: report.lTrack,
                techOP: report.lTech,
                progressCubes: report.lCubes,
                board: report.board,
              })
              const pScore = scorePlayer({
                trackOP: report.pTrack,
                progressCubes: report.pCubes,
                techOP: report.pTech,
                ships: report.pShips,
                builtL1: report.pB1,
                builtL3: report.pB3,
                unbuiltL1: report.pU1,
                unbuiltL3: report.pU3,
                scientists: report.pScientists,
                contracts: Object.entries(report.pContracts).map(([id, mark]) => ({
                  id: Number(id),
                  completed: mark === 'completed',
                })),
                colonistsOP: report.pColonists,
                board: report.board,
              })
              const v = verdict(pScore, lScore, g.soloGoalId)
              const ticked = g.goalChecked.filter(Boolean).length
              const allTicked = ticked === goal.requirements.length
              return (
                <>
                  <div className="report-cols">
                    <ScoreTable title={`Lacerda — ${lScore.total} OP`} score={lScore} />
                    <ScoreTable title={`You — ${pScore.total} OP`} score={pScore} />
                  </div>
                  <div className={`verdict ${v.marginMet && allTicked ? 'win' : v.marginMet ? 'partial' : 'fail'}`}>
                    {v.marginMet
                      ? `Margin met: +${v.margin} OP (needs +${v.required}).`
                      : `Margin missed: ${v.margin >= 0 ? '+' : ''}${v.margin} OP of the +${v.required} required.`}{' '}
                    Checklist: {ticked}/{goal.requirements.length} ticked.{' '}
                    {v.marginMet && allTicked
                      ? 'MISSION ACCOMPLISHED — the colony is yours.'
                      : v.marginMet
                        ? 'Verify the remaining goal requirements to claim victory.'
                        : 'Lacerda claims the colony this time.'}
                  </div>
                </>
              )
            })()}
          </div>
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
                    cues.reveal()
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
                  onChange={() => {
                    store.apply(toggleGoalRequirement(g, i))
                    cues.tick()
                  }}
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
