export interface RecordingSerialized {
  createdDate: Date;
  duration?: number;
  id: string;
  resolution?: number;
  state: "idle" | "starting" | "recording" | "stopping" | "stopped";
  targetDuration: number;
  thumbnail?: string;
  url: string;
}
