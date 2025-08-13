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
    <header className="bg-custom-background border-b border-custom px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-custom-primary">Poker Payout Calculator</h1>
        <nav className="flex">
          <a href="/leaderboard" className={`${getLinkClass('leaderboard')} mr-6`}>
            Leaderboard
          </a>
          <a href="/payout" className={`${getLinkClass('payout')} mr-6`}>
            Payout
          </a>
          <a href="/history" className={`${getLinkClass('history')} mr-6`}>
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