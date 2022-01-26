import {Validator} from '@cfworker/json-schema';
import {Schema} from '@cfworker/json-schema/src/types';
import {LIBRARIES_OF_INTEREST, REQUIRED_FIELDS} from './index';
import {Accessor, Accessors, JsObject, JsValue} from './types';

export const accessorsJsonSchema: Schema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  $id: 'accessors',
  type: 'object',
  required: LIBRARIES_OF_INTEREST,
  properties: Object.fromEntries(
    LIBRARIES_OF_INTEREST.map((lib) => [lib, {$ref: '#/$defs/bid'}])
  ),
  $defs: {
    bid: {
      type: 'object',
      required: REQUIRED_FIELDS,
      properties: Object.fromEntries(
        REQUIRED_FIELDS.map((field) => [
          field,
          {oneOf: [{$ref: '#/$defs/accessor'}, {type: 'null'}]},
        ])
      ),
    },
    accessor: {
      type: 'object',
      oneOf: [
        {required: ['constant']},
        {required: ['getAttribute']},
        {required: ['tryGetAttribute']},
        {required: ['callMethod']},
        {required: ['applyFunction']},
      ],
      properties: {
        constant: {}, // can be anything
        getAttribute: {
          type: 'string',
        },
        tryGetAttribute: {
          type: 'string',
        },
        callMethod: {
          type: 'string',
        },
        applyFunction: {
          type: 'string',
        },
        then: {
          $ref: '#/$defs/accessor',
        },
      },
      maxProperties: 2,
      additionalProperties: false,
    },
  },
};

export const initialAccessors: Accessors = {
  accessors: {
    pbjs: {
      unitCode: {
        getAttribute: 'adUnitCode',
      },
      bidder: {
        getAttribute: 'bidder',
      },
      cpm: {
        getAttribute: 'cpm',
      },
      currency: {
        getAttribute: 'currency',
      },
      won: {
        getAttribute: 'won',
      },
    },
    googletag: {
      unitCode: {
        callMethod: 'getSlotId',
        then: {
          callMethod: 'getId',
        },
      },
      bidder: {
        callMethod: 'getTargetingMap',
        then: {
          getAttribute: 'hb_bidder',
          then: {
            tryGetAttribute: '0',
          },
        },
      },
      cpm: {
        callMethod: 'getTargetingMap',
        then: {
          getAttribute: 'hb_pb',
          then: {
            tryGetAttribute: '0',
            then: {
              applyFunction: 'parseFloat',
            },
          },
        },
      },
      currency: {
        constant: 'USD',
      },
      won: {
        constant: true,
      },
    },
    apstag: {
      unitCode: {
        getAttribute: 'bid',
        then: {
          getAttribute: 'kvMap',
          then: {
            getAttribute: 'amznp',
            then: {
              getAttribute: '0',
            },
          },
        },
      },
      bidder: {
        getAttribute: 'bid',
        then: {
          getAttribute: 'kvMap',
          then: {
            getAttribute: 'hb_bidder',
            then: {
              getAttribute: '0',
            },
          },
        },
      },
      cpm: {
        getAttribute: 'bid',
        then: {
          getAttribute: 'kvMap',
          then: {
            getAttribute: 'hb_pb',
            then: {
              getAttribute: '0',
              then: {
                applyFunction: 'parseFloat',
              },
            },
          },
        },
      },
      currency: {
        constant: 'USD',
      },
      won: {
        constant: true,
      },
    },
  },
};

const validator = new Validator(accessorsJsonSchema);

export function validateAccessors(data: unknown): string[] {
  return validator.validate(data).errors.map((output) => output.error);
}

const functions: {[key: string]: (val: JsValue) => JsValue} = {
  // serves as an example
  identity(value) {
    return value;
  },
  parseFloat(value) {
    return parseFloat(value as string);
  },
};

function access(value: JsValue, accessor: Accessor): JsValue {
  let result: JsValue;
  const {
    constant,
    getAttribute,
    tryGetAttribute,
    callMethod,
    applyFunction,
    then,
  } = accessor;

  if (constant) {
    result = constant;
  } else if (getAttribute) {
    result = (value as JsObject)[getAttribute];
  } else if (tryGetAttribute) {
    if (value) {
      result = (value as JsObject)[tryGetAttribute];
    } else {
      result = null;
    }
  } else if (callMethod) {
    result = ((value as JsObject)[callMethod] as () => JsValue)();
  } else if (applyFunction) {
    result = functions[applyFunction](value);
  } else {
    throw new Error(`Unknown accessor type.`);
  }
  if (then) {
    result = access(result, then);
  }
  return result;
}
export function accessAll(
  value: JsObject,
  accessors: {[field: string]: Accessor}
): JsValue {
  return Object.fromEntries(
    Object.entries(accessors).map(([k, v]) => [k, access(value, v)])
  );
}

export const accessorEngine = {
  accessAll,
  access,
  functions,
};
