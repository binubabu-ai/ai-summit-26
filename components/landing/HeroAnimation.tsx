'use client';

export function HeroAnimation() {
  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Animated gradient background */}
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" className="text-neutral-50 dark:text-neutral-900" stopOpacity="0.5">
              <animate attributeName="stop-color" values="rgb(250,250,250);rgb(245,245,245);rgb(250,250,250)" dur="8s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="currentColor" className="text-neutral-100 dark:text-neutral-800" stopOpacity="0.3">
              <animate attributeName="stop-color" values="rgb(245,245,245);rgb(240,240,240);rgb(245,245,245)" dur="8s" repeatCount="indefinite" />
            </stop>
          </linearGradient>

          {/* Document icon pattern */}
          <pattern id="doc-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect x="8" y="8" width="24" height="24" fill="none" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" strokeWidth="1" />
            <line x1="12" y1="16" x2="28" y2="16" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" strokeWidth="1" />
            <line x1="12" y1="20" x2="24" y2="20" stroke="currentColor" className="text-neutral-200 dark:text-neutral-800" strokeWidth="1" />
          </pattern>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background pattern */}
        <rect width="600" height="600" fill="url(#doc-pattern)" opacity="0.3" />

        {/* Main Document Stack */}
        <g className="animate-float">
          {/* Document 3 (back) */}
          <rect
            x="180"
            y="180"
            width="220"
            height="280"
            rx="8"
            fill="currentColor"
            className="text-neutral-100 dark:text-neutral-900"
            opacity="0.6"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-5; 0,0"
              dur="4s"
              repeatCount="indefinite"
            />
          </rect>

          {/* Document 2 (middle) */}
          <rect
            x="170"
            y="170"
            width="220"
            height="280"
            rx="8"
            fill="currentColor"
            className="text-neutral-50 dark:text-neutral-950"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.8"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-3; 0,0"
              dur="4s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </rect>

          {/* Document 1 (front) - Main focus */}
          <rect
            x="160"
            y="160"
            width="220"
            height="280"
            rx="8"
            fill="currentColor"
            className="text-white dark:text-black"
            stroke="currentColor"
            strokeWidth="2"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-2; 0,0"
              dur="4s"
              begin="1s"
              repeatCount="indefinite"
            />
          </rect>

          {/* Document content lines */}
          <g>
            <line x1="180" y1="190" x2="350" y2="190" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="180" y1="210" x2="340" y2="210" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" begin="0.5s" repeatCount="indefinite" />
            </line>
            <line x1="180" y1="230" x2="350" y2="230" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" begin="1s" repeatCount="indefinite" />
            </line>
            <line x1="180" y1="250" x2="330" y2="250" stroke="currentColor" className="text-neutral-300 dark:text-neutral-700" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" begin="1.5s" repeatCount="indefinite" />
            </line>
          </g>
        </g>

        {/* AI Analysis Circle - Left side */}
        <g>
          <circle
            cx="100"
            cy="300"
            r="50"
            fill="currentColor"
            className="text-black dark:text-white"
            opacity="0.1"
          >
            <animate attributeName="r" values="45;55;45" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.05;0.15;0.05" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle
            cx="100"
            cy="300"
            r="35"
            fill="currentColor"
            className="text-black dark:text-white"
            filter="url(#glow)"
          >
            <animate attributeName="r" values="30;40;30" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* AI Icon (brain/sparkle) */}
          <path
            d="M 100 285 L 105 295 L 115 293 L 108 302 L 115 310 L 105 308 L 100 318 L 95 308 L 85 310 L 92 302 L 85 293 L 95 295 Z"
            fill="currentColor"
            className="text-white dark:text-black"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 100 300"
              to="360 100 300"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Approval Checkmark - Right side */}
        <g>
          <circle
            cx="500"
            cy="300"
            r="50"
            fill="currentColor"
            className="text-black dark:text-white"
            opacity="0.1"
          >
            <animate attributeName="r" values="45;55;45" dur="3s" begin="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.05;0.15;0.05" dur="3s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle
            cx="500"
            cy="300"
            r="35"
            fill="currentColor"
            className="text-black dark:text-white"
            filter="url(#glow)"
          >
            <animate attributeName="r" values="30;40;30" dur="2s" begin="1s" repeatCount="indefinite" />
          </circle>
          {/* Checkmark */}
          <path
            d="M 488 300 L 495 308 L 512 288"
            fill="none"
            stroke="currentColor"
            className="text-white dark:text-black"
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

        {/* Connecting Lines with Data Flow */}
        {/* Left line (AI to Document) */}
        <line
          x1="150"
          y1="300"
          x2="160"
          y2="300"
          stroke="currentColor"
          className="text-neutral-400 dark:text-neutral-600"
          strokeWidth="2"
          strokeDasharray="4 4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>

        {/* Right line (Document to Approval) */}
        <line
          x1="380"
          y1="300"
          x2="450"
          y2="300"
          stroke="currentColor"
          className="text-neutral-400 dark:text-neutral-600"
          strokeWidth="2"
          strokeDasharray="4 4"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
        </line>

        {/* Floating particles */}
        <circle cx="250" cy="120" r="2" fill="currentColor" className="text-neutral-400 dark:text-neutral-600">
          <animate attributeName="cy" values="120;140;120" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="350" cy="480" r="2" fill="currentColor" className="text-neutral-400 dark:text-neutral-600">
          <animate attributeName="cy" values="480;500;480" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="450" cy="150" r="2" fill="currentColor" className="text-neutral-400 dark:text-neutral-600">
          <animate attributeName="cy" values="150;170;150" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
