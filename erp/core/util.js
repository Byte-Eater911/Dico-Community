function fmtRp(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

function fmtDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function fmtDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function truncate(text, len = 50) {
  return text.length > len ? text.substring(0, len) + '...' : text;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function debounce(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function paginate(arr, page = 1, perPage = 10) {
  const total = arr.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const rows = arr.slice(start, end);
  return { rows, pages: totalPages, total, page };
}
