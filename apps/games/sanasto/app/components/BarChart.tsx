'use client';

interface BarChartProps {
  data: Record<number, number>;
  maxAttempts?: number;
}

export default function BarChart({ data, maxAttempts = 6 }: BarChartProps) {
  // Find the maximum count to scale bars
  const maxCount = Math.max(...Object.values(data), 1);
  
  // Create array of all possible guess counts
  const guessNumbers = Array.from({ length: maxAttempts }, (_, i) => i + 1);
  
  return (
    <div className="w-full space-y-1">
      {guessNumbers.map((guessNum) => {
        const count = data[guessNum] || 0;
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const minWidth = count > 0 ? 7 : 0; // Minimum width for bars with values
        const barWidth = Math.max(percentage, minWidth);
        
        return (
          <div key={guessNum} className="flex items-center gap-2">
            <div className="w-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              {guessNum}
            </div>
            <div className="flex-1 flex items-center">
              <div
                className="bg-green-600 dark:bg-green-500 text-white text-xs font-bold py-1 px-2 rounded transition-all duration-300"
                style={{ width: `${barWidth}%` }}
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
