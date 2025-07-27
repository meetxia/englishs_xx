/**
 * 爽文带背单词 - 后台管理系统JavaScript
 * 第四部分：单词编辑和删除功能
 */

// 跳转到指定页
function goToPage(page) {
    if (page < 1 || page > totalPages || !currentCategoryId) {
        return;
    }
    
    currentPage = page;
    document.getElementById('page-input').value = page;
    loadWordsWithPagination(currentCategoryId, currentPage, pageSize);
}

// 全选/取消全选单词
function toggleAllWords(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.word-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// 编辑单词
async function editWord(id) {
    if (!id) {
        alert('单词ID无效');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/words/${id}`);
        if (!response.ok) {
            throw new Error(`获取单词数据失败: ${response.status}`);
        }
        
        const word = await response.json();
        if (!word || !word.id) {
            throw new Error('获取到的单词数据无效');
        }
        
        document.getElementById('word-id').value = word.id;
        document.getElementById('word-en').value = word.en || '';
        document.getElementById('word-phonetic').value = word.phonetic || '';
        document.getElementById('word-pos').value = word.pos || '';
        document.getElementById('word-cn').value = word.cn || '';
        document.getElementById('word-category').value = word.category_id || '';
        
        document.getElementById('word-modal').classList.remove('hidden');
    } catch (error) {
        console.error('加载单词数据失败:', error);
        handleError(error, '加载单词数据失败');
    }
}

// 保存单词
async function saveWord(e) {
    e.preventDefault();
    
    const id = document.getElementById('word-id').value;
    const en = document.getElementById('word-en').value.trim();
    const phonetic = document.getElementById('word-phonetic').value.trim();
    const pos = document.getElementById('word-pos').value.trim();
    const cn = document.getElementById('word-cn').value.trim();
    const category_id = document.getElementById('word-category').value;
    
    if (!en || !category_id) {
        alert('英文单词和所属分类为必填项');
        return;
    }
    
    const wordData = { en, phonetic, pos, cn, category_id };
    
    try {
        let url = `${API_BASE_URL}/words`;
        let method = 'POST';
        
        if (id) {
            url = `${API_BASE_URL}/words/${id}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wordData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `保存失败: ${response.status}`);
        }
        
        document.getElementById('word-modal').classList.add('hidden');
        
        // 重新加载当前页
        if (currentCategoryId) {
            loadWordsWithPagination(currentCategoryId, currentPage, pageSize);
        }
    } catch (error) {
        console.error('保存单词失败:', error);
        handleError(error, '保存单词失败');
    }
}

// 删除单词
async function deleteWord(id) {
    if (!id) {
        alert('单词ID无效');
        return;
    }
    
    if (!confirm('确定要删除这个单词吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/words/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `删除失败: ${response.status}`);
        }
        
        // 重新加载当前页
        if (currentCategoryId) {
            loadWordsWithPagination(currentCategoryId, currentPage, pageSize);
        }
    } catch (error) {
        console.error('删除单词失败:', error);
        handleError(error, '删除单词失败');
    }
}

// 清理重复单词
async function cleanDuplicateWords() {
    const categoryId = currentCategoryId;
    
    if (!categoryId) {
        alert('请先选择一个词库分类');
        return;
    }
    
    if (!confirm('确定要清理该分类下的重复单词吗？此操作将保留每个单词的第一个出现，删除其余重复项。')) {
        return;
    }
    
    try {
        // 显示加载状态
        const cleanBtn = document.getElementById('clean-duplicates-btn');
        const originalText = cleanBtn.innerHTML;
        cleanBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 清理中...';
        cleanBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/words/clean-duplicates/${categoryId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('清理失败');
        }
        
        const result = await response.json();
        
        // 恢复按钮状态
        cleanBtn.innerHTML = originalText;
        cleanBtn.disabled = false;
        
        // 显示结果
        if (result.deletedCount > 0) {
            alert(`清理完成！已删除 ${result.deletedCount} 个重复单词。`);
        } else {
            alert('没有找到需要清理的重复单词。');
        }
        
        // 重新加载单词列表
        loadWordsWithPagination(categoryId, currentPage, pageSize);
    } catch (error) {
        // 恢复按钮状态
        const cleanBtn = document.getElementById('clean-duplicates-btn');
        cleanBtn.innerHTML = '<i class="fas fa-broom mr-1"></i> 清理重复单词';
        cleanBtn.disabled = false;
        
        handleError(error, '清理重复单词失败');
    }
}

// 清空分类单词
async function clearCategoryWords() {
    const categoryId = currentCategoryId;
    
    if (!categoryId) {
        alert('请先选择一个词库分类');
        return;
    }
    
    const categoryName = getCategoryName(categoryId);
    if (!confirm(`确定要清空"${categoryName}"分类下的所有单词吗？此操作不可恢复！`)) {
        return;
    }
    
    // 二次确认
    if (!confirm('警告：此操作将永久删除该分类下的所有单词数据，确定要继续吗？')) {
        return;
    }
    
    try {
        // 显示加载状态
        const clearBtn = document.getElementById('clear-category-btn');
        const originalText = clearBtn.innerHTML;
        clearBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 清空中...';
        clearBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/words/category/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('清空失败');
        }
        
        const result = await response.json();
        
        // 恢复按钮状态
        clearBtn.innerHTML = originalText;
        clearBtn.disabled = false;
        
        // 显示结果
        alert(`清空成功！已删除 ${result.deletedCount || 0} 个单词。`);
        
        // 重置到第一页并重新加载
        currentPage = 1;
        document.getElementById('page-input').value = 1;
        loadWordsWithPagination(categoryId, currentPage, pageSize);
    } catch (error) {
        // 恢复按钮状态
        const clearBtn = document.getElementById('clear-category-btn');
        clearBtn.innerHTML = '<i class="fas fa-trash-alt mr-1"></i> 清空分类单词';
        clearBtn.disabled = false;
        
        handleError(error, '清空分类单词失败');
    }
}

// 批量删除单词
async function batchDeleteWords() {
    const selectedIds = [];
    document.querySelectorAll('.word-checkbox:checked').forEach(checkbox => {
        try {
            // 尝试将ID转换为整数，如果失败则使用原始字符串
            const id = checkbox.dataset.id;
            const parsedId = parseInt(id);
            selectedIds.push(isNaN(parsedId) ? id : parsedId);
        } catch (error) {
            console.error('解析单词ID失败:', error);
        }
    });
    
    if (selectedIds.length === 0) {
        alert('请先选择要删除的单词');
        return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个单词吗？`)) {
        return;
    }
    
    try {
        // 显示加载状态
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        const originalText = batchDeleteBtn.innerHTML;
        batchDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 删除中...';
        batchDeleteBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/words/batch`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: selectedIds })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `批量删除失败: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 恢复按钮状态
        batchDeleteBtn.innerHTML = originalText;
        batchDeleteBtn.disabled = false;
        
        // 显示结果
        const deletedCount = result.deletedCount || 0;
        alert(`删除成功！已删除 ${deletedCount} 个单词。`);
        
        // 重新加载当前页
        loadWordsWithPagination(currentCategoryId, currentPage, pageSize);
    } catch (error) {
        // 恢复按钮状态
        const batchDeleteBtn = document.getElementById('batch-delete-btn');
        batchDeleteBtn.innerHTML = '<i class="fas fa-trash mr-1"></i> 批量删除';
        batchDeleteBtn.disabled = false;
        
        console.error('批量删除单词失败:', error);
        handleError(error, '批量删除单词失败');
    }
} 