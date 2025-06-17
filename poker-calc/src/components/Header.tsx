interface HeaderProps {
    currentPage: "payout" | "leaderboard" | "history";
}

export default function Header({ currentPage }: HeaderProps) {
    return (
        <header>
            {/* left */}
            <h1>Poker Payout Calculator</h1>

            {/* right */}
            <nav>
                <a href="/leaderboard">Leaderboard</a>
                <a href="/payout">Payout</a>
                <a href="/history">Game History</a>
            </nav>
        </header>
    );
}
