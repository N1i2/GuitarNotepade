import { SongDto } from "@/types/songs";

export interface SongDetailDto extends SongDto {
  segments?: Array<{
    segmentData: {
      type: string;
      lyric?: string;
      chordId?: string;
      patternId?: string;
      duration?: number;
      description?: string;
      color?: string;
      backgroundColor?: string;
      chord?: {
        id: string;
        name: string;
        fingering: string;
        description?: string;
      };
      pattern?: {
        id: string;
        name: string;
        pattern: string;
        isFingerStyle: boolean;
        description?: string;
      };
    };
    positionIndex: number;
    repeatGroup?: string;
  }>;
  
  comments?: Array<{
    id: string;
    songId: string;
    segmentId?: string;
    text: string;
    createdAt: string;
    userId?: string;
    userName?: string;
  }>;
}