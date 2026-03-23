use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

// Program ID
declare_id!("ToKLxTk67d7b7r9q7Y9Z9p9k9p9k9p9k9p9k9p9k9p9");

#[program]
pub mod ezzi_token {
    use super::*;

    /// Initialize EZZI token
    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        token_data.authority = ctx.accounts.authority.key();
        token_data.mint = ctx.accounts.mint.key();
        token_data.name = name;
        token_data.symbol = symbol;
        token_data.decimals = decimals;
        token_data.total_supply = total_supply;
        token_data.circulating_supply = 0;

        msg!("EZZI Token initialized: {}", token_data.name);
        Ok(())
    }

    /// Mint tokens (only authority)
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        require!(
            ctx.accounts.authority.key() == token_data.authority,
            ErrorCode::Unauthorized
        );

        require!(
            token_data.circulating_supply + amount <= token_data.total_supply,
            ErrorCode::MaxSupplyReached
        );

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            amount,
        )?;

        token_data.circulating_supply += amount;

        msg!("Minted {} EZZI tokens", amount);
        Ok(())
    }

    /// Burn tokens
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
        )?;

        token_data.circulating_supply -= amount;

        msg!("Burned {} EZZI tokens", amount);
        Ok(())
    }

    /// Distribute mining rewards
    pub fn distribute_rewards(
        ctx: Context<DistributeRewards>,
        amount: u64,
    ) -> Result<()> {
        let token_data = &mut ctx.accounts.token_data;
        require!(
            ctx.accounts.authority.key() == token_data.authority,
            ErrorCode::Unauthorized
        );

        require!(
            token_data.circulating_supply + amount <= token_data.total_supply,
            ErrorCode::MaxSupplyReached
        );

        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            amount,
        )?;

        token_data.circulating_supply += amount;

        msg!("Distributed {} EZZI as mining rewards", amount);
        Ok(())
    }

    /// Transfer tokens
    pub fn transfer(
        ctx: Context<TransferTokens>,
        amount: u64,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.from_authority.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Transferred {} EZZI tokens", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + TokenData::SIZE
    )]
    pub token_data: Account<'info, TokenData>,

    #[account(
        init,
        payer = authority,
        mint::decimals = decimals,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    /// CHECK: Mint authority
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub token_data: Account<'info, TokenData>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    /// CHECK: Mint authority
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from_authority: Signer<'info>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TokenData {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub circulating_supply: u64,
}

impl TokenData {
    pub const SIZE: usize = 32 + 32 + 50 + 10 + 1 + 8 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Max supply reached")]
    MaxSupplyReached,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Invalid amount")]
    InvalidAmount,
}
