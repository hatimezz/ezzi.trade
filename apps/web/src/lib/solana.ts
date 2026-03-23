/**
 * Solana Blockchain Integration
 * Connects frontend to smart contracts via backend API
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { api } from './api';

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

const RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

// Error types for better UX
export class SolanaError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'SolanaError';
  }
}

interface NFTMetadata {
  name: string;
  symbol: string;
  uri: string;
}

class SolanaService {
  private connection: Connection;
  private wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> } | null = null;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS], 'confirmed');
    this.wallet = null;
  }

  /**
   * Set connected wallet
   */
  setWallet(wallet: { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> }) {
    this.wallet = wallet;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.wallet !== null;
  }

  /**
   * Get connected wallet address
   */
  getWalletAddress(): string | null {
    return this.wallet?.publicKey?.toString() || null;
  }

  /**
   * Mint NFT - Full flow: create DB record + blockchain mint
   */
  async mintNFT({
    warriorId,
    rarity,
    metadataUri,
  }: {
    warriorId: string;
    rarity: string;
    metadataUri: string;
  }): Promise<{ signature: string; nft: unknown }> {
    if (!this.wallet) {
      throw new SolanaError('Wallet not connected', 'WALLET_NOT_CONNECTED');
    }

    try {
      // Step 1: Create mint transaction via backend
      const response = await api.post('/solana/nfts/mint', {
        warriorId,
        rarity,
        metadataUri,
        walletAddress: this.wallet.publicKey.toString(),
      });

      const { nft, transaction: transactionBase64 } = response.data.data;

      // Step 2: Deserialize transaction
      const transaction = Transaction.from(Buffer.from(transactionBase64, 'base64'));

      // Step 3: Sign with wallet
      const signed = await this.wallet.signTransaction(transaction);

      // Step 4: Send to blockchain
      const signature = await this.connection.sendRawTransaction(signed.serialize());

      // Step 5: Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      // Step 6: Confirm mint with backend
      await api.post('/solana/nfts/confirm', {
        signature,
        nftId: nft.id,
      });

      return { signature, nft };
    } catch (error) {
      if (error instanceof SolanaError) throw error;
      throw new SolanaError('Failed to mint NFT', 'MINT_FAILED', error);
    }
  }

  /**
   * Buy NFT from marketplace - Full flow with escrow
   */
  async buyNFT({
    listingId,
  }: {
    listingId: string;
  }): Promise<{ signature: string; escrowId: string }> {
    if (!this.wallet) {
      throw new SolanaError('Wallet not connected', 'WALLET_NOT_CONNECTED');
    }

    try {
      // Step 1: Create escrow via backend
      const escrowResponse = await api.post('/escrow/create', {
        listingId,
      });

      const { transaction: transactionBase64, escrowId } = escrowResponse.data.data;

      // Step 2: Deserialize transaction
      const transaction = Transaction.from(Buffer.from(transactionBase64, 'base64'));

      // Step 3: Sign with wallet
      const signed = await this.wallet.signTransaction(transaction);

      // Step 4: Send to blockchain
      const signature = await this.connection.sendRawTransaction(signed.serialize());

      // Step 5: Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      // Step 6: Confirm escrow with backend
      await api.post('/escrow/confirm', {
        escrowId,
        signature,
        listingId,
      });

      return { signature, escrowId };
    } catch (error) {
      if (error instanceof SolanaError) throw error;
      throw new SolanaError('Failed to buy NFT', 'PURCHASE_FAILED', error);
    }
  }

  /**
   * Get NFT metadata from blockchain (via backend)
   */
  async getNFTMetadata(mintAddress: string): Promise<NFTMetadata | null> {
    try {
      const response = await api.get(`/solana/nfts/metadata/${mintAddress}`);
      return response.data.data;
    } catch {
      return null;
    }
  }

  /**
   * Get SOL balance
   */
  async getSolBalance(walletAddress?: string): Promise<number> {
    try {
      const address = walletAddress || this.wallet?.publicKey?.toString();
      if (!address) return 0;

      const response = await api.get(`/solana/nfts/balance/${address}`);
      return response.data.data.balance;
    } catch {
      return 0;
    }
  }

  /**
   * Request airdrop (devnet only)
   */
  async requestAirdrop(amount: number = 1): Promise<string> {
    if (!this.wallet) {
      throw new SolanaError('Wallet not connected', 'WALLET_NOT_CONNECTED');
    }

    try {
      const response = await api.post('/solana/nfts/airdrop', {
        address: this.wallet.publicKey.toString(),
        amount,
      });

      return response.data.data.signature;
    } catch (error) {
      throw new SolanaError('Airdrop failed', 'AIRDROP_FAILED', error);
    }
  }

  /**
   * Verify NFT ownership
   */
  async verifyNFTOwner(mintAddress: string, ownerAddress?: string): Promise<boolean> {
    try {
      const address = ownerAddress || this.wallet?.publicKey?.toString();
      if (!address) return false;

      const response = await api.post('/solana/marketplace/verify-ownership', {
        mintAddress,
        ownerAddress: address,
      });

      return response.data.data.isOwner;
    } catch {
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.wallet = null;
  }
}

export const solana = new SolanaService();
