"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { UISegment, UIComment } from "@/types/songs";

interface ExtendedChord {
  id: string;
  name: string;
  fingering?: string;
  color?: string;
}

interface ExtendedPattern {
  id: string;
  name: string;
  pattern?: string;
  isFingerStyle?: boolean;
  color?: string;
}

interface SegmentsListProps {
  onSegmentClick: (segmentId: string) => void;
  segments: UISegment[];
  chords: ExtendedChord[];
  patterns: ExtendedPattern[];
  comments?: UIComment[];
}

export function SegmentsList({
  onSegmentClick,
  segments,
  chords,
  patterns,
  comments = [],
}: SegmentsListProps) {
  console.log("=== SegmentsList DEBUG ===");
  console.log("Segments received:", segments);
  console.log("Comments received:", comments);
  console.log(
    "Segments with comments:",
    segments.filter((s) => s.comments && s.comments.length > 0)
  );

  const getSegmentComments = (segmentId: string): UIComment[] => {
    const passedComments = comments.filter(
      (comment) => comment.segmentId === segmentId
    );

    const segment = segments.find((s) => s.id === segmentId);
    const segmentComments = segment?.comments || [];

    const allComments = [...passedComments, ...segmentComments];

    const uniqueComments = Array.from(
      new Map(allComments.map((comment) => [comment.id, comment])).values()
    );

    console.log(`Comments for segment ${segmentId}:`, uniqueComments);
    return uniqueComments;
  };

  const allComments = useMemo(() => {
    const fromProps = comments;
    const fromSegments = segments.flatMap((segment) => segment.comments || []);
    const all = [...fromProps, ...fromSegments];

    return Array.from(
      new Map(all.map((comment) => [comment.id, comment])).values()
    );
  }, [segments, comments]);

  console.log("All comments:", allComments);

  const groupedSegments = useMemo(() => {
    console.log("Grouping segments...");
    const groups: Array<{
      id: string;
      text: string;
      chord?: { id: string; name: string; color?: string };
      pattern?: {
        id: string;
        name: string;
        color?: string;
        isFingerStyle?: boolean;
      };
      segments: UISegment[];
      allComments: UIComment[];
      segmentComments: Map<string, UIComment[]>;
      startIndex: number;
      hasComments: boolean;
      segmentsWithCommentsCount: number;
    }> = [];

    const sortedSegments = [...segments].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    sortedSegments.forEach((segment) => {
      let group = groups.find(
        (g) =>
          g.chord?.id === segment.chordId &&
          g.pattern?.id === segment.patternId &&
          g.text === segment.text
      );

      const segmentComments = getSegmentComments(segment.id);
      console.log(
        `Segment ${segment.id} has ${segmentComments.length} comments`
      );

      if (!group) {
        const chord = segment.chordId
          ? chords.find((c) => c.id === segment.chordId)
          : undefined;
        const pattern = segment.patternId
          ? patterns.find((p) => p.id === segment.patternId)
          : undefined;

        const segmentCommentsMap = new Map<string, UIComment[]>();
        segmentCommentsMap.set(segment.id, segmentComments);

        const hasComments = segmentComments.length > 0;

        group = {
          id: `group-${segment.id}`,
          text: segment.text,
          chord: chord
            ? {
                id: chord.id,
                name: chord.name,
                color: chord.color || "#3b82f6",
              }
            : undefined,
          pattern: pattern
            ? {
                id: pattern.id,
                name: pattern.name,
                color: pattern.color || "#8b5cf6",
                isFingerStyle: pattern.isFingerStyle,
              }
            : undefined,
          segments: [segment],
          allComments: [...segmentComments],
          segmentComments: segmentCommentsMap,
          startIndex: segment.startIndex,
          hasComments,
          segmentsWithCommentsCount: hasComments ? 1 : 0,
        };
        groups.push(group);
        console.log(`Created new group for segment ${segment.id}`);
      } else {
        group.segments.push(segment);
        group.segmentComments.set(segment.id, segmentComments);
        group.allComments.push(...segmentComments);

        const hasSegmentComments = segmentComments.length > 0;
        group.hasComments = group.hasComments || hasSegmentComments;
        if (hasSegmentComments) {
          group.segmentsWithCommentsCount += 1;
        }
        console.log(`Added segment ${segment.id} to existing group`);
      }
    });

    const sortedGroups = groups.sort((a, b) => a.startIndex - b.startIndex);
    console.log(
      "Created groups:",
      sortedGroups.map((g) => ({
        id: g.id,
        text: g.text.substring(0, 30) + "...",
        segments: g.segments.length,
        comments: g.allComments.length,
        hasComments: g.hasComments,
      }))
    );

    return sortedGroups;
  }, [segments, chords, patterns, comments]);

  const commentsStats = useMemo(() => {
    const totalComments = allComments.length;
    const segmentsWithComments = segments.filter(
      (segment) => getSegmentComments(segment.id).length > 0
    ).length;

    console.log("Comments stats:", { totalComments, segmentsWithComments });

    return { totalComments, segmentsWithComments };
  }, [segments, allComments]);

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
          {commentsStats.totalComments > 0 && (
            <Badge variant="secondary" className="ml-2">
              <MessageSquare className="h-3 w-3 mr-1" />
              {commentsStats.totalComments} коммент.
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {groupedSegments.map((group, index) => {
              console.log(
                `Rendering group ${group.id} with ${group.allComments.length} comments`
              );

              return (
                <div
                  key={group.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors group-container"
                  data-group-index={index}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-medium bg-muted px-2 py-1 rounded">
                          Группа {index + 1}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {group.segments.length} сегмент
                          {group.segments.length !== 1 ? "ов" : ""}
                        </div>
                        {group.segmentsWithCommentsCount > 0 && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            {group.segmentsWithCommentsCount} с комментариями
                          </Badge>
                        )}
                      </div>

                      <div className="mb-3 relative">
                        <div className="font-mono text-sm bg-muted/50 p-2 rounded border min-h-[60px]">
                          {group.text.length > 100
                            ? `${group.text.substring(0, 100)}...`
                            : group.text}

                          {group.segmentsWithCommentsCount > 0 && (
                            <div className="absolute -top-2 -right-2 flex gap-1 flex-wrap">
                              {group.segments.map((segment) => {
                                const segmentComments =
                                  group.segmentComments.get(segment.id) || [];
                                if (segmentComments.length > 0) {
                                  return (
                                    <div
                                      key={segment.id}
                                      className="relative group/comment"
                                      title={`${segmentComments.length} комментариев`}
                                    >
                                      <MessageSquare className="h-4 w-4 text-blue-500" />
                                      <span className="absolute -top-1 -right-1 text-[8px] font-bold text-white bg-blue-500 rounded-full w-3 h-3 flex items-center justify-center">
                                        {segmentComments.length}
                                      </span>

                                      <div className="absolute top-full right-0 mt-1 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/comment:opacity-100 transition-opacity z-50 pointer-events-none">
                                        <div className="font-medium">
                                          Комментарии:
                                        </div>
                                        {segmentComments
                                          .slice(0, 2)
                                          .map((comment, i) => (
                                            <div key={i} className="truncate">
                                              {comment.authorName}:{" "}
                                              {comment.text.substring(0, 30)}...
                                            </div>
                                          ))}
                                        {segmentComments.length > 2 && (
                                          <div>
                                            ...и ещё{" "}
                                            {segmentComments.length - 2}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
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
                            {group.pattern.isFingerStyle && (
                              <Badge variant="secondary" className="text-xs">
                                Fingerstyle
                              </Badge>
                            )}
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

                  {group.allComments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">
                          Комментарии в этой группе
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {group.allComments.length}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {group.allComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">
                                {comment.authorName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                              {comment.text}
                            </p>
                            <div className="text-xs text-muted-foreground mt-2">
                              ID комментария: {comment.id.substring(0, 8)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-muted-foreground">
                        Позиции в тексте:
                      </div>
                      {group.segmentsWithCommentsCount > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {group.segmentsWithCommentsCount} сегм. с
                          комментариями
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.segments.map((segment) => {
                        const segmentComments =
                          group.segmentComments.get(segment.id) || [];
                        const hasComments = segmentComments.length > 0;

                        return (
                          <Button
                            key={segment.id}
                            size="sm"
                            variant={hasComments ? "default" : "outline"}
                            onClick={() => onSegmentClick(segment.id)}
                            className={`h-7 px-2 text-xs transition-all ${
                              hasComments
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : ""
                            }`}
                            title={`${segment.startIndex}-${
                              segment.startIndex + segment.length
                            }${
                              hasComments
                                ? ` (${segmentComments.length} коммент.)`
                                : ""
                            }`}
                          >
                            {segment.startIndex}-
                            {segment.startIndex + segment.length}
                            {hasComments && (
                              <div className="ml-1 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {segmentComments.length > 1 && (
                                  <span className="text-xs">
                                    {segmentComments.length}
                                  </span>
                                )}
                              </div>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{segments.length}</div>
              <div className="text-xs text-muted-foreground">
                Всего сегментов
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{chords.length}</div>
              <div className="text-xs text-muted-foreground">
                Уникальных аккордов
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">{patterns.length}</div>
              <div className="text-xs text-muted-foreground">
                Уникальных паттернов
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {commentsStats.totalComments}
              </div>
              <div className="text-xs text-muted-foreground">
                Комментариев ({commentsStats.segmentsWithComments} сегм.)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
