/**
 * 每日进度检查脚本
 * 由 sisyphus-cron 定时触发
 * 输出每日状态报告到 .sisyphus/status/Daily-{YYYY-MM-DD}.md
 */
const fs = require('fs');
const path = require('path');

const tasksFile = path.join(__dirname, 'TASKS.md');
const statusDir = path.join(__dirname, '..', 'status');
if (!fs.existsSync(statusDir)) {fs.mkdirSync(statusDir, { recursive: true });}

const today = new Date().toISOString().split('T')[0];
const output = path.join(statusDir, `Daily-${today}.md`);

// 读取 TASKS.md 提取状态
const content = fs.readFileSync(tasksFile, 'utf-8');
const taskStats = {
  total: 0, completed: 0, inProgress: 0, pending: 0, blocked: 0
};

const lines = content.split('\n');
let currentTask = '';
const report = [];

for (const line of lines) {
  // 检测任务标题
  const taskMatch = line.match(/^## Task (\d+)/);
  if (taskMatch) {
    currentTask = taskMatch[0];
    report.push(`\n### ${currentTask}`);
  }
  // 检测子任务状态
  const subMatch = line.match(/^\| (\d\.\d+).*\| \[(.)\]/);
  if (subMatch) {
    const [_, id, status] = subMatch;
    const icons = { ' ': '⏸', '>': '▶', 'x': '✅', '!': '🚫', '-': '➖' };
    report.push(`${icons[status] || '⏸'} ${id}`);
    taskStats.total++;
    if (status === 'x') {taskStats.completed++;}
    else if (status === '>') {taskStats.inProgress++;}
    else if (status === ' ') {taskStats.pending++;}
    else if (status === '!') {taskStats.blocked++;}
  }
}

const progress = taskStats.total > 0 
  ? Math.round(taskStats.completed / taskStats.total * 100) 
  : 0;

const md = `# 每日进度报告 — ${today}

## 总览

\`\`\`
[${'■'.repeat(Math.floor(progress/10))}${'□'.repeat(10-Math.floor(progress/10))}] ${progress}%
已完成: ${taskStats.completed} / ${taskStats.total}
进行中: ${taskStats.inProgress}
待开始: ${taskStats.pending}
阻塞中: ${taskStats.blocked}
\`\`\`

## 当前状态

${taskStats.inProgress > 0 
  ? '▶ **当前进行中的任务需要关注**'
  : taskStats.pending > 0 
    ? '⏸ **没有进行中的任务。下一步建议：** 查看 .sisyphus/tasks/TASKS.md 选择下一个任务开始'
    : taskStats.completed === taskStats.total 
      ? '✅ **全部任务已完成！**'
      : '⏸ 待启动'}

${report.join('\n')}

## 依赖检查

${taskStats.blocked > 0 ? '⚠️ 有阻塞任务，需先完成其前置依赖' : '✅ 无阻塞任务'}
`;

fs.writeFileSync(output, md, 'utf-8');
console.log(`Daily report written: ${output}`);
console.log(`Progress: ${taskStats.completed}/${taskStats.total} (${progress}%)`);
