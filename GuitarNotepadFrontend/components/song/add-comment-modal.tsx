'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSongCreation } from '@/app/contexts/song-creation-context';
import { useAuth } from '@/components/providers/auth-provider';

interface AddCommentModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddCommentModal({ open, onClose }: AddCommentModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const { state, dispatch } = useSongCreation();
  const [comment, setComment] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [segmentText, setSegmentText] = useState('');

  useEffect(() => {
    if (open) {
      const segmentId = localStorage.getItem('commentSegmentId');
      const selection = JSON.parse(localStorage.getItem('commentSelection') || '{}');
      
      if (segmentId) {
        setSelectedSegmentId(segmentId);
        const segment = state.segments.find(s => s.id === segmentId);
        if (segment) {
          setSegmentText(segment.text);
        } else if (selection.start !== undefined) {
          const text = state.text.substring(selection.start, selection.end);
          setSegmentText(text);
        }
      }
    }
  }, [open, state.segments, state.text]);

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast.error('Введите текст комментария');
      return;
    }

    if (!user) {
      toast.error('Для добавления комментария необходимо войти в систему');
      return;
    }

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      segmentId: selectedSegmentId,
      authorId: user.id,
      authorName: user.nikName || user.email,
      text: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_COMMENT', payload: newComment });
    
    toast.success('Комментарий добавлен');
    handleClose();
  };

  const handleClose = () => {
    setComment('');
    setSelectedSegmentId('');
    setSegmentText('');
    localStorage.removeItem('commentSegmentId');
    localStorage.removeItem('commentSelection');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить комментарий</DialogTitle>
          <DialogDescription>
            Добавьте комментарий к выделенному тексту
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Выделенный текст</Label>
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
              Добавить комментарий
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}