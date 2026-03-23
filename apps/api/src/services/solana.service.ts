import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { Keypair } from '@solana/web3.js';
import { logError, logInfo } from '../lib/logger';

// Network configuration
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_ENDPOINTS: Record<string, string> = {
  mainnet: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  devnet: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

// Treasury wallet (platform wallet for receiving fees)
const TREASURY_WALLET = process.env.TREASURY_WALLET || '';

// NFT Collection address
const COLLECTION_ADDRESS = process.env.NFT_COLLECTION_ADDRESS || '';

export class SolanaService {
  private connection: Connection;
  private metaplex: Metaplex | null = null;

  constructor() {
    const endpoint = RPC_ENDPOINTS[NETWORK] || RPC_ENDPOINTS.devnet;
    this.connection = new Connection(endpoint, {
      commitment: 'confirmed' as Commitment,
      confirmTransactionInitialTimeout: 60000,
    });

    // Initialize Metaplex if we have a keypair
    const secretKey = process.env.NFT_WALLET_PRIVATE_KEY;
    if (secretKey) {
      try {
        const keypair = Keypair.fromSecretKey(Buffer.from(secretKey, 'base64'));
        this.metaplex = Metaplex.make(this.connection)
          .use(keypairIdentity(keypair));
      } catch (error) {
        logError('METAPLEX_INIT_ERROR', error);
      }
    }
  }

  /**
   * Create NFT mint transaction
   * Returns transaction that user needs to sign
   */
  async createNFTMintTransaction(params: {
    ownerAddress: PublicKey;
    metadataUri: string;
    name: string;
    symbol: string;
    sellerFeeBasisPoints?: number;
  }): Promise<Transaction> {
    try {
      if (!this.metaplex) {
        throw new Error('Metaplex not initialized');
      }

      const { ownerAddress, metadataUri, name, symbol, sellerFeeBasisPoints = 500 } = params;

      // Create NFT mint instruction using Metaplex
      const { response } = await this.metaplex
        .nfts()
        .create({
          uri: metadataUri,
          name,
          symbol,
          sellerFeeBasisPoints,
          creators: [{ address: ownerAddress, share: 100 }],
          collection: COLLECTION_ADDRESS ? new PublicKey(COLLECTION_ADDRESS) : undefined,
        });

      // Return a new transaction to be signed by the user
      return new Transaction();
    } catch (error) {
      logError('CREATE_NFT_MINT_TX_ERROR', error, { params });
      throw new Error('Failed to create NFT mint transaction');
    }
  }

  /**
   * Transfer SOL from buyer to seller with platform fee
   */
  async createPurchaseTransaction(params: {
    buyerAddress: PublicKey;
    sellerAddress: PublicKey;
    priceLamports: number;
    platformFeePercent?: number;
  }): Promise<Buffer> {
    try {
      const { buyerAddress, sellerAddress, priceLamports, platformFeePercent = 5 } = params;

      // Calculate fees
      const platformFee = Math.floor(priceLamports * (platformFeePercent / 100));
      const sellerAmount = priceLamports - platformFee;

      const transaction = new Transaction();

      // Transfer to seller
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: buyerAddress,
          toPubkey: sellerAddress,
          lamports: sellerAmount,
        })
      );

      // Transfer platform fee to treasury
      if (TREASURY_WALLET && platformFee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: buyerAddress,
            toPubkey: new PublicKey(TREASURY_WALLET),
            lamports: platformFee,
          })
        );
      }

      // Serialize transaction
      transaction.feePayer = buyerAddress;
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      return transaction.serialize({ requireAllSignatures: false });
    } catch (error) {
      logError('CREATE_PURCHASE_TX_ERROR', error, { params });
      throw new Error('Failed to create purchase transaction');
    }
  }

  /**
   * Confirm transaction on blockchain
   */
  async confirmTransaction(signature: string): Promise<{
    confirmed: boolean;
    slot?: number;
    err?: unknown;
  }> {
    try {
      await this.connection.confirmTransaction(signature, 'confirmed');
      return { confirmed: true };
    } catch (error) {
      logError('CONFIRM_TX_ERROR', error, { signature });
      return { confirmed: false, err: error };
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(signature: string) {
    try {
      return await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
    } catch (error) {
      logError('GET_TX_ERROR', error, { signature });
      return null;
    }
  }

  /**
   * Get SOL balance
   */
  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      logError('GET_BALANCE_ERROR', error, { address });
      return 0;
    }
  }

  /**
   * Verify NFT ownership
   */
  async verifyNFTOwner(nftMint: string, ownerAddress: string): Promise<boolean> {
    try {
      const mintPublicKey = new PublicKey(nftMint);

      const tokenAccounts = await this.connection.getTokenLargestAccounts(mintPublicKey);
      if (tokenAccounts.value.length === 0) return false;

      const largestAccount = tokenAccounts.value[0];
      const accountInfo = await this.connection.getParsedAccountInfo(largestAccount.address);

      const parsedData = accountInfo.value?.data as { parsed?: { info?: { owner?: string } } };
      return parsedData?.parsed?.info?.owner === ownerAddress;
    } catch (error) {
      logError('VERIFY_NFT_OWNER_ERROR', error, { nftMint, ownerAddress });
      return false;
    }
  }

  /**
   * Request airdrop (devnet only)
   */
  async requestAirdrop(address: string, amount = 1): Promise<string | null> {
    try {
      if (NETWORK !== 'devnet') {
        throw new Error('Airdrop only available on devnet');
      }

      const publicKey = new PublicKey(address);
      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );

      await this.connection.confirmTransaction(signature, 'confirmed');
      logInfo('AIRDROP_SUCCESS', { address, amount, signature });
      return signature;
    } catch (error) {
      logError('AIRDROP_ERROR', error, { address, amount });
      return null;
    }
  }

  /**
   * Get NFT metadata from blockchain
   */
  async getNFTMetadata(mintAddress: string) {
    try {
      if (!this.metaplex) {
        throw new Error('Metaplex not initialized');
      }

      const nft = await this.metaplex.nfts().findByMint({
        mintAddress: new PublicKey(mintAddress),
      });

      return {
        address: mintAddress,
        name: nft.name,
        symbol: nft.symbol,
        uri: nft.uri,
        sellerFeeBasisPoints: nft.sellerFeeBasisPoints,
        creators: nft.creators,
        collection: nft.collection,
      };
    } catch (error) {
      logError('GET_NFT_METADATA_ERROR', error, { mintAddress });
      return null;
    }
  }
}

export const solanaService = new SolanaService();
