export interface Chord {
  id: string;
  name: string;
  fingering: string; 
  description?: string;
  createdByUserId: string;
  createdByNikName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateChordDto {
  name: string;
  fingering: string;
  description?: string;
}

export interface UpdateChordDto {
  name?: string;
  fingering?: string;
  description?: string;
}

export interface ChordFilters {
  name?: string;
  myChordsOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedChords {
  items: Chord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DistinctChordName {
  name: string;
  variationsCount: number;
  latestVariationDate: string;
}