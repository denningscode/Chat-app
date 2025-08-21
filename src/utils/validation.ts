import Joi from 'joi';

export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one letter and one number'
    })
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const roomCreationSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  isPrivate: Joi.boolean().default(false)
});

export const messageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  roomId: Joi.string().uuid().required()
});

export const joinRoomSchema = Joi.object({
  roomId: Joi.string().uuid().optional(),
  inviteCode: Joi.string().optional()
}).or('roomId', 'inviteCode');

export const validateRequest = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(error.details.map(detail => detail.message).join(', '));
  }
  return value;
};
