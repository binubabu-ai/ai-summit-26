'use client';

interface HealthScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function HealthScore({ score, size = 'md', showLabel = true }: HealthScoreProps) {
  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 90) return 'text-green-500 dark:text-green-400';
    if (score >= 70) return 'text-yellow-500 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const sizeMap = {
    sm: { dimension: 'w-16 h-16', fontSize: 'text-lg', statusSize: 'text-xs' },
    md: { dimension: 'w-24 h-24', fontSize: 'text-2xl', statusSize: 'text-sm' },
    lg: { dimension: 'w-32 h-32', fontSize: 'text-3xl', statusSize: 'text-base' },
  };

  const { dimension, fontSize, statusSize } = sizeMap[size];
  const color = getColor(score);
  const status = getStatus(score);

  // Calculate circle stroke dasharray for progress
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

  return (
    <div className="flex items-center gap-4">
      <div className={`relative ${dimension}`}>
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200 dark:text-neutral-800"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            className={color}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold text-black dark:text-white`}>{score}</span>
        </div>
      </div>
      {showLabel && (
        <div>
          <div className={`${fontSize} font-bold text-black dark:text-white`}>{score}/100</div>
          <div className={`${statusSize} ${color} font-medium`}>{status}</div>
        </div>
      )}
    </div>
  );
}
