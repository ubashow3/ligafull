import { League } from '../types';

const clubsData = [
  { 
    id: 'club-1', 
    name: 'Real Madruga', 
    abbreviation: 'RMD', 
    logoUrl: 'https://picsum.photos/seed/club1/100/100', 
    whatsapp: '5511999998888',
    players: [ 
      {id: 'p1-1', name: 'Seu Madruga', position: 'Goleiro', goals: 0, photoUrl: 'https://picsum.photos/seed/p1-1/100/100', birthDate: '1924-09-02'},
      {id: 'p1-2', name: 'Chaves', position: 'Defensor', goals: 1, photoUrl: 'https://picsum.photos/seed/p1-2/100/100', birthDate: '1971-06-21'},
      {id: 'p1-3', name: 'Kiko', position: 'Meio-campo', goals: 3, photoUrl: 'https://picsum.photos/seed/p1-3/100/100', birthDate: '1944-01-12'},
      {id: 'p1-4', name: 'Nhonho', position: 'Meio-campo', goals: 2, photoUrl: 'https://picsum.photos/seed/p1-4/100/100', birthDate: '1964-08-25'},
      {id: 'p1-5', name: 'Cristiano Ronaldo da Silva', nickname: 'CR7', cpf: '111.111.111-11', position: 'Atacante', goals: 12, photoUrl: 'https://picsum.photos/seed/p1-5/100/100', birthDate: '1985-02-05'} 
    ], 
    technicalStaff: [{id: 't1', name: 'Seu Madruga', role: 'Técnico'}] 
  },
  { 
    id: 'club-2', 
    name: 'Unidos da Vila', 
    abbreviation: 'UDV', 
    logoUrl: 'https://picsum.photos/seed/club2/100/100', 
    players: [ 
      {id: 'p2-1', name: 'Dona Florinda', position: 'Goleiro', goals: 0, photoUrl: 'https://picsum.photos/seed/p2-1/100/100', birthDate: '1945-02-19'},
      {id: 'p2-2', name: 'Chiquinha', position: 'Defensor', goals: 2, photoUrl: 'https://picsum.photos/seed/p2-2/100/100', birthDate: '1950-12-17'},
      {id: 'p2-3', name: 'Godinez', position: 'Meio-campo', goals: 1, photoUrl: 'https://picsum.photos/seed/p2-3/100/100', birthDate: '1960-03-14'},
      {id: 'p2-4', name: 'Pópis', position: 'Meio-campo', goals: 4, photoUrl: 'https://picsum.photos/seed/p2-4/100/100', birthDate: '1962-07-28'},
      {id: 'p2-5', name: 'Lionel Messi de Souza', nickname: 'La Pulga', cpf: '222.222.222-22', position: 'Atacante', goals: 10, photoUrl: 'https://picsum.photos/seed/p2-5/100/100', birthDate: '1987-06-24'} 
    ], 
    technicalStaff: [{id: 't2', name: 'Dona Florinda', role: 'Técnica'}] 
  },
  { 
    id: 'club-3', 
    name: 'Galácticos do Bairro', 
    abbreviation: 'GDB', 
    logoUrl: 'https://picsum.photos/seed/club3/100/100', 
    players: [ {id: 'p3', name: 'Neymar Jr. Santos', nickname: 'Ney', cpf: '333.333.333-33', position: 'Ponta', goals: 8, photoUrl: 'https://picsum.photos/seed/p3/100/100', birthDate: '1992-02-05'} ], 
    technicalStaff: [{id: 't3', name: 'Professor Girafales', role: 'Técnico'}] 
  },
  { 
    id: 'club-4', 
    name: 'Chuteira de Ouro FC', 
    abbreviation: 'CFC', 
    logoUrl: 'https://picsum.photos/seed/club4/100/100', 
    players: [ {id: 'p4', name: 'Kylian Mbappé Lottin', nickname: 'Donatello', cpf: '444.444.444-44', position: 'Atacante', goals: 9, photoUrl: 'https://picsum.photos/seed/p4/100/100', birthDate: '1998-12-20'} ], 
    technicalStaff: [{id: 't4', name: 'Senhor Barriga', role: 'Técnico'}] 
  },
   { id: 'club-5', name: 'Atlético Varzeano', abbreviation: 'ATV', logoUrl: 'https://picsum.photos/seed/club5/100/100', players: [], technicalStaff: [] },
  { id: 'club-6', name: 'Esporte Clube Bairro Novo', abbreviation: 'EBN', logoUrl: 'https://picsum.photos/seed/club6/100/100', players: [], technicalStaff: [] },
  { id: 'club-7', name: 'Fúria FC', abbreviation: 'FFC', logoUrl: 'https://picsum.photos/seed/club7/100/100', players: [], technicalStaff: [] },
  { id: 'club-8', name: 'Trovão Azul', abbreviation: 'TAZ', logoUrl: 'https://picsum.photos/seed/club8/100/100', players: [], technicalStaff: [] },
  { id: 'club-9', name: 'Red Bull Pelada', abbreviation: 'RBP', logoUrl: 'https://picsum.photos/seed/club9/100/100', players: [], technicalStaff: [] },
  { id: 'club-10', name: 'União da Comunidade', abbreviation: 'UCM', logoUrl: 'https://picsum.photos/seed/club10/100/100', players: [], technicalStaff: [] },
  { id: 'club-11', name: 'Independente FC', abbreviation: 'IFC', logoUrl: 'https://picsum.photos/seed/club11/100/100', players: [], technicalStaff: [] },
  { id: 'club-12', name: 'Manchester Cansado', abbreviation: 'MNC', logoUrl: 'https://picsum.photos/seed/club12/100/100', players: [], technicalStaff: [] },
];


export const mockLeagues: League[] = [
  {
    id: 'liga-1',
    name: 'Premier League da Várzea',
    slug: 'premier-league-da-varzea',
    logoUrl: 'https://picsum.photos/seed/liga1/200/200',
    adminEmail: 'dono1@liga.com',
    adminPassword: '123456',
    referees: [
      { id: 'ref-1', name: 'Carlos Eugênio Simon', nickname: 'Simon', cpf: '111.111.111-11', bankAccount: 'Banco: 123, Ag: 4567, CC: 89012-3' },
      { id: 'ref-2', name: 'Arnaldo Cezar Coelho', cpf: '222.222.222-22', bankAccount: 'Banco: 321, Ag: 7654, CC: 21098-7' },
      { id: 'ref-3', name: 'Sandro Meira Ricci' },
    ],
    tableOfficials: [
      { id: 'to-1', name: 'Ana Paula Oliveira', cpf: '333.333.333-33', bankAccount: 'Banco: 111, Ag: 2222, CC: 33333-3' },
      { id: 'to-2', name: 'Renato Marsiglia' },
    ],
    championships: [
      {
        id: 'champ-1-A',
        name: 'Série A - 2024',
        clubs: clubsData.slice(0, 4),
        matches: [],
        standings: [
            { clubId: 'club-1', clubName: 'Real Madruga', clubAbbreviation: 'RMD', clubLogoUrl: 'https://picsum.photos/seed/club1/100/100', played: 5, wins: 4, draws: 1, losses: 0, goalsFor: 15, goalsAgainst: 5, goalDifference: 10, points: 13 },
            { clubId: 'club-2', clubName: 'Unidos da Vila', clubAbbreviation: 'UDV', clubLogoUrl: 'https://picsum.photos/seed/club2/100/100', played: 5, wins: 3, draws: 1, losses: 1, goalsFor: 10, goalsAgainst: 7, goalDifference: 3, points: 10 },
            { clubId: 'club-4', clubName: 'Chuteira de Ouro FC', clubAbbreviation: 'CFC', clubLogoUrl: 'https://picsum.photos/seed/club4/100/100', played: 5, wins: 1, draws: 1, losses: 3, goalsFor: 8, goalsAgainst: 12, goalDifference: -4, points: 4 },
            { clubId: 'club-3', clubName: 'Galácticos do Bairro', clubAbbreviation: 'GDB', clubLogoUrl: 'https://picsum.photos/seed/club3/100/100', played: 5, wins: 0, draws: 1, losses: 4, goalsFor: 4, goalsAgainst: 13, goalDifference: -9, points: 1 },
        ],
        financials: null,
        clubFinancials: null,
      },
      {
        id: 'champ-1-B',
        name: 'Copa dos Bairros 2025',
        clubs: clubsData,
        matches: [],
        standings: [],
        financials: null,
        clubFinancials: null,
      }
    ]
  },
  {
    id: 'liga-2',
    name: 'Liga dos Campeões Amadores',
    slug: 'liga-dos-campeoes-amadores',
    logoUrl: 'https://picsum.photos/seed/liga2/200/200',
    adminEmail: 'dono2@liga.com',
    adminPassword: '123456',
    referees: [
        { id: 'ref-l2-1', name: 'Wilson Seneme' }
    ],
    tableOfficials: [
        { id: 'to-l2-1', name: 'Márcio Rezende de Freitas' }
    ],
    championships: [
      {
        id: 'champ-2-A',
        name: 'Taça Ouro',
        clubs: [],
        matches: [],
        standings: [],
        financials: null,
        clubFinancials: null,
      }
    ]
  }
];

// Populate matches for the first championship for demonstration
const clubs = mockLeagues[0].championships[0].clubs;
if (clubs.length > 3) {
    mockLeagues[0].championships[0].matches = [
      { 
        id: 'm1', 
        round: 1, 
        homeTeam: clubs[0], 
        awayTeam: clubs[1], 
        homeScore: 2, 
        awayScore: 2, 
        date: '2024-07-20T19:00:00', 
        status: 'finished', 
        location: 'Estádio Municipal',
        events: [
          { type: 'goal', playerId: 'p1-5', playerName: 'Cristiano Ronaldo da Silva', minute: 25 },
          { type: 'goal', playerId: 'p2-5', playerName: 'Lionel Messi de Souza', minute: 40 },
          { type: 'yellow_card', playerId: 'p1-2', playerName: 'Chaves', minute: 55 },
          { type: 'goal', playerId: 'p1-5', playerName: 'Cristiano Ronaldo da Silva', minute: 75 },
          { type: 'red_card', playerId: 'p2-2', playerName: 'Chiquinha', minute: 80 },
          { type: 'goal', playerId: 'p2-4', playerName: 'Pópis', minute: 88 },
        ],
        referee: 'Carlos Eugênio Simon',
        assistant1: 'Arnaldo Cezar Coelho',
        tableOfficial: 'Ana Paula Oliveira'
      },
      { id: 'm2', round: 1, homeTeam: clubs[2], awayTeam: clubs[3], homeScore: 1, awayScore: 3, date: '2024-07-20T21:00:00', status: 'finished', location: 'Arena do Bairro', events: [] },
      { id: 'm3', round: 2, homeTeam: clubs[0], awayTeam: clubs[2], homeScore: 4, awayScore: 0, date: '2024-07-27T16:00:00', status: 'finished', location: 'Estádio Municipal', events: [
          { type: 'yellow_card', playerId: 'p1-2', playerName: 'Chaves', minute: 15 },
          { type: 'yellow_card', playerId: 'p1-2', playerName: 'Chaves', minute: 85 },
      ] },
      { id: 'm4', round: 2, homeTeam: clubs[1], awayTeam: clubs[3], homeScore: null, awayScore: null, date: '2024-07-27T18:00:00', status: 'scheduled', location: 'Campo da Vila', events: [] },
    ];
}