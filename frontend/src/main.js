const app = document.querySelector('#app');

const API_BASE =
  localStorage.getItem('API_BASE') ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

const formatMoney = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
const formatDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : '--/--/----';

const state = {
  theme: localStorage.getItem('theme') || 'light',
  sidebar: false,
  activeMenu: 'dashboard',
  modal: null,
  loading: true,
  error: '',
  search: '',
  filterType: '',
  chartLine: null,
  chartDonut: null,
  data: {
    dashboard: null,
    transactions: [],
    categories: [],
    wallets: [],
    budgets: [],
    goals: []
  }
};

const menuItems = [
  ['dashboard', 'Tổng quan', 'grid'],
  ['transactions', 'Giao dịch', 'receipt'],
  ['wallets', 'Ví tiền', 'wallet'],
  ['budgets', 'Ngân sách', 'target'],
  ['goals', 'Mục tiêu', 'flag'],
  ['reports', 'Báo cáo', 'chart'],
  ['categories', 'Danh mục', 'folder'],
  ['settings', 'Cài đặt', 'gear']
];

function icon(name) {
  const icons = {
    grid: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
    receipt: '<svg viewBox="0 0 24 24"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Zm2 5h6M9 12h6M9 16h4"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><path d="M4 7a3 3 0 0 1 3-3h11v4H7a3 3 0 0 0 0 6h13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm13 7h4v-4h-4a2 2 0 0 0 0 4Z"/></svg>',
    target: '<svg viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4h8l1 2h5v10h-7l-1-2H7v7H5Z"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5h2v14H4Zm5 0V9h2v10H9Zm5 0V3h2v16h-2Zm5 0v-7h2v7h-2Z"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="m12 2 2 3 4 .5-.8 3.9 2.3 2.6-2.3 2.6.8 3.9-4 .5-2 3-2-3-4-.5.8-3.9L4.5 12l2.3-2.6L6 5.5 10 5l2-3Zm0 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M11 5h2v14h-2zM5 11h14v2H5z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10.5 18a7.5 7.5 0 1 1 5.3-12.8A7.5 7.5 0 0 1 10.5 18Zm6-1.5 4 4"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0v4l-2 3h16l-2-3V9Zm-8 10h4"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  return icons[name] || '';
}

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(API_BASE + endpoint, {
    ...options,
    headers: isFormData
      ? { ...(options.headers || {}) }
      : {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Không gọi được API');
  }

  return json.data;
}

async function loadAll(showLoading = true) {
  try {
    if (showLoading) state.loading = true;
    state.error = '';

    const [dashboard, transactions, categories, wallets, budgets, goals] = await Promise.all([
      request('/dashboard'),
      request('/transactions'),
      request('/categories'),
      request('/wallets'),
      request('/budgets'),
      request('/goals')
    ]);

    state.data = { dashboard, transactions, categories, wallets, budgets, goals };
  } catch (error) {
    state.error = error.message + '. Kiểm tra backend, MySQL, AWS S3 và file .env.';
  } finally {
    state.loading = false;
    render();
  }
}

function render() {
  document.documentElement.className = state.theme;

  app.innerHTML = `
    <aside class="sidebar ${state.sidebar ? 'open' : ''}">
      <div class="brand">
        <div class="brand-mark">FC</div>
        <div>
          <strong>FinCare</strong>
          <span>Quản lí chi tiêu</span>
        </div>
      </div>

      <nav class="nav">
        ${menuItems.map(([id, label, ic]) => `
          <button class="nav-link ${state.activeMenu === id ? 'active' : ''}" data-menu="${id}">
            ${icon(ic)}
            <span>${label}</span>
          </button>
        `).join('')}
      </nav>

      <div class="side-panel">
        <span>Máy chủ</span>
        <strong>${API_BASE.replace('/api', '')}</strong>
        <p>Frontend đang lấy dữ liệu từ API và MySQL.</p>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <button class="icon-btn menu-toggle" id="toggleSidebar">${icon('menu')}</button>

        <div>
          <p class="eyebrow">Bảng điều khiển</p>
          <h1>${pageTitle()}</h1>
        </div>

        <div class="top-actions">
          <label class="search-box">
            ${icon('search')}
            <input id="globalSearch" placeholder="Tìm giao dịch, danh mục, ví..." value="${state.search}" />
          </label>

          <button class="icon-btn" id="refreshBtn">${icon('bell')}</button>
          <button class="theme-btn" id="themeBtn">${state.theme === 'dark' ? 'Sáng' : 'Tối'}</button>
        </div>
      </header>

      ${state.loading ? loadingView() : state.error ? errorView() : pageContent()}
      ${footer()}
    </main>

    ${state.modal ? modalTemplate(state.modal) : ''}
  `;

  bindEvents();
  drawCharts();
}

function pageTitle() {
  return menuItems.find(item => item[0] === state.activeMenu)?.[1] || 'Quản lí tài chính cá nhân';
}

function loadingView() {
  return `
    <section class="hero-card">
      <div>
        <p class="eyebrow">Đang tải</p>
        <h2>Đang kết nối dữ liệu</h2>
        <p>Vui lòng kiểm tra backend đang chạy ở cổng 5000.</p>
      </div>
    </section>
  `;
}

function errorView() {
  return `
    <section class="hero-card">
      <div>
        <p class="eyebrow">Chưa kết nối được</p>
        <h2>${state.error}</h2>
        <p>Chạy MySQL, import file SQL, cấu hình .env rồi khởi động backend.</p>
        <div class="hero-actions">
          <button class="primary" id="retryBtn">Thử lại</button>
        </div>
      </div>
    </section>
  `;
}

function pageContent() {
  const pages = { dashboard, transactions, wallets, budgets, goals, reports, categories, settings };
  return (pages[state.activeMenu] || dashboard)();
}

function dashboard() {
  const d = state.data.dashboard;
  const summary = d.summary || {};
  const wallets = d.wallets || {};
  const budget = d.budget || {};

  return `
    <section class="hero-card">
      <div>
        <p class="eyebrow">Tổng quan tháng này</p>
        <h2>Kiểm soát thu chi dễ dàng hơn</h2>
        <p>Dữ liệu được tải trực tiếp từ MySQL qua API. Bạn có thể thêm ví, danh mục, ngân sách, mục tiêu và giao dịch kèm ảnh hóa đơn.</p>
        <div class="hero-actions">
          <button class="primary" data-modal="transaction">${icon('plus')} Thêm giao dịch</button>
          <button class="secondary" data-modal="wallet">Tạo ví mới</button>
        </div>
      </div>

      <div class="hero-balance">
        <span>Số dư ví</span>
        <strong>${formatMoney(wallets.wallet_balance)}</strong>
        <small>${wallets.wallet_count || 0} ví đang quản lí</small>
      </div>
    </section>

    <section class="stats-grid">
      ${statCard('Thu nhập tháng', summary.total_income, 'Tổng khoản thu', 'income')}
      ${statCard('Chi tiêu tháng', summary.total_expense, 'Tổng khoản chi', 'expense')}
      ${statCard('Chênh lệch tháng', summary.balance, 'Thu trừ chi', 'balance')}
      ${statCard('Ngân sách còn lại', budget.remaining_budget, 'Theo hạn mức', 'budget')}
    </section>

    <section class="content-grid">
      <div class="panel wide">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Biểu đồ</p>
            <h3>Dòng tiền gần đây</h3>
          </div>
        </div>
        <canvas id="lineChart" height="115"></canvas>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Phân bổ</p>
            <h3>Danh mục chi</h3>
          </div>
        </div>
        <canvas id="donutChart" height="210"></canvas>
      </div>
    </section>

    <section class="content-grid second">
      <div class="panel wide">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Giao dịch</p>
            <h3>Gần đây</h3>
          </div>
          <button class="mini-btn" data-modal="transaction">Thêm mới</button>
        </div>
        ${transactionTable(d.recent || [])}
      </div>

      <div class="panel stack-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Tiện ích</p>
            <h3>Thao tác nhanh</h3>
          </div>
        </div>
        ${quickAction('Nhập giao dịch', 'Ghi nhận thu chi hằng ngày', 'transaction')}
        ${quickAction('Tạo ngân sách', 'Đặt hạn mức theo danh mục', 'budget')}
        ${quickAction('Thêm mục tiêu', 'Theo dõi kế hoạch tiết kiệm', 'goal')}
        ${quickAction('Thêm danh mục', 'Tổ chức dữ liệu rõ ràng', 'category')}
      </div>
    </section>

    <section class="feature-grid" id="features">
      ${feature('Quản lí nhiều ví', 'Tách ví tiền mặt, ngân hàng, ví điện tử và tài khoản tiết kiệm.')}
      ${feature('Ngân sách theo danh mục', 'Thiết lập hạn mức ăn uống, đi lại, học tập, mua sắm, giải trí.')}
      ${feature('Lưu ảnh hóa đơn', 'Ảnh biên lai được upload lên AWS S3 và gắn với từng giao dịch.')}
      ${feature('Báo cáo trực quan', 'Biểu đồ tự cập nhật dựa trên giao dịch đã lưu trong MySQL.')}
    </section>
  `;
}

function transactions() {
  const rows = filteredTransactions();

  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Dữ liệu giao dịch</p>
          <h3>${rows.length} giao dịch</h3>
        </div>
        <button class="primary" data-modal="transaction">${icon('plus')} Thêm giao dịch</button>
      </div>

      <div class="filters">
        <input id="transactionSearch" placeholder="Tìm theo tên, ghi chú, danh mục" value="${state.search}" />
        <select id="typeFilter">
          <option value="">Tất cả loại</option>
          <option value="income" ${state.filterType === 'income' ? 'selected' : ''}>Khoản thu</option>
          <option value="expense" ${state.filterType === 'expense' ? 'selected' : ''}>Khoản chi</option>
        </select>
      </div>

      ${transactionTable(rows, true)}
    </section>
  `;
}

function receiptCell(row) {
  if (!row.receipt_url) {
    return `<span class="muted">Không có</span>`;
  }

  return `
    <a href="${row.receipt_url}" target="_blank" class="receipt-link">
      Xem hóa đơn
    </a>
  `;
}

function transactionTable(rows, allowDelete = false) {
  if (!rows.length) return `<div class="empty-state">Chưa có dữ liệu phù hợp.</div>`;

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tên giao dịch</th>
            <th>Danh mục</th>
            <th>Ví</th>
            <th>Ngày</th>
            <th>Loại</th>
            <th>Hóa đơn</th>
            <th class="right">Số tiền</th>
            ${allowDelete ? '<th></th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td>
                <strong>${row.title}</strong>
                <small>${row.note || ''}</small>
              </td>
              <td>${row.category_name || 'Khác'}</td>
              <td>${row.wallet_name || '-'}</td>
              <td>${formatDate(row.transaction_date)}</td>
              <td>
                <span class="badge ${row.type}">
                  ${row.type === 'income' ? 'Khoản thu' : 'Khoản chi'}
                </span>
              </td>
              <td>${receiptCell(row)}</td>
              <td class="right ${row.type === 'income' ? 'money-in' : 'money-out'}">
                ${row.type === 'income' ? '+' : '-'}${formatMoney(row.amount)}
              </td>
              ${allowDelete ? `
                <td>
                  <button class="mini-btn danger-btn" data-delete-transaction="${row.id}">Xóa</button>
                </td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filteredTransactions() {
  const keyword = state.search.trim().toLowerCase();

  return state.data.transactions.filter(row => {
    const text = [row.title, row.note, row.category_name, row.wallet_name].join(' ').toLowerCase();
    return (!keyword || text.includes(keyword)) && (!state.filterType || row.type === state.filterType);
  });
}

function wallets() {
  return entityPage('Ví tiền', 'wallet', state.data.wallets, item => `
    <article class="entity-card">
      <span>${item.type}</span>
      <h3>${item.name}</h3>
      <strong>${formatMoney(item.balance)}</strong>
      <p>${item.note || 'Không có ghi chú'}</p>
    </article>
  `);
}

function budgets() {
  return entityPage('Ngân sách', 'budget', state.data.budgets, item => {
    const percent = item.limit_amount
      ? Math.min(100, Math.round((Number(item.spent || 0) / Number(item.limit_amount)) * 100))
      : 0;

    return `
      <article class="entity-card">
        <span>${item.category_name || 'Tất cả'}</span>
        <h3>${item.name}</h3>
        <strong>${formatMoney(item.spent)} / ${formatMoney(item.limit_amount)}</strong>
        <div class="progress"><i style="width:${percent}%"></i></div>
        <p>${percent}% đã sử dụng</p>
      </article>
    `;
  });
}

function goals() {
  return entityPage('Mục tiêu', 'goal', state.data.goals, item => {
    const percent = item.target_amount
      ? Math.min(100, Math.round((Number(item.current_amount || 0) / Number(item.target_amount)) * 100))
      : 0;

    return `
      <article class="entity-card">
        <span>Hạn: ${formatDate(item.deadline)}</span>
        <h3>${item.name}</h3>
        <strong>${formatMoney(item.current_amount)} / ${formatMoney(item.target_amount)}</strong>
        <div class="progress"><i style="width:${percent}%"></i></div>
        <p>${item.note || percent + '% hoàn thành'}</p>
      </article>
    `;
  });
}

function categories() {
  return entityPage('Danh mục', 'category', state.data.categories, item => `
    <article class="entity-card">
      <span>${item.type === 'income' ? 'Khoản thu' : 'Khoản chi'}</span>
      <h3>${item.name}</h3>
      <strong style="color:${item.color}">${item.color}</strong>
      <p>Biểu tượng: ${item.icon || 'folder'}</p>
    </article>
  `);
}

function entityPage(title, modal, rows, renderer) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <p class="eyebrow">Quản lí</p>
          <h3>${title}</h3>
        </div>
        <button class="primary" data-modal="${modal}">${icon('plus')} Thêm mới</button>
      </div>

      <div class="entity-grid">
        ${rows.length ? rows.map(renderer).join('') : '<div class="empty-state">Chưa có dữ liệu.</div>'}
      </div>
    </section>
  `;
}

function reports() {
  const d = state.data.dashboard;
  const totalExpense = Number(d.summary?.total_expense || 0);
  const totalIncome = Number(d.summary?.total_income || 0);
  const rate = totalIncome ? Math.round((totalExpense / totalIncome) * 100) : 0;

  return `
    <section class="content-grid">
      <div class="panel wide">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Báo cáo</p>
            <h3>Dòng tiền</h3>
          </div>
        </div>
        <canvas id="lineChart" height="125"></canvas>
      </div>

      <div class="panel">
        <p class="eyebrow">Tỉ lệ chi tiêu</p>
        <h3>${rate}% thu nhập</h3>
        <div class="progress big"><i style="width:${Math.min(rate, 100)}%"></i></div>
        <p class="muted-text">Chi tiêu tháng: ${formatMoney(totalExpense)} trên thu nhập ${formatMoney(totalIncome)}.</p>
      </div>
    </section>
  `;
}

function settings() {
  return `
    <section class="forms-grid">
      <div class="panel form-preview">
        <p class="eyebrow">Kết nối API</p>
        <h3>Cấu hình frontend</h3>
        <form class="form" id="apiForm">
          <input name="apiBase" value="${API_BASE}" placeholder="API base URL" />
          <button class="primary full">Lưu cấu hình</button>
        </form>
      </div>

      <div class="panel form-preview">
        <p class="eyebrow">Tài khoản</p>
        <h3>Thông tin hiển thị</h3>
        <form class="form">
          <input placeholder="Họ và tên" />
          <input placeholder="Email" />
          <select>
            <option>Tiền tệ: VND</option>
            <option>USD</option>
          </select>
          <button type="button" class="primary full">Lưu thay đổi</button>
        </form>
      </div>
    </section>
  `;
}

function statCard(title, value, hint, type) {
  return `
    <article class="stat-card ${type}">
      <span>${title}</span>
      <strong>${formatMoney(value)}</strong>
      <small>${hint}</small>
    </article>
  `;
}

function feature(title, desc) {
  return `
    <article class="feature">
      <div class="feature-dot"></div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </article>
  `;
}

function quickAction(title, desc, modal) {
  return `
    <button class="quick" data-modal="${modal}">
      <span>
        <strong>${title}</strong>
        <small>${desc}</small>
      </span>
      <b>→</b>
    </button>
  `;
}

function modalTemplate(type) {
  const titles = {
    transaction: 'Thêm giao dịch',
    wallet: 'Tạo ví mới',
    budget: 'Tạo ngân sách',
    goal: 'Thêm mục tiêu',
    category: 'Thêm danh mục'
  };

  return `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <button class="close" id="closeModal">×</button>
        <p class="eyebrow">Biểu mẫu</p>
        <h2>${titles[type] || 'Biểu mẫu'}</h2>
        ${modalForm(type)}
      </div>
    </div>
  `;
}

function modalForm(type) {
  if (type === 'transaction') {
    return `
      <form class="form" data-form="transaction">
        <div class="two">
          <input name="title" placeholder="Tên giao dịch" required />
          <input name="amount" type="number" placeholder="Số tiền" required />
        </div>

        <div class="two">
          <select name="type">
            <option value="expense">Khoản chi</option>
            <option value="income">Khoản thu</option>
          </select>

          <select name="category_id">
            <option value="">Danh mục</option>
            ${state.data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>

        <div class="two">
          <input name="transaction_date" type="date" required value="${new Date().toISOString().slice(0, 10)}" />

          <select name="wallet_id">
            <option value="">Ví tiền</option>
            ${state.data.wallets.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
          </select>
        </div>

        <select name="budget_id">
          <option value="">Ngân sách liên quan</option>
          ${state.data.budgets.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
        </select>

        <textarea name="note" placeholder="Ghi chú"></textarea>

        <label class="file-field">
          <span>Ảnh hóa đơn / biên lai</span>
          <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" />
          <small>Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 5MB.</small>
        </label>

        <button class="primary full">Lưu giao dịch</button>
      </form>
    `;
  }

  if (type === 'wallet') {
    return `
      <form class="form" data-form="wallet">
        <input name="name" placeholder="Tên ví" required />
        <input name="balance" type="number" placeholder="Số dư ban đầu" />
        <select name="type">
          <option value="cash">Tiền mặt</option>
          <option value="bank">Ngân hàng</option>
          <option value="ewallet">Ví điện tử</option>
          <option value="saving">Tiết kiệm</option>
          <option value="other">Khác</option>
        </select>
        <textarea name="note" placeholder="Ghi chú"></textarea>
        <button class="primary full">Lưu ví</button>
      </form>
    `;
  }

  if (type === 'budget') {
    return `
      <form class="form" data-form="budget">
        <input name="name" placeholder="Tên ngân sách" required />
        <input name="limit_amount" type="number" placeholder="Hạn mức" required />

        <select name="category_id">
          <option value="">Danh mục</option>
          ${state.data.categories
            .filter(c => c.type === 'expense')
            .map(c => `<option value="${c.id}">${c.name}</option>`)
            .join('')}
        </select>

        <div class="two">
          <input name="start_date" type="date" />
          <input name="end_date" type="date" />
        </div>

        <textarea name="note" placeholder="Ghi chú"></textarea>
        <button class="primary full">Lưu ngân sách</button>
      </form>
    `;
  }

  if (type === 'goal') {
    return `
      <form class="form" data-form="goal">
        <input name="name" placeholder="Tên mục tiêu" required />

        <div class="two">
          <input name="target_amount" type="number" placeholder="Số tiền cần đạt" required />
          <input name="current_amount" type="number" placeholder="Đã tiết kiệm" />
        </div>

        <input name="deadline" type="date" />
        <textarea name="note" placeholder="Ghi chú"></textarea>
        <button class="primary full">Lưu mục tiêu</button>
      </form>
    `;
  }

  if (type === 'category') {
    return `
      <form class="form" data-form="category">
        <input name="name" placeholder="Tên danh mục" required />

        <select name="type">
          <option value="expense">Khoản chi</option>
          <option value="income">Khoản thu</option>
        </select>

        <div class="two">
          <input name="color" value="#2563eb" placeholder="Màu" />
          <input name="icon" value="folder" placeholder="Icon" />
        </div>

        <button class="primary full">Lưu danh mục</button>
      </form>
    `;
  }

  return '';
}

function footer() {
  return `
    <footer class="footer" id="contact">
      <div>
        <div class="brand footer-brand">
          <div class="brand-mark">FC</div>
          <div>
            <strong>FinCare</strong>
            <span>Quản lí chi tiêu cá nhân</span>
          </div>
        </div>
        <p>Website hỗ trợ quản lí thu chi, ngân sách, ví tiền và mục tiêu tiết kiệm.</p>
      </div>

      <div>
        <h4>Giới thiệu</h4>
        <a>Về dự án</a>
        <a>Tính năng</a>
        <a>Bảo mật</a>
        <a>Hướng dẫn</a>
      </div>

      <div>
        <h4>Liên hệ</h4>
        <a>Email: contact@fincare.vn</a>
        <a>Hotline: 0123 456 789</a>
        <a>Địa chỉ: Việt Nam</a>
        <a>Facebook / Zalo</a>
      </div>

      <div>
        <h4>Nhận thông tin</h4>
        <p>Đăng ký để nhận thông báo khi hệ thống có bản cập nhật.</p>
        <div class="subscribe">
          <input placeholder="Email của bạn" />
          <button>Gửi</button>
        </div>
      </div>
    </footer>
  `;
}

function bindEvents() {
  document.querySelectorAll('[data-menu]').forEach(btn => {
    btn.onclick = () => {
      state.activeMenu = btn.dataset.menu;
      state.sidebar = false;
      render();
    };
  });

  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.onclick = () => {
      state.modal = btn.dataset.modal;
      render();
    };
  });

  document.querySelector('#themeBtn')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    render();
  });

  document.querySelector('#toggleSidebar')?.addEventListener('click', () => {
    state.sidebar = !state.sidebar;
    render();
  });

  document.querySelector('#refreshBtn')?.addEventListener('click', () => loadAll());
  document.querySelector('#retryBtn')?.addEventListener('click', () => loadAll());

  document.querySelector('#globalSearch')?.addEventListener('input', e => {
    state.search = e.target.value;
  });

  document.querySelector('#transactionSearch')?.addEventListener('input', e => {
    state.search = e.target.value;
    render();
  });

  document.querySelector('#typeFilter')?.addEventListener('change', e => {
    state.filterType = e.target.value;
    render();
  });

  document.querySelector('#closeModal')?.addEventListener('click', () => {
    state.modal = null;
    render();
  });

  document.querySelector('#modalBackdrop')?.addEventListener('click', e => {
    if (e.target.id === 'modalBackdrop') {
      state.modal = null;
      render();
    }
  });

  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', handleSubmit);
  });

  document.querySelectorAll('[data-delete-transaction]').forEach(btn => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.deleteTransaction));
  });

  document.querySelector('#apiForm')?.addEventListener('submit', e => {
    e.preventDefault();
    localStorage.setItem('API_BASE', new FormData(e.target).get('apiBase'));
    location.reload();
  });
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const type = form.dataset.form;

  const endpoint = {
    transaction: '/transactions',
    wallet: '/wallets',
    budget: '/budgets',
    goal: '/goals',
    category: '/categories'
  }[type];

  try {
    if (type === 'transaction') {
      const formData = new FormData(form);

      for (const [key, value] of [...formData.entries()]) {
        if (value === '') {
          formData.delete(key);
        }
      }

      const receipt = form.querySelector('input[name="receipt"]')?.files?.[0];

      if (!receipt) {
        formData.delete('receipt');
      }

      await request(endpoint, {
        method: 'POST',
        body: formData
      });
    } else {
      const data = Object.fromEntries(new FormData(form).entries());

      Object.keys(data).forEach(key => {
        if (data[key] === '') data[key] = null;
      });

      await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }

    state.modal = null;
    await loadAll(false);
  } catch (error) {
    alert(error.message);
  }
}

async function deleteTransaction(id) {
  if (!confirm('Xóa giao dịch này?')) return;

  try {
    await request('/transactions/' + id, { method: 'DELETE' });
    await loadAll(false);
  } catch (error) {
    alert(error.message);
  }
}

function drawCharts() {
  if (!window.Chart || state.loading || state.error) return;

  const line = document.querySelector('#lineChart');
  const donut = document.querySelector('#donutChart');

  if (state.chartLine) state.chartLine.destroy();
  if (state.chartDonut) state.chartDonut.destroy();

  const cashflow = state.data.dashboard?.cashflow || [];

  if (line) {
    state.chartLine = new Chart(line, {
      type: 'line',
      data: {
        labels: cashflow.map(x => x.label),
        datasets: [
          {
            label: 'Thu nhập',
            data: cashflow.map(x => x.income),
            tension: 0.45,
            borderWidth: 3
          },
          {
            label: 'Chi tiêu',
            data: cashflow.map(x => x.expense),
            tension: 0.45,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          y: {
            ticks: {
              callback: value => new Intl.NumberFormat('vi-VN').format(value)
            }
          }
        }
      }
    });
  }

  const cats = state.data.dashboard?.categoryStats || [];

  if (donut) {
    state.chartDonut = new Chart(donut, {
      type: 'doughnut',
      data: {
        labels: cats.map(x => x.name),
        datasets: [
          {
            data: cats.map(x => x.total),
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '70%'
      }
    });
  }
}

loadAll();