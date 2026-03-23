/**
 * Solana Blockchain Integration
 * Connects frontend to smart contracts
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { api } from './api';

// Program IDs (replace with deployed addresses)
const PROGRAM_IDS = {
  nft: process.env.NEXT_PUBLIC_NFT_PROGRAM_ID || 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID || 'HjrMEZ7aWLFrX7t1L9p1Q7JkG1f7b7r9q7Y9Z9p9k9p9',
  token: process.env.NEXT_PUBLIC_TOKEN_PROGRAM_ID || 'ToKLxTk67d7b7r9q7Y9Z9p9k9p9k9p9k9p9k9p9k9p9',
};

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

class SolanaService {
  private connection: Connection;
  private provider: any;
  private wallet: any;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS], 'confirmed');
  }

  setWallet(wallet: any) {
    this.wallet = wallet;
    this.provider = new AnchorProvider(
      this.connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
  }

  // Get NFT metadata from blockchain
  async getNFTMetadata(mintAddress: string) {
    try {
      const mintPublicKey = new PublicKey(mintAddress);

      // Get token account info
      const tokenAccount = await this.connection.getTokenLargestAccounts(mintPublicKey);
      const accountInfo = await this.connection.getParsedAccountInfo(tokenAccount.value[0].address);

      // Get metadata from Metaplex
      const metadataAccount = await this.findMetadataAccount(mintPublicKey);
      const metadata = await this.connection.getAccountInfo(metadataAccount);

      return {
        mint: mintAddress,
        owner: accountInfo.value?.data?.parsed?.info?.owner,
        metadata: metadata ? this.decodeMetadata(metadata.data) : null,
      };
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return null;
    }
  }

  // Mint NFT on blockchain
  async mintNFT({
    warriorId,
    rarity,
    metadataUri,
  }: {
    warriorId: string;
    rarity: string;
    metadataUri: string;
  }) {
    if (!this.provider || !this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      // Call backend to get transaction
      const response = await api.post('/nfts/mint', {
        warriorId,
        rarity,
        metadataUri,
      });

      const { transaction: transactionBase64 } = response.data.data;

      // Deserialize and sign transaction
      const transaction = Transaction.from(Buffer.from(transactionBase64, 'base64'));

      // Sign with wallet
      const signed = await this.wallet.signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(signed.serialize());

      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        signature,
        success: true,
      };
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      throw error;
    }
  }

  // Buy NFT from marketplace
  async buyNFT({
    listingId,
    price,
    seller,
  }: {
    listingId: string;
    price: number;
    seller: string;
  }) {
    if (!this.provider || !this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const walletPublicKey = new PublicKey(this.wallet.publicKey);
      const sellerPublicKey = new PublicKey(seller);
      const priceLamports = price * LAMPORTS_PER_SOL;

      // Create transaction
      const transaction = new Transaction();

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: sellerPublicKey,
          lamports: priceLamports,
        })
      );

      // Sign and send
      const signed = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signed.serialize());

      await this.connection.confirmTransaction(signature, 'confirmed');

      // Confirm with backend
      await api.post('/marketplace/buy', {
        listingId,
        txHash: signature,
      });

      return {
        signature,
        success: true,
      };
    } catch (error) {
      console.error('Failed to buy NFT:', error);
      throw error;
    }
  }

  // Get EZZI token balance
  async getEZZIBalance(walletAddress: string) {
    try {
      const publicKey = new PublicKey(walletAddress);

      // Get all token accounts
      const accounts = await this.connection.getTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      // Find EZZI token account
      // This is simplified - in real implementation, filter by mint
      const ezziAccount = accounts.value[0];

      if (!ezziAccount) {
        return 0;
      }

      // Parse account data
      const data = Buffer.from(ezziAccount.account.data);
      const amount = data.readBigUInt64LE(64); // Token account data layout

      return Number(amount) / 1_000_000_000; // Adjust for decimals
    } catch (error) {
      console.error('Failed to get EZZI balance:', error);
      return 0;
    }
  }

  // Send EZZI tokens
  async sendEZZI({
    recipient,
    amount,
  }: {
    recipient: string;
    amount: number;
  }) {
    if (!this.provider || !this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      // Implementation depends on SPL token program
      // This is a placeholder
      console.log(`Sending ${amount} EZZI to ${recipient}`);

      // In real implementation:
      // 1. Create SPL token transfer instruction
      // 2. Sign and send transaction

      return {
        signature: 'dummy-signature',
        success: true,
      };
    } catch (error) {
      console.error('Failed to send EZZI:', error);
      throw error;
    }
  }

  // Helper: Find Metaplex metadata account
  private async findMetadataAccount(mint: PublicKey): Promise<PublicKey> {
    const seeds = [
      Buffer.from('metadata'),
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
      mint.toBuffer(),
    ];

    const [metadataAccount] = await PublicKey.findProgramAddress(
      seeds,
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );

    return metadataAccount;
  }

  // Helper: Decode metadata
  private decodeMetadata(data: Buffer): any {
    // Simplified - real implementation uses Metaplex decoder
    return {
      name: 'NFT Name',
      symbol: 'EZZI',
      uri: 'https://nft.ezzi.trade/metadata.json',
    };
  }

  // Get wallet SOL balance
  async getSolBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      return 0;
    }
  }

  // Request airdrop (devnet only)
  async requestAirdrop(walletAddress: string, amount: number = 1) {
    if (NETWORK !== 'devnet') {
      throw new Error('Airdrop only available on devnet');
    }

    try {
      const publicKey = new PublicKey(walletAddress);
      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );

      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        signature,
        success: true,
      };
    } catch (error) {
      console.error('Failed to request airdrop:', error);
      throw error;
    }
  }
}

export const solana = new SolanaService();
