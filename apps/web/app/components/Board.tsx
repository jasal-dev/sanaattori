'use client';

export default function Board() {
  // Placeholder for the game board
  // Will be implemented in later issues
  return (
    <div className="flex-1 flex items-center justify-center py-4">
      <div className="grid gap-1">
        {/* 6 rows of guesses */}
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-1">
            {/* 5 letters per row (default) */}
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="w-14 h-14 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-2xl font-bold uppercase"
              >
                {/* Letter will go here */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
