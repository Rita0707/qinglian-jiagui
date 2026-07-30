const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/submit', (req, res) => {
  const { name, phone, task, taskType, time, timestamp } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: '姓名和手机号为必填' });
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  data.push({ name, phone, task, taskType, time, timestamp });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json({ success: true, total: data.length });
});

app.get('/api/submissions', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  res.json({ total: data.length, submissions: data });
});

app.get('/api/export', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let csv = '\uFEFF姓名,手机号,任务,任务类型,时间\n';
  data.forEach(s => {
    csv += '"' + s.name + '","' + s.phone + '","' + s.task + '","' + s.taskType + '","' + s.time + '"\n';
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=qinlian-jiagui-data.csv');
  res.send(csv);
});

app.get('/admin', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let rows = '';
  data.reverse().forEach(s => {
    rows += '<tr><td>' + s.name + '</td><td>' + s.phone + '</td><td>' + s.task + '</td><td>' + s.time + '</td></tr>';
  });
  res.send('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>清廉家风数据管理</title><style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:24px;background:#fef9f0;color:#3d2e1e}h1{color:#c41e3a;margin-bottom:4px}.sub{color:#8b7355;font-size:14px;margin-bottom:20px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)}th{background:#c41e3a;color:#fff;padding:10px 12px;text-align:left;font-size:14px}td{padding:10px 12px;border-bottom:1px solid #f0e6d8;font-size:14px}.total{font-size:14px;color:#8b7355;margin-top:16px}.export{display:inline-block;margin-top:16px;padding:10px 20px;background:#c41e3a;color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:14px;text-decoration:none}</style></head><body><h1>📋 清廉家风 · 活动数据</h1><p class="sub">武义县妇女联合会</p><table><tr><th>姓名</th><th>手机号</th><th>任务</th><th>时间</th></tr>' + rows + '</table><p class="total">共 ' + data.length + ' 条记录</p><a href="/api/export" class="export">⬇ 导出 CSV</a></body></html>');
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
