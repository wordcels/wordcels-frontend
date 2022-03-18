import { PublicKey } from '@solana/web3.js'
import { BATCH_SIZE } from '../../constants/utils'
import { GameState } from '../../lib/localStorage'
import { getLatestPuzzleBatch } from '../../lib/utils'
import SolvedWord from './SolvedWord'

interface SolvedRowProps {
  words: string[]
  batchId: number
  tokenAccounts: (PublicKey | null)[]
}

function SolvedRow({ words, batchId, tokenAccounts }: SolvedRowProps) {
  let latestBatch = getLatestPuzzleBatch()
  if (latestBatch < 1) {
    latestBatch = 1
  }
  const firstPuzzleOfBatch = (latestBatch - 1) * BATCH_SIZE + 1
  const gameState = new GameState(null, firstPuzzleOfBatch)
  const solvedPuzzles = gameState.solvedPuzzles
  const puzzleIdToTokenAccount: { [key: number]: PublicKey | null } = {}
  solvedPuzzles.forEach((puzzleId, i) => {
    puzzleIdToTokenAccount[puzzleId] = tokenAccounts[i]
  })

  console.log(puzzleIdToTokenAccount)

  return (
    <div className="py-8 text-white">
      <div className="text-center">
        Puzzles {BATCH_SIZE * (batchId - 1) + 1} - {batchId * BATCH_SIZE}{' '}
      </div>
      <div className="grid grid-cols-6">
        {words.map((word, i) => (
          <SolvedWord
            word={word}
            index={i + BATCH_SIZE * (batchId - 1) + 1}
            tokenAccount={
              puzzleIdToTokenAccount[i + BATCH_SIZE * (batchId - 1) + 1]
            }
          />
        ))}
      </div>
    </div>
  )
}

export default SolvedRow
