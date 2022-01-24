export const accessorsSchema = JSON.stringify({
  $schema: "http://json-schema.org/draft-04/schema#",
  id: "accessors",
  type: "object",
  required: librariesOfInterest,
  properties: Object.fromEntries(librariesOfInterest.map(lib => [lib, { $ref: "#/$defs/bid" }])),
  $defs: {
    bid: {
      type: "object",
      required: requiredFields,
      properties: Object.fromEntries(requiredFields.map(field => [field, { $ref: "#/defs/accessor"}]))
    },
    accessor: {
      type: "object",
      oneOf: [
        { required: ["constant"] },
        { required: ["getAttribute"] },
        { required: ["tryGetAttribute"] },
        { required: ["callMethod"] },
        { required: ["applyFunction"] }
      ],
      properties: {
        constant: {
          type: "object"
        },
        getAttribute: {
          type: "string"
        },
        tryGetAttribute: {
          type: "string"
        },
        callMethod: {
          type: "string"
        },
        applyFunction: {
          type: "string"
        },
        then: {
          $ref: "#/$defs/accessor"
        }
      },
      maxProperties: 2,
      additionalProperties: false
    }
  }
})
