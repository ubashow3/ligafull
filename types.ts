

export interface Player {
  id: string;
  name: string;
  position: string;
  goals: number;
  photoUrl?: string;
  birthDate?: string;
  nickname?: string;
  cpf?: string;
}

export interface TechnicalStaff {
  id: string;
  name: string;
  role: string;
}

export interface Club {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  whatsapp?: string;
  players: Player[];
  technicalStaff: TechnicalStaff[];
}

export interface Official {
    id: string;
    name: string;
    nickname?: string;
    cpf?: string;
    bankAccount?: string;
}

export interface MatchEvent {
    type: 'goal' | 'yellow_card' | 'red_card';
    playerId: string;
    playerName: string;
    minute: number;
}

export interface Match {
    id:string;
    round: number;
    homeTeam: Club;
    awayTeam: Club;
    homeScore: number | null;
    awayScore: number | null;
    date: string;
    status: 'scheduled' | 'in_progress' | 'finished';
    location: string;
    events: MatchEvent[];
    referee?: string;
    assistant1?: string;
    assistant2?: string;
    tableOfficial?: string;
    championship_id?: string;
    homeLineup?: { playerId: string; shirtNumber: number | string }[];
    awayLineup?: { playerId: string; shirtNumber: number | string }[];
}

export interface Standing {
    clubId: string;
    clubName: string;
    clubAbbreviation: string;
    clubLogoUrl: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
}

// FIX: Added ChampionshipFinancials interface to be used in FinancialsTab.tsx
export interface ChampionshipFinancials {
    refereeFee: number;
    assistantFee: number;
    tableOfficialFee: number;
    fieldFee: number;
    yellowCardFine: number;
    redCardFine: number;
    totalCost: number;
    registrationFeePerClub: number;
    clubPayments?: { [clubId:string]: boolean };
    finePayments?: { [clubId: string]: { [round: number]: boolean } };
    playerRegistrationDeadline?: string;
    clubAdminTokens?: { [clubId: string]: string };
}

export interface Championship {
    id: string;
    name: string;
    clubs: Club[];
    matches: Match[];
    standings: Standing[];
    financials?: ChampionshipFinancials;
}

export interface League {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  adminEmail: string;
  adminPassword?: string;
  city?: string;
  state?: string;
  referees: Official[];
  tableOfficials: Official[];
  championships: Championship[];
}

export interface ChampionshipWizardConfig {
    format: 'ROUND_ROBIN' | 'GROUP_STAGE';
    turns: 1 | 2;
    playoffs: boolean;
    numGroups: number; 
    playoffTeamsPerGroup: number;
    groupPlayType: 'WITHIN_GROUP' | 'CROSS_GROUP_SEQUENTIAL' | 'CROSS_GROUP_REVERSE';
}