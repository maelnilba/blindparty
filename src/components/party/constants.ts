import { ONE_SECOND_IN_MS } from "lib/helpers/date";

export const VIEW_SCORE_MS =
  process.env.NODE_ENV === "production"
    ? 10 * ONE_SECOND_IN_MS
    : 10 * ONE_SECOND_IN_MS;
export const GUESS_MS =
  process.env.NODE_ENV === "production"
    ? 30 * ONE_SECOND_IN_MS
    : 30 * ONE_SECOND_IN_MS;
export const TRACK_TIMER_MS =
  process.env.NODE_ENV === "production"
    ? 5 * ONE_SECOND_IN_MS
    : 5 * ONE_SECOND_IN_MS;
