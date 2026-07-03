import type { BlueprintCard } from './types'

/** The 24 Blueprint cards (Reference Book pp. 4–5). Level 1 = ±3 OP, Level 3 = ±5 OP. */
export const BLUEPRINTS: readonly BlueprintCard[] = [
  { id: 1, name: 'Construction Yard', level: 1, upgrades: 'mine', matchingScientist: 'geologist', gainOnObtain: '1 Mineral' },
  { id: 2, name: 'Metal Deposit', level: 1, upgrades: 'mine', matchingScientist: 'geologist', gainOnObtain: '1 Mineral' },
  { id: 3, name: 'Automated Production', level: 1, upgrades: 'generator', matchingScientist: 'rdEngineer', gainOnObtain: '1 Battery' },
  { id: 4, name: 'Wind Turbines', level: 1, upgrades: 'generator', matchingScientist: 'rdEngineer', gainOnObtain: '1 Battery' },
  { id: 5, name: 'Private Ship', level: 1, upgrades: 'waterExtractor', matchingScientist: 'hydrologist', gainOnObtain: '1 Water' },
  { id: 6, name: 'Moisture Vaporator', level: 1, upgrades: 'waterExtractor', matchingScientist: 'hydrologist', gainOnObtain: '1 Water' },
  { id: 7, name: 'Biomarket', level: 1, upgrades: 'greenhouse', matchingScientist: 'biochemist', gainOnObtain: '1 Plant' },
  { id: 8, name: 'Hydroponic Farm', level: 1, upgrades: 'greenhouse', matchingScientist: 'biochemist', gainOnObtain: '1 Plant' },
  { id: 9, name: 'Oxygen Tank', level: 1, upgrades: 'oxygenCondenser', matchingScientist: 'geochemist', gainOnObtain: '1 Oxygen' },
  { id: 10, name: 'Concentrator', level: 1, upgrades: 'oxygenCondenser', matchingScientist: 'geochemist', gainOnObtain: '1 Oxygen' },
  { id: 11, name: 'Casino', level: 1, upgrades: 'shelter', matchingScientist: 'systemsEngineer', gainOnObtain: '1 Crystal' },
  { id: 12, name: 'Gym', level: 1, upgrades: 'shelter', matchingScientist: 'systemsEngineer', gainOnObtain: '1 Crystal' },
  { id: 13, name: 'Mineral Mine', level: 3, upgrades: 'mine', matchingScientist: 'geologist', gainOnObtain: '1 Mineral' },
  { id: 14, name: 'Biolab', level: 3, upgrades: 'mine', matchingScientist: 'geologist', gainOnObtain: '1 Mineral' },
  { id: 15, name: 'Radar', level: 3, upgrades: 'generator', matchingScientist: 'rdEngineer', gainOnObtain: '1 Battery' },
  { id: 16, name: 'Builder Drone AI600', level: 3, upgrades: 'generator', matchingScientist: 'rdEngineer', gainOnObtain: '1 Battery' },
  { id: 17, name: 'Research Lab', level: 3, upgrades: 'waterExtractor', matchingScientist: 'hydrologist', gainOnObtain: '1 Water' },
  { id: 18, name: 'Aqueduct', level: 3, upgrades: 'waterExtractor', matchingScientist: 'hydrologist', gainOnObtain: '1 Water' },
  { id: 19, name: 'Eco Resort', level: 3, upgrades: 'greenhouse', matchingScientist: 'biochemist', gainOnObtain: '1 Plant' },
  { id: 20, name: 'Trade Market', level: 3, upgrades: 'greenhouse', matchingScientist: 'biochemist', gainOnObtain: '1 Plant' },
  { id: 21, name: 'Recycling Bots', level: 3, upgrades: 'oxygenCondenser', matchingScientist: 'geochemist', gainOnObtain: '1 Oxygen' },
  { id: 22, name: 'Aerial Elevator', level: 3, upgrades: 'oxygenCondenser', matchingScientist: 'geochemist', gainOnObtain: '1 Oxygen' },
  { id: 23, name: 'Library', level: 3, upgrades: 'shelter', matchingScientist: 'systemsEngineer', gainOnObtain: '1 Crystal' },
  { id: 24, name: 'Command Center', level: 3, upgrades: 'shelter', matchingScientist: 'systemsEngineer', gainOnObtain: '1 Crystal' },
]
