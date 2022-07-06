import type { Recording } from "@types";
import {
  RecorderActionTypes,
  SET_RECORDINGS,
  ADD_RECORDING,
  UPDATE_RECORDING,
  PROLONG_RECORDING,
  STOP_RECORDING,
  DELETE_RECORDING,
} from "./types";
import { Dispatch } from "redux";
import { nanoid } from "nanoid";
import { getRecordingName } from "@utils";

import { API_BASE_URL } from "@constants";

export function fetchRecordings() {
  return async (dispatch: Dispatch<RecorderActionTypes>) => {
    const res = await fetch(`${API_BASE_URL}/recordings`);
    const recordings = await res.json();
    dispatch(setRecordings(recordings));
  };
}

export function createRecording(url: string, duration: number, resolution: number) {
  return async (dispatch: Dispatch<RecorderActionTypes>) => {
    const tmpId = nanoid();
    const tmpRecording: Recording = {
      createdDate: Date.now(),
      id: tmpId,
      state: "idle",
      targetDuration: duration,
      url,
    };

    dispatch(addRecording(tmpRecording));

    const res = await fetch(`${API_BASE_URL}/recordings`, {
      method: "POST",
      body: JSON.stringify({
        duration,
        name: getRecordingName(url),
        resolution,
        url,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const recording = await res.json();
    dispatch(updateRecording(tmpId, recording))
  }
}

export function setRecordings(recordings: Recording[]): RecorderActionTypes {
  return {
    type: SET_RECORDINGS,
    payload: recordings
  };
}

export function addRecording(recording: Recording): RecorderActionTypes {
  return {
    type: ADD_RECORDING,
    payload: recording
  };
}

export function updateRecording(id: string, update: Partial<Recording>): RecorderActionTypes {
  return {
    type: UPDATE_RECORDING,
    payload: {
      id,
      update
    }
  };
}

export function prolongRecording(id: string, duration: number) {
  return (dispatch: Dispatch<RecorderActionTypes>) => {
    dispatch({
      type: PROLONG_RECORDING,
      payload: {
        id,
        duration
      }
    });
    fetch(`${API_BASE_URL}/recordings/${id}/prolong?duration=${duration}`, {
      method: "PUT",
    });
  }
}

export function stopRecording(id: string) {
  return (dispatch: Dispatch<RecorderActionTypes>) => {
    dispatch({
      type: STOP_RECORDING,
      payload: id
    });
    fetch(`${API_BASE_URL}/recordings/${id}/stop`, {
      method: "PUT",
    });
  }
}

export function deleteRecording(id: string) {
  return (dispatch: Dispatch<RecorderActionTypes>) => {
    dispatch({
      type: DELETE_RECORDING,
      payload: id
    });
    fetch(`${API_BASE_URL}/recordings/${id}`, {
      method: "DELETE",
    });
  }
}
