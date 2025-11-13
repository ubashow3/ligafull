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
    id: string;
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
    // FIX: Add optional championship_id to be available on matches fetched from the DB.
    championship_id?: string;
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

export interface ChampionshipFinancials {
    registrationFeePerClub: number;
    totalCost: number;
    refereeFee: number;
    assistantFee: number;
    tableOfficialFee: number;
    fieldFee: number;
    yellowCardFine: number;
    redCardFine: number;
}

export interface ClubFinancials {
    clubId: string;
    registrationFeeDue: number;
    totalFines: number;
    amountPaid: number;
    balance: number;
}

export interface Championship {
    id: string;
    name: string;
    clubs: Club[];
    matches: Match[];
    standings: Standing[];
    financials: ChampionshipFinancials | null;
    clubFinancials: ClubFinancials[] | null;
}

export interface League {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  adminEmail: string;
  adminPassword?: string;
  referees: Official[];
  tableOfficials: Official[];
  championships: Championship[];
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Optional property to hold calculated distance
}

export interface ChampionshipWizardConfig {
    format: 'ROUND_ROBIN' | 'GROUP_STAGE';
    turns: 1 | 2;
    playoffs: boolean;
    numGroups: number; 
    playoffTeamsPerGroup: number;
    groupPlayType: 'WITHIN_GROUP' | 'CROSS_GROUP_SEQUENTIAL' | 'CROSS_GROUP_REVERSE';
}