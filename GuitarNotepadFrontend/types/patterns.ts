export interface Pattern {
  id: string;
  name: string;
  pattern: string;
  isFingerStyle: boolean;
  description?: string;
  createdByUserId: string;
  createdByNikName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePatternDto {
  name: string;
  pattern: string;
  isFingerStyle: boolean;
  description?: string;
}

export interface UpdatePatternDto {
  name?: string;
  pattern?: string;
  isFingerStyle?: boolean;
  description?: string;
}

export interface PatternFilters {
  name?: string;
  myPatternsOnly?: boolean;
  isFingerStyle?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedPattern {
  items: Pattern[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PatternFormData {
  name: string;
  pattern: string;
  isFingerStyle: boolean;
  description: string;
}

export interface ExtendedPatternFormData {
  name: string;
  description: string;
  isFingerStyle: boolean;
  strummingPattern: string;
  fingerStylePattern: string;
}

export interface PatternValidationErrors {
  name?: string;
  pattern?: string;
  description?: string;
  strummingPattern?: string;
  fingerStylePattern?: string;
  isFingerStyle?: string;
}

export interface FingerStylePatternFormData {
  name: string;
  pattern: string;
  isFingerStyle: boolean;
  description: string;
}

export type PatternFormField = keyof PatternFormData;
