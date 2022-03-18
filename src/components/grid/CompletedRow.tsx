import { getGuessStatuses } from '../../lib/statuses'
import { Cell } from './Cell'
import { unicodeSplit } from '../../lib/words'

type Props = {
  guess: string
  response: number[]
  isRevealing?: boolean
}

export const CompletedRow = ({ guess, response, isRevealing }: Props) => {
  // TODO: Replace this with response coming from the backend (probably pass in
  // as a prop).
  const statuses = getGuessStatuses(response)
  const splitGuess = unicodeSplit(guess)

  return (
    <div className="flex justify-center mb-1">
      {splitGuess.map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          position={i}
          isRevealing={isRevealing}
          isCompleted
        />
      ))}
    </div>
  )
}
