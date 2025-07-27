/**
 * 爽文带背单词 - 后台管理系统JavaScript
 * 第七部分：CSV导入和工具函数
 */

// 切换导入方式
function toggleImportMethod() {
    const method = document.querySelector('input[name="import-method"]:checked').value;
    
    if (method === 'csv') {
        document.getElementById('csv-import-section').classList.remove('hidden');
        document.getElementById('text-import-section').classList.add('hidden');
    } else {
        document.getElementById('csv-import-section').classList.add('hidden');
        document.getElementById('text-import-section').classList.remove('hidden');
    }
}

// 上传并导入CSV文件
async function uploadCSV(e) {
    e.preventDefault();
    
    const statusDiv = document.getElementById('csv-import-status');
    const fileInput = document.getElementById('csv-file');
    const categorySelect = document.getElementById('category-select');
    const newCategoryId = document.getElementById('new-category-id');
    const newCategoryName = document.getElementById('new-category-name');
    
    // 检查是否选择了文件
    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.textContent = '请选择CSV文件';
        statusDiv.className = 'mt-3 text-sm text-red-700';
        return;
    }
    
    // 检查分类信息
    let categoryId = categorySelect.value;
    let isNewCategory = false;
    
    if (!categoryId) {
        // 检查是否提供了新分类信息
        categoryId = newCategoryId.value.trim();
        const categoryName = newCategoryName.value.trim();
        
        if (!categoryId || !categoryName) {
            statusDiv.textContent = '请选择现有分类或提供新分类信息';
            statusDiv.className = 'mt-3 text-sm text-red-700';
            return;
        }
        
        isNewCategory = true;
    }
    
    // 构建FormData对象
    const formData = new FormData();
    formData.append('csvFile', fileInput.files[0]);
    formData.append('categoryId', categoryId);
    
    if (isNewCategory) {
        formData.append('categoryName', newCategoryName.value.trim());
        formData.append('isNewCategory', 'true');
    }
    
    // 显示上传中状态
    statusDiv.textContent = '正在上传并处理CSV文件，请稍候...';
    statusDiv.className = 'mt-3 text-sm text-gray-700';
    
    try {
        // 发送请求
        const response = await fetch(`${API_BASE_URL}/import-csv`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '上传CSV失败');
        }
        
        const result = await response.json();
        
        statusDiv.textContent = `成功导入${result.wordCount}个单词到"${result.categoryName}"分类`;
        statusDiv.className = 'mt-3 text-sm text-green-700';
        
        // 重置表单
        fileInput.value = '';
        
        // 如果是新分类，重置输入框
        if (isNewCategory) {
            newCategoryId.value = '';
            newCategoryName.value = '';
        }
        
        // 重新加载分类数据
        loadCategories();
        
        // 更新仪表盘数据
        loadDashboardData();
    } catch (error) {
        statusDiv.textContent = `错误: ${error.message}`;
        statusDiv.className = 'mt-3 text-sm text-red-700';
        console.error('上传CSV失败:', error);
    }
}

// 提交导入
async function submitImport() {
    const categoryId = document.getElementById('import-category').value;
    const method = document.querySelector('input[name="import-method"]:checked').value;
    const statusDiv = document.getElementById('import-status');
    
    if (!categoryId) {
        statusDiv.textContent = '请先选择一个分类';
        statusDiv.className = 'mt-3 text-sm text-red-700';
        return;
    }
    
    // 显示加载状态
    const importBtn = document.getElementById('import-submit-btn');
    const originalText = importBtn.textContent;
    importBtn.textContent = '导入中...';
    importBtn.disabled = true;
    statusDiv.textContent = '正在处理...';
    statusDiv.className = 'mt-3 text-sm text-gray-700';
    
    try {
        if (method === 'csv') {
            // CSV文件导入
            const fileInput = document.getElementById('import-csv-file');
            
            if (!fileInput.files || fileInput.files.length === 0) {
                statusDiv.textContent = '请选择CSV文件';
                statusDiv.className = 'mt-3 text-sm text-red-700';
                importBtn.textContent = originalText;
                importBtn.disabled = false;
                return;
            }
            
            const formData = new FormData();
            formData.append('csvFile', fileInput.files[0]);
            formData.append('categoryId', categoryId);
            formData.append('isNewCategory', 'false'); // 使用现有分类
            
            const response = await fetch(`${API_BASE_URL}/import-csv`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '导入失败');
            }
            
            const result = await response.json();
            
            statusDiv.textContent = `成功导入${result.wordCount}个单词`;
            statusDiv.className = 'mt-3 text-sm text-green-700';
            
            // 重新加载单词列表
            currentPage = 1; // 重置到第一页
            loadWordsWithPagination(categoryId, currentPage, pageSize);
            
            // 3秒后自动关闭模态框
            setTimeout(() => {
                document.getElementById('import-words-modal').classList.add('hidden');
            }, 3000);
            
        } else {
            // 文本框导入
            const textInput = document.getElementById('import-text').value.trim();
            
            if (!textInput) {
                statusDiv.textContent = '请输入单词数据';
                statusDiv.className = 'mt-3 text-sm text-red-700';
                importBtn.textContent = originalText;
                importBtn.disabled = false;
                return;
            }
            
            // 将文本转换为CSV格式
            const lines = textInput.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                statusDiv.textContent = '没有有效的单词数据';
                statusDiv.className = 'mt-3 text-sm text-red-700';
                importBtn.textContent = originalText;
                importBtn.disabled = false;
                return;
            }
            
            // 创建一个Blob对象，模拟CSV文件
            const csvContent = lines.join('\n');
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvFile = new File([csvBlob], 'imported_words.csv', { type: 'text/csv' });
            
            const formData = new FormData();
            formData.append('csvFile', csvFile);
            formData.append('categoryId', categoryId);
            formData.append('isNewCategory', 'false'); // 使用现有分类
            
            const response = await fetch(`${API_BASE_URL}/import-csv`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '导入失败');
            }
            
            const result = await response.json();
            
            statusDiv.textContent = `成功导入${result.wordCount}个单词`;
            statusDiv.className = 'mt-3 text-sm text-green-700';
            
            // 重新加载单词列表
            currentPage = 1; // 重置到第一页
            loadWordsWithPagination(categoryId, currentPage, pageSize);
            
            // 3秒后自动关闭模态框
            setTimeout(() => {
                document.getElementById('import-words-modal').classList.add('hidden');
            }, 3000);
        }
    } catch (error) {
        statusDiv.textContent = `错误: ${error.message}`;
        statusDiv.className = 'mt-3 text-sm text-red-700';
        console.error('导入失败:', error);
    } finally {
        importBtn.textContent = originalText;
        importBtn.disabled = false;
    }
}

// 模态框通用事件绑定
document.addEventListener('DOMContentLoaded', () => {
    // 绑定所有通用模态框取消按钮
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 找到最近的模态框并隐藏
            const modal = btn.closest('[id$="-modal"]');
            if (modal) {
                modal.classList.add('hidden');
            }
        });
    });
}); 