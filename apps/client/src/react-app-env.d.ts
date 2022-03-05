/// <reference types="react-scripts" />

type History = UploadedFile | string;

interface UploadedFile {
  id: string;
  sender: string;
  file: File;
  size: number;
  status: UploadStatus;
  type: FileTransmitType;
}
