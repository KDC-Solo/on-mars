import { BLUEPRINTS } from '../data/blueprints'
import { missionById } from '../data/missions'
import { SCIENTISTS } from '../data/scientists'
import type { ActionNumber, BuildingType, SoloCard } from '../data/types'
import { LSS_SEQUENCE } from '../data/types'
import type { LacerdaState } from './lacerda'
import { botIcon } from './lacerda'

export const BUILDING_LABEL: Record<BuildingType, string> = {
  mine: 'Mine',
  generator: 'Generator',
  waterExtractor: 'Water Extractor',
  greenhouse: 'Greenhouse',
  oxygenCondenser: 'Oxygen Condenser',
  shelter: 'Shelter',
}

export interface MissionSetup {
  A: number
  B: number
  C: number
}

/** One imperative instruction shown to the player, one screen at a time. */
export interface Step {
  text: string
}

export function describeCard(card: SoloCard): string {
  const travel = card.travels ? 'Shuttle: travels' : 'Shuttle: does NOT travel (✗)'
  return `Solo card — Mission ${card.mission} · Action ${card.action} · ${travel}`
}

export function missionCubeStep(card: SoloCard, missions: MissionSetup): {
  step: Step
  crystals: number
} {
  const mission = missionById(missions[card.mission])
  return {
    step: {
      text:
        `Second pass: move the Mission ${card.mission} tracker cube (“${mission.name}”) down one space. ` +
        `Lacerda gains ${mission.rewardCrystals} Crystal${mission.rewardCrystals > 1 ? 's' : ''} (applied).`,
    },
    crystals: mission.rewardCrystals,
  }
}

/** Blueprint types that add to the end-game score of Lacerda's current Scientists. */
export function preferredBlueprintTypes(lacerda: LacerdaState): BuildingType[] {
  return SCIENTISTS.filter((s) => lacerda.scientists.includes(s.id)).map(
    (s) => s.scoresPerUpgraded
  )
}

function constructSteps(lacerda: LacerdaState): Step[] {
  const icon = botIcon(lacerda)
  const seq = [...LSS_SEQUENCE.slice(lacerda.botSequenceIndex + 1), ...LSS_SEQUENCE]
    .slice(0, 4)
    .map((b) => BUILDING_LABEL[b])
    .join(' → ')
  return [
    {
      text:
        `Construct a Building. His Bot is on the ${BUILDING_LABEL[icon]} icon: build a ${BUILDING_LABEL[icon]} ` +
        `if its LSS marker is below the Colony level marker. Otherwise continue along the sequence (${seq}) ` +
        `to the first buildable one — a Mine is always buildable.`,
    },
    {
      text:
        'Place it to form the largest possible Complex, using any available Tech. ' +
        'If several placements tie, use the Ambiguity resolver. ' +
        'Afterwards, tell the app which Building was constructed (his Bot advances past it).',
    },
  ]
}

/** The action script for a revealed card, based on Lacerda's current location. */
export function actionSteps(lacerda: LacerdaState, action: ActionNumber): Step[] {
  if (lacerda.location === 'orbit') {
    switch (action) {
      case 1: {
        const preferred = preferredBlueprintTypes(lacerda)
        const pref =
          preferred.length > 0
            ? `a type that scores his Scientists (${preferred.map((b) => BUILDING_LABEL[b]).join(' or ')})`
            : 'any type (he has no Scientists yet)'
        return [
          {
            text:
              `Obtain Blueprint: take ${pref}. If tied, take the leftmost card from the row ` +
              'with the most cards (bottom row if tied). Then tell the app which Blueprint he took.',
          },
        ]
      }
      case 2:
        return [
          {
            text:
              'Learn New Technology: Lacerda takes the cheapest Tech tile (leftmost if tied) and places it ' +
              'in his Lab, top space first, taking the space’s benefit as normal. ' +
              'If his Lab has no space, the move is illegal — he moves his Rover instead.',
          },
        ]
      case 3:
        return [
          {
            text:
              'R&D: Lacerda develops the most-developed Tech that can be developed once, ' +
              'then the least-developed Tech that can be developed once. If two Techs tie, develop the bottom one.',
          },
        ]
    }
  }
  switch (action) {
    case 1:
      return constructSteps(lacerda)
    case 2: {
      const unused = lacerda.blueprints.filter((id) => !lacerda.usedBlueprints.includes(id))
      if (unused.length === 0) {
        return [
          {
            text:
              'Upgrade a Building: Lacerda has no unused Blueprints — the move is illegal, ' +
              'he moves his Rover instead.',
          },
        ]
      }
      const preferred = preferredBlueprintTypes(lacerda)
      const pick =
        unused
          .map((id) => BLUEPRINTS.find((b) => b.id === id)!)
          .sort((a, b) => {
            const ap = preferred.includes(a.upgrades) ? 0 : 1
            const bp = preferred.includes(b.upgrades) ? 0 : 1
            return ap - bp || b.level - a.level
          })[0]
      return [
        {
          text:
            `Upgrade a Building: Lacerda uses his “${pick.name}” Blueprint (level ${pick.level}, ` +
            `upgrades a ${BUILDING_LABEL[pick.upgrades]}) and upgrades a Building anywhere on the board. ` +
            'If the Upgrade Tech is in play, he uses it to upgrade as many Buildings as he can.',
        },
      ]
    }
    case 3: {
      if (lacerda.scientists.length < 2) {
        return [
          {
            text:
              'Hire a Scientist: Lacerda hires the Scientist with the most potential OP, based on the ' +
              'number of Blueprints owned by each player (his and yours, used or not). ' +
              'Then tell the app which Scientist he took.',
          },
        ]
      }
      return [
        {
          text:
            'Take an Earth Contract: Lacerda already has 2 Scientists, so he takes the Contract worth the ' +
            'most OP — an Upgrade contract (12 OP) if any is in the display, otherwise a Deliver contract ' +
            '(9 OP). It counts as automatically completed. Then shuffle the Contract deck and refill the ' +
            'display with the top card. Record the taken type in the app.',
        },
      ]
    }
  }
}

/** Reminder shown whenever an action turns out to be illegal or unaffordable. */
export const ROVER_FALLBACK_STEP: Step = {
  text:
    'Move Lacerda’s Rover instead: it moves toward the closest tile it can collect (Research or Discovery, ' +
    'ignoring Discovery tiles that only give Resources). He uses available Tech and spends Crystals if ' +
    'required; ties → Ambiguity resolver. If it reaches a tile, resolve it immediately.',
}

export function colonistCostStep(occupiedSlots: number, lacerda: LacerdaState): {
  step: Step
  affordable: boolean
  cost: number
} {
  const cost = occupiedSlots
  if (cost === 0) {
    return { step: { text: 'No Colonists on this action yet — placement costs nothing extra.' }, affordable: true, cost }
  }
  if (lacerda.crystals >= cost) {
    return {
      step: {
        text: `Lacerda pays ${cost} Crystal${cost > 1 ? 's' : ''} for Colonist placement (applied).`,
      },
      affordable: true,
      cost,
    }
  }
  return {
    step: {
      text: `Placement costs ${cost} Crystals but Lacerda has ${lacerda.crystals} — the action is illegal.`,
    },
    affordable: false,
    cost,
  }
}

export function colonyLevelUpSteps(): Step[] {
  return [
    {
      text:
        'Colony levels up! At the end of the current player’s turn: Lacerda builds a Shelter ' +
        '(a Complex if possible — construction rules as usual, ties → Ambiguity resolver).',
    },
    {
      text:
        'Lacerda Welcomes a new Ship (he keeps his Ships to score; he never spends them) and takes 1 Bot ' +
        'onto his player board (it counts for LSS Rewards and Missions, never placed on the map).',
    },
  ]
}

export function travelSteps(destination: 'orbit' | 'colony'): Step[] {
  if (destination === 'orbit') {
    return [
      {
        text:
          'Lacerda travels to Orbit. He skips both arrival steps. ' +
          '(Turn Order space is chosen at random by the app once you say how many are free.)',
      },
    ]
  }
  return [
    {
      text:
        'Lacerda travels to the Colony. He places the leftmost Discovery tile from the Exploration space, ' +
        '3 spaces away from his Rover and as far from your Rover as possible. He skips retrieving Colonists.',
    },
    {
      text: 'Then he constructs a Building (same rules as his Construct action — the app will walk you through it).',
    },
  ]
}

export const TURN_ORDER_BENEFIT_STEP: Step = {
  text:
    'Turn Order benefit — resolve per icon: Resources: he takes whatever there is most of (ties: leftmost, ' +
    'Crystals first) into the general supply. Tech: as his Learn Tech action. Colonists: he moves his Rover ' +
    'instead. Bot ×2: move his Bot twice along the LSS sequence. Blueprint / Discovery: as the matching action.',
}
