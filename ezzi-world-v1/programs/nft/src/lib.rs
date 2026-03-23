use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_spl::metadata::{create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, Metadata, MetadataAccount};

// Program ID
// Replace with your deployed program ID
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod ezzi_nft {
    use super::*;

    /// Initialize the NFT collection
    pub fn initialize_collection(
        ctx: Context<InitializeCollection>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        collection.authority = ctx.accounts.authority.key();
        collection.mint = ctx.accounts.mint.key();
        collection.name = name.clone();
        collection.symbol = symbol.clone();
        collection.uri = uri;
        collection.total_supply = 0;
        collection.max_supply = 2300;

        msg!("Collection initialized: {}", name);
        Ok(())
    }

    /// Mint a new NFT
    pub fn mint_nft(
        ctx: Context<MintNFT>,
        warrior_id: String,
        rarity: String,
        stats: WarriorStats,
    ) -> Result<()> {
        let collection = &mut ctx.accounts.collection;

        // Check supply limit
        require!(
            collection.total_supply < collection.max_supply,
            ErrorCode::MaxSupplyReached
        );

        // Create metadata
        let name = format!("{} #{}", collection.name, collection.total_supply + 1);
        let symbol = collection.symbol.clone();
        let uri = format!("{}/{}", collection.uri, warrior_id);

        let data = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 500, // 5% royalty
            creators: Some(vec![anchor_spl::metadata::state::Creator {
                address: collection.authority,
                verified: true,
                share: 100,
            }]),
            collection: None,
            uses: None,
        };

        // Create metadata accounts
        create_metadata_accounts_v3(
            CpiContext::new(
                ctx.accounts.token_metadata_program.to_account_info(),
                anchor_spl::metadata::CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.mint_authority.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    update_authority: ctx.accounts.update_authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            data,
            true,
            true,
            None,
        )?;

        // Mint token to user
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            1,
        )?;

        // Update collection stats
        collection.total_supply += 1;

        // Store NFT data
        let nft_data = &mut ctx.accounts.nft_data;
        nft_data.owner = ctx.accounts.payer.key();
        nft_data.warrior_id = warrior_id;
        nft_data.rarity = rarity;
        nft_data.stats = stats;
        nft_data.mint = ctx.accounts.mint.key();
        nft_data.durability = 100;
        nft_data.sale_count = 0;

        msg!("NFT minted: {}", ctx.accounts.mint.key());
        Ok(())
    }

    /// Transfer NFT
    pub fn transfer_nft(ctx: Context<TransferNFT>) -> Result<()> {
        // Update NFT data owner
        let nft_data = &mut ctx.accounts.nft_data;
        nft_data.owner = ctx.accounts.to.key();
        nft_data.sale_count += 1;

        // Transfer token
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.from_authority.to_account_info(),
                },
            ),
            1,
        )?;

        msg!("NFT transferred");
        Ok(())
    }

    /// Repair NFT durability
    pub fn repair_nft(ctx: Context<RepairNFT>, amount: u8) -> Result<()> {
        let nft_data = &mut ctx.accounts.nft_data;

        // Cost: 10 EZZI per 10% durability
        let cost = (amount / 10) * 10;

        // Verify payment (in real implementation, transfer EZZI tokens)
        // transfer_ezzi_tokens(...)?;

        nft_data.durability = std::cmp::min(nft_data.durability + amount, 100);

        msg!("NFT repaired: {}% durability", nft_data.durability);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Collection::SIZE
    )]
    pub collection: Account<'info, Collection>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub collection: Account<'info, Collection>,

    /// CHECK: Metaplex metadata account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        space = 8 + NFTData::SIZE
    )]
    pub nft_data: Account<'info, NFTData>,

    /// CHECK: Mint authority (PDA)
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    /// CHECK: Update authority
    #[account(seeds = [b"update_authority"], bump)]
    pub update_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferNFT<'info> {
    #[account(mut)]
    pub from_authority: Signer<'info>,

    #[account(
        mut,
        constraint = from.owner == from_authority.key()
    )]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    #[account(mut)]
    pub nft_data: Account<'info, NFTData>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RepairNFT<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = nft_data.owner == owner.key()
    )]
    pub nft_data: Account<'info, NFTData>,
}

#[account]
pub struct Collection {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub total_supply: u16,
    pub max_supply: u16,
}

impl Collection {
    pub const SIZE: usize = 32 + 32 + 100 + 20 + 200 + 2 + 2;
}

#[account]
pub struct NFTData {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub warrior_id: String,
    pub rarity: String,
    pub stats: WarriorStats,
    pub durability: u8,
    pub sale_count: u16,
}

impl NFTData {
    pub const SIZE: usize = 32 + 32 + 50 + 20 + WarriorStats::SIZE + 1 + 2;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct WarriorStats {
    pub attack: u8,
    pub defense: u8,
    pub speed: u8,
    pub magic: u8,
    pub mining_rate: u8,
}

impl WarriorStats {
    pub const SIZE: usize = 5;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Maximum supply reached")]
    MaxSupplyReached,
    #[msg("Invalid rarity")]
    InvalidRarity,
    #[msg("Invalid warrior ID")]
    InvalidWarriorId,
    #[msg("NFT not owned")]
    NotOwned,
    #[msg("Durability already full")]
    DurabilityFull,
}
