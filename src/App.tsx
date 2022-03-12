import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletConnectionProvider } from './components/providers/WalletConnectionProvider'
import GuessWord from './pages/GuessWord'

function App() {
  return (
    <>
      <WalletConnectionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GuessWord />} />
          </Routes>
        </BrowserRouter>
      </WalletConnectionProvider>
    </>
  )
}

export default App
