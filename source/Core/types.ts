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
export type Accessor = {
  then?: Accessor;
  constant?: JsValue;
  getAttribute?: string;
  tryGetAttribute?: string;
  callMethod?: string;
  applyFunction?: string;
};

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

// Helper types
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
export type JsObject = {[member: string]: JsValue};
export type JsArray = Array<JsValue>;
export type JsValue = JsPrimitive | JsObject | JsArray;
