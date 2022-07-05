import {
  RecorderState,
  RecorderActionTypes,
  SET_RECORDINGS,
  ADD_RECORDING,
  UPDATE_RECORDING,
  PROLONG_RECORDING,
  STOP_RECORDING,
  DELETE_RECORDING,
} from "./types";

const initialState: RecorderState = {
  recordings: [],
};

export function recorderReducer(
  state = initialState,
  action: RecorderActionTypes
): RecorderState {
  switch (action.type) {
    case SET_RECORDINGS:
      return { recordings: action.payload };
    case ADD_RECORDING:
      return { recordings: [...state.recordings, action.payload] };
    case UPDATE_RECORDING:
      return {
        recordings: state.recordings.map((item) =>
          item.id == action.payload.id ? { ...item, ...action.payload.update } : item
        )
      };
    case PROLONG_RECORDING:
      return {
        recordings: state.recordings.map((item) =>
          item.id == action.payload.id
            ? { ...item, targetDuration: item.targetDuration + action.payload.duration }
            : item
        )
      };
    case STOP_RECORDING:
      return {
        recordings: state.recordings.map((item) =>
          item.id == action.payload ? { ...item, state: "stopped" } : item
        )
      };
    case DELETE_RECORDING:
      return {
        recordings: state.recordings.filter((item) => item.id != action.payload)
      };
    default:
      return state;
  }
}
