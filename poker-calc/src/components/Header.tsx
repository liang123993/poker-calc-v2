import React from 'react';

interface HeaderProps {
  currentPage: 'payout' | 'leaderboard' | 'history' | 'groups';
}

export default function Header({ currentPage }: HeaderProps) {
  const getLinkClass = (page: string) => {
    return currentPage === page 
      ? "text-custom-primary font-medium" 
      : "text-custom-secondary hover:text-custom-primary transition-colors";
  };

  return (
    <header className="bg-custom-background border-b border-custom px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-lg sm:text-xl font-bold text-custom-primary">Poker Payout Calculator</h1>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base">
          <a href="/leaderboard" className={getLinkClass('leaderboard')}>
            Leaderboard
          </a>
          <a href="/payout" className={getLinkClass('payout')}>
            Payout
          </a>
          <a href="/history" className={getLinkClass('history')}>
            Game History
          </a>
          <a href="/groups" className={getLinkClass('groups')}>
            Groups
          </a>
        </nav>
      </div>
    </header>
  );
}