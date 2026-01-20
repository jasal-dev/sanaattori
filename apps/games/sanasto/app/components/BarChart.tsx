'use client';

const MIN_BAR_WIDTH_PERCENT = 7; // Minimum width percentage for bars with values

interface BarChartProps {
  data: Record<number, number>;
  maxAttempts?: number;
}

export default function BarChart({ data, maxAttempts = 6 }: BarChartProps) {
  // Find the maximum count to scale bars
  const maxCount = Math.max(...Object.values(data), 1);
  
  // Create array of all possible guess counts
  const guessNumbers = Array.from({ length: maxAttempts }, (_, i) => i + 1);
  
  // Create accessible description
  const totalWins = Object.values(data).reduce((sum, count) => sum + count, 0);
  const ariaLabel = `Guess distribution chart showing ${totalWins} total wins distributed across ${maxAttempts} possible guess counts`;
  
  return (
    <div className="w-full space-y-1" role="img" aria-label={ariaLabel}>
      {guessNumbers.map((guessNum) => {
        const count = data[guessNum] || 0;
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const minWidth = count > 0 ? MIN_BAR_WIDTH_PERCENT : 0;
        const barWidth = Math.max(percentage, minWidth);
        
        return (
          <div key={guessNum} className="flex items-center gap-2" aria-label={`${guessNum} guesses: ${count} wins`}>
            <div className="w-4 text-sm font-medium text-gray-700 dark:text-gray-300" aria-hidden="true">
              {guessNum}
            </div>
            <div className="flex-1 flex items-center">
              <div
                className="bg-green-600 dark:bg-green-500 text-white text-xs font-bold py-1 px-2 rounded transition-all duration-300"
                style={{ width: `${barWidth}%` }}
                aria-hidden="true"
              >
                {count > 0 ? count : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
