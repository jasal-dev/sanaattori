'use client';

import Header from './components/Header';
import Board from './components/Board';
import Keyboard from './components/Keyboard';
import Toast from './components/Toast';
import { GameProvider, useGame } from './context/GameContext';
import { LocaleProvider } from './context/LocaleContext';
import { IntlProvider } from './context/IntlProvider';
import { AuthProvider } from './context/AuthContext';

function GameContent() {
  const { hardModeError, clearHardModeError } = useGame();

  return (
    <>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
        <Header />
        <Board />
        <Keyboard />
      </div>
      {hardModeError && <Toast message={hardModeError} onClose={clearHardModeError} />}
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <LocaleProvider>
        <IntlProvider>
          <GameProvider>
            <GameContent />
          </GameProvider>
        </IntlProvider>
      </LocaleProvider>
    </AuthProvider>
  );
}
