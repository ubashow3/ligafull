
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
    type?: 'referee' | 'table_official';
    role?: string;
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
    refereeId?: string;
    assistant1Id?: string;
    assistant2Id?: string;
    tableOfficialId?: string;
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

export interface TopScorer {
    id: string;
    name: string;
    goals: number;
    clubName: string;
    clubLogoUrl: string;
    photoUrl?: string;
}

export interface ChampionshipFinancials {
    refereeFee: number;
    assistantFee: number;
    tableOfficialFee: number;
    fieldFee: number;
    yellowCardFine: number;
    redCardFine: number;
    totalCost: number;
    registrationFeePerClub: number;
    playerRegistrationDeadline?: string;
    clubPayments?: { [clubId:string]: boolean };
    finePayments?: { [clubId: string]: { [round: number]: boolean } };
    clubAdminTokens?: { [clubId: string]: string };
}

export interface Championship {
    id: string;
    name: string;
    clubs: Club[];
    matches: Match[];
    standings: Standing[];
    topScorers: TopScorer[];
    financials?: ChampionshipFinancials;
}

export interface Post {
    id: string;
    user_id: string;
    user_name: string;
    user_photo?: string;
    league_id: string;
    content: string;
    media_url?: string;
    media_type?: 'image' | 'video';
    created_at: string;
    is_official?: boolean;
}

export interface UserProfile {
    id: string;
    full_name: string;
    photo_url?: string;
    email: string;
    is_paid: boolean;
    trial_started_at: string;
    registered_league_id: string;
}

export interface League {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  coverUrl?: string;
  adminEmail: string;
  adminPassword?: string;
  city?: string;
  state?: string;
  referees: Official[];
  tableOfficials: Official[];
  championships: Championship[];
  posts?: Post[];
}

export interface ChampionshipWizardConfig {
    format: 'ROUND_ROBIN' | 'GROUP_STAGE';
    turns: 1 | 2;
    playoffs: boolean;
    numGroups: number; 
    playoffTeamsPerGroup: number;
    groupPlayType: 'WITHIN_GROUP' | 'CROSS_GROUP_SEQUENTIAL' | 'CROSS_GROUP_REVERSE';
}
