/**
 * 爽文带背单词 - 后台管理系统JavaScript
 * 第五部分：主题模板管理功能
 */

// 初始化模板管理相关事件
function initTemplateEvents() {
    // 添加模板按钮点击事件
    document.getElementById('add-template-btn').addEventListener('click', () => {
        // 重置表单
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
        const response = await fetch(`${API_BASE_URL}/theme-templates`);
        if (!response.ok) {
            throw new Error(`加载模板失败: ${response.status}`);
        }
        
        const templates = await response.json();
        const tableBody = document.getElementById('templates-table-body');
        
        // 确保templates是数组
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
            if (!template || !template.id) return; // 跳过无效数据
            
            const status = template.is_active ? 
                '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">启用</span>' : 
                '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">禁用</span>';
            
            const safeId = template.id.replace(/'/g, "\\'"); // 转义单引号
            
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
        handleError(error, '加载模板失败');
    }
}

// 查看模板详情
async function viewTemplate(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/theme-templates/${id}`);
        if (!response.ok) {
            throw new Error(`获取模板失败: ${response.status}`);
        }
        
        const template = await response.json();
        
        // 填充表单
        document.getElementById('template-id').value = template.id;
        document.getElementById('template-id').disabled = true; // 查看模式下不允许修改ID
        document.getElementById('template-name').value = template.name;
        document.getElementById('template-description').value = template.description || '';
        document.getElementById('template-prompt').value = template.prompt_text;
        document.getElementById('template-active').checked = template.is_active === 1;
        
        // 禁用所有输入框
        document.querySelectorAll('#template-form input, #template-form textarea').forEach(input => {
            input.disabled = true;
        });
        
        // 隐藏保存按钮，只显示取消按钮
        document.querySelector('#template-form button[type="submit"]').classList.add('hidden');
        
        // 显示模态框
        document.getElementById('template-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('查看模板失败:', error);
        handleError(error, '查看模板失败');
    }
}

// 编辑模板
async function editTemplate(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/theme-templates/${id}`);
        if (!response.ok) {
            throw new Error(`获取模板失败: ${response.status}`);
        }
        
        const template = await response.json();
        
        // 填充表单
        document.getElementById('template-id').value = template.id;
        document.getElementById('template-id').disabled = true; // 编辑模式下不允许修改ID
        document.getElementById('template-name').value = template.name;
        document.getElementById('template-description').value = template.description || '';
        document.getElementById('template-prompt').value = template.prompt_text;
        document.getElementById('template-active').checked = template.is_active === 1;
        
        // 启用所有输入框
        document.querySelectorAll('#template-form input, #template-form textarea').forEach(input => {
            if (input.id !== 'template-id') {
                input.disabled = false;
            }
        });
        
        // 显示保存按钮
        document.querySelector('#template-form button[type="submit"]').classList.remove('hidden');
        
        // 显示模态框
        document.getElementById('template-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('编辑模板失败:', error);
        handleError(error, '编辑模板失败');
    }
} 