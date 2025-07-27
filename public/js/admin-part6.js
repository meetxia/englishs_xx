/**
 * 爽文带背单词 - 后台管理系统JavaScript
 * 第六部分：模板保存和数据导入功能
 */

// 保存模板
async function saveTemplate(e) {
    e.preventDefault();
    
    const id = document.getElementById('template-id').value.trim();
    const name = document.getElementById('template-name').value.trim();
    const description = document.getElementById('template-description').value.trim();
    const prompt_text = document.getElementById('template-prompt').value.trim();
    const is_active = document.getElementById('template-active').checked ? 1 : 0;
    
    if (!id || !name || !prompt_text) {
        alert('ID、名称和提示词文本为必填项');
        return;
    }
    
    const templateData = { id, name, description, prompt_text, is_active };
    const isEdit = document.getElementById('template-id').disabled;
    
    try {
        const url = isEdit ? `${API_BASE_URL}/theme-templates/${id}` : `${API_BASE_URL}/theme-templates`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `保存失败: ${response.status}`);
        }
        
        // 关闭模态框
        document.getElementById('template-modal').classList.add('hidden');
        
        // 重新加载模板列表
        loadTemplates();
        
        // 更新仪表盘数据
        loadDashboardData();
        
    } catch (error) {
        console.error('保存模板失败:', error);
        handleError(error, '保存模板失败');
    }
}

// 删除模板
async function deleteTemplate(id) {
    if (!confirm(`确定要删除模板 "${id}" 吗？`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/theme-templates/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `删除失败: ${response.status}`);
        }
        
        // 重新加载模板列表
        loadTemplates();
        
        // 更新仪表盘数据
        loadDashboardData();
        
    } catch (error) {
        console.error('删除模板失败:', error);
        handleError(error, '删除模板失败');
    }
}

// 导入默认模板
async function importDefaultTemplates() {
    if (!confirm('确定要导入默认的故事主题模板吗？这将覆盖同名的现有模板。')) {
        return;
    }
    
    try {
        // 显示导入中状态
        const importBtn = document.getElementById('import-default-templates-btn');
        const originalText = importBtn.innerHTML;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 导入中...';
        importBtn.disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/import-default-templates`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `导入失败: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 恢复按钮状态
        importBtn.innerHTML = originalText;
        importBtn.disabled = false;
        
        // 显示结果
        alert(`成功导入 ${result.count || 0} 个默认模板`);
        
        // 重新加载模板列表
        loadTemplates();
        
        // 更新仪表盘数据
        loadDashboardData();
        
    } catch (error) {
        // 恢复按钮状态
        const importBtn = document.getElementById('import-default-templates-btn');
        importBtn.innerHTML = '<i class="fas fa-download mr-1"></i> 导入默认模板';
        importBtn.disabled = false;
        
        console.error('导入默认模板失败:', error);
        handleError(error, '导入默认模板失败');
    }
}

// 初始化数据导入相关事件
function initImportEvents() {
    // 绑定导入按钮事件
    document.getElementById('import-btn').addEventListener('click', importData);
    
    // 绑定CSV上传表单提交事件
    document.getElementById('csv-upload-form').addEventListener('submit', uploadCSV);
    
    // 绑定导入方式切换事件
    document.querySelectorAll('input[name="import-method"]').forEach(radio => {
        radio.addEventListener('change', toggleImportMethod);
    });
    
    // 绑定导入提交按钮事件
    document.getElementById('import-submit-btn').addEventListener('click', submitImport);
}

// 从预设文件导入数据
async function importData() {
    const statusDiv = document.getElementById('import-status');
    statusDiv.textContent = '正在导入...';
    statusDiv.className = 'mt-3 text-sm text-gray-700';

    try {
        const response = await fetch(`${API_BASE_URL}/import`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('导入失败!');
        }
        
        const text = await response.text();
        
        statusDiv.textContent = `成功: ${text}`;
        statusDiv.className = 'mt-3 text-sm text-green-700';
        
        // 重新加载分类数据
        loadCategories();
        
        // 更新仪表盘数据
        loadDashboardData();
    } catch (error) {
        statusDiv.textContent = `错误: ${error.message}`;
        statusDiv.className = 'mt-3 text-sm text-red-700';
        console.error('导入数据失败:', error);
    }
} 