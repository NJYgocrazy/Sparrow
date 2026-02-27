// src/scale/point.js

import { createBand } from "./band";

export function createPoint(options) {
  return createBand({ ...options, padding: 1 });
}
