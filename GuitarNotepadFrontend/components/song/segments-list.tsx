"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  ListMusic,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { UISegment, SongChordDto, SongPatternDto, UIComment } from "@/types/songs";

interface SegmentsListProps {
  onSegmentClick: (segmentId: string) => void;
  segments: UISegment[];
  chords: SongChordDto[];
  patterns: SongPatternDto[];
  comments?: UIComment[];
}

export function SegmentsList({ 
  onSegmentClick, 
  segments, 
  chords, 
  patterns, 
  comments = [] 
}: SegmentsListProps) {
  
  const groupedSegments = useMemo(() => {
    const groups: {
      id: string;
      text: string;
      chord?: { id: string; name: string; color: string };
      pattern?: {
        id: string;
        name: string;
        color: string;
        isFingerStyle?: boolean;
      };
      segments: UISegment[];
      comments: UIComment[];
      startIndex: number;
    }[] = [];

    const sortedSegments = [...segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    for (const segment of sortedSegments) {
      let group = groups.find(
        (g) =>
          g.chord?.id === segment.chordId &&
          g.pattern?.id === segment.patternId &&
          g.text === segment.text
      );

      if (!group) {
        const chord = segment.chordId
          ? chords.find((c) => c.chordId === segment.chordId)
          : undefined;

        const pattern = segment.patternId
          ? patterns.find((p) => p.patternId === segment.patternId)
          : undefined;

        group = {
          id: `group-${segment.chordId || "no-chord"}-${
            segment.patternId || "no-pattern"
          }-${segment.text}`,
          text: segment.text,
          chord: chord
            ? { id: chord.chordId, name: chord.chordName, color: chord.color }
            : undefined,
          pattern: pattern
            ? {
                id: pattern.patternId,
                name: pattern.patternName,
                color: pattern.color,
                isFingerStyle: pattern.isFingerStyle,
              }
            : undefined,
          segments: [],
          comments: [...(segment.comments || []), ...comments.filter((c) => c.segmentId === segment.id)],
          startIndex: segment.startIndex,
        };
        groups.push(group);
      }

      group.segments.push(segment);
    }

    return groups.sort((a, b) => a.startIndex - b.startIndex);
  }, [
    segments,
    chords,
    patterns,
    comments,
  ]);

  if (segments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Нет сегментов</h3>
            <p className="text-muted-foreground text-sm">
              Добавьте аккорды или паттерны к тексту, чтобы увидеть сегменты
              здесь
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Группы сегментов
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {groupedSegments.map((group, index) => (
              <div
                key={group.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-sm font-medium bg-muted px-2 py-1 rounded">
                        Группа {index + 1}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {group.segments.length}{" "}
                        {group.segments.length === 1 ? "сегмент" : "сегментов"}
                      </div>
                      {group.comments.length > 0 && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {group.comments.length}
                        </Badge>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="font-mono text-sm bg-muted/50 p-2 rounded border">
                        {group.text.length > 100
                          ? `${group.text.substring(0, 100)}...`
                          : group.text}
                      </div>
                      {group.text.length > 100 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {group.text.length} символов
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mb-3">
                      {group.chord && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: group.chord.color }}
                          />
                          <span className="text-sm font-medium">
                            {group.chord.name}
                          </span>
                          <Link
                            href={`/home/chords/${encodeURIComponent(
                              group.chord.name
                            )}`}
                            target="_blank"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            перейти
                          </Link>
                        </div>
                      )}

                      {group.pattern && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: group.pattern.color }}
                          />
                          <span className="text-sm font-medium">
                            {group.pattern.name}
                          </span>
                          <Link
                            href={`/home/patterns/${encodeURIComponent(
                              group.pattern.name
                            )}`}
                            target="_blank"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            перейти
                          </Link>
                          <Badge variant="secondary" className="text-xs">
                            {group.pattern.isFingerStyle
                              ? "Fingerstyle"
                              : "Strumming"}
                          </Badge>
                        </div>
                      )}

                      {!group.chord && !group.pattern && (
                        <div className="text-sm text-muted-foreground">
                          Текст без аккордов и паттернов
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSegmentClick(group.segments[0].id)}
                    className="ml-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {group.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Комментарии</h4>
                    </div>
                    <div className="space-y-2">
                      {group.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium">
                              {comment.authorName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2">
                    Позиции в тексте:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.segments.map((segment, i) => (
                      <Button
                        key={segment.id}
                        size="sm"
                        variant="outline"
                        onClick={() => onSegmentClick(segment.id)}
                        className="h-7 px-2 text-xs"
                      >
                        {segment.startIndex}-
                        {segment.startIndex + segment.length}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{segments.length}</div>
              <div className="text-xs text-muted-foreground">
                Всего сегментов
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {chords.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Уникальных аккордов
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {patterns.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Уникальных паттернов
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}