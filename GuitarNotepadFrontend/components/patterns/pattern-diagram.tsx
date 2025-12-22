"use client";

interface PatternDiagramProps {
  pattern: string;
  name?: string;
}

export function PatternDiagram({ pattern, name }: PatternDiagramProps) {
  const symbols = pattern.split("");

  const getSymbolConfig = (symbol: string) => {
    switch (symbol) {
      case "D":
        return {
          icon: (
            <div className="relative">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">ALL</span>
              </div>
            </div>
          ),
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          label: "Down All",
        };
      case "d":
        return {
          icon: (
            <div className="relative">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">TOP</span>
              </div>
            </div>
          ),
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          label: "Down Top",
        };
      case "U":
        return {
          icon: (
            <div className="relative">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">ALL</span>
              </div>
            </div>
          ),
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/30",
          label: "Up All",
        };
      case "u":
        return {
          icon: (
            <div className="relative">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">TOP</span>
              </div>
            </div>
          ),
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          label: "Up Top",
        };
      case "X":
        return {
          icon: (
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-current rounded-full"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center rotate-45">
                <div className="w-8 h-1 bg-current"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">CHK</span>
              </div>
            </div>
          ),
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900/30",
          label: "Scratch",
        };
      case "-":
        return {
          icon: (
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-8 h-1.5 bg-current"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">PAU</span>
              </div>
            </div>
          ),
          color: "text-gray-600",
          bgColor: "bg-gray-100 dark:bg-gray-800/30",
          label: "Pause",
        };
      case ".":
        return {
          icon: (
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 border-2 border-current rounded-full"></div>
                  <div className="absolute inset-1.5 bg-current rounded-full opacity-50"></div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">MUT</span>
              </div>
            </div>
          ),
          color: "text-amber-600",
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          label: "Mute",
        };
      default:
        return {
          icon: <div className="w-10 h-10"></div>,
          color: "text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-800/20",
          label: "Empty",
        };
    }
  };

  return (
    <div className="relative w-full">
      <div className="border-2 rounded-xl p-6 bg-gradient-to-b from-background to-muted/5 shadow-sm">
        <div className="text-center mb-6">
          {name && <div className="text-3xl font-bold mb-2">{name}</div>}
          <div className="text-lg text-muted-foreground font-mono bg-muted/50 px-4 py-2 rounded-lg inline-block">
            {pattern || "(empty)"}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="border-4 border-amber-800 rounded-lg bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 shadow-lg p-4 w-full max-w-4xl">
            {symbols.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-lg mb-2">No pattern yet</div>
                  <div className="text-sm">Add symbols to see preview</div>
                </div>
              </div>
            ) : (
              <div className="h-40">
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-min px-1">
                    {symbols.map((symbol, index) => {
                      const config = getSymbolConfig(symbol);
                      return (
                        <div
                          key={index}
                          className="flex-shrink-0 flex flex-col items-center gap-1.5 w-24"
                        >
                          <div
                            className={`${config.bgColor} ${config.color} p-2.5 rounded-lg border border-current/20`}
                          >
                            {config.icon}
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="text-[10px] font-mono bg-black/20 text-white px-1.5 py-0.5 rounded">
                              {index + 1}
                            </div>
                            <div className="text-xs font-medium text-center">
                              {config.label}
                            </div>
                            <div
                              className={`text-sm font-bold font-mono ${config.color}`}
                            >
                              {symbol}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {["D", "d", "U", "u", "X", "-", "."].map((symbol) => {
              const config = getSymbolConfig(symbol);
              return (
                <div
                  key={symbol}
                  className="text-center p-2 bg-gradient-to-b from-muted to-muted/50 rounded border"
                >
                  <div className="text-[11px] text-muted-foreground mb-1">
                    {config.label}
                  </div>
                  <div className={`flex justify-center ${config.color}`}>
                    {config.icon}
                  </div>
                  <div
                    className={`font-bold font-mono text-sm mt-1 ${config.color}`}
                  >
                    {symbol}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Down all</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>Down top</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>Up all</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span>Up top</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 flex items-center justify-center">
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 border border-amber-600 rounded-full"></div>
                  <div className="absolute inset-0.5 bg-amber-600 rounded-full opacity-50"></div>
                </div>
              </div>
              <span>Mute</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
