'use client';

export default function Keyboard() {
  // Placeholder for the on-screen keyboard
  // Will be implemented in later issues
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
  ];

  return (
    <div className="w-full max-w-screen-sm mx-auto px-2 pb-4">
      <div className="flex flex-col gap-1.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center">
            {row.map((key) => {
              const isSpecial = key === 'ENTER' || key === 'BACK';
              return (
                <button
                  key={key}
                  className={`${
                    isSpecial ? 'px-3 text-xs' : 'w-9'
                  } h-14 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded font-bold uppercase flex items-center justify-center`}
                >
                  {key === 'BACK' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
