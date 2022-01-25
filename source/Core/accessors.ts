import Ajv, {ErrorObject} from 'ajv';
import {LIBRARIES_OF_INTEREST, REQUIRED_FIELDS} from './index';

export const accessorsJsonSchema = JSON.stringify({
  $schema: 'http://json-schema.org/draft-04/schema#',
  id: 'accessors',
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
        REQUIRED_FIELDS.map((field) => [field, {$ref: '#/defs/accessor'}])
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
        constant: {
          type: 'object',
        },
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
});

export const initialAccessors = {
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
      won: null,
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
            tryGetAttribute: 0,
          },
        },
      },
      cpm: {
        callMethod: 'getTargetingMap',
        then: {
          getAttribute: 'hb_pb',
          then: {
            tryGetAttribute: 0,
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
              getAttribute: 0,
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
              getAttribute: 0,
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
              getAttribute: 0,
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

export function validateAccessors(
  data: unknown
): ErrorObject[] | null | undefined {
  const ajv = new Ajv();
  ajv.validate(accessorsJsonSchema, data);
  return ajv.errors;
}
