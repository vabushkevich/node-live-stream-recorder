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
    fetch(`${API_BASE_URL}/recordings`)
      .then((res) => res.json())
      .then((recordings) => dispatch(setRecordings(recordings)));
  };
}

export function createRecording(url: string, duration: number, resolution: number) {
  return (dispatch: Dispatch<RecorderActionTypes>) => {
    const tmpId = nanoid();
    const tmpRecording: Recording = {
      createdDate: Date.now(),
      id: tmpId,
      state: "idle",
      targetDuration: duration,
      url,
    };

    dispatch(addRecording(tmpRecording));

    fetch(`${API_BASE_URL}/recordings`, {
      method: "POST",
      body: JSON.stringify({
        duration,
        name: getRecordingName(url),
        resolution,
        url,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((recording) => {
        dispatch(updateRecording(tmpId, recording))
      });
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
