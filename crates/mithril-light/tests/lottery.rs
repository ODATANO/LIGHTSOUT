//! The lottery sums the series once per signer. It must decide every value as the plain
//! comparison of mithril-stm does, also right at the edge between winning and losing.

use mithril_light::Error;
use mithril_light::lottery::{Lottery, is_won};
use num_bigint::{BigInt, Sign};
use num_rational::Ratio;
use num_traits::{One, Signed};

// mithril-stm's comparison with its num-integer backend, one value at a time.
fn plain(phi_f: f64, ev: [u8; 64], stake: u64, total_stake: u64) -> bool {
    let ev_max = BigInt::from(2u8).pow(512);
    let q = Ratio::new_raw(ev_max.clone(), ev_max - BigInt::from_bytes_le(Sign::Plus, &ev));
    let c = Ratio::from_float((1.0 - phi_f).ln()).unwrap();
    let x = -(Ratio::new_raw(BigInt::from(stake), BigInt::from(total_stake)) * c);
    let mut new_x = x.clone();
    let mut phi: Ratio<BigInt> = One::one();
    let mut divisor: BigInt = One::one();
    for _ in 0..1000 {
        phi += new_x.clone();
        divisor += 1;
        new_x = (new_x.clone() * x.clone()) / divisor.clone();
        let error_term = new_x.clone().abs() * BigInt::from(3);
        if q > phi.clone() + error_term.clone() {
            return false;
        } else if q < phi.clone() - error_term {
            return true;
        }
    }
    false
}

// A value with `top` as its 16 leading bytes and `fill` in every byte below.
fn value(top: u128, fill: u8) -> [u8; 64] {
    let mut ev = [fill; 64];
    ev[48..].copy_from_slice(&top.to_le_bytes());
    ev
}

// The smallest `top` whose value loses: lower values win, higher ones lose.
fn edge(phi_f: f64, stake: u64, total_stake: u64) -> u128 {
    let (mut won, mut lost) = (0u128, u128::MAX);
    assert!(plain(phi_f, value(won, 0), stake, total_stake) && !plain(phi_f, value(lost, 0), stake, total_stake));
    while lost - won > 1 {
        let middle = won + (lost - won) / 2;
        if plain(phi_f, value(middle, 0), stake, total_stake) { won = middle } else { lost = middle }
    }
    lost
}

const SIGNERS: [(f64, u64, u64); 5] = [
    (0.65, 1, 3),
    (0.65, 5, 5),
    (0.65, 3_000_000_000_000, 9_000_000_000_001),
    (0.2, 12_345_678_901, 22_000_000_000_000_000),
    (0.05, 7, 1000),
];

#[test]
fn values_at_the_edge_are_decided_as_the_plain_series_decides_them() {
    for (phi_f, stake, total_stake) in SIGNERS {
        let edge = edge(phi_f, stake, total_stake);
        let mut lottery = Lottery::new(phi_f, stake, total_stake).unwrap();
        for top in [0, 1, edge / 2, edge - 2, edge - 1, edge, edge + 1, edge + 2, edge.saturating_mul(2), u128::MAX] {
            for fill in [0x00, 0x5a, 0xff] {
                let ev = value(top, fill);
                let expected = plain(phi_f, ev, stake, total_stake);
                // One lottery for all values of the signer, and a fresh one for this value.
                assert_eq!(lottery.is_won(ev), expected, "phi_f {phi_f}, stake {stake} of {total_stake}, top {top}, fill {fill}");
                assert_eq!(is_won(phi_f, ev, stake, total_stake), Ok(expected));
            }
        }
    }
}

#[test]
fn any_value_is_decided_as_the_plain_series_decides_it() {
    let mut seed = 0x9e3779b97f4a7c15u64;
    let mut next = || {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        seed
    };
    for (phi_f, stake, total_stake) in SIGNERS {
        let mut lottery = Lottery::new(phi_f, stake, total_stake).unwrap();
        let (mut won, mut lost) = (0, 0);
        for _ in 0..200 {
            let mut ev = [0u8; 64];
            ev.chunks_mut(8).for_each(|chunk| chunk.copy_from_slice(&next().to_le_bytes()));
            // Half of the values lie low, where a small stake wins.
            if next() % 2 == 0 {
                ev[62..].fill(0);
            }
            let expected = plain(phi_f, ev, stake, total_stake);
            assert_eq!(lottery.is_won(ev), expected);
            if expected { won += 1 } else { lost += 1 }
        }
        assert!(won > 0 && lost > 0, "phi_f {phi_f}, stake {stake} of {total_stake}: {won} won, {lost} lost");
    }
}

#[test]
fn a_lottery_needs_a_total_stake_and_a_phi_f_above_0_up_to_1() {
    assert_eq!(is_won(1.0, [0xff; 64], 1, 2), Ok(true));
    assert_eq!(is_won(0.65, [0; 64], 1, 0), Err(Error::BadParameters));
    assert_eq!(is_won(0.0, [0; 64], 1, 2), Err(Error::BadParameters));
    assert_eq!(is_won(1.5, [0; 64], 1, 2), Err(Error::BadParameters));
    assert_eq!(is_won(f64::NAN, [0; 64], 1, 2), Err(Error::BadParameters));
    // No stake never wins, not even the lowest value.
    assert_eq!(is_won(0.65, [0; 64], 0, 2), Ok(false));
    assert_eq!(is_won(0.65, [0; 64], 1, 2), Ok(true));
}
