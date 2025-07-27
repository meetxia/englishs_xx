const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * 获取所有单词
 */
router.get('/words', async (req, res) => {
  try {
    const words = await db.all('SELECT * FROM words');
    res.json(words);
  } catch (err) {
    console.error('获取单词列表失败:', err);
    res.status(500).json({ error: '获取单词列表失败', details: err.message });
  }
});

/**
 * 获取单个单词
 */
router.get('/words/:id', async (req, res) => {
  try {
    const word = await db.get('SELECT * FROM words WHERE id = ?', [req.params.id]);
    if (!word) {
      return res.status(404).json({ error: '未找到该单词' });
    }
    res.json(word);
  } catch (err) {
    console.error('获取单词详情失败:', err);
    res.status(500).json({ error: '获取单词详情失败', details: err.message });
  }
});

/**
 * 添加新单词
 */
router.post('/words', async (req, res) => {
  const { word, meaning, example } = req.body;
  
  if (!word || !meaning) {
    return res.status(400).json({ error: '缺少必要的字段' });
  }
  
  try {
    const result = await db.run(
      'INSERT INTO words (word, meaning, example) VALUES (?, ?, ?)',
      [word, meaning, example || '']
    );
    
    res.status(201).json({
      id: result.id,
      message: '单词添加成功'
    });
  } catch (err) {
    console.error('添加单词失败:', err);
    res.status(500).json({ error: '添加单词失败', details: err.message });
  }
});

/**
 * 更新单词
 */
router.put('/words/:id', async (req, res) => {
  const { word, meaning, example } = req.body;
  const id = req.params.id;
  
  if (!word && !meaning && !example) {
    return res.status(400).json({ error: '没有提供要更新的字段' });
  }
  
  try {
    // 先检查单词是否存在
    const existingWord = await db.get('SELECT * FROM words WHERE id = ?', [id]);
    if (!existingWord) {
      return res.status(404).json({ error: '未找到该单词' });
    }
    
    // 更新单词信息
    const result = await db.run(
      'UPDATE words SET word = ?, meaning = ?, example = ? WHERE id = ?',
      [
        word || existingWord.word,
        meaning || existingWord.meaning,
        example !== undefined ? example : existingWord.example,
        id
      ]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到该单词或未做任何更改' });
    }
    
    res.json({
      message: '单词更新成功',
      changes: result.changes
    });
  } catch (err) {
    console.error('更新单词失败:', err);
    res.status(500).json({ error: '更新单词失败', details: err.message });
  }
});

/**
 * 删除单词
 */
router.delete('/words/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    const result = await db.run('DELETE FROM words WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到该单词' });
    }
    
    res.json({
      message: '单词删除成功',
      changes: result.changes
    });
  } catch (err) {
    console.error('删除单词失败:', err);
    res.status(500).json({ error: '删除单词失败', details: err.message });
  }
});

/**
 * 搜索单词
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: '请提供搜索关键词' });
  }
  
  try {
    const words = await db.all(
      'SELECT * FROM words WHERE word LIKE ? OR meaning LIKE ?',
      [`%${q}%`, `%${q}%`]
    );
    
    res.json(words);
  } catch (err) {
    console.error('搜索单词失败:', err);
    res.status(500).json({ error: '搜索单词失败', details: err.message });
  }
});

module.exports = router; 