'use client';

interface StepAnimationProps {
  step: 1 | 2 | 3;
}

export function StepAnimation({ step }: StepAnimationProps) {
  if (step === 1) {
    return (
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="step1-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" className="text-black dark:text-white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" className="text-black dark:text-white" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle cx="200" cy="200" r="150" fill="url(#step1-gradient)" />

        {/* Folder */}
        <g>
          <path
            d="M 120 160 L 160 160 L 170 150 L 280 150 L 280 250 L 120 250 Z"
            fill="currentColor"
            className="text-black dark:text-white"
            opacity="0.1"
          >
            <animate attributeName="opacity" values="0.1;0.15;0.1" dur="3s" repeatCount="indefinite" />
          </path>
          <rect
            x="120"
            y="160"
            width="160"
            height="90"
            rx="4"
            fill="none"
            stroke="currentColor"
            className="text-black dark:text-white"
            strokeWidth="2"
          />
          <path
            d="M 120 160 L 160 160 L 170 150 L 280 150 L 280 160 L 120 160"
            fill="currentColor"
            className="text-black dark:text-white"
            opacity="0.2"
          />
        </g>

        {/* Documents floating in */}
        <g>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={140 + i * 15}
              y={180 + i * 10}
              width="80"
              height="50"
              rx="2"
              fill="currentColor"
              className="text-neutral-300 dark:text-neutral-700"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.8"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,${-20 * (i + 1)}; 0,0`}
                dur="2s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.8"
                dur="2s"
                begin={`${i * 0.3}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>

        {/* Lines representing content */}
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <line
                x1={150 + i * 15}
                y1={195 + i * 10}
                x2={200 + i * 15}
                y2={195 + i * 10}
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-600"
                strokeWidth="1"
              >
                <animate attributeName="opacity" values="0;1" dur="2s" begin={`${i * 0.3 + 0.5}s`} repeatCount="indefinite" />
              </line>
              <line
                x1={150 + i * 15}
                y1={205 + i * 10}
                x2={190 + i * 15}
                y2={205 + i * 10}
                stroke="currentColor"
                className="text-neutral-500 dark:text-neutral-600"
                strokeWidth="1"
              >
                <animate attributeName="opacity" values="0;1" dur="2s" begin={`${i * 0.3 + 0.7}s`} repeatCount="indefinite" />
              </line>
            </g>
          ))}
        </g>
      </svg>
    );
  }

  if (step === 2) {
    return (
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="step2-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" className="text-black dark:text-white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" className="text-black dark:text-white" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle cx="200" cy="200" r="150" fill="url(#step2-gradient)" />

        {/* Document */}
        <rect
          x="120"
          y="140"
          width="100"
          height="120"
          rx="4"
          fill="currentColor"
          className="text-white dark:text-black"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line x1="135" y1="160" x2="205" y2="160" stroke="currentColor" className="text-neutral-400 dark:text-neutral-600" strokeWidth="2" />
        <line x1="135" y1="180" x2="195" y2="180" stroke="currentColor" className="text-neutral-400 dark:text-neutral-600" strokeWidth="2" />
        <line x1="135" y1="200" x2="205" y2="200" stroke="currentColor" className="text-neutral-400 dark:text-neutral-600" strokeWidth="2" />

        {/* AI Brain/Sparkle */}
        <g>
          <circle cx="280" cy="200" r="40" fill="currentColor" className="text-black dark:text-white" opacity="0.1">
            <animate attributeName="r" values="35;45;35" dur="2s" repeatCount="indefinite" />
          </circle>
          <path
            d="M 280 175 L 285 190 L 300 188 L 290 200 L 300 212 L 285 210 L 280 225 L 275 210 L 260 212 L 270 200 L 260 188 L 275 190 Z"
            fill="currentColor"
            className="text-black dark:text-white"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 280 200"
              to="360 280 200"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Connection line with data flow */}
        <line
          x1="220"
          y1="200"
          x2="240"
          y2="200"
          stroke="currentColor"
          className="text-neutral-400 dark:text-neutral-600"
          strokeWidth="2"
          strokeDasharray="4 4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>

        {/* Suggestion bubbles */}
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={230 + i * 5}
            cy={200}
            r="3"
            fill="currentColor"
            className="text-black dark:text-white"
          >
            <animate
              attributeName="cx"
              values={`${220};${240}`}
              dur="1.5s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="1.5s"
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    );
  }

  // Step 3
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="step3-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" className="text-black dark:text-white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="currentColor" className="text-black dark:text-white" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="200" cy="200" r="150" fill="url(#step3-gradient)" />

      {/* Shield with checkmark */}
      <g>
        <path
          d="M 200 130 L 260 150 L 260 200 Q 260 240 200 270 Q 140 240 140 200 L 140 150 Z"
          fill="currentColor"
          className="text-black dark:text-white"
          opacity="0.1"
        >
          <animate attributeName="opacity" values="0.1;0.15;0.1" dur="3s" repeatCount="indefinite" />
        </path>
        <path
          d="M 200 130 L 260 150 L 260 200 Q 260 240 200 270 Q 140 240 140 200 L 140 150 Z"
          fill="none"
          stroke="currentColor"
          className="text-black dark:text-white"
          strokeWidth="3"
        />

        {/* Checkmark */}
        <path
          d="M 175 200 L 190 215 L 225 175"
          fill="none"
          stroke="currentColor"
          className="text-black dark:text-white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate
            attributeName="stroke-dasharray"
            from="0,100"
            to="100,0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Floating metrics/stats */}
      <g>
        {/* Risk Score */}
        <g opacity="0.8">
          <rect x="250" y="150" width="60" height="30" rx="4" fill="currentColor" className="text-white dark:text-black" stroke="currentColor" strokeWidth="1" />
          <text x="280" y="170" textAnchor="middle" fill="currentColor" className="text-black dark:text-white" fontSize="12" fontWeight="bold">
            LOW
          </text>
          <animate attributeName="opacity" values="0;0.8" dur="2s" begin="0.5s" repeatCount="indefinite" />
        </g>

        {/* Freshness */}
        <g opacity="0.8">
          <rect x="90" y="180" width="60" height="30" rx="4" fill="currentColor" className="text-white dark:text-black" stroke="currentColor" strokeWidth="1" />
          <text x="120" y="200" textAnchor="middle" fill="currentColor" className="text-black dark:text-white" fontSize="12" fontWeight="bold">
            95%
          </text>
          <animate attributeName="opacity" values="0;0.8" dur="2s" begin="1s" repeatCount="indefinite" />
        </g>

        {/* No Conflicts */}
        <g opacity="0.8">
          <rect x="250" y="220" width="60" height="30" rx="4" fill="currentColor" className="text-white dark:text-black" stroke="currentColor" strokeWidth="1" />
          <circle cx="265" cy="235" r="4" fill="currentColor" className="text-green-500" />
          <text x="285" y="240" textAnchor="middle" fill="currentColor" className="text-black dark:text-white" fontSize="10">
            OK
          </text>
          <animate attributeName="opacity" values="0;0.8" dur="2s" begin="1.5s" repeatCount="indefinite" />
        </g>
      </g>
    </svg>
  );
}
