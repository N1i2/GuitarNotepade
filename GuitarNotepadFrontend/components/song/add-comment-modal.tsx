"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSongCreation } from "@/app/contexts/song-creation-context";
import { useAuth } from "@/components/providers/auth-provider";

interface AddCommentModalProps {
  open: boolean;
  onClose: () => void;
  segmentId: string;
}

export function AddCommentModal({
  open,
  onClose,
  segmentId,
}: AddCommentModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { state, dispatch } = useSongCreation();
  const [comment, setComment] = useState("");
  const [segmentText, setSegmentText] = useState("");

  useEffect(() => {
    if (open && segmentId) {
      const segment = state.segments.find((s) => s.id === segmentId);
      if (segment) {
        setSegmentText(segment.text);

        const existingComment = state.comments.find(
          (c) => c.segmentId === segmentId
        );
        if (existingComment) {
          setComment(existingComment.text);
        }
      }
    }
  }, [open, segmentId, state.segments, state.comments]);

  const handleSubmit = () => {
    if (!comment.trim() || !segmentId) {
      toast.error("Введите текст комментария");
      return;
    }

    if (!user) {
      toast.error("Для добавления комментария необходимо войти в систему");
      return;
    }

    const existingComment = state.comments.find(
      (c) => c.segmentId === segmentId
    );

    if (existingComment) {
      dispatch({
        type: "UPDATE_COMMENT",
        payload: { ...existingComment, text: comment.trim() },
      });
      toast.success("Комментарий обновлен");
    } else {
      const newComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        segmentId: segmentId,
        authorId: user.id,
        authorName: user.nikName || user.email,
        text: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_COMMENT", payload: newComment });
      toast.success("Комментарий добавлен");
    }

    handleClose();
  };

  const handleClose = () => {
    setComment("");
    setSegmentText("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить комментарий</DialogTitle>
          <DialogDescription>
            Добавьте комментарий к выделенному сегменту
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Текст сегмента</Label>
            <div className="p-3 bg-muted rounded-md border text-sm">
              {segmentText.length > 200
                ? `${segmentText.substring(0, 200)}...`
                : segmentText}
              {segmentText.length > 200 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {segmentText.length} символов
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: В этом месте играем чуть быстрее..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Максимум 1000 символов</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={!comment.trim()}>
              {state.comments.find((c) => c.segmentId === segmentId)
                ? "Обновить"
                : "Добавить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
