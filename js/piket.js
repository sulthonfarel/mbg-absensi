/**
 * Piket Management
 * - Load & render urutan piket dalam 8 MBG slots (2 orang per slot)
 * - Handle drag & drop antar slots
 * - Save urutan ke Firestore
 */

let piketData = [];
let sortableInstances = [];

/**
 * Load piket order dari Firestore
 */
async function loadPiketOrder() {
  try {
    const piketDoc = await getDocument('piket_order', 'current');
    
    if (!piketDoc) {
      console.log('Piket order not found, creating default...');
      const users = await getCollection('users');
      piketData = users.map(u => u.id);
      
      await setDocument('piket_order', 'current', {
        order: piketData,
        last_updated: new Date().getTime()
      });
    } else {
      piketData = piketDoc.order || [];
    }
    
    renderPiketSlots();
    initSortableSlots();
  } catch (error) {
    showStatusMessage('piketStatus', `Error loading piket: ${error.message}`, 'error');
    console.error('Error loading piket order:', error);
  }
}

/**
 * Render 8 MBG slots dengan 2 orang per slot
 * Split: Active MBGs (belum diambil) di atas, Completed (sudah diambil) di bawah
 */
async function renderPiketSlots() {
  const piketSlots = document.getElementById('piketSlots');
  piketSlots.innerHTML = '';
  
  const users = await getCollection('users');
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });
  
  // Get semua absensi untuk tahu MBG mana yang sudah selesai
  const absensiDocs = await getCollection('absensi');
  const completedMBGs = new Set();
  absensiDocs.forEach(doc => {
    if (doc.pair_number) {
      completedMBGs.add(doc.pair_number);
    }
  });
  
  // Separate active dan completed slots
  const activeSlots = [];
  const completedSlots = [];
  
  for (let slotNum = 1; slotNum <= 8; slotNum++) {
    if (completedMBGs.has(slotNum)) {
      completedSlots.push(slotNum);
    } else {
      activeSlots.push(slotNum);
    }
  }
  
  // Render ACTIVE section
  const activeContainer = document.createElement('div');
  activeContainer.className = 'piket-section';
  
  const activeHeader = document.createElement('div');
  activeHeader.className = 'piket-section-header';
  activeHeader.innerHTML = '<h3>📋 Aktif (Belum Diambil)</h3>';
  activeContainer.appendChild(activeHeader);
  
  const activeSlotsDiv = document.createElement('div');
  activeSlotsDiv.className = 'piket-slots';
  
  activeSlots.forEach(slotNum => {
    activeSlotsDiv.appendChild(createMBGCard(slotNum, userMap));
  });
  
  activeContainer.appendChild(activeSlotsDiv);
  piketSlots.appendChild(activeContainer);
  
  // Render COMPLETED section (jika ada)
  if (completedSlots.length > 0) {
    const completedContainer = document.createElement('div');
    completedContainer.className = 'piket-section';
    
    const completedHeader = document.createElement('div');
    completedHeader.className = 'piket-section-header completed';
    completedHeader.innerHTML = '<h3>✅ Sudah Selesai (Telah Diambil)</h3>';
    completedContainer.appendChild(completedHeader);
    
    const completedSlotsDiv = document.createElement('div');
    completedSlotsDiv.className = 'piket-slots';
    
    completedSlots.forEach(slotNum => {
      completedSlotsDiv.appendChild(createMBGCard(slotNum, userMap));
    });
    
    completedContainer.appendChild(completedSlotsDiv);
    piketSlots.appendChild(completedContainer);
  }
}

/**
 * Helper: Create MBG card
 */
function createMBGCard(slotNum, userMap) {
  const startIdx = (slotNum - 1) * 2;
  const endIdx = startIdx + 2;
  
  const slotDiv = document.createElement('div');
  slotDiv.className = 'mbg-card';
  slotDiv.dataset.slot = slotNum;
  
  const header = document.createElement('div');
  header.className = 'mbg-card-header';
  header.innerHTML = `<h3>MBG ${slotNum}</h3>`;
  slotDiv.appendChild(header);
  
  const list = document.createElement('ul');
  list.className = 'mbg-card-list piket-sortable';
  list.dataset.slot = slotNum;
  
  // 2 orang per slot
  for (let i = startIdx; i < endIdx && i < piketData.length; i++) {
    const userId = piketData[i];
    const user = userMap[userId];
    
    const li = document.createElement('li');
    li.className = 'piket-item';
    li.dataset.id = userId;
    li.textContent = user?.name || 'Unknown';
    list.appendChild(li);
  }
  
  slotDiv.appendChild(list);
  return slotDiv;
}

/**
 * Initialize SortableJS untuk setiap slot (drag antar slot)
 */
function initSortableSlots() {
  // Destroy existing instances
  sortableInstances.forEach(instance => {
    if (instance) instance.destroy();
  });
  sortableInstances = [];
  
  // Initialize untuk setiap .mbg-card-list dengan drag antar slot
  const lists = document.querySelectorAll('.mbg-card-list');
  lists.forEach(list => {
    const sortable = Sortable.create(list, {
      group: {
        name: 'piket-items',
        pull: true,      // Bisa diambil dari list ini
        put: true        // Bisa diterima ke list ini
      },
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      fallbackOnBody: true,
      swapThreshold: 0.5,
      onEnd: () => updatePiketDataFromDOM()
    });
    sortableInstances.push(sortable);
  });
}

/**
 * Update piketData dari DOM berdasarkan urutan terbaru di slots
 */
function updatePiketDataFromDOM() {
  const newOrder = [];
  
  // Loop setiap slot MBG 1-8
  for (let slotNum = 1; slotNum <= 8; slotNum++) {
    const list = document.querySelector(`.mbg-card-list[data-slot="${slotNum}"]`);
    if (list) {
      const items = list.querySelectorAll('.piket-item');
      items.forEach(item => {
        if (item.dataset.id) {
          newOrder.push(item.dataset.id);
        }
      });
    }
  }
  
  piketData = newOrder;
  console.log('Updated piket order:', piketData);
}

/**
 * Save piket order
 */
async function savePiketOrder() {
  try {
    updatePiketDataFromDOM();
    
    if (piketData.length !== 16) {
      showStatusMessage('piketStatus', 
        `⚠️ Error: Piket harus 16 siswa (sekarang ${piketData.length})`, 
        'error');
      return;
    }
    
    await updateDocument('piket_order', 'current', {
      order: piketData,
      last_updated: new Date().getTime()
    });
    
    showStatusMessage('piketStatus', 
      '✓ Urutan piket 8 MBG slots berhasil disimpan!', 
      'success');
  } catch (error) {
    showStatusMessage('piketStatus', 
      `✗ Error menyimpan piket: ${error.message}`, 
      'error');
    console.error('Error saving piket order:', error);
  }
}

/**
 * Get next pair untuk pengambilan
 * Pair 1 = MBG 1 (index 0-1), Pair 2 = MBG 2 (index 2-3), dst
 * Hitung berdasarkan berapa banyak absensi sudah ada
 */
async function getNextPairToTake() {
  try {
    const absensiDocs = await getCollection('absensi');
    
    // Berapa pair yang sudah diambil?
    const pairsTaken = absensiDocs.length;
    
    if (pairsTaken >= 8) {
      throw new Error('Semua MBG slot sudah diambil (16 orang)');
    }
    
    const pairIndex = pairsTaken;
    const startIdx = pairIndex * 2;
    
    const users = await getCollection('users');
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user.name;
    });
    
    return {
      pair_number: pairIndex + 1,
      pengambil1_id: piketData[startIdx],
      pengambil1_name: userMap[piketData[startIdx]],
      pengambil2_id: piketData[startIdx + 1],
      pengambil2_name: userMap[piketData[startIdx + 1]]
    };
  } catch (error) {
    console.error('Error getting next pair:', error);
    throw error;
  }
}

/**
 * Get pengganti options
 */
async function getPenggantiOptions() {
  try {
    const users = await getCollection('users');
    return users.filter(user => user.ambil === 0);
  } catch (error) {
    console.error('Error getting pengganti options:', error);
    return [];
  }
}

/**
 * Refresh pengganti select options
 */
async function refreshPenggantiOptions() {
  const pengganti = await getPenggantiOptions();
  
  ['pengantiSelect1', 'pengantiSelect2'].forEach(selectId => {
    const select = document.getElementById(selectId);
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Pilih siswa dengan ambil = 0 --</option>';
    pengganti.forEach(p => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.name} (Ambil: ${p.ambil})`;
      select.appendChild(option);
    });
    select.value = currentValue;
  });
}

/**
 * Setup piket event listeners
 */
function setupPiketEventListeners() {
  document.getElementById('savePiketBtn').addEventListener('click', savePiketOrder);
  
  document.getElementById('resetPiketBtn')?.addEventListener('click', async () => {
    if (confirm('Reset ke urutan default?')) {
      const users = await getCollection('users');
      piketData = users.map(u => u.id);
      await renderPiketSlots();
      await initSortableSlots();
      showStatusMessage('piketStatus', '✓ Reset ke urutan default', 'success');
    }
  });
}

/**
 * Show status message
 */
function showStatusMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.className = `status-message show ${type}`;
  element.textContent = message;
  
  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}
