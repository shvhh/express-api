import { validateQuery, validatedBody } from './index';
// body schema
const bodySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    }
  },
  required: ['name'],
  additionalProperties: false
};
// query Schema
const querySchema = {
  type: 'object',
  properties: {
    skip: {
      type: 'number'
    },
    limit: {
      type: 'number'
    }
  },
  required: [],
  additionalProperties: false
};

export const newUserValidator = validatedBody(bodySchema);
export const getUserValidator = validateQuery(querySchema);
export const updateUserValidator = validatedBody(bodySchema);
