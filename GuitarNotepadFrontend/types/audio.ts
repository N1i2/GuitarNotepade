export enum AudioInputType {
  NONE = "none",
  FILE = "file",
  URL = "url",
  RECORD = "record",
}

export interface AudioInputData {
  type: AudioInputType;
  file?: File;
  url?: string;
  audioBlob?: Blob;
  fileName?: string;
  customAudioUrl?: string;
  customAudioType?: string;
}
