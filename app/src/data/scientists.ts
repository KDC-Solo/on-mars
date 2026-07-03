import type { ScientistCard } from './types'

/** The 6 Scientist cards (Reference Book p. 3). All score 3 OP per matching upgraded building. */
export const SCIENTISTS: readonly ScientistCard[] = [
  {
    id: 'geologist',
    name: 'The Geologist',
    hireCost: 'Move 2 Colonists from Living Quarters to Working Area',
    worksIn: 'mine',
    scoresPerUpgraded: 'generator',
  },
  {
    id: 'rdEngineer',
    name: 'The R&D Engineer',
    hireCost: '2 Minerals',
    worksIn: 'generator',
    scoresPerUpgraded: 'waterExtractor',
  },
  {
    id: 'hydrologist',
    name: 'The Hydrologist',
    hireCost: '2 Batteries',
    worksIn: 'waterExtractor',
    scoresPerUpgraded: 'greenhouse',
  },
  {
    id: 'biochemist',
    name: 'The Biochemist',
    hireCost: '2 Water',
    worksIn: 'greenhouse',
    scoresPerUpgraded: 'oxygenCondenser',
  },
  {
    id: 'geochemist',
    name: 'The Geochemist',
    hireCost: '2 Plants',
    worksIn: 'oxygenCondenser',
    scoresPerUpgraded: 'shelter',
  },
  {
    id: 'systemsEngineer',
    name: 'The Systems Engineer',
    hireCost: '2 Oxygen',
    worksIn: 'shelter',
    scoresPerUpgraded: 'mine',
  },
]
