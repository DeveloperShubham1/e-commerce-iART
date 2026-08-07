import React from "react";

/**
 * LoadingCartAnimation
 * ---------------------------------------------------------
 * React version of the shopping-cart "Loading..." animation.
 * Self-contained: no external CSS or assets required.
 *
 * Usage:
 *   <LoadingCartAnimation />
 * ---------------------------------------------------------
 */
export default function LoadingCartAnimation() {
  return (
    <div className="lca-wrap">
      <svg viewBox="0 0 500 460" xmlns="http://www.w3.org/2000/svg">
        {/* Phone body */}
        <rect x="215" y="30" width="200" height="320" rx="28" fill="#5b7186" />
        <rect x="228" y="48" width="174" height="284" rx="14" fill="#dcf0dc" className="phone-screen" />

        {/* Screen content: two product cards */}
        <g className="tag">
          <rect x="242" y="66" width="66" height="66" rx="6" fill="#bfe3bf" />
          <circle cx="292" cy="72" r="5" fill="#fff" /> max-width: 520px;
          <line x1="292" y1="72" x2="300" y2="64" stroke="#fff" strokeWidth="2" />
        </g>
        <g className="tag tag2">
          <rect x="320" y="66" width="66" height="66" rx="6" fill="#bfe3bf" />
          <circle cx="370" cy="72" r="5" fill="#fff" />
          <line x1="370" y1="72" x2="378" y2="64" stroke="#fff" strokeWidth="2" />
        </g>

        {/* fake text lines */}
        <rect x="242" y="146" width="60" height="6" rx="3" fill="#bfe3bf" />
        <rect x="242" y="158" width="40" height="6" rx="3" fill="#bfe3bf" />
        <rect x="320" y="146" width="60" height="6" rx="3" fill="#bfe3bf" />
        <rect x="320" y="158" width="40" height="6" rx="3" fill="#bfe3bf" />

        <rect x="242" y="280" width="144" height="6" rx="3" fill="#bfe3bf" />
        <rect x="242" y="294" width="100" height="6" rx="3" fill="#bfe3bf" />

        {/* Person + cart rig */}
        <g className="rig">
          {/* cart handle */}
          <line x1="150" y1="215" x2="180" y2="230" stroke="#e8a33d" strokeWidth="10" strokeLinecap="round" />
          <circle cx="148" cy="213" r="9" fill="#e8a33d" />

          {/* cart basket */}
          <path d="M175 225 L295 225 L275 300 L190 300 Z" fill="#f6c453" stroke="#e0a92f" strokeWidth="3" />
          {/* basket grid lines */}
          <line x1="195" y1="225" x2="205" y2="300" stroke="#e0a92f" strokeWidth="2" />
          <line x1="215" y1="225" x2="220" y2="300" stroke="#e0a92f" strokeWidth="2" />
          <line x1="235" y1="225" x2="235" y2="300" stroke="#e0a92f" strokeWidth="2" />
          <line x1="255" y1="225" x2="250" y2="300" stroke="#e0a92f" strokeWidth="2" />
          <line x1="275" y1="225" x2="265" y2="300" stroke="#e0a92f" strokeWidth="2" />
          <line x1="180" y1="245" x2="290" y2="245" stroke="#e0a92f" strokeWidth="2" />
          <line x1="185" y1="270" x2="282" y2="270" stroke="#e0a92f" strokeWidth="2" />

          {/* wheels */}
          <g className="wheel">
            <circle cx="205" cy="330" r="16" fill="#3a2a25" />
            <circle cx="205" cy="330" r="4" fill="#8a6a55" />
            <line x1="205" y1="316" x2="205" y2="344" stroke="#5c4438" strokeWidth="2" />
            <line x1="191" y1="330" x2="219" y2="330" stroke="#5c4438" strokeWidth="2" />
          </g>
          <g className="wheel">
            <circle cx="270" cy="330" r="16" fill="#e8a33d" />
            <circle cx="270" cy="330" r="4" fill="#c98a26" />
            <line x1="270" y1="316" x2="270" y2="344" stroke="#c98a26" strokeWidth="2" />
            <line x1="256" y1="330" x2="284" y2="330" stroke="#c98a26" strokeWidth="2" />
          </g>

          {/* person body */}
          <ellipse cx="225" cy="235" rx="34" ry="26" fill="#e8695f" />
          {/* head */}
          <circle cx="200" cy="185" r="24" fill="#b97a52" />
          {/* hair */}
          <path
            d="M180 178 Q178 155 200 158 Q222 152 220 178 Q222 168 210 165 Q205 172 200 165 Q195 172 188 168 Q182 170 180 178 Z"
            fill="#2b1c14"
          />
          {/* smile */}
          <path d="M192 192 Q200 198 208 192" stroke="#3a241a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="192" cy="182" r="2.2" fill="#2b1c14" />
          <circle cx="208" cy="182" r="2.2" fill="#2b1c14" />

          {/* arm holding phone */}
          <path d="M222 215 Q250 200 262 178" stroke="#e8695f" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="264" cy="174" r="10" fill="#b97a52" />
          {/* mini phone */}
          <rect x="256" y="150" width="22" height="34" rx="4" fill="#e6e6e6" stroke="#c7c7c7" strokeWidth="1.5" />
          <rect x="260" y="155" width="14" height="20" rx="1.5" fill="#8ecae6" className="mini-screen" />

          {/* legs stretched out over the cart */}
          <path d="M240 250 Q300 245 335 268" stroke="#3a2a30" strokeWidth="16" strokeLinecap="round" fill="none" />
          <path d="M330 260 Q350 268 348 288" stroke="#f6c453" strokeWidth="16" strokeLinecap="round" fill="none" />
          <ellipse cx="352" cy="292" rx="16" ry="10" fill="#f6c453" />

          <path d="M235 258 Q270 285 260 320" stroke="#3a2a30" strokeWidth="16" strokeLinecap="round" fill="none" />
          <ellipse cx="257" cy="330" rx="15" ry="9" fill="#f6c453" />
        </g>

        {/* Loading text */}
        <text
          x="250"
          y="410"
          textAnchor="middle"
          fontFamily="Trebuchet MS, Verdana, sans-serif"
          fontSize="46"
          fill="#7d8ba1"
          fontWeight="bold"
        >
          Loading
        </text>
        <circle className="dot dot1" cx="392" cy="398" r="5" fill="#7d8ba1" />
        <circle className="dot dot2" cx="406" cy="398" r="5" fill="#7d8ba1" />
        <circle className="dot dot3" cx="420" cy="398" r="5" fill="#7d8ba1" />
      </svg>

      <style>{`
     .lca-wrap {
  width: 100%;
  max-width: 520px;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

  margin: 0 auto;
}
        .lca-wrap svg {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Wheels spin */
        .wheel {
          transform-box: fill-box;
          transform-origin: center;
          animation: lca-spin 0.6s linear infinite;
        }
        @keyframes lca-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Whole cart+person bobs up and down like it's rolling */
        .rig {
          animation: lca-bob 1.2s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes lca-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        /* Phone glow pulse */
        .phone-screen {
          animation: lca-glow 2s ease-in-out infinite;
        }
        @keyframes lca-glow {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }

        /* Little handheld phone screen blink */
        .mini-screen {
          animation: lca-blink 1.6s ease-in-out infinite;
        }
        @keyframes lca-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Loading dots */
        .dot {
          animation: lca-dotPulse 1.4s ease-in-out infinite;
        }
        .dot1 { animation-delay: 0s; }
        .dot2 { animation-delay: 0.2s; }
        .dot3 { animation-delay: 0.4s; }
        @keyframes lca-dotPulse {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-4px); }
        }

        /* subtle background price tags float */
        .tag {
          animation: lca-sway 3s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: top center;
        }
        .tag2 { animation-delay: 0.6s; }
        @keyframes lca-sway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .wheel, .rig, .phone-screen, .mini-screen, .dot, .tag {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}