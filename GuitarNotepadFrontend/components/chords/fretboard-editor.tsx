"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Circle, X, GripVertical, Minus } from "lucide-react";

interface FretboardEditorProps {
  fingering: string; 
  onFingeringChange: (fingering: string) => void;
}

export function FretboardEditor({ fingering, onFingeringChange }: FretboardEditorProps) {
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
    if (fingering.includes('-')) {
      values = fingering.split('-');
    } else {
      values = fingering.split('');
    }
    
    return values.slice(0, 6).map(val => {
      if (val === 'X' || val === 'x') return 'X';
      const num = parseInt(val, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const formatFingering = (values: (number | "X" | 0)[]): string => {
    return values.map(v => v === 'X' ? 'X' : v.toString()).join('-');
  };

  const currentValues = parseFingering(fingering);

  const handleFretClick = (stringIndex: number, fret: number) => {
    const newValues = [...currentValues];
    
    if (newValues[stringIndex] === fret) {
      newValues[stringIndex] = 0;
    } else {
      newValues[stringIndex] = fret;
    }
    
    onFingeringChange(formatFingering(newValues));
  };

  const handleStringAction = (stringIndex: number, action: "open" | "mute") => {
    const newValues = [...currentValues];
    newValues[stringIndex] = action === "open" ? 0 : "X";
    onFingeringChange(formatFingering(newValues));
  };

  const getFretColor = (fret: number): string => {
    if (fret <= 3) return 'bg-blue-500 hover:bg-blue-600';
    if (fret <= 5) return 'bg-purple-500 hover:bg-purple-600';
    if (fret <= 7) return 'bg-red-500 hover:bg-red-600';
    if (fret <= 9) return 'bg-orange-500 hover:bg-orange-600';
    return 'bg-teal-500 hover:bg-teal-600';
  };

  const getDisplayValue = (value: number | "X" | 0): string => {
    if (value === 0) return "Open";
    if (value === "X") return "Mute";
    return `Fret ${value}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Click on frets to place fingers (up to 12th fret)</div>
      
      <div className="border rounded-lg p-4 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
        <div className="flex mb-4">
          <div className="w-28 flex-shrink-0"></div>
          <div className="flex-1 flex justify-between px-2">
            {strings.map((string) => (
              <div key={string.number} className="text-center w-16">
                <div className="font-bold text-lg">{string.number}</div>
                <div className="text-xs text-muted-foreground">({string.note})</div>
              </div>
            ))}
          </div>
        </div>


        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          <div className="flex mb-4">
            <div className="w-28 flex items-center">
              <div className="text-sm font-medium">Open/Mute:</div>
            </div>
            <div className="flex-1 flex justify-between px-2">
              {strings.map((string, index) => {
                const stringIndex = index; 
                const currentValue = currentValues[stringIndex];
                
                return (
                  <div key={string.number} className="flex flex-col gap-2 w-16">
                    <Button
                      size="sm"
                      variant={currentValue === 0 ? "default" : "outline"}
                      onClick={() => handleStringAction(stringIndex, "open")}
                      className="h-10"
                    >
                      <Circle className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant={currentValue === "X" ? "default" : "outline"}
                      onClick={() => handleStringAction(stringIndex, "mute")}
                      className="h-10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Mute
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {Array.from({ length: maxFret }).map((_, fret) => (
            <div key={fret + 1} className="flex">
              <div className="w-28 flex items-center justify-end pr-4">
                <div className="text-lg font-bold bg-muted px-3 py-1 rounded">
                  Fret {fret + 1}
                </div>
              </div>
              <div className="flex-1 flex justify-between px-2">
                {strings.map((string, index) => {
                  const stringIndex = index; 
                  const currentValue = currentValues[stringIndex];
                  const isActive = currentValue === fret + 1;
                  
                  return (
                    <Button
                      key={string.number}
                      variant={isActive ? "default" : "outline"}
                      size="lg"
                      className={`w-16 h-12 text-lg ${isActive ? getFretColor(fret + 1) : ''}`}
                      onClick={() => handleFretClick(stringIndex, fret + 1)}
                    >
                      {isActive ? "●" : "○"}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-background rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-medium">Current Pattern:</div>
            <div className="text-sm text-muted-foreground">
              6th → 1st string 
            </div>
          </div>
          <div className="space-y-3">
            <div className="font-mono text-3xl font-bold text-center tracking-wider">
              {formatFingering(currentValues)}
            </div>
            
            <div className="grid grid-cols-6 gap-2">
              {strings.map((string, index) => {
                const stringIndex = index; 
                const value = currentValues[stringIndex];
                
                return (
                  <div key={string.number} className="text-center">
                    <div className="text-xs text-muted-foreground">String {string.number}</div>
                    <div className={`font-bold text-lg p-2 rounded ${
                      value === 0 ? 'bg-green-100 dark:bg-green-900/30' :
                      value === "X" ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
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
    </div>
  );
}