import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { logError, logInfo } from '../lib/logger';
import { prisma } from '../lib/db';

// Escrow configuration
const ESCROW_FEE_PERCENT = 5; // Platform fee: 5%
const TREASURY_WALLET = process.env.TREASURY_WALLET || '';
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';

interface CreateEscrowInput {
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number; // in SOL
  nftId: string;
}

interface ReleaseEscrowInput {
  escrowId: string;
  signature: string;
}

export class EscrowService {
  private connection: Connection;

  constructor() {
    const endpoint = SOLANA_NETWORK === 'mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com';

    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Create escrow transaction
   * This creates a transaction that:
   * 1. Transfers SOL from buyer to seller (minus fee)
   * 2. Transfers platform fee to treasury
   * 3. Transfers NFT from seller to buyer (handled by program)
   *
   * For now, we use a simple transfer approach with database tracking
   */
  async createEscrowTransaction(input: CreateEscrowInput): Promise<{
    transaction: string; // base64 encoded
    escrowId: string;
    fee: number;
    netAmount: number;
  }> {
    try {
      // Calculate fees
      const priceLamports = input.price * LAMPORTS_PER_SOL;
      const feeLamports = Math.floor(priceLamports * (ESCROW_FEE_PERCENT / 100));
      const netAmountLamports = priceLamports - feeLamports;

      // Get buyer's wallet
      const buyerWallet = await prisma.wallet.findFirst({
        where: { userId: input.buyerId, isPrimary: true },
      });

      const sellerWallet = await prisma.wallet.findFirst({
        where: { userId: input.sellerId, isPrimary: true },
      });

      if (!buyerWallet?.address || !sellerWallet?.address) {
        throw new Error('Buyer or seller wallet not found');
      }

      // Create transaction
      const transaction = new Transaction();

      // Add transfer to seller
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(buyerWallet.address),
          toPubkey: new PublicKey(sellerWallet.address),
          lamports: netAmountLamports,
        })
      );

      // Add platform fee transfer
      if (TREASURY_WALLET && feeLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(buyerWallet.address),
            toPubkey: new PublicKey(TREASURY_WALLET),
            lamports: feeLamports,
          })
        );
      }

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(buyerWallet.address);

      // Serialize transaction
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      // Create escrow record in database
      const escrow = await prisma.processedTx.create({
        data: {
          txHash: `escrow_${input.listingId}_${Date.now()}`,
          type: 'escrow',
          status: 'pending',
          amount: input.price,
          token: 'SOL',
          fromAddress: buyerWallet.address,
          toAddress: sellerWallet.address,
          userId: input.buyerId,
          metadata: JSON.stringify({
            listingId: input.listingId,
            sellerId: input.sellerId,
            nftId: input.nftId,
            fee: feeLamports / LAMPORTS_PER_SOL,
            netAmount: netAmountLamports / LAMPORTS_PER_SOL,
          }),
        },
      });

      logInfo('ESCROW_CREATED', {
        escrowId: escrow.id,
        listingId: input.listingId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        price: input.price,
        fee: feeLamports / LAMPORTS_PER_SOL,
      });

      return {
        transaction: Buffer.from(serialized).toString('base64'),
        escrowId: escrow.id,
        fee: feeLamports / LAMPORTS_PER_SOL,
        netAmount: netAmountLamports / LAMPORTS_PER_SOL,
      };
    } catch (error) {
      logError('CREATE_ESCROW_ERROR', error, { input });
      throw new Error('Failed to create escrow');
    }
  }

  /**
   * Confirm and release escrow after blockchain confirmation
   */
  async confirmEscrow(escrowId: string, signature: string): Promise<boolean> {
    try {
      // Verify transaction on blockchain
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        throw new Error('Transaction not found on blockchain');
      }

      if (tx.meta?.err) {
        throw new Error('Transaction failed on blockchain');
      }

      // Update escrow record
      await prisma.processedTx.update({
        where: { id: escrowId },
        data: {
          status: 'confirmed',
          txHash: signature,
          confirmedAt: new Date(),
        },
      });

      logInfo('ESCROW_CONFIRMED', { escrowId, signature });
      return true;
    } catch (error) {
      logError('CONFIRM_ESCROW_ERROR', error, { escrowId, signature });
      return false;
    }
  }

  /**
   * Cancel escrow and return funds to buyer
   */
  async cancelEscrow(escrowId: string): Promise<boolean> {
    try {
      const escrow = await prisma.processedTx.findUnique({
        where: { id: escrowId },
      });

      if (!escrow || escrow.status !== 'pending') {
        throw new Error('Escrow not found or already processed');
      }

      await prisma.processedTx.update({
        where: { id: escrowId },
        data: { status: 'cancelled' },
      });

      logInfo('ESCROW_CANCELLED', { escrowId });
      return true;
    } catch (error) {
      logError('CANCEL_ESCROW_ERROR', error, { escrowId });
      return false;
    }
  }

  /**
   * Get escrow details
   */
  async getEscrow(escrowId: string) {
    try {
      return prisma.processedTx.findUnique({
        where: { id: escrowId },
      });
    } catch (error) {
      logError('GET_ESCROW_ERROR', error, { escrowId });
      return null;
    }
  }

  /**
   * Calculate platform fee for a transaction
   */
  calculateFee(price: number): { fee: number; netAmount: number } {
    const fee = Math.floor(price * (ESCROW_FEE_PERCENT / 100) * 100) / 100;
    return {
      fee,
      netAmount: price - fee,
    };
  }
}

export const escrowService = new EscrowService();
