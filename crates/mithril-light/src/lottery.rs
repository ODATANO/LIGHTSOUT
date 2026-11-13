use blake2::{Blake2b512, Digest};
use num_bigint::{BigInt, Sign};
use num_rational::Ratio;
use num_traits::{Signed, Zero};

use crate::Error;

// The same series and error bound as mithril-stm's num-integer backend, so both sides draw the
// same conclusion from the same bytes.
const TAYLOR_BOUND: usize = 1000;

/// The lottery value of one index: Blake2b-512("map" ‖ msg ‖ index ‖ σ).
pub fn evaluate(msg: &[u8], index: u64, sigma: &[u8; 48]) -> [u8; 64] {
    let out = Blake2b512::new().chain_update(b"map").chain_update(msg).chain_update(index.to_le_bytes()).chain_update(sigma).finalize();
    out.into()
}

/// The lottery of one signer. A value `ev` wins when `ev / 2^512 < 1 - (1 - phi_f)^(stake /
/// total_stake)`, decided as `2^512 / (2^512 - ev) < exp(x)` by the series of `exp`. The
/// exponent depends on the signer alone, so the series is summed once for all of its indexes.
pub struct Lottery {
    /// `phi_f` is 1: every value wins.
    certain: bool,
    // The exponent `x` as `numerator / denominator`, the denominator positive.
    numerator: BigInt,
    denominator: BigInt,
    // After k terms: the sum times `denominator^k k!`, `numerator^k`, and `denominator^k k!`.
    sum: BigInt,
    power: BigInt,
    scale: BigInt,
    // Per term: the sum plus and minus the error bound, and 2^512, all times one denominator.
    steps: Vec<Step>,
}

struct Step {
    upper: BigInt,
    lower: BigInt,
    one: BigInt,
}

impl Lottery {
    pub fn new(phi_f: f64, stake: u64, total_stake: u64) -> Result<Self, Error> {
        if total_stake == 0 {
            return Err(Error::BadParameters);
        }
        let certain = (phi_f - 1.0).abs() < f64::EPSILON;
        if !certain && !(phi_f > 0.0 && phi_f <= 1.0) {
            return Err(Error::BadParameters);
        }
        let c = if certain { Ratio::zero() } else { Ratio::from_float((1.0 - phi_f).ln()).ok_or(Error::BadParameters)? };
        let one = BigInt::from(1u8);
        Ok(Self {
            certain,
            numerator: -(BigInt::from(stake) * c.numer()),
            denominator: BigInt::from(total_stake) * c.denom(),
            sum: one.clone(),
            power: one.clone(),
            scale: one,
            steps: Vec::new(),
        })
    }

    /// Whether the value `ev` wins. Undecided after the last term counts as lost.
    pub fn is_won(&mut self, ev: [u8; 64]) -> bool {
        if self.certain {
            return true;
        }
        // The series of exp(0) stays at 1, which no value is below.
        if self.numerator.is_zero() {
            return false;
        }
        let rest = (BigInt::from(1u8) << 512usize) - BigInt::from_bytes_le(Sign::Plus, &ev);
        for term in 0..TAYLOR_BOUND {
            if term == self.steps.len() {
                self.add_term();
            }
            let step = &self.steps[term];
            if step.one > &rest * &step.upper {
                return false;
            } else if step.one < &rest * &step.lower {
                return true;
            }
        }
        false
    }

    // Term k of the series is x^k / k!. The error bound after it is three times the next term.
    fn add_term(&mut self) {
        let k = BigInt::from(self.steps.len() + 1);
        let next = BigInt::from(self.steps.len() + 2);
        self.power = &self.power * &self.numerator;
        self.sum = &self.sum * &self.denominator * &k + &self.power;
        self.scale = &self.scale * &self.denominator * &k;
        // Sum and bound over the denominator of the next term.
        let middle = &self.sum * &self.denominator * &next;
        let error = (&self.power * &self.numerator).abs() * BigInt::from(3u8);
        let one = (&self.scale * &self.denominator * &next) << 512usize;
        self.steps.push(Step { upper: &middle + &error, lower: middle - error, one });
    }
}

/// Whether one value wins the lottery of a signer with `stake` of `total_stake`.
pub fn is_won(phi_f: f64, ev: [u8; 64], stake: u64, total_stake: u64) -> Result<bool, Error> {
    Ok(Lottery::new(phi_f, stake, total_stake)?.is_won(ev))
}
