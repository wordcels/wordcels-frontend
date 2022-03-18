import { PublicKey } from '@solana/web3.js'

const gameStateKey = 'gameState'
const highContrastKey = 'highContrast'

type StoredGameState = {
  guesses: string[]
  solution: string
}

type GameResponses = {
  guesses: string[]
  responses: string[]
}

type SolvedList = {
  solvedIds: number[]
}

export class GameState {
  player: PublicKey | null
  onLastPuzzle: number
  solvedPuzzles: number[]

  constructor(player: PublicKey | null, latestPuzzle: number) {
    this.player = player
    const lastPuzzle = GameState.loadLastPuzzle(player ? player.toBase58() : '')
    this.onLastPuzzle = lastPuzzle ? parseInt(lastPuzzle) : latestPuzzle
    const solved = GameState.loadSolvedPuzzles(player)
    this.solvedPuzzles = solved ? solved.solvedIds : []
  }

  saveGameState(puzzleId: number, gameState: GameResponses) {
    localStorage.setItem(
      GameState.gameStateKey(this.player, puzzleId),
      JSON.stringify(gameState)
    )
  }

  loadGameState(puzzleId: number) {
    const gameData = localStorage.getItem(
      GameState.gameStateKey(this.player, puzzleId)
    )

    return gameData ? (JSON.parse(gameData) as GameResponses) : null
  }

  saveLastPuzzle(puzzleId: number) {
    let key = GameState.lastPuzzleKey(this.player ? this.player.toBase58() : '')
    localStorage.setItem(GameState.lastPuzzleKey(key), puzzleId.toString())
  }

  updateSolvedPuzzles(puzzleId: number) {
    if (this.solvedPuzzles.includes(puzzleId)) {
      return
    }
    this.solvedPuzzles.push(puzzleId)
  }

  saveSolvedPuzzles() {
    const solvedResponses: SolvedList = { solvedIds: this.solvedPuzzles }
    localStorage.setItem(
      GameState.solvedPuzzlesKey(this.player),
      JSON.stringify(solvedResponses)
    )
  }

  static loadSolvedPuzzles(key: PublicKey | null) {
    const solvedPuzzles = localStorage.getItem(GameState.solvedPuzzlesKey(key))
    return solvedPuzzles ? (JSON.parse(solvedPuzzles) as SolvedList) : null
  }

  static solvedPuzzlesKey(key: PublicKey | null) {
    let keyPortion = key ? key.toBase58() : ''
    return `solvedList_${keyPortion}`
  }

  static gameStateKey(key: PublicKey | null, puzzleId: number) {
    let keyPortion = key ? key.toBase58() : ''
    return `gameState_${puzzleId}_${keyPortion}`
  }

  static loadLastPuzzle(key: string) {
    return localStorage.getItem(GameState.lastPuzzleKey(key))
  }

  static lastPuzzleKey(key: string) {
    return `lastPuzzle_${key}`
  }
}

export const saveGameStateToLocalStorage = (gameState: StoredGameState) => {
  localStorage.setItem(gameStateKey, JSON.stringify(gameState))
}

export const loadGameStateFromLocalStorage = () => {
  const state = localStorage.getItem(gameStateKey)
  return state ? (JSON.parse(state) as StoredGameState) : null
}

const gameStatKey = 'gameStats'

export type GameStats = {
  winDistribution: number[]
  gamesFailed: number
  currentStreak: number
  bestStreak: number
  totalGames: number
  successRate: number
}

export const saveStatsToLocalStorage = (gameStats: GameStats) => {
  localStorage.setItem(gameStatKey, JSON.stringify(gameStats))
}

export const loadStatsFromLocalStorage = () => {
  const stats = localStorage.getItem(gameStatKey)
  return stats ? (JSON.parse(stats) as GameStats) : null
}

export const setStoredIsHighContrastMode = (isHighContrast: boolean) => {
  if (isHighContrast) {
    localStorage.setItem(highContrastKey, '1')
  } else {
    localStorage.removeItem(highContrastKey)
  }
}

export const getStoredIsHighContrastMode = () => {
  const highContrast = localStorage.getItem(highContrastKey)
  return highContrast === '1'
}
