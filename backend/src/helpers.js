function ok(res, data = null, message = 'Thành công') {
  res.json({ success: true, message, data });
}

function created(res, data = null, message = 'Tạo mới thành công') {
  res.status(201).json({ success: true, message, data });
}

function fail(res, status = 500, message = 'Có lỗi xảy ra', details = null) {
  res.status(status).json({ success: false, message, details });
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function requireFields(body, fields) {
  return fields.filter(field => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
}

module.exports = { ok, created, fail, toNumber, requireFields };
