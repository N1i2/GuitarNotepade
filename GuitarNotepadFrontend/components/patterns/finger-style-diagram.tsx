"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronRight, Music, Hash, Info } from "lucide-react";

interface FingerStyleDiagramProps {
  pattern: string;
  name?: string;
}

type FingerStyleSymbol = "1" | "2" | "3" | "4" | "5" | "6" | "X" | ".";

interface Step {
  index: number;
  symbols: FingerStyleSymbol[];
  display: string;
}

export function FingerStyleDiagram({
  pattern,
  name = "Untitled Pattern",
}: FingerStyleDiagramProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  const parsePattern = (patternStr: string): Step[] => {
    if (!patternStr.trim()) return [];

    const steps: Step[] = [];
    let i = 0;
    let stepIndex = 0;

    while (i < patternStr.length) {
      if (patternStr[i] === "(") {
        const closeIndex = patternStr.indexOf(")", i);
        if (closeIndex === -1) break;

        const content = patternStr.substring(i + 1, closeIndex);
        const symbols = content
          .split("")
          .filter((char) =>
            ["1", "2", "3", "4", "5", "6", "X", "."].includes(char)
          ) as FingerStyleSymbol[];

        steps.push({
          index: stepIndex,
          symbols,
          display: `(${content})`,
        });

        i = closeIndex + 1;
        stepIndex++;
      } else if (
        ["1", "2", "3", "4", "5", "6", "X", "."].includes(patternStr[i])
      ) {
        steps.push({
          index: stepIndex,
          symbols: [patternStr[i] as FingerStyleSymbol],
          display: patternStr[i],
        });

        i++;
        stepIndex++;
      } else {
        i++;
      }
    }

    return steps;
  };

  const steps = parsePattern(pattern);

  const scrollToStep = (stepIndex: number) => {
    setActiveStep(stepIndex);

    if (diagramRef.current && stepsContainerRef.current) {
      const stepElement = diagramRef.current.querySelector(
        `[data-step="${stepIndex}"]`
      );
      if (stepElement) {
        stepElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });

        const stepsContainer = stepsContainerRef.current;
        const stepButton = stepsContainer.querySelector(
          `[data-step-button="${stepIndex}"]`
        );
        if (stepButton) {
          stepButton.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }

        stepElement.classList.add("ring-2", "ring-primary", "ring-offset-2");

        setTimeout(() => {
          stepElement.classList.remove(
            "ring-2",
            "ring-primary",
            "ring-offset-2"
          );
        }, 2000);
      }
    }
  };

  const stringColors = {
    "1": "bg-blue-500 dark:bg-blue-600",
    "2": "bg-green-500 dark:bg-green-600",
    "3": "bg-yellow-500 dark:bg-yellow-600",
    "4": "bg-purple-500 dark:bg-purple-600",
    "5": "bg-pink-500 dark:bg-pink-600",
    "6": "bg-red-500 dark:bg-red-600",
    X: "bg-amber-500 dark:bg-amber-600",
    ".": "bg-gray-500 dark:bg-gray-600",
  };

  const stringLabels = {
    "1": "String 1 (High E)",
    "2": "String 2 (B)",
    "3": "String 3 (G)",
    "4": "String 4 (D)",
    "5": "String 5 (A)",
    "6": "String 6 (Low E)",
    X: "Scratch/Chuck",
    ".": "Mute",
  };

  const stringOrder: FingerStyleSymbol[] = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "X",
    ".",
  ];

  const diagramHeight = stringOrder.length * 40;

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <div className="text-3xl font-bold mb-2">{name}</div>
        <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
          <Music className="h-5 w-5" />
          <span>Fingerstyle Pattern</span>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <Card className="border-2 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Pattern Diagram
          </CardTitle>
          <CardDescription>
            Visual representation of the fingerstyle pattern. Click on step
            numbers below to navigate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div
              ref={diagramRef}
              className="relative"
              style={{
                minWidth: `${Math.max(steps.length * 80 + 120, 400)}px`,
              }}
            >
              <div
                className="relative mb-8"
                style={{ height: `${diagramHeight}px` }}
              >
                {stringOrder.map((string, stringIndex) => (
                  <div
                    key={string}
                    className="absolute left-0 right-0 flex items-center"
                    style={{ top: `${stringIndex * 40}px` }}
                  >
                    <div className="w-24 flex items-center justify-end pr-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${stringColors[string]} text-white font-bold`}
                      >
                        {string}
                      </div>
                      <span className="ml-2 text-sm font-medium w-20 text-right">
                        {stringLabels[string]}
                      </span>
                    </div>
                    <div className="flex-1 border-t-2 border-gray-300 dark:border-gray-600 relative">
                      {steps.map((step, stepIndex) => {
                        const isActive = step.symbols.includes(string);
                        if (!isActive) return null;

                        return (
                          <div
                            key={`${string}-${stepIndex}`}
                            data-step={stepIndex}
                            className="absolute top-1/2 transform -translate-y-1/2"
                            style={{ left: `${stepIndex * 80 + 40}px` }}
                          >
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${stringColors[string]} text-white font-bold shadow-lg transition-transform hover:scale-110 cursor-pointer relative`}
                            >
                              {string}
                              <div className="absolute w-px h-6 bg-current -top-6 left-1/2 transform -translate-x-1/2 opacity-50"></div>
                            </div>
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-mono bg-muted px-2 py-1 rounded">
                              {stepIndex + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {steps.map((_, stepIndex) => (
                  <div
                    key={`vline-${stepIndex}`}
                    className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
                    style={{ left: `${stepIndex * 80 + 96}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs font-mono bg-background hover:bg-primary hover:text-primary-foreground"
                        onClick={() => scrollToStep(stepIndex)}
                      >
                        Step {stepIndex + 1}
                      </Button>
                    </div>

                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {stepIndex + 1}
                      </div>
                    </div>
                  </div>
                ))}

                {stringOrder.map((_, index) => (
                  <div
                    key={`hline-${index}`}
                    className="absolute left-24 right-0 border-t border-gray-100 dark:border-gray-800"
                    style={{ top: `${(index + 1) * 40}px` }}
                  />
                ))}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>String 1</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>String 2</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>String 3</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>String 4</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span>String 5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>String 6</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Scratch</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span>Mute</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Step-by-Step Plan
          </CardTitle>
          <CardDescription>
            Click on any step to navigate to it in the diagram above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div
              ref={stepsContainerRef}
              className="flex gap-3 pb-4"
              style={{ minWidth: `${Math.max(steps.length * 104, 400)}px` }}
            >
              {steps.map((step, index) => (
                <Button
                  key={index}
                  data-step-button={index}
                  variant={activeStep === index ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-24 w-24 transition-all hover:scale-105"
                  onClick={() => scrollToStep(index)}
                >
                  <div className="text-xs text-muted-foreground mb-1">Step</div>
                  <div className="text-2xl font-bold mb-2">{index + 1}</div>
                  <div className="flex gap-1">
                    {step.symbols.map((symbol, symIndex) => (
                      <div
                        key={symIndex}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${stringColors[symbol]} text-white text-xs font-bold`}
                      >
                        {symbol}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs mt-1 font-mono">{step.display}</div>
                </Button>
              ))}

              {steps.length === 0 && (
                <div className="w-full py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Music className="h-8 w-8" />
                    <div>No pattern yet</div>
                    <div className="text-sm">
                      Create a fingerstyle pattern to see the steps
                    </div>
                  </div>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {steps.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium mb-3">Step Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      activeStep === index
                        ? "border-primary bg-primary/5"
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold">Step {index + 1}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => scrollToStep(index)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="font-mono bg-background px-2 py-1 rounded">
                        {step.display}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {step.symbols.length === 1 ? (
                        <span>Play {stringLabels[step.symbols[0]]}</span>
                      ) : (
                        <span>
                          Play simultaneously:{" "}
                          {step.symbols
                            .map((s) => stringLabels[s].split(" (")[0])
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Pattern Notation & Legend
          </CardTitle>
          <CardDescription>
            Text representation and symbol explanations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Pattern Notation:</h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-lg text-center">
                {pattern || "(empty)"}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Format: Single numbers play individual strings, parentheses
                indicate multiple strings played together. Example: "1(23)4"
                means: 1) String 1, 2) Strings 2+3 together, 3) String 4.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Symbol Legend:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stringOrder.map((symbol) => (
                  <div
                    key={symbol}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${stringColors[
                      symbol
                    ]
                      .replace("bg-", "bg-")
                      .replace(
                        "dark:bg-",
                        "dark:bg-"
                      )} bg-opacity-10 border-current border-opacity-20`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${stringColors[symbol]} text-white font-bold`}
                    >
                      {symbol}
                    </div>
                    <div>
                      <div className="font-medium">
                        {stringLabels[symbol].split(" (")[0]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {symbol === "1" && "High E string (thinnest)"}
                        {symbol === "2" && "B string"}
                        {symbol === "3" && "G string"}
                        {symbol === "4" && "D string"}
                        {symbol === "5" && "A string"}
                        {symbol === "6" && "Low E string (thickest)"}
                        {symbol === "X" && "Scratch/chuck sound"}
                        {symbol === "." && "Mute all strings"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Reading Tips:
              </h4>
              <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-300">
                <li>
                  • <strong>Top to bottom</strong>: String 1 (High E) → String 6
                  (Low E) → Scratch → Mute
                </li>
                <li>
                  • <strong>Left to right</strong>: Steps in chronological order
                </li>
                <li>
                  • <strong>Circles</strong> show which strings to play in each
                  step
                </li>
                <li>
                  • <strong>Multiple circles in same column</strong> = play
                  those strings together
                </li>
                <li>
                  • <strong>X</strong> = percussive scratch/chuck sound (mute
                  strings with palm)
                </li>
                <li>
                  • <strong>.</strong> = mute/pause (dampen all strings)
                </li>
                <li>
                  • Click step numbers above/below diagram or buttons in
                  "Step-by-Step Plan" to navigate
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
