"use client";

import React from "react";

interface MascotCosminoProps {
  mood?: "happy" | "celebrating" | "sleeping" | "thinking";
  size?: number;
  className?: string;
  animate?: boolean;
}

export function MascotCosmino({
  mood = "happy",
  size = 96,
  className = "",
  animate = true,
}: MascotCosminoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center select-none ${
        animate ? "animate-bounce-gentle" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Gradiente corpo alieno */}
          <linearGradient id="cosmoAlienGrad" x1="20" y1="20" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6B8CFF" />
            <stop offset="0.5" stopColor="#4F75FF" />
            <stop offset="1" stopColor="#2F55E6" />
          </linearGradient>

          {/* Gradiente pancia soffice */}
          <linearGradient id="cosmoBellyGrad" x1="60" y1="75" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E0EBFF" />
            <stop offset="1" stopColor="#BED6FF" />
          </linearGradient>

          {/* Bagliore orbita antenna */}
          <radialGradient id="antennaOrbGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF7A6" />
            <stop offset="60%" stopColor="#FFDE43" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>

        {/* Ombra di base */}
        <ellipse cx="60" cy="112" rx="34" ry="5" fill="#4A4458" fillOpacity="0.08" />

        {/* Antennina */}
        <path
          d="M60 38 Q58 24 60 16"
          stroke="#4F75FF"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Sferetta antenna */}
        <circle cx="60" cy="13" r="7" fill="url(#antennaOrbGrad)" />
        <circle cx="58" cy="11" r="2" fill="#FFFFFF" />

        {/* Braccia o manine carine */}
        {mood === "celebrating" ? (
          <>
            <path
              d="M32 75 Q20 55 24 45"
              stroke="#4F75FF"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M88 75 Q100 55 96 45"
              stroke="#4F75FF"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <ellipse cx="32" cy="80" rx="5" ry="7" transform="rotate(-20 32 80)" fill="#3B63EB" />
            <ellipse cx="88" cy="80" rx="5" ry="7" transform="rotate(20 88 80)" fill="#3B63EB" />
          </>
        )}

        {/* Orecchiette da alieno carino */}
        <path
          d="M28 50 Q16 48 20 62 Q25 64 28 58"
          fill="#4F75FF"
        />
        <path
          d="M92 50 Q104 48 100 62 Q95 64 92 58"
          fill="#4F75FF"
        />

        {/* Corpo testa arrotondata principale (Pucciosa) */}
        <rect
          x="26"
          y="34"
          width="68"
          height="66"
          rx="32"
          fill="url(#cosmoAlienGrad)"
        />

        {/* Pancina chiara */}
        <ellipse cx="60" cy="86" rx="20" ry="12" fill="url(#cosmoBellyGrad)" />

        {/* Guanciotte rosa pastello */}
        <ellipse cx="40" cy="68" rx="6" ry="3.5" fill="#FFB3C6" fillOpacity="0.75" />
        <ellipse cx="80" cy="68" rx="6" ry="3.5" fill="#FFB3C6" fillOpacity="0.75" />

        {/* Occhietti in base al mood */}
        {mood === "sleeping" ? (
          // Occhietti chiusi felici a mezzaluna
          <>
            <path
              d="M42 58 Q47 63 52 58"
              stroke="#2D2838"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M68 58 Q73 63 78 58"
              stroke="#2D2838"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        ) : mood === "celebrating" ? (
          // Occhi strizzati di gioia ^ ^
          <>
            <path
              d="M42 60 Q47 52 52 60"
              stroke="#2D2838"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M68 60 Q73 52 78 60"
              stroke="#2D2838"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        ) : mood === "thinking" ? (
          // Occhietti che guardano in alto
          <>
            <ellipse cx="47" cy="56" rx="6" ry="7" fill="#2D2838" />
            <circle cx="49" cy="53" r="2.5" fill="#FFFFFF" />
            <ellipse cx="73" cy="56" rx="6" ry="7" fill="#2D2838" />
            <circle cx="75" cy="53" r="2.5" fill="#FFFFFF" />
          </>
        ) : (
          // Occhietti grandi scintillanti normali
          <>
            <ellipse cx="46" cy="57" rx="6" ry="7" fill="#2D2838" />
            <circle cx="44.5" cy="54.5" r="2.5" fill="#FFFFFF" />
            <circle cx="48" cy="58.5" r="1.2" fill="#FFFFFF" />

            <ellipse cx="74" cy="57" rx="6" ry="7" fill="#2D2838" />
            <circle cx="72.5" cy="54.5" r="2.5" fill="#FFFFFF" />
            <circle cx="76" cy="58.5" r="1.2" fill="#FFFFFF" />
          </>
        )}

        {/* Bocca */}
        {mood === "celebrating" ? (
          // Grande sorriso aperto con linguetta
          <path
            d="M53 67 Q60 76 67 67"
            stroke="#2D2838"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="#FF8DA1"
          />
        ) : mood === "sleeping" ? (
          // Piccola boccuccia dolce
          <path
            d="M57 68 Q60 71 63 68"
            stroke="#2D2838"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          // Dolce sorrisino
          <path
            d="M55 67 Q60 72 65 67"
            stroke="#2D2838"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Stelline se festeggia */}
        {mood === "celebrating" && (
          <>
            <path
              d="M18 30 L20 25 L22 30 L27 32 L22 34 L20 39 L18 34 L13 32 Z"
              fill="#FFD600"
            />
            <path
              d="M98 25 L100 20 L102 25 L107 27 L102 29 L100 34 L98 29 L93 27 Z"
              fill="#FFD600"
            />
          </>
        )}
      </svg>
    </div>
  );
}
