use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

// Program ID
declare_id!("HjrMEZ7aWLFrX7t1L9p1Q7JkG1f7b7r9q7Y9Z9p9k9p9");

#[program]
pub mod ezzi_marketplace {
    use super::*;

    /// Initialize marketplace
    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        fee_percentage: u16,
    ) -> Result<()> {
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.authority = ctx.accounts.authority.key();
        marketplace.fee_percentage = fee_percentage;
        marketplace.total_volume = 0;
        marketplace.listing_count = 0;

        msg!("Marketplace initialized with {}% fee", fee_percentage);
        Ok(())
    }

    /// Create a listing
    pub fn create_listing(
        ctx: Context<CreateListing>,
        price: u64,
    ) -> Result<()> {
        require!(price > 0, ErrorCode::InvalidPrice);

        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        listing.status = ListingStatus::Active;
        listing.created_at = Clock::get()?.unix_timestamp;

        // Transfer NFT to escrow
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.seller_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.seller.to_account_info(),
                },
            ),
            1,
        )?;

        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.listing_count += 1;

        msg!("Listing created: {} for {} lamports", listing.key(), price);
        Ok(())
    }

    /// Buy NFT
    pub fn buy_nft(ctx: Context<BuyNFT>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(
            listing.status == ListingStatus::Active,
            ErrorCode::ListingNotActive
        );

        let marketplace = &ctx.accounts.marketplace;
        let price = listing.price;
        let fee = price * marketplace.fee_percentage as u64 / 10000; // fee_percentage is in basis points
        let seller_amount = price - fee;

        // Transfer SOL to seller
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.seller.to_account_info(),
                },
            ),
            seller_amount,
        )?;

        // Transfer fee to marketplace treasury
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            fee,
        )?;

        // Transfer NFT from escrow to buyer
        let nft_mint_key = listing.nft_mint;
        let seeds = &[
            b"escrow",
            nft_mint_key.as_ref(),
            &[*ctx.bumps.get("escrow_token_account").unwrap()],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_token_account.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        // Update listing
        listing.status = ListingStatus::Sold;
        listing.buyer = Some(ctx.accounts.buyer.key());

        // Update marketplace stats
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.total_volume += price;
        marketplace.listing_count -= 1;

        msg!("NFT sold: {} for {} lamports", listing.nft_mint, price);
        Ok(())
    }

    /// Cancel listing
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(
            listing.status == ListingStatus::Active,
            ErrorCode::ListingNotActive
        );
        require!(
            listing.seller == ctx.accounts.seller.key(),
            ErrorCode::NotSeller
        );

        // Return NFT from escrow to seller
        let nft_mint_key = listing.nft_mint;
        let seeds = &[
            b"escrow",
            nft_mint_key.as_ref(),
            &[*ctx.bumps.get("escrow_token_account").unwrap()],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.seller_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_token_account.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        listing.status = ListingStatus::Cancelled;

        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.listing_count -= 1;

        msg!("Listing cancelled: {}", listing.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Marketplace::SIZE
    )]
    pub marketplace: Account<'info, Marketplace>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,

    #[account(
        init,
        payer = seller,
        space = 8 + Listing::SIZE
    )]
    pub listing: Account<'info, Listing>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,

    /// NFT mint
    /// CHECK: NFT mint account
    pub nft_mint: AccountInfo<'info>,

    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = seller,
        associated_token::mint = nft_mint,
        associated_token::authority = escrow_token_account
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyNFT<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub seller: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 0
    )]
    /// CHECK: Treasury account
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,

    #[account(mut)]
    pub listing: Account<'info, Listing>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = listing.nft_mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,

    #[account(mut)]
    pub listing: Account<'info, Listing>,

    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(address = token::ID)]
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Marketplace {
    pub authority: Pubkey,
    pub fee_percentage: u16, // basis points (e.g., 500 = 5%)
    pub total_volume: u64,
    pub listing_count: u64,
}

impl Marketplace {
    pub const SIZE: usize = 32 + 2 + 8 + 8;
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub status: ListingStatus,
    pub created_at: i64,
}

impl Listing {
    pub const SIZE: usize = 32 + 33 + 32 + 8 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Listing not active")]
    ListingNotActive,
    #[msg("Not the seller")]
    NotSeller,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Invalid marketplace")]
    InvalidMarketplace,
}
