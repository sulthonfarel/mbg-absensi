/**
 * Iuran Management
 * - Load & display iuran checklist
 * - Handle payment status update
 * - Calculate iuran summary
 */

let currentIuranId = null;

/**
 * Load iuran data (absensi terakhir)
 */
async function loadLatestIuran() {
  try {
    // Get latest absensi
    const absensiDocs = await getCollection('absensi');
    
    if (absensiDocs.length === 0) {
      document.getElementById('lastAbsensiDate').textContent = 'Belum ada pengambilan';
      document.getElementById('iuranForm').innerHTML = '';
      return;
    }
    
    // Sort by timestamp dan ambil yang terbaru
    const latest = absensiDocs.sort((a, b) => b.timestamp - a.timestamp)[0];
    currentIuranId = latest.id;
    
    document.getElementById('lastAbsensiDate').textContent = 
      `${latest.tanggal} (${latest.pengambil_nama.join(', ')})`;
    
    // Load iuran document
    const iuranDoc = await getDocument('iuran', latest.id);
    
    if (!iuranDoc) {
      throw new Error('Iuran document tidak ditemukan');
    }
    
    renderIuranChecklist(iuranDoc);
    updateIuranSummary();
    
  } catch (error) {
    console.error('Error loading iuran:', error);
  }
}

/**
 * Render iuran checklist
 */
async function renderIuranChecklist(iuranData) {
  const form = document.getElementById('iuranForm');
  form.innerHTML = '';
  
  const users = await getCollection('users');
  
  users.forEach(user => {
    const isPaid = iuranData.bayar[user.id] || false;
    
    const div = document.createElement('div');
    div.className = 'checkbox-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `bayar_${user.id}`;
    checkbox.checked = isPaid;
    checkbox.dataset.userId = user.id;
    checkbox.addEventListener('change', onPaymentStatusChange);
    
    const label = document.createElement('label');
    label.htmlFor = `bayar_${user.id}`;
    label.textContent = user.name;
    
    div.appendChild(checkbox);
    div.appendChild(label);
    form.appendChild(div);
  });
}

/**
 * Handle payment status change
 */
async function onPaymentStatusChange(event) {
  const userId = event.target.dataset.userId;
  const isPaid = event.target.checked;
  
  try {
    if (!currentIuranId) {
      throw new Error('No current iuran selected');
    }
    
    // Update payment status
    const updatePath = `bayar.${userId}`;
    const updateData = {};
    updateData[`bayar.${userId}`] = isPaid;
    
    await updateDocument('iuran', currentIuranId, updateData);
    console.log(`✓ Updated payment for ${userId}: ${isPaid}`);
    
    // Update summary
    updateIuranSummary();
    
  } catch (error) {
    console.error('Error updating payment:', error);
    event.target.checked = !isPaid; // Revert checkbox
  }
}

/**
 * Save iuran (untuk button)
 */
async function saveIuran() {
  try {
    // Data sudah tersimpan real-time, ini hanya untuk UX
    showIuranSuccess('✓ Pembayaran sudah disimpan!');
  } catch (error) {
    showIuranError(`✗ Error: ${error.message}`);
  }
}

/**
 * Reset iuran checklist untuk absensi current
 */
async function resetIuran() {
  if (!confirm('Reset semua pembayaran untuk absensi ini?')) return;
  
  try {
    if (!currentIuranId) {
      throw new Error('No current iuran selected');
    }
    
    // Get all users
    const users = await getCollection('users');
    const updateData = { bayar: {} };
    users.forEach(user => {
      updateData.bayar[user.id] = false;
    });
    
    // Update document
    await updateDocument('iuran', currentIuranId, updateData);
    console.log('✓ Reset iuran checklist');
    
    // Reload UI
    await loadLatestIuran();
    showIuranSuccess('↻ Pembayaran direset');
    
  } catch (error) {
    showIuranError(`✗ Error reset: ${error.message}`);
    console.error('Error resetting iuran:', error);
  }
}

/**
 * Update iuran summary
 */
async function updateIuranSummary() {
  try {
    // Get current iuran data
    if (!currentIuranId) return;
    
    const iuranDoc = await getDocument('iuran', currentIuranId);
    if (!iuranDoc) return;
    
    // Count payments
    const bayar = iuranDoc.bayar || {};
    const totalPaid = Object.values(bayar).filter(v => v === true).length;
    const totalSiswa = 16;
    const costPerStudent = 1500;
    
    // Calculate totals
    const totalTerkumpul = totalPaid * costPerStudent;
    const totalSeharusnya = totalSiswa * costPerStudent;
    
    // Update UI
    document.getElementById('totalTerkumpul').textContent = formatRupiah(totalTerkumpul);
    document.getElementById('totalSeharusnya').textContent = formatRupiah(totalSeharusnya);
    document.getElementById('siswaLunas').textContent = `${totalPaid} / ${totalSiswa}`;
    
  } catch (error) {
    console.error('Error updating iuran summary:', error);
  }
}

/**
 * Get iuran summary across all absensi
 */
async function getIuranSummaryAll() {
  try {
    const allIuran = await getCollection('iuran');
    const users = await getCollection('users');
    
    const summary = {};
    users.forEach(user => {
      summary[user.id] = {
        name: user.name,
        sudah_bayar: 0,
        belum_bayar: 0,
        total_rp: 0
      };
    });
    
    // Count for each user
    allIuran.forEach(iuran => {
      Object.entries(iuran.bayar).forEach(([userId, isPaid]) => {
        if (summary[userId]) {
          if (isPaid) {
            summary[userId].sudah_bayar++;
            summary[userId].total_rp += 1500;
          } else {
            summary[userId].belum_bayar++;
          }
        }
      });
    });
    
    return Object.values(summary);
    
  } catch (error) {
    console.error('Error getting iuran summary:', error);
    return [];
  }
}

/**
 * Render pembayaran recap table
 */
async function renderPembayaranRecap() {
  const tbody = document.querySelector('#pembayaranTable tbody');
  tbody.innerHTML = '';
  
  const summary = await getIuranSummaryAll();
  
  if (summary.length === 0) {
    document.getElementById('pembayaranEmpty').style.display = 'block';
    return;
  }
  
  document.getElementById('pembayaranEmpty').style.display = 'none';
  
  summary.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.sudah_bayar}</td>
      <td>${item.belum_bayar}</td>
      <td>${formatRupiah(item.total_rp)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Show iuran success message
 */
function showIuranSuccess(message) {
  const status = document.getElementById('iuranStatus');
  status.className = 'status-message show success';
  status.textContent = message;
  setTimeout(() => status.classList.remove('show'), 5000);
}

/**
 * Show iuran error message
 */
function showIuranError(message) {
  const status = document.getElementById('iuranStatus');
  status.className = 'status-message show error';
  status.textContent = message;
  setTimeout(() => status.classList.remove('show'), 5000);
}

/**
 * Setup event listeners untuk iuran tab
 */
function setupIuranEventListeners() {
  const saveBtn = document.getElementById('saveIuranBtn');
  const resetBtn = document.getElementById('resetIuranBtn');
  
  saveBtn.addEventListener('click', saveIuran);
  resetBtn.addEventListener('click', resetIuran);
}

/**
 * Listen for real-time iuran updates
 */
function listenToIuranChanges() {
  // Reload latest iuran every time absensi collection changes
  onCollectionChange('absensi', async (absensiDocs, error) => {
    if (!error && absensiDocs.length > 0) {
      await loadLatestIuran();
      await renderPembayaranRecap();
    }
  });
}
