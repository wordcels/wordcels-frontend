import { ONE_DAY, START_BLOCK_TS } from '../constants/utils'

export function getLatestPuzzleBatch() {
  const now = Date.now() / 1000
  return (now - START_BLOCK_TS) / ONE_DAY + 1
}
