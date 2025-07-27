/**
 * 爽文带背单词 - 后台管理系统JavaScript
 * 第三部分：单词管理功能
 */

// 全局变量
let currentPage = 1;
let totalPages = 1;
let currentCategoryId = '';
let pageSize = 100; // 默认每页100条

// 初始化单词管理相关事件
function initWordEvents() {
    // 绑定单词添加按钮事件
    document.getElementById('add-word-btn').addEventListener('click', () => {
        // 重置表单
        document.getElementById('word-form').reset();
        document.getElementById('word-modal').classList.remove('hidden');
    });

    // 绑定导入单词按钮事件
    document.getElementById('import-words-btn').addEventListener('click', () => {
        // 设置导入分类信息
        const categoryId = document.getElementById('category-filter').value;
        const categoryName = getCategoryName(categoryId);
        document.getElementById('import-category').innerHTML = `<option value="${categoryId}">${categoryName}</option>`;
        
        // 显示模态框
        document.getElementById('import-words-modal').classList.remove('hidden');
    });

    // 绑定清理重复单词按钮事件
    document.getElementById('clean-duplicates-btn').addEventListener('click', cleanDuplicateWords);

    // 绑定清空分类单词按钮事件
    document.getElementById('clear-category-btn').addEventListener('click', clearCategoryWords);

    // 绑定批量删除按钮事件
    document.getElementById('batch-delete-btn').addEventListener('click', batchDeleteWords);

    // 绑定分类筛选器变更事件
    document.getElementById('category-filter').addEventListener('change', (e) => {
        const categoryId = e.target.value;
        currentCategoryId = categoryId;
        if (categoryId) {
            // 重置为第一页
            currentPage = 1;
            document.getElementById('page-input').value = 1;
            
            // 加载单词（带分页）
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
        currentPage = 1; // 重置到第一页
        loadWordsWithPagination(currentCategoryId, currentPage, pageSize);
    });

    // 绑定单词表单提交事件
    document.getElementById('word-form').addEventListener('submit', saveWord);

    // 绑定全选/取消全选事件
    document.getElementById('select-all-words').addEventListener('change', toggleAllWords);
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
        
        const response = await fetch(`${API_BASE_URL}/words/category/${categoryId}/page/${page}?pageSize=${pageSize}`);
        if (!response.ok) {
            throw new Error(`加载单词失败: ${response.status}`);
        }
        
        const data = await response.json();
        const tableBody = document.getElementById('words-table-body');
        
        // 验证返回的数据格式
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
            if (!word || !word.id || !word.en) return; // 跳过无效数据
            
            const categoryName = getCategoryName(word.category_id);
            const wordId = word.id.toString().replace(/"/g, '&quot;'); // 转义引号
            
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
        handleError(error, '加载单词失败');
    }
} 