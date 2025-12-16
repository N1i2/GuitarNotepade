"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChordDisplayProps {
  fingering: string;
  name?: string;
}

export function ChordDisplay({ fingering, name }: ChordDisplayProps) {
  const strings = [
    { number: 6, note: "E" },
    { number: 5, note: "A" },
    { number: 4, note: "D" },
    { number: 3, note: "G" },
    { number: 2, note: "B" },
    { number: 1, note: "E" },
  ];

  const maxFret = 12;

  const parseFingering = (fingering: string): (number | "X" | 0)[] => {
    if (!fingering) return [0, 0, 0, 0, 0, 0];

    let values: string[];
    if (fingering.includes("-")) {
      values = fingering.split("-");
    } else {
      values = fingering.split("");
    }

    return values.slice(0, 6).map((val) => {
      if (val === "X" || val === "x") return "X";
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const values = parseFingering(fingering);

  const getFretColor = (fret: number): string => {
    if (fret <= 3) return "bg-blue-500";
    if (fret <= 5) return "bg-purple-500";
    if (fret <= 7) return "bg-red-500";
    if (fret <= 9) return "bg-orange-500";
    return "bg-teal-500";
  };

  const getDisplayValue = (value: number | "X" | 0): string => {
    if (value === 0) return "Open";
    if (value === "X") return "Mute";
    return `Fret ${value}`;
  };

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
      <div className="text-center mb-6">
        {name && <div className="text-3xl font-bold mb-2">{name}</div>}
        <div className="text-lg text-muted-foreground font-mono bg-muted/50 px-4 py-2 rounded-lg inline-block">
          {fingering}
        </div>
      </div>

      <div className="flex mb-2">
        <div className="w-28 flex-shrink-0"></div>
        <div className="flex-1 grid grid-cols-6 gap-0 px-2">
          {strings.map((string) => (
            <div key={string.number} className="text-center">
              <div className="font-bold text-lg">{string.number}</div>
              <div className="text-xs text-muted-foreground">
                ({string.note})
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex mb-4">
        <div className="w-28 flex items-center">
          <div className="text-sm font-medium">Status:</div>
        </div>
        <div className="flex-1 grid grid-cols-6 gap-0 px-2">
          {strings.map((string, index) => {
            const stringIndex = index;
            const value = values[stringIndex];

            return (
              <div
                key={string.number}
                className="flex flex-col gap-1 items-center"
              >
                <div
                  className={`w-16 h-10 rounded flex items-center justify-center text-white font-bold ${
                    value === 0
                      ? "bg-green-500"
                      : value === "X"
                      ? "bg-red-500"
                      : typeof value === "number" && value > 0
                      ? getFretColor(value)
                      : "bg-gray-200"
                  }`}
                >
                  {value === 0 ? "O" : value === "X" ? "X" : value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getDisplayValue(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 max-h-[480px] overflow-y-auto pr-2">
        {Array.from({ length: maxFret }).map((_, fret) => {
          const fretNum = fret + 1;

          return (
            <div key={fretNum} className="flex">
              <div className="w-28 flex items-center justify-end pr-4">
                <div
                  className={`text-lg font-bold px-3 py-1 rounded ${
                    values.some((v) => v === fretNum)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  Fret {fretNum}
                </div>
              </div>
              <div className="flex-1 grid grid-cols-6 gap-0 px-2">
                {strings.map((string, index) => {
                  const stringIndex = index;
                  const currentValue = values[stringIndex];
                  const isActive = currentValue === fretNum;

                  return (
                    <div
                      key={string.number}
                      className={`h-12 flex items-center justify-center mx-auto w-full max-w-[64px] border ${
                        fretNum === 1
                          ? "border-t-2 border-amber-600"
                          : "border-gray-300"
                      } ${index === 0 ? "border-l-2 border-amber-800" : ""} ${
                        index === 5 ? "border-r-2 border-amber-800" : ""
                      }`}
                    >
                      {isActive ? (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getFretColor(
                            fretNum
                          )}`}
                        >
                          ●
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400">
                          ○
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-background rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-medium">Fingering Pattern:</div>
          <div className="text-sm text-muted-foreground">6th → 1st string</div>
        </div>
        <div className="space-y-3">
          <div className="font-mono text-3xl font-bold text-center tracking-wider bg-muted py-3 rounded">
            {fingering}
          </div>

          <div className="grid grid-cols-6 gap-2">
            {strings.map((string, index) => {
              const stringIndex = index;
              const value = values[stringIndex];

              return (
                <div key={string.number} className="text-center">
                  <div className="text-xs text-muted-foreground">
                    String {string.number}
                  </div>
                  <div
                    className={`font-bold text-lg p-2 rounded ${
                      value === 0
                        ? "bg-green-100 dark:bg-green-900/30"
                        : value === "X"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-blue-100 dark:bg-blue-900/30"
                    }`}
                  >
                    {getDisplayValue(value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Open string</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Muted string</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span>Frets 1-3</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-teal-500"></div>
          <span>Frets 10-12</span>
        </div>
      </div>
    </div>
  );
}
