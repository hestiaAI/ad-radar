export interface Bid {
  bidder: string;
  cpm: number;
  currency: string;
  unitCode: string;
  won: boolean;
  outdated: boolean;
  time: number;
}
