#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

fn create_token<'a>(e: &Env, admin: &Address) -> SamonoTokenClient<'a> {
    let contract_id = e.register(
        SamonoToken,
        (
            admin.clone(),
            7_u32,
            String::from_str(e, "Samono Token"),
            String::from_str(e, "SMT"),
        ),
    );
    SamonoTokenClient::new(e, &contract_id)
}

#[test]
fn metadata_and_admin() {
    let e = Env::default();
    let admin = Address::generate(&e);
    let token = create_token(&e, &admin);

    assert_eq!(token.decimals(), 7);
    assert_eq!(token.name(), String::from_str(&e, "Samono Token"));
    assert_eq!(token.symbol(), String::from_str(&e, "SMT"));
    assert_eq!(token.admin(), admin);
}

#[test]
fn admin_can_mint() {
    let e = Env::default();
    e.mock_all_auths();
    let admin = Address::generate(&e);
    let user = Address::generate(&e);
    let token = create_token(&e, &admin);

    token.mint(&user, &1_000_000_000); // 100 SMT at 7 decimals
    assert_eq!(token.balance(&user), 1_000_000_000);
}

#[test]
fn transfer_moves_balance() {
    let e = Env::default();
    e.mock_all_auths();
    let admin = Address::generate(&e);
    let a = Address::generate(&e);
    let b = Address::generate(&e);
    let token = create_token(&e, &admin);

    token.mint(&a, &500);
    token.transfer(&a, &b, &200);
    assert_eq!(token.balance(&a), 300);
    assert_eq!(token.balance(&b), 200);
}

#[test]
fn approve_and_transfer_from() {
    let e = Env::default();
    e.mock_all_auths();
    e.ledger().set_sequence_number(10);
    let admin = Address::generate(&e);
    let owner = Address::generate(&e);
    let spender = Address::generate(&e);
    let dest = Address::generate(&e);
    let token = create_token(&e, &admin);

    token.mint(&owner, &1_000);
    token.approve(&owner, &spender, &400, &1000);
    assert_eq!(token.allowance(&owner, &spender), 400);

    token.transfer_from(&spender, &owner, &dest, &250);
    assert_eq!(token.balance(&owner), 750);
    assert_eq!(token.balance(&dest), 250);
    assert_eq!(token.allowance(&owner, &spender), 150);
}

#[test]
fn burn_reduces_balance() {
    let e = Env::default();
    e.mock_all_auths();
    let admin = Address::generate(&e);
    let user = Address::generate(&e);
    let token = create_token(&e, &admin);

    token.mint(&user, &1_000);
    token.burn(&user, &400);
    assert_eq!(token.balance(&user), 600);
}

#[test]
fn set_admin_rotates_authority() {
    let e = Env::default();
    e.mock_all_auths();
    let admin = Address::generate(&e);
    let new_admin = Address::generate(&e);
    let token = create_token(&e, &admin);

    token.set_admin(&new_admin);
    assert_eq!(token.admin(), new_admin);
}

#[test]
#[should_panic]
fn mint_negative_amount_fails() {
    let e = Env::default();
    e.mock_all_auths();
    let admin = Address::generate(&e);
    let user = Address::generate(&e);
    let token = create_token(&e, &admin);

    token.mint(&user, &-1);
}

#[test]
#[should_panic]
fn transfer_insufficient_balance_fails() {
    let e = Env::default();
    e.mock_all_auths();
    let admin = Address::generate(&e);
    let a = Address::generate(&e);
    let b = Address::generate(&e);
    let token = create_token(&e, &admin);

    token.mint(&a, &100);
    token.transfer(&a, &b, &500);
}
