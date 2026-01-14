/**
 * Manage Data - Kelola Siswa
 * - Tambah siswa baru
 * - Edit siswa
 * - Hapus siswa
 */

let allUsers = [];
let editingUserId = null;

/**
 * Load dan render semua siswa
 */
async function loadAndRenderSiswa() {
  try {
    allUsers = await getCollection('users');
    renderSiswaList();
  } catch (error) {
    showManageStatus(`Error loading siswa: ${error.message}`, 'error');
    console.error(error);
  }
}

/**
 * Render list siswa dalam cards
 */
function renderSiswaList() {
  const container = document.getElementById('siswaListContainer');
  container.innerHTML = '';
  
  document.getElementById('totalSiswa').textContent = allUsers.length;
  
  allUsers.forEach(user => {
    const card = document.createElement('div');
    card.className = 'siswa-card';
    card.innerHTML = `
      <div class="siswa-card-header">
        <div class="siswa-card-name">${user.name}</div>
        <div class="siswa-card-actions">
          <button class="btn btn-sm btn-warning edit-btn" data-id="${user.id}">✏️ Edit</button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${user.id}">🗑️ Hapus</button>
        </div>
      </div>
      <div class="siswa-card-info">
        <p><strong>NIS:</strong> ${user.nis || '-'}</p>
        <p><strong>Jurusan:</strong> ${user.jurusan || '-'}</p>
      </div>
      <div class="siswa-card-stats">
        <div class="stat-item">
          <div class="stat-label">Ambil</div>
          <div class="stat-value">${user.ambil || 0}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Utang</div>
          <div class="stat-value">${user.utang || 0}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Setup event listeners untuk edit dan delete buttons
  setupSiswaCardEvents();
}

/**
 * Setup event listeners untuk action buttons di cards
 */
function setupSiswaCardEvents() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.id;
      editSiswa(userId);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.id;
      if (confirm('Yakin hapus siswa ini?')) {
        deleteSiswa(userId);
      }
    });
  });
}

/**
 * Load form untuk edit siswa
 */
function editSiswa(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  
  editingUserId = userId;
  
  document.getElementById('manageName').value = user.name;
  document.getElementById('manageNis').value = user.nis || '';
  document.getElementById('manageJurusan').value = user.jurusan || '';
  document.getElementById('manageAmbil').value = user.ambil || 0;
  document.getElementById('manageUtang').value = user.utang || 0;
  
  document.getElementById('formTitle').textContent = `Edit: ${user.name}`;
  document.getElementById('submitBtn').textContent = '💾 Simpan Perubahan';
  document.getElementById('submitBtn').className = 'btn btn-warning';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  
  // Scroll ke form
  document.getElementById('manageForm').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Cancel edit
 */
function cancelEdit() {
  editingUserId = null;
  resetManageForm();
}

/**
 * Reset form ke state default
 */
function resetManageForm() {
  document.getElementById('manageForm').reset();
  document.getElementById('formTitle').textContent = 'Tambah Siswa Baru';
  document.getElementById('submitBtn').textContent = '➕ Tambah';
  document.getElementById('submitBtn').className = 'btn btn-primary';
  document.getElementById('cancelEditBtn').style.display = 'none';
  editingUserId = null;
}

/**
 * Submit form - tambah atau edit
 */
async function submitManageForm(e) {
  e.preventDefault();
  
  const name = document.getElementById('manageName').value.trim();
  const nis = document.getElementById('manageNis').value.trim();
  const jurusan = document.getElementById('manageJurusan').value;
  const ambil = parseInt(document.getElementById('manageAmbil').value) || 0;
  const utang = parseInt(document.getElementById('manageUtang').value) || 0;
  
  if (!name || !jurusan) {
    showManageStatus('Nama dan jurusan wajib diisi!', 'error');
    return;
  }
  
  try {
    if (editingUserId) {
      // Edit existing user
      await updateDocument('users', editingUserId, {
        name,
        nis,
        jurusan,
        ambil,
        utang
      });
      showManageStatus(`✓ Data ${name} berhasil diubah!`, 'success');
    } else {
      // Add new user
      const newUserId = `user_${Date.now()}`;
      await setDocument('users', newUserId, {
        name,
        nis,
        jurusan,
        ambil: 0,
        utang: 0
      });
      showManageStatus(`✓ Siswa ${name} berhasil ditambahkan!`, 'success');
    }
    
    resetManageForm();
    await loadAndRenderSiswa();
  } catch (error) {
    showManageStatus(`✗ Error: ${error.message}`, 'error');
    console.error(error);
  }
}

/**
 * Hapus siswa
 */
async function deleteSiswa(userId) {
  try {
    const user = allUsers.find(u => u.id === userId);
    await deleteDocument('users', userId);
    showManageStatus(`✓ Siswa ${user.name} berhasil dihapus!`, 'success');
    await loadAndRenderSiswa();
  } catch (error) {
    showManageStatus(`✗ Error menghapus: ${error.message}`, 'error');
    console.error(error);
  }
}

/**
 * Show status message
 */
function showManageStatus(message, type) {
  const element = document.getElementById('manageStatus');
  element.className = `status-message show ${type}`;
  element.textContent = message;
  
  setTimeout(() => {
    element.classList.remove('show');
  }, 4000);
}

/**
 * Setup event listeners untuk manage tab
 */
function setupManageEventListeners() {
  document.getElementById('manageForm').addEventListener('submit', submitManageForm);
  document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
}

/**
 * Init manage tab ketika tab active
 */
async function initManageTab() {
  await loadAndRenderSiswa();
  setupManageEventListeners();
}
