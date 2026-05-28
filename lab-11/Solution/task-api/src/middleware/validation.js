const Joi = require('joi');

const taskCreationSchema = Joi.object({
  title: Joi.string().min(3).max(120).required().messages({
    'string.min': 'Наименование должно быть не менее 3 символов',
    'string.max': 'Наименование ограничено 120 символами',
    'any.required': 'Наименование задачи обязательно для заполнения'
  }),
  description: Joi.string().max(600).allow('').messages({
    'string.max': 'Описание ограничено 600 символами'
  }),
  category: Joi.string().valid('work', 'study', 'home', 'other').default('other').messages({
    'any.only': 'Допустимые категории: work, study, home, other'
  }),
  priority: Joi.number().integer().min(1).max(5).default(3).messages({
    'number.min': 'Приоритет оценивается от 1 до 5',
    'number.max': 'Приоритет оценивается от 1 до 5'
  }),
  dueDate: Joi.date().greater('now').messages({
    'date.greater': 'Срок выполнения должен быть назначен в будущем'
  })
});

const taskModificationSchema = Joi.object({
  title: Joi.string().min(3).max(120),
  description: Joi.string().max(600).allow(''),
  category: Joi.string().valid('work', 'study', 'home', 'other'),
  priority: Joi.number().integer().min(1).max(5),
  dueDate: Joi.date().greater('now'),
  completed: Joi.boolean()
});

const checkTaskCreation = (req, res, next) => {
  const { error } = taskCreationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: error.details.map(d => ({
        field: d.path[0],
        message: d.message
      }))
    });
  }
  next();
};

const checkTaskModification = (req, res, next) => {
  const { error } = taskModificationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      details: error.details.map(d => ({
        field: d.path[0],
        message: d.message
      }))
    });
  }
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      message: 'Тело запроса должно содержать хотя бы одно поле для обновления'
    });
  }
  next();
};

const checkTaskId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      message: 'Идентификатор должен быть положительным числом'
    });
  }
  req.params.id = id;
  next();
};

module.exports = {
  checkTaskCreation,
  checkTaskModification,
  checkTaskId
};
