/**
 * 爽文带背单词 - 后台管理系统JavaScript
 * 第一部分：基础初始化和仪表盘功能
 */

// API基础URL
const API_BASE_URL = '/api';

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
                
                // 如果切换到模板管理页面，加载模板数据
                if (targetId === 'theme-templates') {
                    loadTemplates();
                }
                // 如果切换到单词数据页面，加载分类数据
                else if (targetId === 'word-data') {
                    loadCategories();
                }
                // 如果切换到数据导入页面，也加载分类数据
                else if (targetId === 'import-data') {
                    loadCategoriesForImport();
                }
            }
        });
    });
    
    // 加载仪表盘数据
    loadDashboardData();
    
    // 绑定模板管理相关事件
    initTemplateEvents();
    
    // 绑定单词管理相关事件
    initWordEvents();
    
    // 绑定数据导入相关事件
    initImportEvents();
});

// 通用错误处理函数
function handleError(error, defaultMessage = '操作失败') {
    console.error(error);
    let errorMessage = defaultMessage;
    
    if (error.message) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    alert(errorMessage);
}

// 加载仪表盘数据
async function loadDashboardData() {
    try {
        // 检查API状态
        try {
            const apiResponse = await fetch(`${API_BASE_URL}/health`);
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
            const categoriesResponse = await fetch(`${API_BASE_URL}/words/categories`);
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                document.getElementById('total-categories-count').textContent = categories.length;
                document.getElementById('db-status').textContent = '正常';
                document.getElementById('db-status').classList.add('text-green-600');
                
                // 计算所有分类中的单词总数
                let totalWords = 0;
                const promises = categories.map(async (category) => {
                    try {
                        const wordsResponse = await fetch(`${API_BASE_URL}/words/count/${category.id}`);
                        if (wordsResponse.ok) {
                            const data = await wordsResponse.json();
                            return data.count || 0;
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
            const templatesResponse = await fetch(`${API_BASE_URL}/theme-templates`);
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