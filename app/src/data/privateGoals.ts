import type { PrivateGoalCard } from './types'

/**
 * The 16 Private Goal cards (docs/card-database.md). Reward is always
 * "Develop ×2 at no cost" OR the listed alternative. Lacerda never has these;
 * the player's Solo Goal requires completing one.
 */
export const PRIVATE_GOALS: readonly PrivateGoalCard[] = [
  { id: 1, goal: 'Have 4 Blueprints (built or not)', altReward: 'Upgrade up to 2 Buildings at no cost' },
  { id: 2, goal: 'Upgrade 3 Advanced Buildings', altReward: 'Gain up to 3 Resources (not Minerals)' },
  { id: 3, goal: 'Have 3 Mines with your Colonist or your Advanced Building marker', altReward: 'Gain 3 Minerals' },
  { id: 4, goal: 'Have 3 Discovery tiles taken with your Rover', altReward: 'Move your Rover up to 5 spaces' },
  { id: 5, goal: 'Have an Advanced Building marker on a Complex of size ≥ 4', altReward: 'Take 2 Colonists from supply into your Living Quarters' },
  { id: 6, goal: 'Have 4 Resources of the same type (not Minerals)', altReward: 'Take an Earth Contract from the display at no cost' },
  { id: 7, goal: 'Have 3 Shelters', altReward: 'Take 2 Colonists from supply into your Living Quarters' },
  { id: 8, goal: 'The Colony reaches level 3', altReward: 'Move your Rover up to 5 spaces' },
  { id: 9, goal: 'Have 7 Colonists in your Living Quarters', altReward: 'Welcome a Ship at no cost' },
  { id: 10, goal: 'Have at least 5 Tech tiles (initial Shelter Tech counts)', altReward: 'Retrieve 2 Colonists from the board and/or Working Area' },
  { id: 11, goal: 'Have 3 Ships in your Hangar', altReward: 'Travel to Orbit or the Colony, performing travel steps as normal' },
  { id: 12, goal: 'Have 2 Research tiles', altReward: 'Take a Scientist card at no cost' },
  { id: 13, goal: 'Have 1 Scientist and 1 completed Earth Contract', altReward: 'Take 1 Earth Contract from the display at no cost' },
  { id: 14, goal: 'Have 3 Tech tiles on the indicated spaces of your Lab', altReward: 'Take up to 3 Crystals from the supply' },
  { id: 15, goal: 'Have 3 cubes in the Progress area', altReward: 'Retrieve 2 Colonists from Action slots and/or Working Area' },
  { id: 16, goal: 'Have 2 Advanced Building markers in 2 different Complexes of size ≥ 3', altReward: 'Upgrade up to 2 Buildings at no cost' },
]
