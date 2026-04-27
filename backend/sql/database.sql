USE defaultdb;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  color VARCHAR(20) DEFAULT '#2563eb',
  icon VARCHAR(50) DEFAULT 'folder',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  type ENUM('cash', 'bank', 'ewallet', 'saving', 'other') DEFAULT 'cash',
  balance DECIMAL(15,2) DEFAULT 0,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category_id INT NULL,
  limit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  start_date DATE NULL,
  end_date DATE NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  deadline DATE NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  transaction_date DATE NOT NULL,
  category_id INT NULL,
  wallet_id INT NULL,
  budget_id INT NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
  FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL,
  INDEX idx_transactions_date (transaction_date),
  INDEX idx_transactions_type (type)
);

INSERT INTO users (full_name, email, phone) VALUES
('Nguyễn Minh Anh', 'minhanh@example.com', '0900000001');

INSERT INTO categories (name, type, color, icon) VALUES
('Lương', 'income', '#10b981', 'salary'),
('Thưởng', 'income', '#22c55e', 'gift'),
('Ăn uống', 'expense', '#f97316', 'food'),
('Đi lại', 'expense', '#06b6d4', 'transport'),
('Nhà ở', 'expense', '#8b5cf6', 'home'),
('Học tập', 'expense', '#2563eb', 'book'),
('Mua sắm', 'expense', '#ec4899', 'shopping'),
('Giải trí', 'expense', '#f59e0b', 'game'),
('Sức khỏe', 'expense', '#ef4444', 'health');

INSERT INTO wallets (name, type, balance, note) VALUES
('Tiền mặt', 'cash', 2500000, 'Chi tiêu hằng ngày'),
('Ngân hàng Vietcombank', 'bank', 18500000, 'Tài khoản chính'),
('Ví điện tử', 'ewallet', 1200000, 'Thanh toán nhanh'),
('Quỹ tiết kiệm', 'saving', 8000000, 'Dành cho mục tiêu dài hạn');

INSERT INTO budgets (name, category_id, limit_amount, start_date, end_date, note) VALUES
('Ngân sách ăn uống tháng này', 3, 3500000, DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), LAST_DAY(CURRENT_DATE()), 'Theo dõi chi phí ăn uống'),
('Ngân sách đi lại tháng này', 4, 1200000, DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), LAST_DAY(CURRENT_DATE()), 'Xăng xe, gửi xe, taxi'),
('Ngân sách giải trí tháng này', 8, 1000000, DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), LAST_DAY(CURRENT_DATE()), 'Cà phê, xem phim, đi chơi');

INSERT INTO goals (name, target_amount, current_amount, deadline, note) VALUES
('Mua laptop mới', 18000000, 6500000, DATE_ADD(CURRENT_DATE(), INTERVAL 5 MONTH), 'Phục vụ học tập và làm việc'),
('Quỹ dự phòng', 30000000, 12000000, DATE_ADD(CURRENT_DATE(), INTERVAL 10 MONTH), 'Dự phòng chi phí phát sinh'),
('Du lịch hè', 10000000, 2500000, DATE_ADD(CURRENT_DATE(), INTERVAL 3 MONTH), 'Kế hoạch cá nhân');

INSERT INTO transactions (title, amount, type, transaction_date, category_id, wallet_id, budget_id, note) VALUES
('Nhận lương tháng này', 12000000, 'income', DATE_FORMAT(CURRENT_DATE(), '%Y-%m-05'), 1, 2, NULL, 'Lương chuyển khoản'),
('Thưởng dự án', 2000000, 'income', DATE_FORMAT(CURRENT_DATE(), '%Y-%m-10'), 2, 2, NULL, 'Thưởng thêm'),
('Ăn trưa', 65000, 'expense', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 3, 1, 1, 'Cơm trưa'),
('Cà phê với bạn', 55000, 'expense', DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY), 8, 3, 3, 'Cuối tuần'),
('Đổ xăng', 90000, 'expense', DATE_SUB(CURRENT_DATE(), INTERVAL 3 DAY), 4, 1, 2, 'Xe máy'),
('Mua sách', 180000, 'expense', DATE_SUB(CURRENT_DATE(), INTERVAL 5 DAY), 6, 2, NULL, 'Sách kỹ năng'),
('Tiền nhà', 2500000, 'expense', DATE_FORMAT(CURRENT_DATE(), '%Y-%m-02'), 5, 2, NULL, 'Thuê phòng'),
('Siêu thị', 430000, 'expense', DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY), 7, 2, NULL, 'Đồ dùng cá nhân'),
('Khám sức khỏe', 350000, 'expense', DATE_SUB(CURRENT_DATE(), INTERVAL 9 DAY), 9, 2, NULL, 'Khám định kỳ'),
('Ăn sáng', 30000, 'expense', DATE_SUB(CURRENT_DATE(), INTERVAL 10 DAY), 3, 1, 1, 'Bánh mì');

-- Điều chỉnh số dư ví theo dữ liệu mẫu giao dịch nếu muốn khớp tuyệt đối có thể tự cập nhật lại sau.
