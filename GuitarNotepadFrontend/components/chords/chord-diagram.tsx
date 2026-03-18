"use client";

interface ChordDiagramProps {
  fingering: string;
  name?: string;
  size?: "sm" | "md" | "lg";
}

export function ChordDiagram({
  fingering,
  name,
  size = "md",
}: ChordDiagramProps) {
  const sizeClasses = {
    sm: "w-48 h-64",
    md: "w-72 h-96",
    lg: "w-96 h-128",
  };

  const parseFingering = (fingering: string): (number | "X" | 0)[] => {
    if (!fingering) return [0, 0, 0, 0, 0, 0];

    let values: string[];
    if (fingering.includes("-")) {
      values = fingering.split("-");
    } else {
      values = fingering.split("");
    }

    while (values.length < 6) {
      values.push("0");
    }

    return values.slice(0, 6).map((val) => {
      if (val === "X" || val === "x") return "X";
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const values = parseFingering(fingering);

  const getFretColor = (fret: number): string => {
    if (fret <= 3) return "#3b82f6";
    if (fret <= 5) return "#8b5cf6";
    if (fret <= 7) return "#ef4444";
    if (fret <= 9) return "#f59e0b";
    return "#14b8a6";
  };

  const numberValues = values.filter(
    (v) => typeof v === "number" && v > 0,
  ) as number[];

  const getDisplayFrets = () => {
    if (numberValues.length === 0) return { minFret: 1, maxFret: 4 };

    const minFret = Math.min(...numberValues);
    const maxFret = Math.max(...numberValues);

    if (maxFret <= 4) {
      return { minFret: 1, maxFret: 4 };
    }

    if (minFret <= 5 && maxFret <= 8) {
      return { minFret: 1, maxFret: maxFret };
    }

    const startFret = Math.max(1, minFret - 1);
    const endFret = Math.min(12, maxFret);
    const displayCount = Math.min(5, endFret - startFret + 1);

    return {
      minFret: startFret,
      maxFret: startFret + displayCount - 1,
    };
  };

  const { minFret, maxFret } = getDisplayFrets();
  const displayFrets = maxFret - minFret + 1;

  const topOffset = size === "lg" ? "top-8" : size === "md" ? "top-6" : "top-4";
  const bottomOffset =
    size === "lg" ? "bottom-8" : size === "md" ? "bottom-6" : "bottom-4";

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <div className="absolute inset-0 from-amber-800 to-amber-900 rounded-lg shadow-lg"></div>
      <div className="absolute inset-x-4 inset-y-8">
        {Array.from({ length: displayFrets + 1 }).map((_, fret) => (
          <div
            key={`fret-${fret}`}
            className={`absolute left-0 right-0 h-0.5 ${
              fret === 0 ? "bg-amber-400" : "bg-amber-700/70"
            } ${size === "lg" ? "h-1" : ""}`}
            style={{ top: `${fret * (100 / displayFrets)}%` }}
          ></div>
        ))}
      </div>

      <div className="absolute inset-x-0 top-8 bottom-8 flex items-center">
        {values.map((value, index) => {
          const stringNumber = 6 - index;
          const isOpen = value === 0;
          const isMuted = value === "X";
          const isFretted = typeof value === "number" && value > 0;
          const fretNumber = isFretted ? (value as number) : 0;

          const leftPosition = (index * 100) / (values.length - 1);

          return (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-0.5 bg-gray-300/90"
              style={{ left: `${leftPosition}%` }}
            >
              {isFretted && fretNumber >= minFret && fretNumber <= maxFret && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm z-10 shadow-lg border-2 border-white"
                  style={{
                    top: `${
                      (fretNumber - minFret) * (100 / displayFrets) +
                      50 / displayFrets
                    }%`,
                    backgroundColor: getFretColor(fretNumber),
                  }}
                >
                  {fretNumber}
                </div>
              )}

              {isOpen && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{ top: "-10%" }}
                >
                  <div className="w-6 h-6 rounded-full border-2 border-green-500 bg-transparent flex items-center justify-center">
                    <span className="text-green-500 text-xs font-bold">O</span>
                  </div>
                </div>
              )}

              {isMuted && (
                <div
                  className="absolute left-1/2 transform -translate-x-1/2"
                  style={{ top: "-10%" }}
                >
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 w-full h-0.5 bg-red-500 transform rotate-45 top-1/2 -translate-y-1/2"></div>
                    <div className="absolute inset-0 w-full h-0.5 bg-red-500 transform -rotate-45 top-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`absolute -top-2 left-0 right-0 flex justify-around ${topOffset}`}
      >
        {values.map((_, index) => {
          const stringNumber = 6 - index;
          return (
            <div
              key={index}
              className="text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              {stringNumber}
            </div>
          );
        })}
      </div>

      <div
        className={`absolute left-0 right-0 flex justify-around ${bottomOffset}`}
      >
        {["E", "A", "D", "G", "B", "E"].map((note, index) => (
          <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
            {note}
          </div>
        ))}
      </div>

      {minFret > 1 && (
        <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 -rotate-90">
          <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {minFret}fr
          </div>
        </div>
      )}

      <div className="absolute top-8 left-4 right-4 h-0.5 bg-amber-400"></div>

      {name && (
        <div className="absolute -bottom-10 left-0 right-0 text-center">
          <div className="font-bold text-xl">{name}</div>
          <div className="text-sm text-muted-foreground font-mono mt-1">
            {fingering}
          </div>
        </div>
      )}
    </div>
  );
}
