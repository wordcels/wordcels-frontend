import { FINAL_BATCH, ONE_DAY, START_BLOCK_TS } from '../constants/utils'

export function getLatestPuzzleBatch() {
  const now = Date.now() / 1000
  return Math.min(Math.floor((now - START_BLOCK_TS) / ONE_DAY + 1), FINAL_BATCH)
}
