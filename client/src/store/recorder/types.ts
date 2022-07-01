import type { Recording } from "@types";

export const SET_RECORDINGS = "SET_RECORDINGS";
export const ADD_RECORDING = "ADD_RECORDING";
export const UPDATE_RECORDING = "UPDATE_RECORDING";
export const PROLONG_RECORDING = "PROLONG_RECORDING";
export const STOP_RECORDING = "STOP_RECORDING";
export const CLOSE_RECORDING = "CLOSE_RECORDING";

export interface RecorderState {
  recordings: Recording[];
}

interface setRecordingsAction {
  type: typeof SET_RECORDINGS;
  payload: Recording[];
}

interface addRecordingAction {
  type: typeof ADD_RECORDING;
  payload: Recording;
}

interface updateRecordingAction {
  type: typeof UPDATE_RECORDING;
  payload: {
    id: string;
    update: Partial<Recording>;
  };
}

interface prolongRecordingAction {
  type: typeof PROLONG_RECORDING;
  payload: {
    id: string;
    duration: number;
  };
}

interface stopRecordingAction {
  type: typeof STOP_RECORDING;
  payload: string;
}

interface closeRecordingAction {
  type: typeof CLOSE_RECORDING;
  payload: string;
}

export type RecorderActionTypes = setRecordingsAction
  | addRecordingAction
  | updateRecordingAction
  | prolongRecordingAction
  | stopRecordingAction
  | closeRecordingAction;
