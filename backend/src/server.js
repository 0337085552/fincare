const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const pool = require('./db');
const { ok, created, fail, toNumber, requireFields } = require('./helpers');

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*'}));
app.use(express.json());

app.get('/', (req, res) => ok(res, { name: 'FinCare API', version: '1.0.0' }));
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    ok(res, { database: 'connected' }, 'API đang hoạt động');
  } catch (error) {
    fail(res, 500, 'Không kết nối được MySQL', error.message);
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const [[summary]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
      FROM transactions
      WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())
    `);
    const [[wallets]] = await pool.query('SELECT COALESCE(SUM(balance), 0) AS wallet_balance, COUNT(*) AS wallet_count FROM wallets');
    const [[budget]] = await pool.query(`
      SELECT
        COALESCE(SUM(b.limit_amount), 0) AS total_budget,
        COALESCE(SUM(x.spent), 0) AS total_spent,
        COALESCE(SUM(b.limit_amount) - SUM(x.spent), 0) AS remaining_budget
      FROM budgets b
      LEFT JOIN (
        SELECT budget_id, COALESCE(SUM(amount), 0) AS spent
        FROM transactions
        WHERE type = 'expense'
        GROUP BY budget_id
      ) x ON x.budget_id = b.id
    `);
    const [recent] = await pool.query(`
      SELECT t.*, c.name AS category_name, c.color AS category_color, w.name AS wallet_name
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN wallets w ON w.id = t.wallet_id
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT 8
    `);
    const [cashflow] = await pool.query(`
  SELECT
    DATE_FORMAT(MIN(transaction_date), '%m/%Y') AS label,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
  FROM transactions
  WHERE transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 5 MONTH)
  GROUP BY YEAR(transaction_date), MONTH(transaction_date)
  ORDER BY YEAR(transaction_date), MONTH(transaction_date)
`);
   const [categoryStats] = await pool.query(`
  SELECT c.id, c.name, c.color, COALESCE(SUM(t.amount), 0) AS total
  FROM categories c
  JOIN transactions t ON t.category_id = c.id
  WHERE t.type = 'expense'
  GROUP BY c.id, c.name, c.color
  ORDER BY total DESC
  LIMIT 6
`);
    ok(res, { summary, wallets, budget, recent, cashflow, categoryStats });
  } catch (error) {
    fail(res, 500, 'Không tải được dashboard', error.message);
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY type, name');
    ok(res, rows);
  } catch (error) { fail(res, 500, 'Không tải được danh mục', error.message); }
});

app.post('/api/categories', async (req, res) => {
  try {
    const missing = requireFields(req.body, ['name', 'type']);
    if (missing.length) return fail(res, 400, 'Thiếu thông tin danh mục', missing);
    const { name, type, color = '#2563eb', icon = 'folder' } = req.body;
    const [result] = await pool.query('INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)', [name, type, color, icon]);
    created(res, { id: result.insertId, name, type, color, icon });
  } catch (error) { fail(res, 500, 'Không tạo được danh mục', error.message); }
});

app.get('/api/wallets', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM wallets ORDER BY id DESC');
    ok(res, rows);
  } catch (error) { fail(res, 500, 'Không tải được ví tiền', error.message); }
});

app.post('/api/wallets', async (req, res) => {
  try {
    const missing = requireFields(req.body, ['name']);
    if (missing.length) return fail(res, 400, 'Thiếu tên ví', missing);
    const { name, type = 'cash', balance = 0, note = '' } = req.body;
    const [result] = await pool.query('INSERT INTO wallets (name, type, balance, note) VALUES (?, ?, ?, ?)', [name, type, toNumber(balance), note]);
    created(res, { id: result.insertId, name, type, balance: toNumber(balance), note });
  } catch (error) { fail(res, 500, 'Không tạo được ví', error.message); }
});

app.get('/api/budgets', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, c.name AS category_name, c.color AS category_color,
      COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END), 0) AS spent
      FROM budgets b
      LEFT JOIN categories c ON c.id = b.category_id
      LEFT JOIN transactions t ON t.budget_id = b.id
      GROUP BY b.id
      ORDER BY b.id DESC
    `);
    ok(res, rows);
  } catch (error) { fail(res, 500, 'Không tải được ngân sách', error.message); }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const missing = requireFields(req.body, ['name', 'limit_amount']);
    if (missing.length) return fail(res, 400, 'Thiếu thông tin ngân sách', missing);
    const { name, category_id = null, limit_amount, start_date = null, end_date = null, note = '' } = req.body;
    const [result] = await pool.query('INSERT INTO budgets (name, category_id, limit_amount, start_date, end_date, note) VALUES (?, ?, ?, ?, ?, ?)', [name, category_id || null, toNumber(limit_amount), start_date || null, end_date || null, note]);
    created(res, { id: result.insertId });
  } catch (error) { fail(res, 500, 'Không tạo được ngân sách', error.message); }
});

app.get('/api/goals', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM goals ORDER BY id DESC');
    ok(res, rows);
  } catch (error) { fail(res, 500, 'Không tải được mục tiêu', error.message); }
});

app.post('/api/goals', async (req, res) => {
  try {
    const missing = requireFields(req.body, ['name', 'target_amount']);
    if (missing.length) return fail(res, 400, 'Thiếu thông tin mục tiêu', missing);
    const { name, target_amount, current_amount = 0, deadline = null, note = '' } = req.body;
    const [result] = await pool.query('INSERT INTO goals (name, target_amount, current_amount, deadline, note) VALUES (?, ?, ?, ?, ?)', [name, toNumber(target_amount), toNumber(current_amount), deadline || null, note]);
    created(res, { id: result.insertId });
  } catch (error) { fail(res, 500, 'Không tạo được mục tiêu', error.message); }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { keyword = '', type = '', month = '', wallet_id = '', category_id = '' } = req.query;
    const where = [];
    const params = [];
    if (keyword) { where.push('(t.title LIKE ? OR t.note LIKE ? OR c.name LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    if (type) { where.push('t.type = ?'); params.push(type); }
    if (month) { where.push("DATE_FORMAT(t.transaction_date, '%Y-%m') = ?"); params.push(month); }
    if (wallet_id) { where.push('t.wallet_id = ?'); params.push(wallet_id); }
    if (category_id) { where.push('t.category_id = ?'); params.push(category_id); }
    const sql = `
      SELECT t.*, c.name AS category_name, c.color AS category_color, w.name AS wallet_name, b.name AS budget_name
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN wallets w ON w.id = t.wallet_id
      LEFT JOIN budgets b ON b.id = t.budget_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY t.transaction_date DESC, t.id DESC
    `;
    const [rows] = await pool.query(sql, params);
    ok(res, rows);
  } catch (error) { fail(res, 500, 'Không tải được giao dịch', error.message); }
});

app.post('/api/transactions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const missing = requireFields(req.body, ['title', 'amount', 'type', 'transaction_date']);
    if (missing.length) return fail(res, 400, 'Thiếu thông tin giao dịch', missing);
    const { title, amount, type, transaction_date, category_id = null, wallet_id = null, budget_id = null, note = '' } = req.body;
    const value = toNumber(amount);
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO transactions (title, amount, type, transaction_date, category_id, wallet_id, budget_id, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, value, type, transaction_date, category_id || null, wallet_id || null, budget_id || null, note]
    );
    if (wallet_id) {
      const sign = type === 'income' ? 1 : -1;
      await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [value * sign, wallet_id]);
    }
    await connection.commit();
    created(res, { id: result.insertId });
  } catch (error) {
    await connection.rollback();
    fail(res, 500, 'Không tạo được giao dịch', error.message);
  } finally {
    connection.release();
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[transaction]] = await connection.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    if (!transaction) return fail(res, 404, 'Không tìm thấy giao dịch');
    if (transaction.wallet_id) {
      const sign = transaction.type === 'income' ? -1 : 1;
      await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [transaction.amount * sign, transaction.wallet_id]);
    }
    await connection.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    await connection.commit();
    ok(res, null, 'Đã xóa giao dịch');
  } catch (error) {
    await connection.rollback();
    fail(res, 500, 'Không xóa được giao dịch', error.message);
  } finally {
    connection.release();
  }
});

app.use((req, res) => fail(res, 404, 'Không tìm thấy API'));

app.listen(port, () => {
  console.log(`Backend đang chạy tại http://localhost:${port}`);
});
