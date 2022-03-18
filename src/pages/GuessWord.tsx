import { useState, useEffect } from 'react'
import { Grid } from '../components/grid/Grid'
import { Keyboard } from '../components/keyboard/Keyboard'
import { InfoModal } from '../components/modals/InfoModal'
import { WIN_MESSAGES, NOT_ENOUGH_LETTERS_MESSAGE } from '../constants/strings'
import {
  MAX_WORD_LENGTH,
  MAX_CHALLENGES,
  REVEAL_TIME_MS,
  GAME_LOST_INFO_DELAY,
  WELCOME_INFO_MODAL_MS,
} from '../constants/settings'
import { isWinningWord, solution, unicodeLength } from '../lib/words'
import { loadStats } from '../lib/stats'
import {
  loadGameStateFromLocalStorage,
  saveGameStateToLocalStorage,
  getStoredIsHighContrastMode,
  GameState,
} from '../lib/localStorage'
import { default as GraphemeSplitter } from 'grapheme-splitter'

import '../App.css'
import { AlertContainer } from '../components/alerts/AlertContainer'
import { useAlert } from '../context/AlertContext'
import { Navbar } from '../components/navbar/Navbar'
import { Link, useParams } from 'react-router-dom'
import { NavigationModal } from '../components/modals/NavigationModal'
import axios from 'axios'
import { getLatestPuzzleBatch } from '../lib/utils'
import { BATCH_SIZE } from '../constants/utils'

interface GuessWordProps {
  puzzleId: number
}

function GuessWord({ puzzleId }: GuessWordProps) {
  let actualPuzzleId: number
  let paramPuzzleId = useParams().puzzleId
  if (paramPuzzleId) {
    actualPuzzleId = parseInt(paramPuzzleId)
  } else {
    actualPuzzleId = puzzleId
  }
  const prefersDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  let gameState = new GameState(null, actualPuzzleId)
  let lastResponses = gameState.loadGameState(actualPuzzleId)
  let solvedPuzzles = gameState.solvedPuzzles

  const { showError: showErrorAlert, showSuccess: showSuccessAlert } =
    useAlert()
  const [currentGuess, setCurrentGuess] = useState('')
  const [isGameWon, setIsGameWon] = useState(
    solvedPuzzles.includes(actualPuzzleId)
  )
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isSearchPuzzleModalOpen, setIsSearchPuzzleModalOpen] = useState(false)
  const [currentRowClass, setCurrentRowClass] = useState('')
  const [isGameLost, setIsGameLost] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme')
      ? localStorage.getItem('theme') === 'dark'
      : prefersDarkMode
      ? true
      : false
  )
  const [isHighContrastMode, setIsHighContrastMode] = useState(
    getStoredIsHighContrastMode()
  )
  const [isRevealing, setIsRevealing] = useState(false)
  const [guesses, setGuesses] = useState<string[]>(() => {
    if (!lastResponses) {
      return []
    }

    const guessList = lastResponses.guesses
    if (!isGameWon && guessList.length === MAX_CHALLENGES) {
      setIsGameLost(true)
    }

    return guessList
  })
  const [responses, setResponses] = useState<number[][]>(() => {
    if (!lastResponses) {
      return []
    }

    const newResponseList: number[][] = []
    const responseList = lastResponses.responses
    responseList.forEach((response) => {
      const responseArr = response.split('')
      const responseArrAsNums = responseArr.map((responseChar) =>
        parseInt(responseChar)
      )
      newResponseList.push(responseArrAsNums)
    })
    return newResponseList
  })

  const [stats, setStats] = useState(() => loadStats())

  const [isHardMode, setIsHardMode] = useState(
    localStorage.getItem('gameMode')
      ? localStorage.getItem('gameMode') === 'hard'
      : false
  )

  const resetState = () => {
    const puzzleId = actualPuzzleId
    gameState = new GameState(null, puzzleId)
    lastResponses = gameState.loadGameState(puzzleId)
    solvedPuzzles = gameState.solvedPuzzles

    setCurrentGuess('')
    setIsGameWon(solvedPuzzles.includes(puzzleId))
    setIsSearchPuzzleModalOpen(false)
    setCurrentRowClass('')
    setIsGameLost(false)
    setIsRevealing(false)
    setGuesses(() => {
      if (!lastResponses) {
        return []
      }
      const guessList = lastResponses.guesses
      if (!isGameWon && guessList.length >= MAX_CHALLENGES) {
        setIsGameLost(true)
      }
      return guessList
    })
    setResponses(() => {
      if (!lastResponses) {
        return []
      }

      const newResponseList: number[][] = []
      const responseList = lastResponses.responses
      responseList.forEach((response) => {
        const responseArr = response.split('')
        const responseArrAsNums = responseArr.map((responseChar) =>
          parseInt(responseChar)
        )
        newResponseList.push(responseArrAsNums)
      })
      return newResponseList
    })
  }

  useEffect(() => {
    resetState()
  }, [actualPuzzleId])

  useEffect(() => {
    // if no game state on load,
    // show the user the how-to info modal
    if (!loadGameStateFromLocalStorage()) {
      setTimeout(() => {
        setIsInfoModalOpen(true)
      }, WELCOME_INFO_MODAL_MS)
    }
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    if (isHighContrastMode) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [isDarkMode, isHighContrastMode])

  const handleDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  const clearCurrentRowClass = () => {
    setCurrentRowClass('')
  }

  useEffect(() => {
    saveGameStateToLocalStorage({ guesses, solution })
  }, [guesses])

  useEffect(() => {
    if (isGameWon) {
      const winMessage =
        WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)]
      const delayMs = REVEAL_TIME_MS * MAX_WORD_LENGTH

      showSuccessAlert(winMessage, {
        delayMs,
        onClose: () => setIsStatsModalOpen(true),
      })
    }

    if (isGameLost) {
      setTimeout(() => {
        setIsStatsModalOpen(true)
      }, GAME_LOST_INFO_DELAY)
    }
  }, [isGameWon, isGameLost, showSuccessAlert])

  const onChar = (value: string) => {
    if (
      unicodeLength(`${currentGuess}${value}`) <= MAX_WORD_LENGTH &&
      guesses.length < MAX_CHALLENGES &&
      !isGameWon
    ) {
      setCurrentGuess(`${currentGuess}${value}`)
    }
  }

  const onDelete = () => {
    setCurrentGuess(
      new GraphemeSplitter().splitGraphemes(currentGuess).slice(0, -1).join('')
    )
  }

  const convertResponseToStr = (response: number[]) => {
    const strArr = response.map((res) => res.toString())
    return strArr.join('')
  }

  const onEnter = async () => {
    const puzzleId = actualPuzzleId
    if (isGameWon || isGameLost) {
      return
    }

    if (!isGameWon && guesses.length >= MAX_CHALLENGES) {
      return showErrorAlert('Out of guesses!')
    }

    if (!(unicodeLength(currentGuess) === MAX_WORD_LENGTH)) {
      setCurrentRowClass('jiggle')
      return showErrorAlert(NOT_ENOUGH_LETTERS_MESSAGE, {
        onClose: clearCurrentRowClass,
      })
    }

    // Send the guess to the back end to get the response. Update the game state
    // and save to local storage.
    const config = {
      headers: { 'Content-Type': 'application/json' },
    }
    let res: number[] = []
    try {
      const postResponse = await axios.post(
        'https://wordsgame-89f98.uc.r.appspot.com/check-puzzle',
        {
          puzzleIndex: puzzleId,
          guess: currentGuess.toLowerCase(),
        },
        config
      )
      res = postResponse.data.guessResult
    } catch (e: any) {
      alert(e.message)
      setCurrentGuess('')
      return
    }

    setIsRevealing(true)
    // turn this back off after all
    // chars have been revealed
    setTimeout(() => {
      setIsRevealing(false)
    }, REVEAL_TIME_MS * MAX_WORD_LENGTH)

    const winningWord = isWinningWord(res)
    const allResponses = [...responses, res]
    const strResponses = allResponses.map((res) => convertResponseToStr(res))

    const gameResponses = {
      guesses: [...guesses, currentGuess],
      responses: strResponses,
    }
    gameState.saveGameState(puzzleId, gameResponses)
    if (winningWord) {
      gameState.updateSolvedPuzzles(puzzleId)
      gameState.saveSolvedPuzzles()
    }

    if (
      unicodeLength(currentGuess) === MAX_WORD_LENGTH &&
      guesses.length < MAX_CHALLENGES &&
      !isGameWon
    ) {
      // NOTE: Ordering is important here. We set the responses before the
      // guesses or CompletedRow will throw an error trying to show the
      // response.
      setResponses([...responses, res])
      setGuesses([...guesses, currentGuess])
      setCurrentGuess('')

      if (winningWord) {
        return setIsGameWon(true)
      }

      if (guesses.length === MAX_CHALLENGES - 1) {
        setIsGameLost(true)
        showErrorAlert('Out of guesses!')
      }
    }
  }

  const latestBatch = getLatestPuzzleBatch()
  const latestPuzzle = latestBatch * BATCH_SIZE
  const firstPuzzleOfBatch = (latestBatch - 1) * BATCH_SIZE + 1

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        titleText={`Puzzle #${actualPuzzleId}`}
        setIsInfoModalOpen={setIsInfoModalOpen}
        setIsStatsModalOpen={setIsStatsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        setIsSearchPuzzleModalOpen={setIsSearchPuzzleModalOpen}
      />
      <div className="pt-2 px-1 pb-8 md:max-w-7xl w-full mx-auto sm:px-6 lg:px-8 flex flex-col grow">
        <div className="pb-6 text-center text-white">
          Latest batch: {firstPuzzleOfBatch} - {latestPuzzle}
        </div>
        <div className="pb-6 text-center text-white text-decoration-line: underline">
          <Link to="/solved-puzzles">See all solved puzzles</Link>
        </div>
        <div className="pb-6 grow">
          <Grid
            guesses={guesses}
            responses={responses}
            currentGuess={currentGuess}
            isRevealing={isRevealing}
            currentRowClassName={currentRowClass}
          />
        </div>
        <Keyboard
          onChar={onChar}
          onDelete={onDelete}
          onEnter={onEnter}
          guesses={guesses}
          isRevealing={isRevealing}
        />
        <InfoModal
          isOpen={isInfoModalOpen}
          handleClose={() => setIsInfoModalOpen(false)}
        />
        <NavigationModal
          isOpen={isSearchPuzzleModalOpen}
          handleClose={() => setIsSearchPuzzleModalOpen(false)}
        />
        <AlertContainer />
      </div>
    </div>
  )
}

export default GuessWord
