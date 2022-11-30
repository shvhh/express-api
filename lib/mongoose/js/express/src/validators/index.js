import Ajv from 'ajv';

const ajv = new Ajv();

export const validatedBody = (schema) => (req, res, next) => {
  if (typeof schema.required === 'undefined') {
    schema.required = [];
  }

  if (typeof schema.additionalProperties === 'undefined') {
    schema.additionalProperties = true;
  }
  const validate = ajv.compile(schema);
  const valid = validate(req.body);
  if (!valid) {
    next(validate.errors);
  } else {
    req.validatedBody = req.body;
    next();
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  if (!schema.required) {
    schema.required = [];
  }
  if (!schema.additionalProperties) {
    schema.additionalProperties = false;
  }
  const validate = ajv.compile(schema);
  const valid = validate(req.query);
  if (!valid) {
    next(validate.errors);
  } else {
    req.validatedQuery = req.query;
    next();
  }
};
