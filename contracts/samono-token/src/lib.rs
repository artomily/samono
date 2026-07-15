#![no_std]
//! Samono Token (SMT)
//!
//! A SEP-41 fungible token on Soroban. The backend server holds the **admin**
//! key and mints SMT to users when they swap their off-chain engagement points
//! (tracked in Supabase) for on-chain rewards. Because the admin is the source
//! account of the mint transaction, `admin.require_auth()` is satisfied by the
//! transaction's source signature.
//!
//! This mirrors the previous Solana design (custodial, admin-gated distribution)
//! but as a first-class token the project owns, rather than native SOL.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String,
};

// ─── TTL constants ──────────────────────────────────────────────────────────
// Ledgers close ~every 5s, so 17280 ledgers ≈ 1 day.
const DAY_IN_LEDGERS: u32 = 17_280;
const INSTANCE_BUMP_AMOUNT: u32 = 7 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
const BALANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const BALANCE_LIFETIME_THRESHOLD: u32 = BALANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

// ─── Storage keys ───────────────────────────────────────────────────────────

#[derive(Clone)]
#[contracttype]
pub struct AllowanceDataKey {
    pub from: Address,
    pub spender: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct TokenMetadata {
    pub decimal: u32,
    pub name: String,
    pub symbol: String,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Metadata,
    Balance(Address),
    Allowance(AllowanceDataKey),
}

// ─── Errors ─────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TokenError {
    /// The contract has not been initialised with an admin yet.
    NotInitialized = 1,
    /// A negative amount was supplied where only non-negative is allowed.
    NegativeAmount = 2,
    /// The account has insufficient balance for the operation.
    InsufficientBalance = 3,
    /// The spender's allowance is insufficient for the operation.
    InsufficientAllowance = 4,
    /// The allowance expiration ledger is in the past.
    BadExpiration = 5,
    /// `decimal` exceeds the supported maximum (18).
    DecimalTooLarge = 6,
}

// ─── Internal helpers ───────────────────────────────────────────────────────

fn read_admin(e: &Env) -> Result<Address, TokenError> {
    e.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(TokenError::NotInitialized)
}

fn read_metadata(e: &Env) -> Result<TokenMetadata, TokenError> {
    e.storage()
        .instance()
        .get(&DataKey::Metadata)
        .ok_or(TokenError::NotInitialized)
}

fn read_balance(e: &Env, addr: &Address) -> i128 {
    let key = DataKey::Balance(addr.clone());
    if let Some(balance) = e.storage().persistent().get::<DataKey, i128>(&key) {
        e.storage().persistent().extend_ttl(
            &key,
            BALANCE_LIFETIME_THRESHOLD,
            BALANCE_BUMP_AMOUNT,
        );
        balance
    } else {
        0
    }
}

fn write_balance(e: &Env, addr: &Address, amount: i128) {
    let key = DataKey::Balance(addr.clone());
    e.storage().persistent().set(&key, &amount);
    e.storage().persistent().extend_ttl(
        &key,
        BALANCE_LIFETIME_THRESHOLD,
        BALANCE_BUMP_AMOUNT,
    );
}

fn receive_balance(e: &Env, addr: &Address, amount: i128) {
    let balance = read_balance(e, addr);
    write_balance(e, addr, balance + amount);
}

fn spend_balance(e: &Env, addr: &Address, amount: i128) -> Result<(), TokenError> {
    let balance = read_balance(e, addr);
    if balance < amount {
        return Err(TokenError::InsufficientBalance);
    }
    write_balance(e, addr, balance - amount);
    Ok(())
}

fn read_allowance(e: &Env, from: &Address, spender: &Address) -> AllowanceValue {
    let key = DataKey::Allowance(AllowanceDataKey {
        from: from.clone(),
        spender: spender.clone(),
    });
    if let Some(allowance) = e.storage().temporary().get::<DataKey, AllowanceValue>(&key) {
        if allowance.expiration_ledger < e.ledger().sequence() {
            AllowanceValue { amount: 0, expiration_ledger: allowance.expiration_ledger }
        } else {
            allowance
        }
    } else {
        AllowanceValue { amount: 0, expiration_ledger: 0 }
    }
}

fn write_allowance(
    e: &Env,
    from: &Address,
    spender: &Address,
    amount: i128,
    expiration_ledger: u32,
) -> Result<(), TokenError> {
    let allowance = AllowanceValue { amount, expiration_ledger };
    if amount > 0 && expiration_ledger < e.ledger().sequence() {
        return Err(TokenError::BadExpiration);
    }
    let key = DataKey::Allowance(AllowanceDataKey {
        from: from.clone(),
        spender: spender.clone(),
    });
    e.storage().temporary().set(&key, &allowance);
    if amount > 0 {
        let live_for = expiration_ledger
            .checked_sub(e.ledger().sequence())
            .unwrap_or(0);
        e.storage().temporary().extend_ttl(&key, live_for, live_for);
    }
    Ok(())
}

fn spend_allowance(
    e: &Env,
    from: &Address,
    spender: &Address,
    amount: i128,
) -> Result<(), TokenError> {
    let allowance = read_allowance(e, from, spender);
    if allowance.amount < amount {
        return Err(TokenError::InsufficientAllowance);
    }
    if amount > 0 {
        write_allowance(
            e,
            from,
            spender,
            allowance.amount - amount,
            allowance.expiration_ledger,
        )?;
    }
    Ok(())
}

fn check_nonnegative(amount: i128) -> Result<(), TokenError> {
    if amount < 0 {
        Err(TokenError::NegativeAmount)
    } else {
        Ok(())
    }
}

fn extend_instance_ttl(e: &Env) {
    e.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

// ─── Contract ───────────────────────────────────────────────────────────────

#[contract]
pub struct SamonoToken;

// Events are emitted via the classic `events().publish` API. soroban-sdk 27
// deprecates it in favour of the `#[contractevent]` macro, but the classic API
// still produces valid, indexable events and keeps this contract self-contained.
#[allow(deprecated)]
#[contractimpl]
impl SamonoToken {
    /// Deploy-time initialisation. Sets the admin (the backend server account)
    /// and the token metadata. `decimal` should be 7 to match the app's amounts.
    pub fn __constructor(
        e: Env,
        admin: Address,
        decimal: u32,
        name: String,
        symbol: String,
    ) -> Result<(), TokenError> {
        if decimal > 18 {
            return Err(TokenError::DecimalTooLarge);
        }
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage()
            .instance()
            .set(&DataKey::Metadata, &TokenMetadata { decimal, name, symbol });
        extend_instance_ttl(&e);
        Ok(())
    }

    // ── Admin-gated ──────────────────────────────────────────────────────────

    /// Mint `amount` SMT (in base units) to `to`. Admin-only. This is the
    /// swap/claim reward payout path called by the backend.
    pub fn mint(e: Env, to: Address, amount: i128) -> Result<(), TokenError> {
        check_nonnegative(amount)?;
        let admin = read_admin(&e)?;
        admin.require_auth();
        extend_instance_ttl(&e);

        receive_balance(&e, &to, amount);
        e.events()
            .publish((soroban_sdk::symbol_short!("mint"), admin, to), amount);
        Ok(())
    }

    /// Rotate the admin authority. Admin-only.
    pub fn set_admin(e: Env, new_admin: Address) -> Result<(), TokenError> {
        let admin = read_admin(&e)?;
        admin.require_auth();
        extend_instance_ttl(&e);
        e.storage().instance().set(&DataKey::Admin, &new_admin);
        e.events()
            .publish((soroban_sdk::symbol_short!("set_admin"), admin), new_admin);
        Ok(())
    }

    /// Current admin authority.
    pub fn admin(e: Env) -> Result<Address, TokenError> {
        read_admin(&e)
    }

    // ── SEP-41 token interface ───────────────────────────────────────────────

    pub fn allowance(e: Env, from: Address, spender: Address) -> i128 {
        extend_instance_ttl(&e);
        read_allowance(&e, &from, &spender).amount
    }

    pub fn approve(
        e: Env,
        from: Address,
        spender: Address,
        amount: i128,
        expiration_ledger: u32,
    ) -> Result<(), TokenError> {
        from.require_auth();
        check_nonnegative(amount)?;
        extend_instance_ttl(&e);
        write_allowance(&e, &from, &spender, amount, expiration_ledger)?;
        e.events().publish(
            (soroban_sdk::symbol_short!("approve"), from, spender),
            (amount, expiration_ledger),
        );
        Ok(())
    }

    pub fn balance(e: Env, id: Address) -> i128 {
        extend_instance_ttl(&e);
        read_balance(&e, &id)
    }

    pub fn transfer(e: Env, from: Address, to: Address, amount: i128) -> Result<(), TokenError> {
        from.require_auth();
        check_nonnegative(amount)?;
        extend_instance_ttl(&e);
        spend_balance(&e, &from, amount)?;
        receive_balance(&e, &to, amount);
        e.events()
            .publish((soroban_sdk::symbol_short!("transfer"), from, to), amount);
        Ok(())
    }

    pub fn transfer_from(
        e: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), TokenError> {
        spender.require_auth();
        check_nonnegative(amount)?;
        extend_instance_ttl(&e);
        spend_allowance(&e, &from, &spender, amount)?;
        spend_balance(&e, &from, amount)?;
        receive_balance(&e, &to, amount);
        e.events()
            .publish((soroban_sdk::symbol_short!("transfer"), from, to), amount);
        Ok(())
    }

    pub fn burn(e: Env, from: Address, amount: i128) -> Result<(), TokenError> {
        from.require_auth();
        check_nonnegative(amount)?;
        extend_instance_ttl(&e);
        spend_balance(&e, &from, amount)?;
        e.events()
            .publish((soroban_sdk::symbol_short!("burn"), from), amount);
        Ok(())
    }

    pub fn burn_from(
        e: Env,
        spender: Address,
        from: Address,
        amount: i128,
    ) -> Result<(), TokenError> {
        spender.require_auth();
        check_nonnegative(amount)?;
        extend_instance_ttl(&e);
        spend_allowance(&e, &from, &spender, amount)?;
        spend_balance(&e, &from, amount)?;
        e.events()
            .publish((soroban_sdk::symbol_short!("burn"), from), amount);
        Ok(())
    }

    pub fn decimals(e: Env) -> Result<u32, TokenError> {
        Ok(read_metadata(&e)?.decimal)
    }

    pub fn name(e: Env) -> Result<String, TokenError> {
        Ok(read_metadata(&e)?.name)
    }

    pub fn symbol(e: Env) -> Result<String, TokenError> {
        Ok(read_metadata(&e)?.symbol)
    }
}

#[cfg(test)]
mod test;
