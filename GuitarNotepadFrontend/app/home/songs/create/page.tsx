'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { SongsService } from '@/lib/api/song-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { SongTextEditor } from '@/components/song/song-text-editor';
import { ToolPanel } from '@/components/song/tool-panel';
import { SongCreationProvider, useSongCreation } from '@/app/contexts/song-creation-context';

function CreateSongContent() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { state, dispatch } = useSongCreation();
  
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (title !== state.title) {
      dispatch({ type: 'SET_TITLE', payload: title });
    }
  }, [title, state.title, dispatch]);
  
  useEffect(() => {
    if (isPublic !== state.isPublic) {
      dispatch({ type: 'SET_PUBLIC', payload: isPublic });
    }
  }, [isPublic, state.isPublic, dispatch]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Пожалуйста, войдите в систему, чтобы создать песню');
      return;
    }

    if (!title.trim()) {
      toast.error('Название песни обязательно');

      return;
    }

    if (!state.text.trim()) {
      toast.error('Текст песни обязателен');

      return;
    }

    setIsLoading(true);
    try {
      const createdSong = await SongsService.createSong(state);

      toast.success(`Песня "${createdSong.title}" успешно создана`);

      router.push(`/home/songs/${createdSong.id}`);
    } catch (error: any) {
      console.error('Ошибка при создании песни:', error);
      toast.error(error.message || 'Не удалось создать песню');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/home/songs')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к песням
          </Button>
          <h1 className="text-3xl font-bold">Создать новую песню</h1>
          <p className="text-muted-foreground mt-2">
            Напишите песню, добавьте аккорды и паттерны
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Детали песни</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Название песни *</Label>
                  <Input
                    placeholder="Введите название"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="cursor-pointer">
                    Сделать песню публичной
                  </Label>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {isPublic 
                    ? 'Песня будет доступна всем пользователям'
                    : 'Только вы сможете видеть эту песню'
                  }
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Аккорды: {state.selectedChords?.length || 0}/20</div>
                  <div>Паттерны: {state.selectedPatterns?.length || 0}/10</div>
                  <div>Символов: {state.text?.length || 0}</div>
                </div>
              </CardContent>
            </Card>

            <ToolPanel />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Текст песни</CardTitle>
                <CardDescription>
                  Напишите текст и используйте инструменты слева для добавления аккордов и паттернов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SongTextEditor />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4 justify-end pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/home/songs')}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !state.text?.trim()}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Создание...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Создать песню
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreateSongPage() {
  return (
    <SongCreationProvider>
      <CreateSongContent />
    </SongCreationProvider>
  );
}