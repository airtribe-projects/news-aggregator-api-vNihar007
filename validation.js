const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  preferences: Joi.array().items(Joi.string()).optional(), 
});

const newsQuerySchema = Joi.object({
  query: Joi.string().optional(),
  dateStart: Joi.date().optional(), 
  dateEnd: Joi.date().optional(),     
}).custom((value, helpers) => {
  // Ensure `dateEnd` is greater than or equal to `dateStart` if both are provided
  if (value.dateStart && value.dateEnd && new Date(value.dateStart) > new Date(value.dateEnd)) {
    return helpers.error('any.invalid', { message: "'dateEnd' must be greater than or equal to 'dateStart'" });
  }
  return value;
}, 'Date Range Validation');

module.exports = {
  userSchema,
  newsQuerySchema,
};