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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

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
          (c) => c.segmentId === segmentId,
        );
        if (existingComment) {
          setComment(existingComment.text);
        }
      }
    }
  }, [open, segmentId, state.segments, state.comments]);

  const handleSubmit = () => {
    if (!comment.trim() || !segmentId) {
      toast.error("Enter comment text");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add a comment");
      return;
    }

    const existingComment = state.comments.find(
      (c) => c.segmentId === segmentId,
    );

    if (existingComment) {
      dispatch({
        type: "UPDATE_COMMENT",
        payload: { ...existingComment, text: comment.trim() },
      });
      toast.success("Comment updated");
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
      toast.success("Comment added");
    }

    handleClose();
  };

  const handleDelete = () => {
    const existingComment = state.comments.find(
      (c) => c.segmentId === segmentId,
    );

    if (existingComment) {
      dispatch({ type: "DELETE_COMMENT", payload: existingComment.id });
      toast.success("Comment deleted");
      handleClose();
    }
  };

  const handleClose = () => {
    setComment("");
    setSegmentText("");
    onClose();
  };

  const existingComment = state.comments.find((c) => c.segmentId === segmentId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingComment ? "Edit comment" : "Add comment"}
          </DialogTitle>
          <DialogDescription>
            {existingComment
              ? "Editing a comment for a selected segment"
              : "Add a comment to the selected segment"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Segment Text</Label>
            <div className="p-3 bg-muted rounded-md border text-sm">
              {segmentText.length > 200
                ? `${segmentText.substring(0, 200)}...`
                : segmentText}
              {segmentText.length > 200 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {segmentText.length} characters
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="For example: At this point we play a little faster..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Maximum 1000 characters</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          <div className="flex gap-3 justify-between items-center pt-4">
            <div className="flex gap-2">
              {existingComment && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete comments</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this comment? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!comment.trim()}>
                {existingComment ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
