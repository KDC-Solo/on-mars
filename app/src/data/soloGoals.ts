import type { SoloGoalCard } from './types'

/** The 4 Solo Goals (Rulebook p. 23). The player wins by fulfilling every requirement of one goal. */
export const SOLO_GOALS: readonly SoloGoalCard[] = [
  {
    id: 'first-colonists',
    name: 'First Colonists',
    level: 'Level 1',
    requirements: [
      'Reach at least Colony level 3',
      'Complete at least 1 Contract',
      'Complete 1 Private Goal card',
      'Have a level 6 Tech tile',
      'Have more OP than Lacerda',
    ],
  },
  {
    id: 'next-generation',
    name: 'Next Generation',
    level: 'Level 2',
    requirements: [
      'Reach at least Colony level 3',
      'Complete at least 2 Contracts, 1 of each type',
      'Complete 1 Private Goal card',
      'Have at least 2 Research tiles',
      'Have at least 4 Shelters built',
      'Beat Lacerda by 10 OP or more',
    ],
  },
  {
    id: 'hunky-dory',
    name: 'Hunky Dory',
    level: 'Level 3',
    requirements: [
      'Reach at least Colony level 4',
      'Complete at least 2 Contracts, 1 of each type',
      'Complete 1 Private Goal card',
      'Have Colonists and/or Advanced Building markers on at least 3 Mines',
      'Have at least 5 Advanced Buildings',
      'Beat Lacerda by 20 OP or more',
    ],
  },
  {
    id: 'martian-potato',
    name: 'A Martian Potato (survival scenario)',
    level: 'Scenario',
    requirements: [
      'Reach at least Colony level 3',
      'Complete the size 4 Greenhouse Contract',
      'Complete the Delivery Contract with Plants and Minerals (#11)',
      'Take the Biochemist',
      'Have at least 3 Greenhouse Advanced Buildings',
      'Expand a Greenhouse Complex to at least size 5',
      'Have at least 5 Plants in storage',
      'Take at least 2 Research tiles',
      'Have the Greenhouse Tech at level 6',
      'Finish the game in Orbit',
      'Beat Lacerda by 30 OP or more',
    ],
  },
]
