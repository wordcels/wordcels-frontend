import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import * as anchor from '@project-serum/anchor'
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js'
import { PUZZLE_VAULTS } from '../../constants/puzzleList'
import {
  getAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { VAULT_FUNDS } from '../../constants/utils'

interface SolvedWordProps {
  word: string
  index: number
  tokenAccount: PublicKey | null
}

function createAssociatedTokenAccountInstruction(
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
) {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ]
  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  })
}

function SolvedWord({ word, index, tokenAccount }: SolvedWordProps) {
  const { publicKey: walletKey } = useWallet()
  const wallet = useAnchorWallet()
  const { connection } = useConnection()
  const [isLoading, setIsLoading] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)

  useEffect(() => {
    if (!tokenAccount) {
      return
    }

    const getClaimed = async () => {
      const tokenAccountInfo = await getAccount(connection, tokenAccount)
      if (!tokenAccountInfo || tokenAccountInfo.amount < 1) {
        setIsClaimed(true)
      }
    }

    getClaimed()
  }, [tokenAccount])

  const onClick = async (e: any) => {
    e.preventDefault()
    if (!wallet) {
      throw new Error('Not connected to wallet!')
    }
    setIsLoading(true)
    try {
      const provider = new anchor.Provider(connection, wallet, {})
      const program = await anchor.Program.at(
        'ELP7c23X8MgeGZV3i2HxYz1bzFjcKpqApPVsCvUuaTN2',
        provider
      )
      const [globalState] = await PublicKey.findProgramAddress(
        [Buffer.from('global')],
        program.programId
      )
      const nftVaultKey = new PublicKey(PUZZLE_VAULTS[index - 1])
      const nftVaultInfo = await program.account.nftVaultInfo.fetch(nftVaultKey)
      const tokenAccount = nftVaultInfo.account
      const tokenAccountInfo = await getAccount(connection, tokenAccount)

      const [userTokenAccountAddress] = await PublicKey.findProgramAddress(
        [
          provider.wallet.publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenAccountInfo.mint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      )

      const userTokenAccountInfo = await connection.getAccountInfo(
        userTokenAccountAddress
      )
      const ixs = []
      if (!userTokenAccountInfo) {
        ixs.push(
          createAssociatedTokenAccountInstruction(
            userTokenAccountAddress,
            provider.wallet.publicKey,
            provider.wallet.publicKey,
            tokenAccountInfo.mint
          )
        )
      }

      const vaultFunds = new PublicKey(VAULT_FUNDS)

      await program.rpc.unlockNftWithHash(
        {
          word: word.toLowerCase(),
        },
        {
          accounts: {
            nftVault: nftVaultKey,
            globalState,
            nftTokenAccount: tokenAccount,
            userTokenAccount: userTokenAccountAddress,
            vaultFunds: vaultFunds,
            tokenProgram: TOKEN_PROGRAM_ID,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          },
          preInstructions: ixs,
        }
      )

      setIsClaimed(true)
    } catch (err) {
      console.log(err)
      alert(err)
    } finally {
      setIsLoading(false)
    }
  }

  const disabled = word === '?'
  return (
    <div className="text-center">
      <div className="py-8">{word}</div>
      <button
        className="mt-2 rounded-md border border-transparent shadow-sm px-2 py-3 bg-indigo-600 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
        disabled={isLoading || disabled || !wallet || !walletKey || isClaimed}
        onClick={onClick}
      >
        {isLoading ? 'Processing...' : isClaimed ? 'Claimed' : 'Claim'}
      </button>
    </div>
  )
}

export default SolvedWord
