export type Bid = {
  bidder: string;
  cpm: number;
  currency: string;
  unitCode: string;
  won: boolean;
  lib: string;
  outdated: boolean;
  time: number;
};

// Accessor types
type Constant = {
  constant: unknown;
  then?: Accessor;
};
type GetAttribute = {
  getAttribute: string;
  then?: Accessor;
};
type TryGetAttribute = {
  tryGetAttribute: string;
  then?: Accessor;
};
type CallMethod = {
  callMethod: string;
  then?: Accessor;
};
type ApplyFunction = {
  applyFunction: string;
  then?: Accessor;
};

export type Accessor =
  | Constant
  | GetAttribute
  | TryGetAttribute
  | CallMethod
  | ApplyFunction;

export type Accessors = {
  accessors: {
    [key: string]: {
      [key: string]: Accessor;
    };
  };
};

export type Store = {
  bids: Bid[];
  accessors: Accessors;
};

export type JsPrimitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | (() => JsValue)
  | ((arg: JsValue) => JsValue)
  | ((arg: JsValue) => void)
  // eslint-disable-next-line @typescript-eslint/ban-types
  | Function;
export type JsValue = JsPrimitive | JsObject | JsArray;
export type JsObject = {[member: string]: JsValue};
export type JsArray = Array<JsValue>;

export type PBJS = {
  adUnits: JsObject[];
  // eslint-disable-next-line @typescript-eslint/ban-types
  onEvent: (event: string, f: Function) => void;
}