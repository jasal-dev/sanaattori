import Header from './components/Header';
import Board from './components/Board';
import Keyboard from './components/Keyboard';
import { GameProvider } from './context/GameContext';

export default function Home() {
  return (
    <GameProvider>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
        <Header />
        <Board />
        <Keyboard />
      </div>
    </GameProvider>
  );
}
