import { Link, useNavigate } from 'react-router-dom'
import { BATCH_SIZE } from '../../constants/utils'
import { getLatestPuzzleBatch } from '../../lib/utils'
import { BaseModal } from './BaseModal'

type NavigationModalProps = {
  isOpen: boolean
  handleClose: () => void
}

export const NavigationModal = ({
  isOpen,
  handleClose,
}: NavigationModalProps) => {
  let navigate = useNavigate()

  const latestBatch = getLatestPuzzleBatch()
  const latestPuzzle = latestBatch * BATCH_SIZE

  const onSubmit = (e: any) => {
    e.preventDefault()
    const puzzleId = new FormData(e.target).get('goto-puzzle')
    navigate(`/puzzle/${puzzleId}`)
    handleClose()
  }

  return (
    <BaseModal title="Go to Puzzle" isOpen={isOpen} handleClose={handleClose}>
      <div className="mb-4">
        <form onSubmit={onSubmit}>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="goto-puzzle"
            name="goto-puzzle"
            type="text"
            placeholder=""
          />
          <button
            type="submit"
            className="mt-2 w-full rounded-md border border-transparent shadow-sm px-2 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          >
            GO
          </button>
        </form>
        <Link
          to={`/puzzle/${latestPuzzle}`}
          className="text-decoration-line: underline text-white"
        >
          Or, go to the latest puzzle
        </Link>
      </div>
    </BaseModal>
  )
}
