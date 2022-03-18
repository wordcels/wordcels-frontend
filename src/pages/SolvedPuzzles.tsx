import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { InfoModal } from '../components/modals/InfoModal'
import { NavigationModal } from '../components/modals/NavigationModal'
import { Navbar } from '../components/navbar/Navbar'
import SolvedRow from '../components/solved/SolvedRow'
import { BATCH_SIZE } from '../constants/utils'
import { GameState } from '../lib/localStorage'
import { getLatestPuzzleBatch } from '../lib/utils'
import * as anchor from '@project-serum/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { PUZZLE_VAULTS } from '../constants/puzzleList'

function SolvedPuzzles() {
  const prefersDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  const [tokenAccounts, setTokenAccounts] = useState<(PublicKey | null)[]>([])
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme')
      ? localStorage.getItem('theme') === 'dark'
      : prefersDarkMode
      ? true
      : false
  )
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isSearchPuzzleModalOpen, setIsSearchPuzzleModalOpen] = useState(false)
  let latestBatch = getLatestPuzzleBatch()
  if (latestBatch < 1) {
    latestBatch = 1
  }
  const firstPuzzleOfBatch = (latestBatch - 1) * BATCH_SIZE + 1
  const latestPuzzle = latestBatch * BATCH_SIZE
  const gameState = new GameState(null, firstPuzzleOfBatch)
  const solvedPuzzles = gameState.solvedPuzzles

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const sortSolvedPuzzles = (puzzleIds: number[]) => {
    // NOTE: Can probably generate a dict here instead.
    const sortedIds = puzzleIds.sort((a, b) => a - b)
    const puzzlesSolved: string[][] = []
    let idsPtr = 0
    let puzzleBatch: string[] = []
    for (let i = 1; i <= latestPuzzle; i++) {
      if (idsPtr < sortedIds.length && sortedIds[idsPtr] === i) {
        const lastResponse = gameState.loadGameState(i)
        if (!lastResponse) {
          puzzleBatch.push('?')
          console.error('lastResponse not found! Was the localStorage cleared?')
        } else {
          puzzleBatch.push(
            lastResponse.guesses[lastResponse.guesses.length - 1]
          )
        }

        idsPtr++
      } else {
        puzzleBatch.push('?')
      }

      if (i % BATCH_SIZE === 0) {
        puzzlesSolved.push(puzzleBatch)
        puzzleBatch = []
      }
    }

    return puzzlesSolved
  }

  const vaults = solvedPuzzles.map(
    (idx) => new PublicKey(PUZZLE_VAULTS[idx - 1])
  )
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  useEffect(() => {
    const effect = async () => {
      if (!wallet) {
        return
      }
      const provider = new anchor.Provider(connection, wallet, {})
      const program = await anchor.Program.at(
        'ELP7c23X8MgeGZV3i2HxYz1bzFjcKpqApPVsCvUuaTN2',
        provider
      )
      const vaultInfos = await program.account.nftVaultInfo.fetchMultiple(
        vaults
      )
      const vaultTokenAccounts = vaultInfos.map((vaultInfo) =>
        // @ts-ignore
        vaultInfo ? vaultInfo.account : null
      )

      setTokenAccounts(vaultTokenAccounts)
    }

    effect()
  }, [wallet])

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        titleText="Solved Puzzles"
        setIsInfoModalOpen={setIsInfoModalOpen}
        setIsStatsModalOpen={() => {}}
        setIsSettingsModalOpen={() => {}}
        setIsSearchPuzzleModalOpen={setIsSearchPuzzleModalOpen}
      />
      <div className="pt-2 px-1 pb-8 md:max-w-7xl w-full mx-auto sm:px-6 lg:px-8 flex flex-col grow">
        <div className="pb-6 text-center text-white text-decoration-line: underline">
          <Link to="/">Back to latest batch</Link>
        </div>
        <div>
          {sortSolvedPuzzles(solvedPuzzles)
            .map((puzzleBatch, i) => (
              <SolvedRow
                words={puzzleBatch}
                batchId={i + 1}
                tokenAccounts={tokenAccounts}
              />
            ))
            .reverse()}
        </div>
        <InfoModal
          isOpen={isInfoModalOpen}
          handleClose={() => setIsInfoModalOpen(false)}
        />
        <NavigationModal
          isOpen={isSearchPuzzleModalOpen}
          handleClose={() => setIsSearchPuzzleModalOpen(false)}
        />
      </div>
    </div>
  )
}

export default SolvedPuzzles
