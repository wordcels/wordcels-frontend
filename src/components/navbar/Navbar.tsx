import {
  ChartBarIcon,
  CogIcon,
  InformationCircleIcon,
  SearchIcon,
} from '@heroicons/react/outline'
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'

type Props = {
  titleText: string
  setIsInfoModalOpen: (value: boolean) => void
  setIsStatsModalOpen: (value: boolean) => void
  setIsSettingsModalOpen: (value: boolean) => void
  setIsSearchPuzzleModalOpen: (value: boolean) => void
}

export const Navbar = ({
  titleText,
  setIsInfoModalOpen,
  setIsStatsModalOpen,
  setIsSettingsModalOpen,
  setIsSearchPuzzleModalOpen,
}: Props) => {
  return (
    <div className="navbar">
      <div className="navbar-content px-5">
        <div className="flex w-1/3">
          <InformationCircleIcon
            className="h-6 w-6 mr-3 cursor-pointer dark:stroke-white"
            onClick={() => setIsInfoModalOpen(true)}
          />
          <SearchIcon
            className="h-6 w-6 cursor-pointer dark:stroke-white"
            onClick={() => setIsSearchPuzzleModalOpen(true)}
          />
        </div>
        <div className="flex w-1/3 text-xl justify-center text-center font-bold dark:text-white">
          <p>{titleText}</p>
        </div>
        <div className="flex w-1/3 justify-end">
          <WalletModalProvider>
            <WalletMultiButton />
          </WalletModalProvider>
        </div>
      </div>
      <hr></hr>
    </div>
  )
}
