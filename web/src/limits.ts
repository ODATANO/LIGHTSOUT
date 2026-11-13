// What visitors may spend with the lent agents: an amount per session, per visitor address and
// day, and for all visitors per day. Amounts are micro-NEAR. A restart begins the day again.
const DAY_MS = 86_400_000;
const least = (...amounts: bigint[]): bigint => amounts.reduce((a, b) => (b < a ? b : a));

export class Budget {
  private day = 0;
  private all = 0n;
  private readonly byAddress = new Map<string, bigint>();

  constructor(
    readonly perSession: bigint,
    private readonly perAddress: bigint,
    private readonly perDay: bigint,
  ) {}

  private today(): void {
    const day = Math.floor(Date.now() / DAY_MS);
    if (day === this.day) return;
    this.day = day;
    this.all = 0n;
    this.byAddress.clear();
  }

  /** What a session that spent `spent` can still spend. */
  left(spent: bigint, address: string): bigint {
    this.today();
    const left = least(this.perSession - spent, this.perAddress - (this.byAddress.get(address) ?? 0n), this.perDay - this.all);
    return left > 0n ? left : 0n;
  }

  /** Counts an amount that leaves an agent. A negative one gives back what a failed call did not move. */
  count(address: string, amount: bigint): void {
    this.today();
    const clamp = (value: bigint): bigint => (value > 0n ? value : 0n);
    this.all = clamp(this.all + amount);
    this.byAddress.set(address, clamp((this.byAddress.get(address) ?? 0n) + amount));
  }
}

/** How often each visitor address did something within a time window. */
export class Rate {
  private readonly times = new Map<string, number[]>();

  constructor(
    private readonly most: number,
    private readonly withinMs: number,
  ) {}

  private recent(address: string): number[] {
    return (this.times.get(address) ?? []).filter((at) => Date.now() - at < this.withinMs);
  }

  /** Whether the address may do it once more now. Counts it when so. */
  allows(address: string): boolean {
    const recent = this.recent(address);
    if (recent.length >= this.most) return false;
    this.times.set(address, [...recent, Date.now()]);
    return true;
  }

  /** Drops the addresses with nothing left in the window. */
  tidy(): void {
    for (const address of this.times.keys()) if (this.recent(address).length === 0) this.times.delete(address);
  }
}
