// src/types/player.ts
export interface Player {
    id: string;
    name: string;
    buyIn: number;
    cashOut: number;
    net: number;
    gameId?: string;
    groupId?: string;
    rank?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Transfer {
    from: string;
    to: string;
    amount: number;
}

export interface Game {
    _id: string;
    title: string;
    groupId: string;
    totalAmount: number;
    playerCount: number;
    isBalanced: boolean;
    transfers: Transfer[];
    status: 'completed' | 'active' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface GameWithPlayers extends Game {
    players: Player[];
}

export interface LeaderboardEntry {
    rank: number;
    playerName: string;
    groupId: string;
    totalProfit: number;
    gamesPlayed: number;
    rankChange: 'up' | 'down' | 'same' | 'new';
    previousRank: number | null;
    averageProfit: number;
    lastGame?: {
        title: string;
        date: Date;
    } | null;
    bestGame: {
        profit: number;
        game?: {
            title: string;
            date: Date;
        } | null;
    };
    worstGame: {
        profit: number;
        game?: {
            title: string;
            date: Date;
        } | null;
    };
}

export interface GameResult {
    title: string;
    players: Player[];
    transfers: Transfer[];
    totalNet: number;
    isBalanced: boolean;
    totalAmount: number;
    playerCount: number;
}

// API Response types
export interface GamesResponse {
    games: Game[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface LeaderboardResponse {
    leaderboard: LeaderboardEntry[];
    totalPlayers: number;
}

// Form types for creating games
export interface GameSubmission {
    title: string;
    groupId: string;
    players: Player[];
    transfers: Transfer[];
}

// Group types
export interface Group {
    _id: string;
    name: string;
    createdBy: string;
    description: string;
    isActive: boolean;
    stats: {
        totalGames: number;
        totalPlayers: number;
        lastGameDate: Date | null;
    };
    createdAt: Date;
    updatedAt: Date;
}

// API Response types
export interface GroupsResponse {
    groups: Group[];
}