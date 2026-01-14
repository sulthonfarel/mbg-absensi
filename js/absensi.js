/**
 * Absensi Management
 * - Handle pengambilan MBG dengan input tanggal
 * - Filter pengganti otomatis
 * - Validasi & submit absensi
 */

/**
 * Load & tampilkan pair berikutnya
 */
async function loadTopTwoPiket() {
  try {
    const nextPair = await getNextPairToTake();
    
    document.getElementById('pengambil1').value = nextPair.pengambil1_name;
    document.getElementById('pengambil1').dataset.id = nextPair.pengambil1_id;
    
    document.getElementById('pengambil2').value = nextPair.pengambil2_name;
    document.getElementById('pengambil2').dataset.id = nextPair.pengambil2_id;
    
    document.getElementById('substitusi1').checked = false;
    document.getElementById('substitusi2').checked = false;
    toggleSubstituteSelect(1);
    toggleSubstituteSelect(2);
    
    await refreshPenggantiOptions();
  } catch (error) {
    showAbsensiError(`Error loading pengambil: ${error.message}`);
    console.error('Error loading next pair:', error);
  }
}

/**
 * Toggle visibility of pengganti select
 */
function toggleSubstituteSelect(num) {
  const checkbox = document.getElementById(`substitusi${num}`);
  const container = document.getElementById(`pengganti${num}Container`);
  
  if (checkbox.checked) {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
    document.getElementById(`pengantiSelect${num}`).value = '';
  }
}

/**
 * Setup event listeners
 */
function setupSubstituteListeners() {
  document.getElementById('substitusi1').addEventListener('change', () => {
    toggleSubstituteSelect(1);
  });
  
  document.getElementById('substitusi2').addEventListener('change', () => {
    toggleSubstituteSelect(2);
  });
}

/**
 * Validasi form absensi
 */
function validateAbsensiForm() {
  // Validasi tanggal (required)
  const tanggalInput = document.getElementById('tanggalAbsensi');
  if (!tanggalInput.value) {
    showAbsensiError('❌ Tanggal pengambilan harus diisi');
    return false;
  }
  
  const pengambil1_id = document.getElementById('pengambil1').dataset.id;
  const pengambil2_id = document.getElementById('pengambil2').dataset.id;
  
  // Check pengambil1 & 2 berbeda
  if (pengambil1_id === pengambil2_id) {
    showAbsensiError('❌ Pengambil 1 dan 2 harus berbeda');
    return false;
  }
  
  // Check substitusi
  if (document.getElementById('substitusi1').checked) {
    const pengganti1 = document.getElementById('pengantiSelect1').value;
    if (!pengganti1) {
      showAbsensiError('❌ Pilih siapa yang diganti untuk pengambil 1');
      return false;
    }
  }
  
  if (document.getElementById('substitusi2').checked) {
    const pengganti2 = document.getElementById('pengantiSelect2').value;
    if (!pengganti2) {
      showAbsensiError('❌ Pilih siapa yang diganti untuk pengambil 2');
      return false;
    }
  }
  
  return true;
}

/**
 * Submit absensi
 */
async function submitAbsensi(event) {
  event.preventDefault();
  
  if (!validateAbsensiForm()) {
    return;
  }
  
  try {
    const pengambil1_id = document.getElementById('pengambil1').dataset.id;
    const pengambil1_name = document.getElementById('pengambil1').value;
    const pengambil2_id = document.getElementById('pengambil2').dataset.id;
    const pengambil2_name = document.getElementById('pengambil2').value;
    
    const substitusi1 = document.getElementById('substitusi1').checked;
    const pengganti1_id = document.getElementById('pengantiSelect1').value;
    
    const substitusi2 = document.getElementById('substitusi2').checked;
    const pengganti2_id = document.getElementById('pengantiSelect2').value;
    
    const catatan = document.getElementById('catatan').value;
    const tanggalAbsensi = document.getElementById('tanggalAbsensi').value;
    
    const timestamp = new Date().getTime();
    
    // Get pair info
    const nextPair = await getNextPairToTake();
    
    // Prepare absensi data
    const absensiData = {
      pair_number: nextPair.pair_number,
      tanggal: tanggalAbsensi,
      pengambil: [pengambil1_id, pengambil2_id],
      pengambil_nama: [pengambil1_name, pengambil2_name],
      status_ambil: [
        substitusi1 ? 'pengganti' : 'normal',
        substitusi2 ? 'pengganti' : 'normal'
      ],
      pengganti: [
        substitusi1 ? pengganti1_id : null,
        substitusi2 ? pengganti2_id : null
      ],
      diganti_dari: [
        substitusi1 ? pengambil1_id : null,
        substitusi2 ? pengambil2_id : null
      ],
      catatan: catatan,
      timestamp: timestamp
    };
    
    // 1. Add absensi ke Firestore
    const absensiId = await addDocument('absensi', absensiData);
    console.log('✓ Absensi created:', absensiId);
    
    // 2. Create iuran checklist
    const users = await getCollection('users');
    const iuranData = {
      absensi_id: absensiId,
      tanggal: tanggalAbsensi,
      pair_number: nextPair.pair_number,
      pengambil: [pengambil1_id, pengambil2_id],
      bayar: {},
      created_at: timestamp
    };
    users.forEach(user => {
      iuranData.bayar[user.id] = false;
    });
    await setDocument('iuran', absensiId, iuranData);
    console.log('✓ Iuran checklist created:', absensiId);
    
    // 3. Update user data
    const updates = [];
    
    // Pengambil 1
    const user1 = await getDocument('users', pengambil1_id);
    let user1_ambil = (user1.ambil || 0) + 1;
    let user1_utang = user1.utang || 0;
    if (substitusi1) {
      user1_utang -= 1;
    }
    updates.push({
      docId: pengambil1_id,
      data: {
        ambil: user1_ambil,
        utang: user1_utang
      }
    });
    
    // Pengambil 2
    const user2 = await getDocument('users', pengambil2_id);
    let user2_ambil = (user2.ambil || 0) + 1;
    let user2_utang = user2.utang || 0;
    if (substitusi2) {
      user2_utang -= 1;
    }
    updates.push({
      docId: pengambil2_id,
      data: {
        ambil: user2_ambil,
        utang: user2_utang
      }
    });
    
    // Yang diganti (tambah utang)
    if (substitusi1 && pengganti1_id) {
      const diganti1 = await getDocument('users', pengganti1_id);
      updates.push({
        docId: pengganti1_id,
        data: {
          utang: (diganti1.utang || 0) + 1
        }
      });
    }
    
    if (substitusi2 && pengganti2_id) {
      const diganti2 = await getDocument('users', pengganti2_id);
      updates.push({
        docId: pengganti2_id,
        data: {
          utang: (diganti2.utang || 0) + 1
        }
      });
    }
    
    // Batch update users
    await batchUpdate('users', updates);
    console.log('✓ User data updated');
    
    // 4. Success message
    showAbsensiSuccess(`✓ Absensi berhasil! Pair ${nextPair.pair_number} (${pengambil1_name}, ${pengambil2_name})`);
    
    // 5. Reset form
    document.getElementById('absensiForm').reset();
    document.getElementById('tanggalAbsensi').value = '';
    
    // 6. Reload data
    await loadTopTwoPiket();
    await loadLatestIuran();
    await renderPiketSlots();  // Refresh piket display untuk pindahkan completed MBG ke bawah
    await renderRecapData();
    
  } catch (error) {
    showAbsensiError(`✗ Error submit absensi: ${error.message}`);
    console.error('Error submitting absensi:', error);
  }
}

/**
 * Show absensi success
 */
function showAbsensiSuccess(message) {
  const statusDiv = document.getElementById('absensiStatus');
  statusDiv.className = 'status-message show success';
  statusDiv.textContent = message;
  
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 5000);
}

/**
 * Show absensi error
 */
function showAbsensiError(message) {
  const statusDiv = document.getElementById('absensiStatus');
  statusDiv.className = 'status-message show error';
  statusDiv.textContent = message;
  
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 5000);
}

/**
 * Setup event listeners
 */
function setupAbsensiEventListeners() {
  const form = document.getElementById('absensiForm');
  form.addEventListener('submit', submitAbsensi);
  
  setupSubstituteListeners();
}
