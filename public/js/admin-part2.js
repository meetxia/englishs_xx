/**
 * 爽文带背单词 - 后台管理系统JavaScript
 * 第二部分：分类管理功能
 */

// 全局变量
window.categories = [];

// 加载分类数据
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/words/categories`);
        if (!response.ok) {
            throw new Error(`加载分类失败: ${response.status}`);
        }
        
        const categories = await response.json();
        // 确保categories是数组
        if (!Array.isArray(categories)) {
            console.error('加载分类失败: 返回数据不是数组');
            document.getElementById('categories-table-body').innerHTML = 
                '<tr><td colspan="4" class="py-4 text-center text-red-500">加载失败: 数据格式错误</td></tr>';
            return;
        }
        
        window.categories = categories; // 存储到全局变量
        
        // 更新分类表格
        const tableBody = document.getElementById('categories-table-body');
        if (categories.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-gray-500">暂无数据</td></tr>';
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            if (!category || !category.id) return; // 跳过无效数据
            
            const safeId = category.id.replace(/'/g, "\\'"); // 转义单引号
            html += `
                <tr>
                    <td class="py-2 px-4 border-b">${category.id}</td>
                    <td class="py-2 px-4 border-b">${category.name || ''}</td>
                    <td class="py-2 px-4 border-b">${category.description || ''}</td>
                    <td class="py-2 px-4 border-b">
                        <button class="text-blue-500 hover:text-blue-700 mr-2" onclick="viewWords('${safeId}')">查看单词</button>
                        <button class="text-green-500 hover:text-green-700 mr-2" onclick="editCategory('${safeId}')">编辑</button>
                        <button class="text-red-500 hover:text-red-700" onclick="deleteCategory('${safeId}')">删除</button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
        
        // 更新分类下拉框
        updateCategoryDropdowns(categories);
        
    } catch (error) {
        console.error('加载分类失败:', error);
        document.getElementById('categories-table-body').innerHTML = 
            '<tr><td colspan="4" class="py-4 text-center text-red-500">加载失败</td></tr>';
        handleError(error, '加载分类失败');
    }
}

// 加载分类数据（用于导入页面）
async function loadCategoriesForImport() {
    try {
        const response = await fetch(`${API_BASE_URL}/words/categories`);
        if (!response.ok) {
            throw new Error(`加载分类失败: ${response.status}`);
        }
        
        const categories = await response.json();
        
        // 更新分类下拉框
        const categorySelect = document.getElementById('category-select');
        
        // 清空现有选项，但保留第一个
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // 添加新选项
        categories.forEach(category => {
            const option = new Option(category.name, category.id);
            categorySelect.add(option);
        });
        
    } catch (error) {
        console.error('加载分类失败:', error);
        handleError(error, '加载分类失败');
    }
}

// 更新分类下拉框
function updateCategoryDropdowns(data) {
    if (!Array.isArray(data)) {
        console.error('更新分类下拉框失败: 数据不是数组');
        return;
    }
    
    const categoryFilter = document.getElementById('category-filter');
    const wordCategory = document.getElementById('word-category');
    
    if (!categoryFilter || !wordCategory) {
        console.error('更新分类下拉框失败: 找不到下拉框元素');
        return;
    }
    
    // 清空现有选项，但保留第一个
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    while (wordCategory.options.length > 1) {
        wordCategory.remove(1);
    }
    
    // 添加新选项
    data.forEach(category => {
        if (!category || !category.id || !category.name) return; // 跳过无效数据
        
        try {
            const option1 = new Option(category.name, category.id);
            const option2 = new Option(category.name, category.id);
            categoryFilter.add(option1);
            wordCategory.add(option2);
        } catch (error) {
            console.error(`添加分类选项失败: ${category.id}`, error);
        }
    });
}

// 查看分类下的单词
function viewWords(categoryId) {
    // 切换到单词管理标签
    document.querySelector('.sidebar-item[href="#word-data"]').click();
    
    // 设置分类筛选器
    document.getElementById('category-filter').value = categoryId;
    
    // 触发change事件
    const event = new Event('change');
    document.getElementById('category-filter').dispatchEvent(event);
}

// 编辑分类
function editCategory(id) {
    // 查找分类数据
    const category = window.categories.find(c => c.id === id);
    if (!category) {
        alert('找不到该分类');
        return;
    }
    
    // 填充表单
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
    
    // 添加一个隐藏字段来存储原始ID
    let editIdField = document.getElementById('category-edit-id');
    if (!editIdField) {
        editIdField = document.createElement('input');
        editIdField.type = 'hidden';
        editIdField.id = 'category-edit-id';
        document.getElementById('category-form').appendChild(editIdField);
    }
    editIdField.value = id;
    
    // 修改模态框标题
    document.querySelector('#category-modal h3').textContent = '编辑分类';
    
    // 显示模态框
    document.getElementById('category-modal').classList.remove('hidden');
}

// 保存分类
async function saveCategory(e) {
    e.preventDefault();
    
    const id = document.getElementById('category-id').value.trim();
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim();
    const editId = document.getElementById('category-edit-id') ? document.getElementById('category-edit-id').value : null;
    
    if (!id || !name) {
        alert('ID和名称为必填项');
        return;
    }
    
    let url = `${API_BASE_URL}/words/categories`;
    let method = 'POST';
    
    // 如果是编辑模式
    if (editId) {
        url = `${API_BASE_URL}/words/categories/${editId}`;
        method = 'PUT';
    }
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, name, description })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `保存失败: ${response.status}`);
        }
        
        document.getElementById('category-modal').classList.add('hidden');
        loadCategories();
    } catch (error) {
        handleError(error, '保存分类失败');
    }
}

// 删除分类
async function deleteCategory(id) {
    if (!confirm(`确定要删除分类 "${id}" 吗？`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/words/categories/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `删除失败: ${response.status}`);
        }
        
        loadCategories();
    } catch (error) {
        handleError(error, '删除分类失败');
    }
}

// 获取分类名称的辅助函数
function getCategoryName(categoryId) {
    if (!categoryId) return '';
    
    try {
        if (!window.categories || !Array.isArray(window.categories)) {
            return categoryId;
        }
        
        const category = window.categories.find(c => c && c.id === categoryId);
        return category && category.name ? category.name : categoryId;
    } catch (error) {
        console.error('获取分类名称失败:', error);
        return categoryId || '';
    }
} 