// 全局变量
window.categories = window.categories || [];
window.currentEditId = null;
window.currentPage = 1;
window.totalPages = 1;
window.currentCategoryId = '';
window.pageSize = 100;

// 基础功能初始化
document.addEventListener('DOMContentLoaded', () => {
    // 侧边栏导航切换
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 更新活动状态
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // 获取目标内容区ID
            const targetId = item.getAttribute('href').substring(1);
            const sectionTitle = item.querySelector('span').textContent;
            
            // 更新标题
            document.getElementById('current-section-title').textContent = sectionTitle;
            
            // 切换内容区显示
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(`${targetId}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 根据不同页面加载相应数据
                if (targetId === 'theme-templates') {
                    loadTemplates();
                } else if (targetId === 'word-data') {
                    loadCategories();
                } else if (targetId === 'import-data') {
                    loadCategoriesForImport();
                }
            }
        });
    });
    
    // 加载仪表盘数据
    loadDashboardData();
    
    // 初始化各模块事件
    initTemplateEvents();
    initWordEvents();
    initImportEvents();
    initSettingsEvents();
});

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        // 检查API状态
        try {
            const apiResponse = await fetch('/api/health');
            if (apiResponse.ok) {
                document.getElementById('api-status').textContent = '正常';
                document.getElementById('api-status').classList.add('text-green-600');
            } else {
                document.getElementById('api-status').textContent = '异常';
                document.getElementById('api-status').classList.add('text-red-600');
            }
        } catch (error) {
            console.error('API状态检查失败:', error);
            document.getElementById('api-status').textContent = '异常';
            document.getElementById('api-status').classList.add('text-red-600');
        }
        
        // 加载分类数据
        try {
            const categoriesResponse = await fetch('/api/words/categories');
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                document.getElementById('total-categories-count').textContent = categories.length;
                document.getElementById('db-status').textContent = '正常';
                document.getElementById('db-status').classList.add('text-green-600');
                
                // 计算所有分类中的单词总数
                let totalWords = 0;
                const promises = categories.map(async (category) => {
                    try {
                        const wordsResponse = await fetch(`/api/words/${category.id}/page/1?pageSize=1`);
                        if (wordsResponse.ok) {
                            const data = await wordsResponse.json();
                            return data.pagination.total;
                        }
                        return 0;
                    } catch (error) {
                        console.error(`获取分类 ${category.id} 的单词数量失败:`, error);
                        return 0;
                    }
                });
                
                const counts = await Promise.all(promises);
                totalWords = counts.reduce((sum, count) => sum + count, 0);
                document.getElementById('total-words-count').textContent = totalWords;
            } else {
                document.getElementById('total-categories-count').textContent = '加载失败';
                document.getElementById('db-status').textContent = '异常';
                document.getElementById('db-status').classList.add('text-red-600');
            }
        } catch (error) {
            console.error('加载分类数据失败:', error);
            document.getElementById('total-categories-count').textContent = '加载失败';
            document.getElementById('db-status').textContent = '异常';
            document.getElementById('db-status').classList.add('text-red-600');
        }
        
        // 加载模板数据
        try {
            const templatesResponse = await fetch('/api/admin/theme-templates');
            if (templatesResponse.ok) {
                const templates = await templatesResponse.json();
                document.getElementById('total-templates-count').textContent = templates.length;
            } else {
                document.getElementById('total-templates-count').textContent = '加载失败';
            }
        } catch (error) {
            console.error('加载模板数据失败:', error);
            document.getElementById('total-templates-count').textContent = '加载失败';
        }
        
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        document.getElementById('api-status').textContent = '异常';
        document.getElementById('api-status').classList.add('text-red-600');
        document.getElementById('db-status').textContent = '异常';
        document.getElementById('db-status').classList.add('text-red-600');
    }
}

// 初始化模板管理相关事件
function initTemplateEvents() {
    // 添加模板按钮点击事件
    document.getElementById('add-template-btn').addEventListener('click', () => {
        document.getElementById('template-form').reset();
        document.getElementById('template-id').disabled = false;
        document.getElementById('template-modal').classList.remove('hidden');
    });
    
    // 导入默认模板按钮点击事件
    document.getElementById('import-default-templates-btn').addEventListener('click', importDefaultTemplates);
    
    // 模板表单提交事件
    document.getElementById('template-form').addEventListener('submit', saveTemplate);
    
    // 模板模态框取消按钮点击事件
    document.querySelectorAll('.cancel-template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('template-modal').classList.add('hidden');
        });
    });
}

// 加载故事主题模板列表
async function loadTemplates() {
    try {
        const response = await fetch('/api/admin/theme-templates');
        if (!response.ok) {
            throw new Error(`加载模板失败: ${response.status}`);
        }
        
        const templates = await response.json();
        const tableBody = document.getElementById('templates-table-body');
        
        if (!Array.isArray(templates)) {
            console.error('加载模板失败: 返回数据不是数组');
            tableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-red-500">加载失败: 数据格式错误</td></tr>';
            return;
        }
        
        if (templates.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-gray-500">暂无数据</td></tr>';
            return;
        }
        
        let html = '';
        templates.forEach(template => {
            if (!template || !template.id) return;
            
            const status = template.is_active ? 
                '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">启用</span>' : 
                '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">禁用</span>';
            
            const safeId = template.id.replace(/'/g, "\\'");
            
            html += `
                <tr>
                    <td class="py-2 px-4 border-b">${template.id}</td>
                    <td class="py-2 px-4 border-b">${template.name || ''}</td>
                    <td class="py-2 px-4 border-b">${template.description || ''}</td>
                    <td class="py-2 px-4 border-b">${status}</td>
                    <td class="py-2 px-4 border-b">
                        <button class="text-blue-500 hover:text-blue-700 mr-2" onclick="viewTemplate('${safeId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-green-500 hover:text-green-700 mr-2" onclick="editTemplate('${safeId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700" onclick="deleteTemplate('${safeId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('加载模板失败:', error);
        document.getElementById('templates-table-body').innerHTML = 
            '<tr><td colspan="5" class="py-4 text-center text-red-500">加载失败: ' + error.message + '</td></tr>';
    }
}

// 查看模板详情
async function viewTemplate(id) {
    try {
        const response = await fetch(`/api/admin/theme-templates/${id}`);
        if (!response.ok) {
            throw new Error(`获取模板失败: ${response.status}`);
        }
        
        const template = await response.json();
        
        document.getElementById('template-id').value = template.id;
        document.getElementById('template-id').disabled = true;
        document.getElementById('template-name').value = template.name;
        document.getElementById('template-description').value = template.description || '';
        document.getElementById('template-prompt').value = template.prompt_text;
        document.getElementById('template-active').checked = template.is_active === 1;
        
        // 禁用所有输入框
        document.querySelectorAll('#template-form input, #template-form textarea').forEach(input => {
            input.disabled = true;
        });
        
        // 隐藏保存按钮
        document.querySelector('#template-form button[type="submit"]').classList.add('hidden');
        
        document.getElementById('template-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('查看模板失败:', error);
        alert('查看模板失败: ' + error.message);
    }
}

// 编辑模板
async function editTemplate(id) {
    try {
        const response = await fetch(`/api/admin/theme-templates/${id}`);
        if (!response.ok) {
            throw new Error(`获取模板失败: ${response.status}`);
        }
        
        const template = await response.json();
        
        document.getElementById('template-id').value = template.id;
        document.getElementById('template-id').disabled = true;
        document.getElementById('template-name').value = template.name;
        document.getElementById('template-description').value = template.description || '';
        document.getElementById('template-prompt').value = template.prompt_text;
        document.getElementById('template-active').checked = template.is_active === 1;
        
        // 启用所有输入框
        document.querySelectorAll('#template-form input, #template-form textarea').forEach(input => {
            input.disabled = false;
        });
        
        // 显示保存按钮
        document.querySelector('#template-form button[type="submit"]').classList.remove('hidden');
        
        document.getElementById('template-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('编辑模板失败:', error);
        alert('编辑模板失败: ' + error.message);
    }
}

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
        const url = isEdit ? `/api/admin/theme-templates/${id}` : '/api/admin/theme-templates';
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
        
        document.getElementById('template-modal').classList.add('hidden');
        loadTemplates();
        loadDashboardData();
        
    } catch (error) {
        console.error('保存模板失败:', error);
        alert('保存模板失败: ' + error.message);
    }
}

// 删除模板
async function deleteTemplate(id) {
    if (!confirm(`确定要删除模板 "${id}" 吗？`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/theme-templates/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `删除失败: ${response.status}`);
        }
        
        loadTemplates();
        loadDashboardData();
        
    } catch (error) {
        console.error('删除模板失败:', error);
        alert('删除模板失败: ' + error.message);
    }
}

// 导入默认模板
async function importDefaultTemplates() {
    if (!confirm('确定要导入默认的故事主题模板吗？这将覆盖同名的现有模板。')) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/import-default-templates', {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `导入失败: ${response.status}`);
        }
        
        const result = await response.json();
        alert(`成功导入 ${result.count} 个默认模板`);
        
        loadTemplates();
        loadDashboardData();
        
    } catch (error) {
        console.error('导入默认模板失败:', error);
        alert('导入默认模板失败: ' + error.message);
    }
}

// 初始化单词管理相关事件
function initWordEvents() {
    // 添加分类按钮点击事件
    document.getElementById('add-category-btn').addEventListener('click', () => {
        document.getElementById('category-form').reset();
        document.getElementById('category-modal').classList.remove('hidden');
    });
    
    // 添加单词按钮点击事件
    document.getElementById('add-word-btn').addEventListener('click', () => {
        document.getElementById('word-form').reset();
        document.getElementById('word-modal').classList.remove('hidden');
    });
    
    // 导入单词按钮点击事件
    document.getElementById('import-words-btn').addEventListener('click', () => {
        const categoryId = document.getElementById('category-filter').value;
        const categoryName = getCategoryName(categoryId);
        document.getElementById('import-category').innerHTML = `<option value="${categoryId}">${categoryName}</option>`;
        document.getElementById('import-words-modal').classList.remove('hidden');
    });
    
    // 绑定其他按钮事件
    document.getElementById('clean-duplicates-btn').addEventListener('click', cleanDuplicateWords);
    document.getElementById('clear-category-btn').addEventListener('click', clearCategoryWords);
    document.getElementById('batch-delete-btn').addEventListener('click', batchDeleteWords);
    
    // 绑定分类筛选器变更事件
    document.getElementById('category-filter').addEventListener('change', (e) => {
        const categoryId = e.target.value;
        currentCategoryId = categoryId;
        if (categoryId) {
            currentPage = 1;
            document.getElementById('page-input').value = 1;
            loadWordsWithPagination(categoryId, currentPage, pageSize);
            
            // 显示相关按钮
            document.getElementById('clean-duplicates-btn').classList.remove('hidden');
            document.getElementById('clear-category-btn').classList.remove('hidden');
            document.getElementById('batch-delete-btn').classList.remove('hidden');
            document.getElementById('select-all-words').classList.remove('hidden');
            document.getElementById('page-size-select').classList.remove('hidden');
            document.getElementById('pagination-controls').classList.remove('hidden');
            document.getElementById('import-words-btn').classList.remove('hidden');
        } else {
            document.getElementById('words-table-body').innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">请先选择一个词库分类</td></tr>';
            
            // 隐藏相关按钮
            document.getElementById('clean-duplicates-btn').classList.add('hidden');
            document.getElementById('clear-category-btn').classList.add('hidden');
            document.getElementById('batch-delete-btn').classList.add('hidden');
            document.getElementById('select-all-words').classList.add('hidden');
            document.getElementById('page-size-select').classList.add('hidden');
            document.getElementById('pagination-controls').classList.add('hidden');
            document.getElementById('import-words-btn').classList.add('hidden');
        }
    });
    
    // 绑定分页控件事件
    document.getElementById('first-page-btn').addEventListener('click', () => goToPage(1));
    document.getElementById('prev-page-btn').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('next-page-btn').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('last-page-btn').addEventListener('click', () => goToPage(totalPages));
    document.getElementById('go-page-btn').addEventListener('click', () => {
        const page = parseInt(document.getElementById('page-input').value);
        if (page >= 1 && page <= totalPages) {
            goToPage(page);
        } else {
            alert(`请输入1-${totalPages}之间的页码`);
        }
    });
    
    // 绑定每页显示数量变更事件
    document.getElementById('page-size-select').addEventListener('change', (e) => {
        pageSize = parseInt(e.target.value);
        currentPage = 1;
        loadWordsWithPagination(currentCategoryId, currentPage, pageSize);
    });
    
    // 绑定表单提交事件
    document.getElementById('category-form').addEventListener('submit', saveCategory);
    document.getElementById('word-form').addEventListener('submit', saveWord);
    
    // 绑定模态框取消按钮事件
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('category-modal').classList.add('hidden');
            document.getElementById('word-modal').classList.add('hidden');
            document.getElementById('import-words-modal').classList.add('hidden');
        });
    });
    
    // 绑定全选/取消全选事件
    document.getElementById('select-all-words').addEventListener('change', toggleAllWords);
    
    // 绑定导入方式切换事件
    document.querySelectorAll('input[name="import-method"]').forEach(radio => {
        radio.addEventListener('change', toggleImportMethod);
    });
    
    // 绑定导入提交按钮事件
    document.getElementById('import-submit-btn').addEventListener('click', submitImport);
}

// 跳转到指定页
function goToPage(page) {
    if (page < 1 || page > totalPages) {
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

// 初始化数据导入相关事件
function initImportEvents() {
    // 绑定导入按钮事件
    document.getElementById('import-btn').addEventListener('click', importData);
    
    // 绑定CSV上传表单提交事件
    document.getElementById('csv-upload-form').addEventListener('submit', uploadCSV);
}

// 初始化系统设置相关事件
function initSettingsEvents() {
    // 绑定保存设置按钮事件
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
}

// 加载分类数据
async function loadCategories() {
    try {
        const response = await fetch('/api/words/categories');
        if (!response.ok) {
            throw new Error(`加载分类失败: ${response.status}`);
        }
        
        const categories = await response.json();
        if (!Array.isArray(categories)) {
            console.error('加载分类失败: 返回数据不是数组');
            document.getElementById('categories-table-body').innerHTML = 
                '<tr><td colspan="4" class="py-4 text-center text-red-500">加载失败: 数据格式错误</td></tr>';
            return;
        }
        
        window.categories = categories;
        
        // 更新分类表格
        const tableBody = document.getElementById('categories-table-body');
        if (categories.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-gray-500">暂无数据</td></tr>';
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            if (!category || !category.id) return;
            
            const safeId = category.id.replace(/'/g, "\\'");
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
    }
}

// 加载分类数据（用于导入页面）
async function loadCategoriesForImport() {
    try {
        const response = await fetch('/api/words/categories');
        if (!response.ok) {
            throw new Error(`加载分类失败: ${response.status}`);
        }
        
        const categories = await response.json();
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
        if (!category || !category.id || !category.name) return;
        
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

// 加载单词数据（带分页）
async function loadWordsWithPagination(categoryId, page, pageSize) {
    try {
        if (!categoryId) {
            console.error('加载单词失败: 分类ID为空');
            document.getElementById('words-table-body').innerHTML = 
                '<tr><td colspan="7" class="py-4 text-center text-red-500">加载失败: 分类ID为空</td></tr>';
            return;
        }
        
        const response = await fetch(`/api/words/${categoryId}/page/${page}?pageSize=${pageSize}`);
        if (!response.ok) {
            throw new Error(`加载单词失败: ${response.status}`);
        }
        
        const data = await response.json();
        const tableBody = document.getElementById('words-table-body');
        
        if (!data || !data.pagination || !Array.isArray(data.words)) {
            throw new Error('返回的数据格式不正确');
        }
        
        // 更新分页信息
        currentPage = data.pagination.currentPage || 1;
        totalPages = data.pagination.totalPages || 1;
        
        document.getElementById('total-words').textContent = data.pagination.total || 0;
        document.getElementById('current-page').textContent = currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        document.getElementById('page-input').value = currentPage;
        
        // 更新分页按钮状态
        document.getElementById('first-page-btn').disabled = currentPage === 1;
        document.getElementById('prev-page-btn').disabled = currentPage === 1;
        document.getElementById('next-page-btn').disabled = currentPage === totalPages;
        document.getElementById('last-page-btn').disabled = currentPage === totalPages;
        
        if (data.words.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="py-4 text-center text-gray-500">该分类下暂无单词</td></tr>';
            return;
        }
        
        let html = '';
        data.words.forEach(word => {
            if (!word || !word.id || !word.en) return;
            
            const categoryName = getCategoryName(word.category_id);
            const wordId = word.id.toString().replace(/"/g, '&quot;');
            
            html += `
                <tr>
                    <td class="py-2 px-4 border-b">
                        <input type="checkbox" class="word-checkbox batch-delete-checkbox" data-id="${wordId}">
                    </td>
                    <td class="py-2 px-4 border-b">${word.en}</td>
                    <td class="py-2 px-4 border-b">${word.phonetic || ''}</td>
                    <td class="py-2 px-4 border-b">${word.pos || ''}</td>
                    <td class="py-2 px-4 border-b">${word.cn || ''}</td>
                    <td class="py-2 px-4 border-b">${categoryName || ''}</td>
                    <td class="py-2 px-4 border-b">
                        <button class="text-blue-500 hover:text-blue-700 mr-2" onclick="editWord(${wordId})">编辑</button>
                        <button class="text-red-500 hover:text-red-700" onclick="deleteWord(${wordId})">删除</button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
        
    } catch (error) {
        console.error('加载单词失败:', error);
        document.getElementById('words-table-body').innerHTML = 
            '<tr><td colspan="7" class="py-4 text-center text-red-500">加载失败: ' + error.message + '</td></tr>';
    }
}

// 导入数据
function importData() {
    const statusDiv = document.getElementById('import-status');
    statusDiv.textContent = '正在导入...';
    statusDiv.className = 'mt-3 text-sm text-gray-700';

    fetch('/api/import', {
        method: 'POST'
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error('导入失败!');
    })
    .then(text => {
        statusDiv.textContent = `成功: ${text}`;
        statusDiv.className = 'mt-3 text-sm text-green-700';
        loadCategories();
        loadDashboardData();
    })
    .catch(error => {
        statusDiv.textContent = `错误: ${error.message}`;
        statusDiv.className = 'mt-3 text-sm text-red-700';
    });
}

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
function uploadCSV(e) {
    e.preventDefault(); // 防止表单默认提交行为
    
    const statusDiv = document.getElementById('csv-import-status');
    const fileInput = document.getElementById('csv-file');
    const categorySelect = document.getElementById('category-select');
    const newCategoryId = document.getElementById('new-category-id');
    const newCategoryName = document.getElementById('new-category-name');
    const isNewCategoryField = document.getElementById('is-new-category');
    
    // 检查文件是否选择
    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.textContent = '请选择CSV文件';
        statusDiv.className = 'mt-3 text-sm text-red-700';
        return;
    }
    
    // 检查分类信息
    let categoryId = categorySelect.value;
    
    if (!categoryId) {
        // 如果下拉框未选择，检查是否提供了新分类信息
        categoryId = newCategoryId.value.trim();
        const categoryName = newCategoryName.value.trim();
        
        if (!categoryId || !categoryName) {
            statusDiv.textContent = '请选择现有分类或提供新分类信息';
            statusDiv.className = 'mt-3 text-sm text-red-700';
            return;
        }
        
        // 标记为新分类
        isNewCategoryField.value = 'true';
    } else {
        // 使用现有分类，确保新分类ID字段被禁用
        newCategoryId.disabled = true;
        isNewCategoryField.value = 'false';
    }
    
    // 显示上传进度提示
    statusDiv.textContent = '正在上传并处理CSV文件，请稍候...';
    statusDiv.className = 'mt-3 text-sm text-gray-700';
    
    // 禁用提交按钮，防止重复提交
    const submitButton = document.querySelector('#csv-upload-form button[type="submit"]');
    submitButton.disabled = true;
    const originalText = submitButton.textContent;
    submitButton.textContent = '上传中...';
    
    // 获取表单元素并直接提交
    const form = document.getElementById('csv-upload-form');
    
    // 使用FormData和fetch手动提交表单
    const formData = new FormData(form);
    
    fetch('/api/import-csv', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || '上传CSV失败');
            });
        }
        return response.json();
    })
    .then(result => {
        statusDiv.textContent = `成功导入${result.wordCount}个单词到"${result.categoryName}"分类`;
        statusDiv.className = 'mt-3 text-sm text-green-700';
        
        // 重置表单状态
        newCategoryId.disabled = false;
        
        // 重新加载分类数据
        loadCategories();
        loadDashboardData();
    })
    .catch(error => {
        console.error('CSV上传失败:', error);
        statusDiv.textContent = `错误: ${error.message}`;
        statusDiv.className = 'mt-3 text-sm text-red-700';
        
        // 重置表单状态
        newCategoryId.disabled = false;
    })
    .finally(() => {
        // 恢复提交按钮
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    });
}

// 查看分类下的单词
function viewWords(categoryId) {
    document.querySelector('.sidebar-item[href="#word-data"]').click();
    document.getElementById('category-filter').value = categoryId;
    
    const event = new Event('change');
    document.getElementById('category-filter').dispatchEvent(event);
}

// 编辑分类
function editCategory(id) {
    const category = window.categories.find(c => c.id === id);
    if (!category) {
        alert('找不到该分类');
        return;
    }
    
    document.getElementById('category-id').value = category.id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
    
    let editIdField = document.getElementById('category-edit-id');
    if (!editIdField) {
        editIdField = document.createElement('input');
        editIdField.type = 'hidden';
        editIdField.id = 'category-edit-id';
        document.getElementById('category-form').appendChild(editIdField);
    }
    editIdField.value = id;
    
    document.querySelector('#category-modal h3').textContent = '编辑分类';
    document.getElementById('category-modal').classList.remove('hidden');
}

// 保存分类
function saveCategory(e) {
    e.preventDefault();
    
    const id = document.getElementById('category-id').value.trim();
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim();
    const editId = document.getElementById('category-edit-id') ? document.getElementById('category-edit-id').value : null;
    
    if (!id || !name) {
        alert('ID和名称为必填项');
        return;
    }
    
    let url = '/api/words/categories';
    let method = 'POST';
    
    if (editId) {
        url = `/api/words/categories/${editId}`;
        method = 'PUT';
    }
    
    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name, description })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || '保存失败');
            });
        }
        return response.json();
    })
    .then(() => {
        document.getElementById('category-modal').classList.add('hidden');
        loadCategories();
    })
    .catch(error => {
        alert(`错误: ${error.message}`);
    });
}

// 删除分类
function deleteCategory(id) {
    if (!confirm(`确定要删除分类 "${id}" 吗？`)) {
        return;
    }
    
    fetch(`/api/words/categories/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || '删除失败');
            });
        }
        return response.json();
    })
    .then(() => {
        loadCategories();
    })
    .catch(error => {
        alert(`错误: ${error.message}`);
    });
}

// 编辑单词
function editWord(id) {
    if (!id) {
        alert('单词ID无效');
        return;
    }
    
    fetch(`/api/words/detail/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`获取单词数据失败: ${response.status}`);
            }
            return response.json();
        })
        .then(word => {
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
        })
        .catch(error => {
            console.error('加载单词数据失败:', error);
            alert('加载单词数据失败: ' + error.message);
        });
}

// 保存单词
function saveWord(e) {
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
    
    let url = '/api/words';
    let method = 'POST';
    
    if (id) {
        url = `/api/words/${id}`;
        method = 'PUT';
    }
    
    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(wordData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || `保存失败: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(() => {
        document.getElementById('word-modal').classList.add('hidden');
        const categoryId = document.getElementById('category-filter').value;
        if (categoryId) {
            loadWordsWithPagination(categoryId, currentPage, pageSize);
        }
    })
    .catch(error => {
        console.error('保存单词失败:', error);
        alert(`错误: ${error.message}`);
    });
}

// 删除单词
function deleteWord(id) {
    if (!id) {
        alert('单词ID无效');
        return;
    }
    
    if (!confirm('确定要删除这个单词吗？')) {
        return;
    }
    
    fetch(`/api/words/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || `删除失败: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(() => {
        const categoryId = document.getElementById('category-filter').value;
        loadWordsWithPagination(categoryId, currentPage, pageSize);
    })
    .catch(error => {
        console.error('删除单词失败:', error);
        alert(`错误: ${error.message}`);
    });
}

// 清理重复单词
function cleanDuplicateWords() {
    const categoryId = document.getElementById('category-filter').value;
    
    if (!categoryId) {
        alert('请先选择一个词库分类');
        return;
    }
    
    if (!confirm('确定要清理该分类下的重复单词吗？此操作将保留每个单词的第一个出现，删除其余重复项。')) {
        return;
    }
    
    const cleanBtn = document.getElementById('clean-duplicates-btn');
    const originalText = cleanBtn.textContent;
    cleanBtn.textContent = '清理中...';
    cleanBtn.disabled = true;
    
    fetch(`/api/words/categories/${categoryId}/clean-duplicates`, {
        method: 'POST'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('清理失败');
        }
        return response.json();
    })
    .then(result => {
        cleanBtn.textContent = originalText;
        cleanBtn.disabled = false;
        
        if (result.deletedCount > 0) {
            alert(`清理完成！已删除 ${result.deletedCount} 个重复单词。`);
        } else {
            alert('没有找到需要清理的重复单词。');
        }
        
        loadWordsWithPagination(categoryId, currentPage, pageSize);
    })
    .catch(error => {
        cleanBtn.textContent = originalText;
        cleanBtn.disabled = false;
        alert(`错误: ${error.message}`);
    });
}

// 清空分类单词
function clearCategoryWords() {
    const categoryId = document.getElementById('category-filter').value;
    
    if (!categoryId) {
        alert('请先选择一个词库分类');
        return;
    }
    
    const categoryName = getCategoryName(categoryId);
    if (!confirm(`确定要清空"${categoryName}"分类下的所有单词吗？此操作不可恢复！`)) {
        return;
    }
    
    if (!confirm('警告：此操作将永久删除该分类下的所有单词数据，确定要继续吗？')) {
        return;
    }
    
    const clearBtn = document.getElementById('clear-category-btn');
    const originalText = clearBtn.textContent;
    clearBtn.textContent = '清空中...';
    clearBtn.disabled = true;
    
    fetch(`/api/words/categories/${categoryId}/words`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('清空失败');
        }
        return response.json();
    })
    .then(result => {
        clearBtn.textContent = originalText;
        clearBtn.disabled = false;
        
        alert(`清空成功！已删除 ${result.deletedCount} 个单词。`);
        
        currentPage = 1;
        document.getElementById('page-input').value = 1;
        loadWordsWithPagination(categoryId, currentPage, pageSize);
    })
    .catch(error => {
        clearBtn.textContent = originalText;
        clearBtn.disabled = false;
        alert(`错误: ${error.message}`);
    });
}

// 批量删除单词
function batchDeleteWords() {
    const selectedIds = [];
    document.querySelectorAll('.word-checkbox:checked').forEach(checkbox => {
        try {
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
    
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    const originalText = batchDeleteBtn.textContent;
    batchDeleteBtn.textContent = '删除中...';
    batchDeleteBtn.disabled = true;
    
    fetch('/api/words/batch-delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedIds })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || `批量删除失败: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(result => {
        batchDeleteBtn.textContent = originalText;
        batchDeleteBtn.disabled = false;
        
        const deletedCount = result.deletedCount || 0;
        alert(`删除成功！已删除 ${deletedCount} 个单词。`);
        
        loadWordsWithPagination(currentCategoryId, currentPage, pageSize);
    })
    .catch(error => {
        batchDeleteBtn.textContent = originalText;
        batchDeleteBtn.disabled = false;
        
        console.error('批量删除单词失败:', error);
        alert(`错误: ${error.message}`);
    });
}

// 提交导入
function submitImport() {
    const categoryId = document.getElementById('import-category').value;
    const method = document.querySelector('input[name="import-method"]:checked').value;
    const statusDiv = document.getElementById('import-status');
    
    if (!categoryId) {
        statusDiv.textContent = '请先选择一个分类';
        statusDiv.className = 'mt-3 text-sm text-red-700';
        return;
    }
    
    const importBtn = document.getElementById('import-submit-btn');
    const originalText = importBtn.textContent;
    importBtn.textContent = '导入中...';
    importBtn.disabled = true;
    statusDiv.textContent = '正在处理...';
    statusDiv.className = 'mt-3 text-sm text-gray-700';
    
    if (method === 'csv') {
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
        formData.append('isNewCategory', 'false');
        
        fetch('/api/import-csv', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || '导入失败');
                });
            }
            return response.json();
        })
        .then(result => {
            statusDiv.textContent = `成功导入${result.wordCount}个单词`;
            statusDiv.className = 'mt-3 text-sm text-green-700';
            
            currentPage = 1;
            loadWordsWithPagination(categoryId, currentPage, pageSize);
            
            setTimeout(() => {
                document.getElementById('import-words-modal').classList.add('hidden');
            }, 3000);
        })
        .catch(error => {
            statusDiv.textContent = `错误: ${error.message}`;
            statusDiv.className = 'mt-3 text-sm text-red-700';
        })
        .finally(() => {
            importBtn.textContent = originalText;
            importBtn.disabled = false;
        });
    } else {
        const textInput = document.getElementById('import-text').value.trim();
        
        if (!textInput) {
            statusDiv.textContent = '请输入单词数据';
            statusDiv.className = 'mt-3 text-sm text-red-700';
            importBtn.textContent = originalText;
            importBtn.disabled = false;
            return;
        }
        
        const lines = textInput.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            statusDiv.textContent = '没有有效的单词数据';
            statusDiv.className = 'mt-3 text-sm text-red-700';
            importBtn.textContent = originalText;
            importBtn.disabled = false;
            return;
        }
        
        const csvContent = lines.join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvFile = new File([csvBlob], 'imported_words.csv', { type: 'text/csv' });
        
        const formData = new FormData();
        formData.append('csvFile', csvFile);
        formData.append('categoryId', categoryId);
        formData.append('isNewCategory', 'false');
        
        fetch('/api/import-csv', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(text || '导入失败');
                });
            }
            return response.json();
        })
        .then(result => {
            statusDiv.textContent = `成功导入${result.wordCount}个单词`;
            statusDiv.className = 'mt-3 text-sm text-green-700';
            
            currentPage = 1;
            loadWordsWithPagination(categoryId, currentPage, pageSize);
            
            setTimeout(() => {
                document.getElementById('import-words-modal').classList.add('hidden');
            }, 3000);
        })
        .catch(error => {
            statusDiv.textContent = `错误: ${error.message}`;
            statusDiv.className = 'mt-3 text-sm text-red-700';
        })
        .finally(() => {
            importBtn.textContent = originalText;
            importBtn.disabled = false;
        });
    }
}

// 保存系统设置
function saveSettings() {
    const geminiApiKey = document.getElementById('gemini-api-key').value.trim();
    const qwenApiKey = document.getElementById('qwen-api-key').value.trim();
    const deepseekApiKey = document.getElementById('deepseek-api-key').value.trim();
    
    if (!geminiApiKey && !qwenApiKey && !deepseekApiKey) {
        alert('请至少输入一个API密钥');
        return;
    }
    
    const settingsData = {
        geminiApiKey: geminiApiKey || '',
        qwenApiKey: qwenApiKey || '',
        deepseekApiKey: deepseekApiKey || ''
    };
    
    fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text || '保存设置失败');
            });
        }
        return response.json();
    })
    .then(result => {
        alert('设置保存成功！重启服务器后生效。');
    })
    .catch(error => {
        console.error('保存设置失败:', error);
        alert(`错误: ${error.message}`);
    });
}

// 获取分类名称的全局函数
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