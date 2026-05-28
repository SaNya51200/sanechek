const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { checkTaskCreation, checkTaskModification, checkTaskId } = require('../middleware/validation');
const { initializeDataFile, readData, writeData, getNextId } = require('../utils/fileOperations');

initializeDataFile();

// Получение списка задач с фильтрами, сортировкой и пагинацией
router.get('/', async (req, res, next) => {
  try {
    const { category, completed, priority, sortBy, page, limit, q } = req.query;
    const dbData = await readData();
    let tasksList = [...dbData.tasks];
    
    if (category) {
      tasksList = tasksList.filter(item => item.category === category);
    }
    if (completed !== undefined) {
      tasksList = tasksList.filter(item => item.completed === (completed === 'true'));
    }
    if (priority) {
      tasksList = tasksList.filter(item => item.priority === parseInt(priority, 10));
    }
    if (q && q.trim().length >= 2) {
      const queryStr = q.toLowerCase().trim();
      tasksList = tasksList.filter(item => 
        item.title.toLowerCase().includes(queryStr) || 
        (item.description && item.description.toLowerCase().includes(queryStr))
      );
    }
    
    if (sortBy) {
      const desc = sortBy.startsWith('-');
      const field = desc ? sortBy.slice(1) : sortBy;
      tasksList.sort((a, b) => {
        let valA = a[field], valB = b[field];
        if (field === 'dueDate' || field === 'createdAt') {
          valA = valA ? new Date(valA).getTime() : 0;
          valB = valB ? new Date(valB).getTime() : 0;
        }
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    }
    
    let paginatedResult = tasksList;
    if (page && limit) {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      paginatedResult = tasksList.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    }
    
    res.json({ 
      success: true, 
      count: paginatedResult.length, 
      total: tasksList.length, 
      data: paginatedResult 
    });
  } catch (error) { 
    next(error); 
  }
});

// Текстовый поиск по задачам
router.get('/search/text', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Поисковый запрос должен быть длиннее 1 символа' 
      });
    }
    const dbData = await readData();
    const queryStr = q.toLowerCase().trim();
    const filterResult = dbData.tasks.filter(item => 
      item.title.toLowerCase().includes(queryStr) || 
      (item.description && item.description.toLowerCase().includes(queryStr))
    );
    res.json({ success: true, count: filterResult.length, data: filterResult });
  } catch (error) { 
    next(error); 
  }
});

// Получение статистики по задачам
router.get('/stats/summary', async (req, res, next) => {
  try {
    const dbData = await readData();
    const list = dbData.tasks;
    const summary = { 
      total: list.length, 
      completed: 0, 
      pending: 0, 
      overdue: 0, 
      byCategory: {}, 
      byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
    };
    const currentTime = new Date();
    
    list.forEach(item => {
      if (item.completed) {
        summary.completed++;
      } else {
        summary.pending++;
        if (item.dueDate && new Date(item.dueDate) < currentTime) {
          summary.overdue++;
        }
      }
      summary.byCategory[item.category] = (summary.byCategory[item.category] || 0) + 1;
      if (item.priority >= 1 && item.priority <= 5) {
        summary.byPriority[item.priority]++;
      }
    });
    
    res.json({ success: true, data: summary });
  } catch (error) { 
    next(error); 
  }
});

// Получение задачи по ID
router.get('/:id', checkTaskId, async (req, res, next) => {
  try {
    const dbData = await readData();
    const task = dbData.tasks.find(item => item.id === req.params.id);
    if (!task) { 
      const err = new Error('Задача не найдена в базе данных'); 
      err.status = 404; 
      throw err; 
    }
    res.json({ success: true, data: task });
  } catch (error) { 
    next(error); 
  }
});

// Создание новой задачи
router.post('/', checkTaskCreation, async (req, res, next) => {
  try {
    const { title, description, category, priority, dueDate } = req.body;
    const dbData = await readData();
    const createdTask = {
      id: await getNextId(), 
      uuid: uuidv4(), 
      title, 
      description: description || '',
      category: category || 'other', 
      priority: priority || 3, 
      dueDate: dueDate || null,
      completed: false, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString()
    };
    dbData.tasks.push(createdTask);
    await writeData(dbData);
    res.status(201).json({ 
      success: true, 
      message: 'Задача добавлена в список', 
      data: createdTask 
    });
  } catch (error) { 
    next(error); 
  }
});

// Редактирование задачи по ID
router.put('/:id', checkTaskId, checkTaskModification, async (req, res, next) => {
  try {
    const updates = req.body;
    const dbData = await readData();
    const index = dbData.tasks.findIndex(item => item.id === req.params.id);
    if (index === -1) { 
      const err = new Error('Редактируемая задача не найдена'); 
      err.status = 404; 
      throw err; 
    }
    const modifiedTask = { 
      ...dbData.tasks[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    dbData.tasks[index] = modifiedTask;
    await writeData(dbData);
    res.json({ 
      success: true, 
      message: 'Параметры задачи обновлены', 
      data: modifiedTask 
    });
  } catch (error) { 
    next(error); 
  }
});

// Завершение задачи по ID
router.patch('/:id/complete', checkTaskId, async (req, res, next) => {
  try {
    const dbData = await readData();
    const index = dbData.tasks.findIndex(item => item.id === req.params.id);
    if (index === -1) { 
      const err = new Error('Указанная задача не найдена'); 
      err.status = 404; 
      throw err; 
    }
    dbData.tasks[index].completed = true;
    dbData.tasks[index].updatedAt = new Date().toISOString();
    await writeData(dbData);
    res.json({ 
      success: true, 
      message: 'Статус задачи изменен на Выполнено', 
      data: dbData.tasks[index] 
    });
  } catch (error) { 
    next(error); 
  }
});

// Удаление задачи по ID
router.delete('/:id', checkTaskId, async (req, res, next) => {
  try {
    const dbData = await readData();
    const index = dbData.tasks.findIndex(item => item.id === req.params.id);
    if (index === -1) { 
      const err = new Error('Удаляемая задача отсутствует в списке'); 
      err.status = 404; 
      throw err; 
    }
    dbData.tasks.splice(index, 1);
    await writeData(dbData);
    res.json({ success: true, message: 'Задача успешно удалена из системы' });
  } catch (error) { 
    next(error); 
  }
});

module.exports = router;
