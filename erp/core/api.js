async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('[API ERROR]', url, err);
    return { success: false, message: 'Koneksi server gagal. Pastikan XAMPP MySQL ON.' };
  }
}

async function apiGet(url) {
  return apiCall(url);
}

async function apiPost(url, formData) {
  return apiCall(url, { method: 'POST', body: formData });
}

async function apiPostJSON(url, data) {
  return apiCall(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

function buildFormData(obj) {
  const fd = new FormData();
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      fd.append(key, obj[key]);
    }
  }
  return fd;
}
