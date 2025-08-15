const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// 配置multer用于处理文件上传
const upload = multer({ 
  dest: path.join(__dirname, '../temp'),
  limits: { fileSize: 10 * 1024 * 1024 } // 限制10MB
});

const readFile = promisify(fs.readFile);

/**
 * 健康检查接口
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
 * 获取所有单词分类
 */
router.get('/words/categories', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (err) {
    console.error('获取分类列表失败:', err);
    res.status(500).json({ error: '获取分类列表失败', details: err.message });
  }
});

/**
 * 获取所有故事主题模板
 */
router.get('/theme-templates', async (req, res) => {
  try {
    const templates = await db.all('SELECT id, name FROM theme_templates WHERE is_active = 1 ORDER BY name');
    res.json(templates);
  } catch (err) {
    console.error('获取故事主题模板失败:', err);
    res.status(500).json({ error: '获取故事主题模板失败', details: err.message });
  }
});

/**
 * 获取管理员用的所有故事主题模板（包含详细信息）
 */
router.get('/admin/theme-templates', async (req, res) => {
  try {
    const templates = await db.all('SELECT * FROM theme_templates ORDER BY name');
    res.json(templates);
  } catch (err) {
    console.error('获取故事主题模板失败:', err);
    res.status(500).json({ error: '获取故事主题模板失败', details: err.message });
  }
});

/**
 * 获取单个故事主题模板
 */
router.get('/admin/theme-templates/:id', async (req, res) => {
  try {
    const template = await db.get('SELECT * FROM theme_templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: '未找到该模板' });
    }
    res.json(template);
  } catch (err) {
    console.error('获取模板详情失败:', err);
    res.status(500).json({ error: '获取模板详情失败', details: err.message });
  }
});

/**
 * 添加故事主题模板
 */
router.post('/admin/theme-templates', async (req, res) => {
  try {
    const { id, name, description, prompt_text, is_active } = req.body;
    
    if (!id || !name || !prompt_text) {
      return res.status(400).json({ error: '缺少必要的字段' });
    }
    
    await db.run(
      'INSERT INTO theme_templates (id, name, description, prompt_text, is_active) VALUES (?, ?, ?, ?, ?)',
      [id, name, description || '', prompt_text, is_active || 1]
    );
    
    res.status(201).json({ message: '模板添加成功' });
  } catch (err) {
    console.error('添加模板失败:', err);
    res.status(500).json({ error: '添加模板失败', details: err.message });
  }
});

/**
 * 更新故事主题模板
 */
router.put('/admin/theme-templates/:id', async (req, res) => {
  try {
    const { name, description, prompt_text, is_active } = req.body;
    const id = req.params.id;
    
    if (!name || !prompt_text) {
      return res.status(400).json({ error: '缺少必要的字段' });
    }
    
    const result = await db.run(
      'UPDATE theme_templates SET name = ?, description = ?, prompt_text = ?, is_active = ? WHERE id = ?',
      [name, description || '', prompt_text, is_active, id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到该模板' });
    }
    
    res.json({ message: '模板更新成功' });
  } catch (err) {
    console.error('更新模板失败:', err);
    res.status(500).json({ error: '更新模板失败', details: err.message });
  }
});

/**
 * 删除故事主题模板
 */
router.delete('/admin/theme-templates/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM theme_templates WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到该模板' });
    }
    
    res.json({ message: '模板删除成功' });
  } catch (err) {
    console.error('删除模板失败:', err);
    res.status(500).json({ error: '删除模板失败', details: err.message });
  }
});

/**
 * 导入默认模板
 */
router.post('/admin/import-default-templates', async (req, res) => {
  try {
    // 这里应该有导入默认模板的逻辑
    // 示例实现：
    const defaultTemplates = [
      { id: 'default', name: '默认', description: '默认爽文风格', prompt_text: '默认提示词...', is_active: 1 },
      { id: 'fantasy', name: '玄幻修仙', description: '修真世界的奇幻故事', prompt_text: '玄幻提示词...', is_active: 1 },
      { id: 'scifi', name: '科幻废土', description: '未来科技世界', prompt_text: '科幻提示词...', is_active: 1 }
    ];
    
    for (const template of defaultTemplates) {
      await db.run(
        'INSERT OR REPLACE INTO theme_templates (id, name, description, prompt_text, is_active) VALUES (?, ?, ?, ?, ?)',
        [template.id, template.name, template.description, template.prompt_text, template.is_active]
      );
    }
    
    res.json({ message: '默认模板导入成功', count: defaultTemplates.length });
  } catch (err) {
    console.error('导入默认模板失败:', err);
    res.status(500).json({ error: '导入默认模板失败', details: err.message });
  }
});

/**
 * 获取单词分类下的所有单词
 */
router.get('/words/category/:categoryId', async (req, res) => {
  try {
    const words = await db.all('SELECT * FROM words WHERE category_id = ?', [req.params.categoryId]);
    res.json(words);
  } catch (err) {
    console.error('获取分类单词失败:', err);
    res.status(500).json({ error: '获取分类单词失败', details: err.message });
  }
});

/**
 * 获取单词分类下的单词（带分页）
 */
router.get('/words/:categoryId/page/:page', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.params.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 100;
    const offset = (page - 1) * pageSize;
    
    // 获取总数
    const countResult = await db.get('SELECT COUNT(*) as total FROM words WHERE category_id = ?', [categoryId]);
    const total = countResult.total;
    const totalPages = Math.ceil(total / pageSize);
    
    // 获取当前页数据
    const words = await db.all(
      'SELECT * FROM words WHERE category_id = ? ORDER BY en LIMIT ? OFFSET ?',
      [categoryId, pageSize, offset]
    );
    
    res.json({
      words,
      pagination: {
        total,
        pageSize,
        currentPage: page,
        totalPages
      }
    });
  } catch (err) {
    console.error('获取分页单词数据失败:', err);
    res.status(500).json({ error: '获取分页单词数据失败', details: err.message });
  }
});

/**
 * 获取单个单词详情
 */
router.get('/words/detail/:id', async (req, res) => {
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
  const { en, phonetic, pos, cn, category_id } = req.body;
  
  if (!en || !category_id) {
    return res.status(400).json({ error: '缺少必要的字段' });
  }
  
  try {
    const result = await db.run(
      'INSERT INTO words (en, phonetic, pos, cn, category_id) VALUES (?, ?, ?, ?, ?)',
      [en, phonetic || '', pos || '', cn || '', category_id]
    );
    
    res.status(201).json({
      id: result.lastID,
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
  const { en, phonetic, pos, cn, category_id } = req.body;
  const id = req.params.id;
  
  if (!en && !category_id) {
    return res.status(400).json({ error: '缺少必要的字段' });
  }
  
  try {
    // 先检查单词是否存在
    const existingWord = await db.get('SELECT * FROM words WHERE id = ?', [id]);
    if (!existingWord) {
      return res.status(404).json({ error: '未找到该单词' });
    }
    
    // 更新单词信息
    const result = await db.run(
      'UPDATE words SET en = ?, phonetic = ?, pos = ?, cn = ?, category_id = ? WHERE id = ?',
      [
        en || existingWord.en,
        phonetic !== undefined ? phonetic : existingWord.phonetic,
        pos !== undefined ? pos : existingWord.pos,
        cn !== undefined ? cn : existingWord.cn,
        category_id || existingWord.category_id,
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
 * 批量删除单词
 */
router.post('/words/batch-delete', async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请提供要删除的单词ID列表' });
  }
  
  try {
    // 使用参数化查询的方式批量删除
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`DELETE FROM words WHERE id IN (${placeholders})`, ids);
    
    res.json({
      message: '批量删除成功',
      deletedCount: result.changes
    });
  } catch (err) {
    console.error('批量删除单词失败:', err);
    res.status(500).json({ error: '批量删除单词失败', details: err.message });
  }
});

/**
 * 清理分类中的重复单词
 */
router.post('/words/categories/:categoryId/clean-duplicates', async (req, res) => {
  const categoryId = req.params.categoryId;
  
  try {
    // 查找分类中的所有单词，按英文单词分组，保留ID最小的记录
    const duplicates = await db.all(`
      SELECT w1.id
      FROM words w1
      JOIN (
        SELECT en, MIN(id) as min_id
        FROM words
        WHERE category_id = ?
        GROUP BY en
        HAVING COUNT(*) > 1
      ) w2 ON w1.en = w2.en
      WHERE w1.category_id = ? AND w1.id != w2.min_id
    `, [categoryId, categoryId]);
    
    if (duplicates.length === 0) {
      return res.json({
        message: '没有找到重复的单词',
        deletedCount: 0
      });
    }
    
    // 删除重复的单词
    const ids = duplicates.map(item => item.id);
    const placeholders = ids.map(() => '?').join(',');
    const result = await db.run(`DELETE FROM words WHERE id IN (${placeholders})`, ids);
    
    res.json({
      message: '重复单词清理成功',
      deletedCount: result.changes
    });
  } catch (err) {
    console.error('清理重复单词失败:', err);
    res.status(500).json({ error: '清理重复单词失败', details: err.message });
  }
});

/**
 * 清空分类下的所有单词
 */
router.delete('/words/categories/:categoryId/words', async (req, res) => {
  const categoryId = req.params.categoryId;
  
  try {
    const result = await db.run('DELETE FROM words WHERE category_id = ?', [categoryId]);
    
    res.json({
      message: '清空分类单词成功',
      deletedCount: result.changes
    });
  } catch (err) {
    console.error('清空分类单词失败:', err);
    res.status(500).json({ error: '清空分类单词失败', details: err.message });
  }
});

/**
 * 添加新分类
 */
router.post('/words/categories', async (req, res) => {
  const { id, name, description } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: '缺少必要的字段' });
  }
  
  try {
    await db.run(
      'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
      [id, name, description || '']
    );
    
    res.status(201).json({
      message: '分类添加成功'
    });
  } catch (err) {
    console.error('添加分类失败:', err);
    res.status(500).json({ error: '添加分类失败', details: err.message });
  }
});

/**
 * 更新分类
 */
router.put('/words/categories/:id', async (req, res) => {
  const { id, name, description } = req.body;
  const oldId = req.params.id;
  
  if (!id || !name) {
    return res.status(400).json({ error: '缺少必要的字段' });
  }
  
  try {
    if (id !== oldId) {
      // 如果ID发生变化，需要同时更新所有关联的单词
      await db.run('BEGIN TRANSACTION');
      
      // 更新分类信息
      await db.run(
        'UPDATE categories SET id = ?, name = ?, description = ? WHERE id = ?',
        [id, name, description || '', oldId]
      );
      
      // 更新关联单词的分类ID
      await db.run(
        'UPDATE words SET category_id = ? WHERE category_id = ?',
        [id, oldId]
      );
      
      await db.run('COMMIT');
    } else {
      // 如果ID没有变化，只需更新分类信息
      await db.run(
        'UPDATE categories SET name = ?, description = ? WHERE id = ?',
        [name, description || '', id]
      );
    }
    
    res.json({
      message: '分类更新成功'
    });
  } catch (err) {
    if (id !== oldId) {
      // 如果发生错误且涉及事务，需要回滚
      await db.run('ROLLBACK').catch(console.error);
    }
    
    console.error('更新分类失败:', err);
    res.status(500).json({ error: '更新分类失败', details: err.message });
  }
});

/**
 * 删除分类
 */
router.delete('/words/categories/:id', async (req, res) => {
  const id = req.params.id;
  
  try {
    await db.run('BEGIN TRANSACTION');
    
    // 先删除该分类下的所有单词
    await db.run('DELETE FROM words WHERE category_id = ?', [id]);
    
    // 再删除分类本身
    const result = await db.run('DELETE FROM categories WHERE id = ?', [id]);
    
    await db.run('COMMIT');
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '未找到该分类' });
    }
    
    res.json({
      message: '分类删除成功',
      changes: result.changes
    });
  } catch (err) {
    await db.run('ROLLBACK').catch(console.error);
    
    console.error('删除分类失败:', err);
    res.status(500).json({ error: '删除分类失败', details: err.message });
  }
});

/**
 * 保存系统设置
 */
router.post('/admin/settings', async (req, res) => {
  const { geminiApiKey, qwenApiKey, deepseekApiKey } = req.body;
  
  try {
    // 更新 Gemini API 密钥
    if (geminiApiKey !== undefined) {
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['gemini_api_key', geminiApiKey]
      );
    }
    
    // 更新阿里云千问 API 密钥
    if (qwenApiKey !== undefined) {
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['qwen_api_key', qwenApiKey]
      );
    }
    
    // 更新DeepSeek API 密钥
    if (deepseekApiKey !== undefined) {
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['deepseek_api_key', deepseekApiKey]
      );
    }
    
    res.json({
      message: '设置保存成功'
    });
  } catch (err) {
    console.error('保存设置失败:', err);
    res.status(500).json({ error: '保存设置失败', details: err.message });
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
      'SELECT * FROM words WHERE en LIKE ? OR cn LIKE ?',
      [`%${q}%`, `%${q}%`]
    );
    
    res.json(words);
  } catch (err) {
    console.error('搜索单词失败:', err);
    res.status(500).json({ error: '搜索单词失败', details: err.message });
  }
});

/**
 * 从CSV导入单词
 */
router.post('/import-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const { categoryId, isNewCategory, categoryName } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: '缺少分类ID' });
    }

    // 如果是新分类，先创建分类
    if (isNewCategory === 'true' && categoryName) {
      try {
        await db.run(
          'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
          [categoryId, categoryName, '']
        );
        console.log(`创建新分类: ${categoryId} - ${categoryName}`);
      } catch (err) {
        console.error('创建分类失败:', err);
        return res.status(500).json({ error: '创建分类失败', details: err.message });
      }
    }

    // 读取上传的CSV文件
    const filePath = req.file.path;
    const fileContent = await readFile(filePath, 'utf-8');
    
    // 删除临时文件
    fs.unlink(filePath, err => {
      if (err) console.error('删除临时文件失败:', err);
    });

    // 解析CSV内容
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
    const words = [];
    
    console.log(`开始解析CSV文件，总共 ${lines.length} 行数据`);
    
    for (const line of lines) {
      try {
        const parts = line.split(',');
        
        if (parts.length < 2) {
          console.warn(`忽略格式不正确的行: ${line}`);
          continue;
        }
        
        let en = parts[0].trim();
        let phonetic = '';
        let pos = '';
        let cn = '';
        
        // 根据不同CSV格式处理
        // 1. 检查是否为三列格式，第二列可能是音标
        if (parts.length >= 3) {
          const secondPart = parts[1].trim();
          // 检查第二列是否为音标格式（常见的音标格式都带有/,[ 等符号）
          const isPhoneticColumn = /^[\[\(\/].*[\]\)\/]$/.test(secondPart) || 
                                 /^[a-zA-Z\s'ɑɒæɛəɜɪɔʊʌθðʃʒŋ\:\,\.\'\!\?\-]+$/.test(secondPart);
          
          if (isPhoneticColumn) {
            // 如果第二列是音标，则处理音标
            phonetic = secondPart.replace(/^[\[\(\/]|[\]\)\/]$/g, '').trim(); // 移除音标周围的[]/()
            cn = parts.slice(2).join(',').trim(); // 剩余部分为中文释义
          } else {
            // 如果第二列不是音标，那么可能是中文释义的一部分
            cn = parts.slice(1).join(',').trim();
            
            // 尝试从中文释义中提取音标
            const phoneticMatch = cn.match(/[\[\(\/]([^[\]\)\/]+)[\]\)\/]/);
            if (phoneticMatch) {
              phonetic = phoneticMatch[1].trim();
              cn = cn.replace(/[\[\(\/][^[\]\)\/]+[\]\)\/]/, '').trim();
            }
          }
        } else {
          // 只有两列的情况：英文,中文释义
          cn = parts[1].trim();
          
          // 尝试从中文释义中提取音标
          const phoneticMatch = cn.match(/[\[\(\/]([^[\]\)\/]+)[\]\)\/]/);
          if (phoneticMatch) {
            phonetic = phoneticMatch[1].trim();
            cn = cn.replace(/[\[\(\/][^[\]\)\/]+[\]\)\/]/, '').trim();
          }
        }
        
        // 从中文释义中提取词性
        const posMatch = cn.match(/^([a-z]+\.|adj\.|adv\.|n\.|v\.|vt\.|vi\.|prep\.|conj\.|pron\.|interj\.|art\.|num\.|a\.|aux\.|abbr\.|phr\.|pl\.|sing\.)/i);
        if (posMatch) {
          pos = posMatch[0].trim();
          // 可以选择是否从cn中移除词性
          // cn = cn.substring(posMatch[0].length).trim();
        }
        
        words.push({ en, phonetic, pos, cn, category_id: categoryId });
      } catch (err) {
        console.error(`解析行失败: ${line}`, err);
        // 继续处理其他行
      }
    }

    // 插入单词到数据库
    let insertedCount = 0;
    for (const word of words) {
      try {
        await db.run(
          'INSERT INTO words (en, phonetic, pos, cn, category_id) VALUES (?, ?, ?, ?, ?)',
          [word.en, word.phonetic, word.pos, word.cn, word.category_id]
        );
        insertedCount++;
      } catch (err) {
        console.error(`插入单词 ${word.en} 失败:`, err);
        // 继续处理其他单词，不中断整个流程
      }
    }

    // 获取分类名称
    const category = await db.get('SELECT name FROM categories WHERE id = ?', [categoryId]);
    const actualCategoryName = category ? category.name : categoryId;

    res.json({
      wordCount: insertedCount,
      categoryName: actualCategoryName
    });
    
  } catch (err) {
    console.error('导入CSV文件失败:', err);
    res.status(500).json({ error: '导入CSV文件失败', details: err.message });
  }
});

/**
 * 从预设词库导入单词
 */
router.post('/import', async (req, res) => {
  // 这里应该处理从预设词库导入的逻辑
  res.status(200).send('导入成功');
});

/**
 * AI 生成内容
 */
router.post('/generate', async (req, res) => {
  const { prompt, isJson, model } = req.body;
  console.log('API请求:', { model, isJson, promptLength: prompt?.length || 0 });

  if (!prompt) {
    return res.status(400).json({ error: '缺少提示词' });
  }

  try {
    // 获取API密钥
    let apiKey;
    if (model === 'qwen') {
      // 尝试从数据库获取阿里云千问API密钥
      const setting = await db.get('SELECT value FROM settings WHERE key = ?', ['qwen_api_key']);
      apiKey = setting ? setting.value : process.env.QIANWEN_API_KEY || 'sk-bb800a93f0fa4ebbb306a4c87f2de724';
      console.log('使用千问API密钥:', apiKey ? `${apiKey.substring(0, 8)}...` : '未配置');
    } else if (model === 'gemini') {
      // 尝试从数据库获取Google Gemini API密钥
      const setting = await db.get('SELECT value FROM settings WHERE key = ?', ['gemini_api_key']);
      apiKey = setting ? setting.value : process.env.GEMINI_API_KEY;
      console.log('使用Gemini API密钥:', apiKey ? `${apiKey.substring(0, 8)}...` : '未配置');
    } else if (model === 'deepseek') {
      // 使用DeepSeek-V3模型API密钥
      const setting = await db.get('SELECT value FROM settings WHERE key = ?', ['deepseek_api_key']);
      apiKey = setting ? setting.value : process.env.DEEPSEEK_API_KEY || 'sk-osdyhthiavdtkhwpzpocwkqlxhdvwjocopepvrtblgubhzec';
      console.log('使用DeepSeek API密钥:', apiKey ? `${apiKey.substring(0, 8)}...` : '未配置');
    } else {
      return res.status(400).json({ error: '不支持的模型类型' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: `${model} API密钥未配置` });
    }

    let response;
    if (model === 'qwen') {
      // 调用阿里云千问API
      console.log('开始调用阿里云千问API...');
      const payload = {
        model: 'qwen-max',
        input: {
          prompt: prompt
        },
        parameters: {
          temperature: 0.6,
          result_format: isJson ? 'json' : 'text'
        }
      };
      
      console.log('千问API请求参数:', JSON.stringify(payload).substring(0, 200) + '...');
      
      try {
        response = await axios.post('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 60000 // 60秒超时
        });
        
        console.log('千问API响应状态:', response.status);
        console.log('千问API响应数据结构:', Object.keys(response.data || {}));
        
      } catch (apiError) {
        console.error('千问API调用失败:', apiError.message);
        console.error('错误响应:', apiError.response?.data);
        
        // 返回更详细的错误信息
        return res.status(500).json({
          error: '调用阿里云千问API失败',
          details: apiError.response?.data?.message || apiError.message
        });
      }

      // 处理阿里云千问API的响应
      if (response.data && response.data.output && response.data.output.text) {
        console.log('千问API成功返回文本，长度:', response.data.output.text.length);
        return res.json({ text: response.data.output.text });
      } else {
        console.error('千问API返回无效响应:', response.data);
        throw new Error('阿里云千问API返回无效响应');
      }
    } else if (model === 'gemini') {
      // 调用Google Gemini API
      console.log('开始调用Google Gemini API...');
      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6 }
      };
      
      if (isJson) {
        payload.generationConfig.responseMimeType = "application/json";
      }
      
      try {
        response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          payload,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000 // 60秒超时
          }
        );
      } catch (apiError) {
        console.error('Gemini API调用失败:', apiError.message);
        console.error('错误响应:', apiError.response?.data);
        
        // 返回更详细的错误信息
        return res.status(500).json({
          error: '调用Google Gemini API失败',
          details: apiError.response?.data?.error?.message || apiError.message
        });
      }

      // 处理Google Gemini API的响应
      if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log('Gemini API成功返回文本，长度:', response.data.candidates[0].content.parts[0].text.length);
        return res.json({ text: response.data.candidates[0].content.parts[0].text });
      } else {
        console.error('Gemini API返回无效响应:', response.data);
        throw new Error('Google Gemini API返回无效响应');
      }
    } else if (model === 'deepseek') {
      // 调用DeepSeek-V3 API
      console.log('开始调用DeepSeek-V3 API...');
      const payload = {
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: prompt }]
      };
      
      if (isJson) {
        payload.response_format = { type: "json_object" };
      }
      
      try {
        response = await axios.post(
          'https://api.siliconflow.cn/v1/chat/completions',
          payload,
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            timeout: 60000 // 60秒超时
          }
        );
        console.log('DeepSeek API响应状态:', response.status);
      } catch (apiError) {
        console.error('DeepSeek API调用失败:', apiError.message);
        console.error('错误响应:', apiError.response?.data);
        
        return res.status(500).json({
          error: '调用DeepSeek-V3 API失败',
          details: apiError.response?.data?.error?.message || apiError.message
        });
      }

      // 处理DeepSeek API的响应
      if (response.data && response.data.choices && response.data.choices[0]?.message?.content) {
        console.log('DeepSeek API成功返回文本，长度:', response.data.choices[0].message.content.length);
        return res.json({ text: response.data.choices[0].message.content });
      } else {
        console.error('DeepSeek API返回无效响应:', response.data);
        throw new Error('DeepSeek-V3 API返回无效响应');
      }
    }
  } catch (error) {
    console.error('调用AI模型失败:', error);
    res.status(500).json({ 
      error: '调用AI模型失败', 
      details: error.response?.data?.message || error.message 
    });
  }
});

/**
 * 生成高质量卡片图片/PDF - 新技术方案
 */
router.post('/generate-card', async (req, res) => {
  console.log('🎨 收到卡片生成请求');
  const { htmlContent, options } = req.body;

  // 参数验证
  if (!htmlContent || !options) {
    return res.status(400).json({ 
      error: '缺少必要参数',
      details: 'htmlContent 和 options 参数是必需的'
    });
  }

  try {
    // 动态导入卡片生成器（避免启动时立即加载 Puppeteer）
    const cardGenerator = require('../services/cardGenerator');
    
    console.log('📋 生成选项:', {
      output: options.output,
      width: options.width,
      height: options.height,
      format: options.format,
      preview: options.preview
    });

    // 生成文件
    const buffer = await cardGenerator.generateOutput(htmlContent, options);
    
    // 设置响应头
    if (options.output === 'pdf') {
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${options.filename || 'card'}.pdf"`);
    } else {
      res.contentType('image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${options.filename || 'card'}.png"`);
    }

    // 发送文件
    res.send(buffer);
    console.log('✅ 卡片生成成功并已发送');

  } catch (error) {
    console.error('❌ 卡片生成失败:', error);
    res.status(500).json({ 
      error: '卡片生成失败', 
      details: error.message 
    });
  }
});

module.exports = router; 