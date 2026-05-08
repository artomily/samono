use anchor_lang::prelude::*;
use anchor_lang::system_program;

// After deploying with `anchor deploy`, replace this with the real program ID
// printed by `anchor build` / `anchor keys list`
declare_id!("SaMoXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

// ─── Constants ────────────────────────────────────────────────────────────────

/// Seeds for the program's treasury PDA that holds SOL.
const TREASURY_SEED: &[u8] = b"treasury";
/// Seeds for the config PDA that stores the admin authority pubkey.
const CONFIG_SEED: &[u8] = b"config";

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod samono_swap {
    use super::*;

    /// One-time initialisation: create the Config PDA and record the admin authority.
    ///
    /// * `admin` – the backend server keypair pubkey that will sign future swaps.
    ///
    /// Must be called by the deployer keypair (payer) immediately after deployment.
    pub fn initialize(ctx: Context<Initialize>, admin: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = admin;
        config.bump = ctx.bumps.config;
        config.treasury_bump = ctx.bumps.treasury;
        msg!("Samono swap program initialised. Admin: {}", admin);
        Ok(())
    }

    /// Transfer SOL from the treasury PDA to a user wallet.
    ///
    /// * `sol_amount_lamports` – amount to send in lamports.
    ///
    /// The `authority` account must match `config.admin`.  The backend server
    /// deducts the user's XP in the DB *before* calling this instruction so that
    /// the swap is only executed when the DB write has succeeded.
    pub fn swap_points(ctx: Context<SwapPoints>, sol_amount_lamports: u64) -> Result<()> {
        require!(sol_amount_lamports > 0, SwapError::ZeroAmount);

        // Verify the treasury has enough lamports (rent-exempt floor + transfer amount)
        let treasury_lamports = ctx.accounts.treasury.lamports();
        let rent_minimum = Rent::get()?.minimum_balance(0);
        require!(
            treasury_lamports > rent_minimum + sol_amount_lamports,
            SwapError::InsufficientTreasuryFunds
        );

        // Transfer SOL from treasury PDA to user via CPI to system program
        let config_bump = ctx.accounts.config.bump;
        let treasury_bump = ctx.accounts.config.treasury_bump;
        let treasury_seeds: &[&[u8]] = &[TREASURY_SEED, &[treasury_bump]];
        let config_seeds: &[&[u8]] = &[CONFIG_SEED, &[config_bump]];
        let _ = config_seeds; // config PDA is validated by Anchor via has_one

        let signer_seeds = &[treasury_seeds];

        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.treasury.to_account_info(),
                    to: ctx.accounts.user.to_account_info(),
                },
                signer_seeds,
            ),
            sol_amount_lamports,
        )?;

        emit!(SwapEvent {
            user: ctx.accounts.user.key(),
            sol_amount_lamports,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "Swap: sent {} lamports to {}",
            sol_amount_lamports,
            ctx.accounts.user.key()
        );
        Ok(())
    }

    /// Transfer additional SOL into the treasury PDA (fund the treasury).
    ///
    /// Anyone can call this to top-up the treasury, but the admin is the intended caller.
    pub fn fund_treasury(ctx: Context<FundTreasury>, amount_lamports: u64) -> Result<()> {
        require!(amount_lamports > 0, SwapError::ZeroAmount);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.funder.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            amount_lamports,
        )?;

        msg!(
            "Treasury funded: {} lamports from {}",
            amount_lamports,
            ctx.accounts.funder.key()
        );
        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

/// Config PDA — stores the admin authority pubkey.
#[account]
#[derive(InitSpace)]
pub struct Config {
    /// Backend server keypair that must sign every swap.
    pub admin: Pubkey,
    /// Bump for the Config PDA.
    pub bump: u8,
    /// Bump for the Treasury PDA (stored here to avoid re-deriving on every swap).
    pub treasury_bump: u8,
}

// ─── Contexts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The deployer pays for the PDAs and becomes the first admin.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Config PDA — created here.
    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    /// Treasury PDA — created here (zero-data, just holds lamports).
    #[account(
        init,
        payer = payer,
        space = 0,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SwapPoints<'info> {
    /// The backend authority — must match `config.admin`.
    #[account(
        constraint = authority.key() == config.admin @ SwapError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// Config PDA (read-only; used to validate authority and treasury bump).
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// Treasury PDA — source of SOL.
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = config.treasury_bump,
    )]
    pub treasury: SystemAccount<'info>,

    /// The user receiving SOL.
    #[account(mut)]
    pub user: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundTreasury<'info> {
    /// Anyone can fund; typically the admin.
    #[account(mut)]
    pub funder: Signer<'info>,

    /// Treasury PDA — destination.
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = config.treasury_bump,
    )]
    pub treasury: SystemAccount<'info>,

    /// Config PDA — needed to verify treasury bump.
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct SwapEvent {
    /// The user wallet that received SOL.
    pub user: Pubkey,
    /// Amount transferred in lamports.
    pub sol_amount_lamports: u64,
    /// Unix timestamp of the swap.
    pub timestamp: i64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum SwapError {
    #[msg("Signer is not the registered admin authority.")]
    Unauthorized,
    #[msg("Transfer amount must be greater than zero.")]
    ZeroAmount,
    #[msg("Treasury has insufficient funds to cover the transfer.")]
    InsufficientTreasuryFunds,
}
