import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletConnectionProvider } from './components/providers/WalletConnectionProvider'
import { BATCH_SIZE } from './constants/utils'
import { GameState } from './lib/localStorage'
import { getLatestPuzzleBatch } from './lib/utils'
import GuessWord from './pages/GuessWord'

function App() {
  let latestBatch = getLatestPuzzleBatch()
  if (latestBatch < 1) {
    latestBatch = 1
  }

  // TODO: Fetch the last visited puzzle for the given pubkey (if signed in) and
  // route to the latest of the first puzzle of the latest batch and the last
  // visited puzzle.
  const firstPuzzleOfBatch = (latestBatch - 1) * BATCH_SIZE + 1
  const defaultGameState = new GameState(null, firstPuzzleOfBatch)
  const puzzleId = Math.max(defaultGameState.onLastPuzzle, firstPuzzleOfBatch)

  return (
    <>
      <WalletConnectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GuessWord puzzleId={puzzleId} />} />
            <Route
              path="/puzzle/:puzzleId"
              element={<GuessWord puzzleId={-1} />}
            />
          </Routes>
        </BrowserRouter>
      </WalletConnectionProvider>
    </>
  )
}

export default App
