"use client";

interface SVGChordDiagramProps {
  fingering: string;
  name?: string;
  width?: number;
  height?: number;
}

export function SVGChordDiagram({
  fingering,
  name,
  width = 320,
  height = 420,
}: SVGChordDiagramProps) {
  const parseFingering = (fingering: string): Array<number | "X"> => {
    if (!fingering) return [0, 0, 0, 0, 0, 0];

    let parts: string[];
    if (fingering.includes("-")) {
      parts = fingering.split("-");
    } else {
      parts = fingering.split("");
    }

    return parts.slice(0, 6).map((p) => {
      if (p === "X" || p === "x") return "X";
      const num = parseInt(p, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const values = parseFingering(fingering);

  const padding = 60;
  const stringSpacing = (width - padding * 2) / 5;
  const diagramHeight = height - padding * 2;

  const frets = values.filter(
    (v) => typeof v === "number" && v > 0
  ) as number[];

  const getDisplayRange = (): { baseFret: number; fretSpan: number } => {
    if (frets.length === 0) {
      return { baseFret: 1, fretSpan: 4 };
    }

    const minFret = Math.min(...frets);
    const maxFret = Math.max(...frets);

    if (maxFret <= 4) {
      return { baseFret: 1, fretSpan: 4 };
    }

    if (minFret <= 5 && maxFret <= 9) {
      const fretSpan = Math.min(5, maxFret);
      return { baseFret: 1, fretSpan };
    }

    const baseFret = Math.max(1, minFret - 1);
    const fretSpan = Math.min(5, Math.max(4, maxFret - baseFret + 1));

    return { baseFret, fretSpan };
  };

  const { baseFret, fretSpan } = getDisplayRange();
  const fretHeight = diagramHeight / fretSpan;

  const showBaseFret = baseFret > 1;

  const getFretColor = (fret: number): string => {
    if (fret <= 3) return "#3b82f6";
    if (fret <= 5) return "#8b5cf6";
    if (fret <= 7) return "#ef4444";
    if (fret <= 9) return "#f59e0b";
    return "#14b8a6";
  };

  const getDisplayFret = (fret: number | "X"): number | null => {
    if (fret === 0 || fret === "X") return null;

    const displayFret = fret - baseFret + 1;
    if (displayFret >= 1 && displayFret <= fretSpan) {
      return displayFret;
    }
    return null;
  };

  const checkForBarre = (): {
    fret: number;
    from: number;
    to: number;
  } | null => {
    const fretCounts: Record<number, number[]> = {};

    values.forEach((value, stringIndex) => {
      if (typeof value === "number" && value > 0) {
        if (!fretCounts[value]) {
          fretCounts[value] = [];
        }
        fretCounts[value].push(stringIndex);
      }
    });

    for (const [fretStr, stringIndices] of Object.entries(fretCounts)) {
      const fret = parseInt(fretStr);
      if (stringIndices.length >= 3) {
        stringIndices.sort((a, b) => a - b);

        let maxSequence = 1;
        let currentSequence = 1;
        let maxStart = 0;
        let currentStart = 0;

        for (let i = 1; i < stringIndices.length; i++) {
          if (stringIndices[i] === stringIndices[i - 1] + 1) {
            currentSequence++;
            if (currentSequence > maxSequence) {
              maxSequence = currentSequence;
              maxStart = currentStart;
            }
          } else {
            currentSequence = 1;
            currentStart = i;
          }
        }

        if (maxSequence >= 3) {
          return {
            fret: fret,
            from: stringIndices[maxStart],
            to: stringIndices[maxStart + maxSequence - 1],
          };
        }
      }
    }

    return null;
  };

  const barre = checkForBarre();

  return (
    <div className="relative">
      <div className="border-2 rounded-xl p-6 bg-gradient-to-b from-background to-muted/5 shadow-sm">
        <div className="text-center mb-6">
          {name && <div className="text-3xl font-bold mb-2">{name}</div>}
          <div className="text-lg text-muted-foreground font-mono bg-muted/50 px-4 py-2 rounded-lg inline-block">
            {fingering}
          </div>
        </div>

        <div className="flex justify-center">
          <svg
            width={width}
            height={height}
            className="border-4 border-amber-800 rounded-lg bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 shadow-lg"
          >
            <rect
              x={padding}
              y={padding}
              width={width - padding * 2}
              height={diagramHeight}
              fill="url(#fretboard-gradient)"
              rx="4"
            />

            <defs>
              <linearGradient
                id="fretboard-gradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#92400e" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>

            {Array.from({ length: fretSpan + 1 }).map((_, i) => (
              <line
                key={`fret-${i}`}
                x1={padding}
                y1={padding + i * fretHeight}
                x2={width - padding}
                y2={padding + i * fretHeight}
                stroke={i === 0 ? "#fbbf24" : "#d97706"}
                strokeWidth={i === 0 ? "4" : "2"}
              />
            ))}

            {Array.from({ length: 6 }).map((_, i) => {
              const x = padding + i * stringSpacing;
              const stringSize = i === 0 || i === 5 ? 2 : 1.5;

              return (
                <line
                  key={`string-${i}`}
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={padding + diagramHeight}
                  stroke="#e5e7eb"
                  strokeWidth={stringSize}
                  opacity={0.9}
                />
              );
            })}

            {barre &&
              (() => {
                const displayFret = barre.fret - baseFret + 1;
                if (displayFret < 1 || displayFret > fretSpan) return null;

                const x1 = padding + barre.from * stringSpacing;
                const x2 = padding + barre.to * stringSpacing;
                const y = padding + (displayFret - 0.5) * fretHeight;

                return (
                  <rect
                    x={x1 - 10}
                    y={y - 10}
                    width={x2 - x1 + 20}
                    height={20}
                    rx={10}
                    fill={getFretColor(barre.fret)}
                    opacity={0.9}
                  />
                );
              })()}

            {values.map((value, stringIndex) => {
              const displayFret = getDisplayFret(value);
              if (!displayFret) return null;

              const x = padding + stringIndex * stringSpacing;
              const y = padding + (displayFret - 0.5) * fretHeight;

              if (
                barre &&
                typeof value === "number" &&
                value === barre.fret &&
                stringIndex >= barre.from &&
                stringIndex <= barre.to
              ) {
                return null;
              }

              return (
                <g key={`finger-${stringIndex}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="14"
                    fill={getFretColor(value as number)}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {values.map((value, stringIndex) => {
              if (value !== 0) return null;

              const x = padding + stringIndex * stringSpacing;
              const y = padding - 30;

              return (
                <g key={`open-${stringIndex}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                </g>
              );
            })}

            {values.map((value, stringIndex) => {
              if (value !== "X") return null;

              const x = padding + stringIndex * stringSpacing;
              const y = padding - 30;

              return (
                <g key={`mute-${stringIndex}`}>
                  <line
                    x1={x - 10}
                    y1={y - 10}
                    x2={x + 10}
                    y2={y + 10}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1={x + 10}
                    y1={y - 10}
                    x2={x - 10}
                    y2={y + 10}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {[6, 5, 4, 3, 2, 1].map((stringNum, i) => (
              <text
                key={`top-label-${i}`}
                x={padding + i * stringSpacing}
                y={padding - 45}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="16"
                fontWeight="bold"
              >
                {stringNum}
              </text>
            ))}

            {["E", "A", "D", "G", "B", "E"].map((note, i) => (
              <text
                key={`bottom-label-${i}`}
                x={padding + i * stringSpacing}
                y={padding + diagramHeight + 35}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="14"
                fontWeight="medium"
              >
                {note}
              </text>
            ))}

            {showBaseFret && (
              <text
                x={padding - 35}
                y={padding + diagramHeight / 2}
                textAnchor="middle"
                fill="#f59e0b"
                fontSize="18"
                fontWeight="bold"
                transform={`rotate(-90, ${padding - 35}, ${
                  padding + diagramHeight / 2
                })`}
              >
                {baseFret}fr
              </text>
            )}
          </svg>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-6 gap-3 mb-4">
            {values.map((value, index) => {
              const stringNum = 6 - index;
              const note = ["E", "A", "D", "G", "B", "E"][index];

              return (
                <div
                  key={index}
                  className="text-center p-3 bg-gradient-to-b from-muted to-muted/50 rounded-lg border"
                >
                  <div className="text-xs text-muted-foreground">
                    String {stringNum} ({note})
                  </div>
                  <div
                    className={`text-lg font-bold mt-1 ${
                      value === "X"
                        ? "text-red-500"
                        : value === 0
                        ? "text-green-500"
                        : "text-blue-500"
                    }`}
                  >
                    {value === 0
                      ? "Open"
                      : value === "X"
                      ? "Mute"
                      : `Fret ${value}`}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Open string</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Muted string</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Finger position</span>
            </div>
            {barre && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-3 rounded bg-blue-500 opacity-80"></div>
                <span>Barre on fret {barre.fret}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
