/**
 * Main App Initialization
 * - Initialize Firebase & load data
 * - Setup tab navigation
 * - Setup all event listeners
 * - Real-time listeners
 */

// Global variables untuk tracking
let appState = {
  isInitialized: false,
  firebaseReady: false,
  usersLoaded: false
};

/**
 * Initialize application
 */
async function initApp() {
  try {
    console.log('🚀 Initializing MBG Absensi App...');
    
    // Step 1: Initialize Firebase
    const fbReady = await initFirebase();
    if (!fbReady) {
      throw new Error('Firebase initialization failed');
    }
    appState.firebaseReady = true;
    updateConnectionStatus(true);
    
    // Step 2: Initialize default users (16 siswa)
    await initializeUsers();
    appState.usersLoaded = true;
    
    // Step 3: Load data
    await loadPiketOrder();
    await loadTopTwoPiket();
    await loadLatestIuran();
    
    // Step 4: Setup event listeners
    setupTabNavigation();
    setupPiketEventListeners();
    setupAbsensiEventListeners();
    setupIuranEventListeners();
    setupUtilityEventListeners();
    
    // Step 5: Setup real-time listeners
    setupRealtimeListeners();
    
    // Step 6: Render recap data
    await renderRecapData();
    
    appState.isInitialized = true;
    console.log('✓ App initialized successfully');
    
  } catch (error) {
    console.error('❌ App initialization error:', error);
    showError(`App initialization failed: ${error.message}`);
  }
}

/**
 * Initialize 16 default users jika belum ada
 */
async function initializeUsers() {
  try {
    const existingUsers = await getCollection('users');
    
    if (existingUsers.length === 0) {
      console.log('Creating default users...');
      
      const defaultUsers = [
        // AKL
        { name: 'Rifa', nis: '1202316532', jurusan: 'AKL' },
        { name: 'Salha', nis: '1202316566', jurusan: 'AKL' },
        { name: 'Anisa', nis: '1202316151', jurusan: 'AKL' },
        { name: 'Windi', nis: '1202316669', jurusan: 'AKL' },
        { name: 'Erica', nis: '1202316250', jurusan: 'AKL' },
        // MP
        { name: 'Ayunda', nis: '1202316178', jurusan: 'MP' },
        { name: 'Aura', nis: '1202316168', jurusan: 'MP' },
        { name: 'Elvi', nis: '1202316439', jurusan: 'MP' },
        { name: 'Jahwa', nis: '1202316338', jurusan: 'MP' },
        { name: 'Maryam', nis: '1202316379', jurusan: 'MP' },
        // TKJ
        { name: 'Sri Cahyani', nis: '1202316617', jurusan: 'TKJ' },
        { name: 'Devi Amalia', nis: '1202316219', jurusan: 'TKJ' },
        // RPL
        { name: 'Sulthon Farel', nis: '1202316628', jurusan: 'RPL' },
        { name: 'Restu Hamdan Firdaus', nis: '1202316518', jurusan: 'RPL' },
        { name: 'Rangga Surya Kusuma', nis: '1202316504', jurusan: 'RPL' }
      ];
      
      for (const user of defaultUsers) {
        const userId = user.name.toLowerCase().replace(/\s+/g, '_');
        await setDocument('users', userId, {
          name: user.name,
          nis: user.nis,
          jurusan: user.jurusan,
          ambil: 0,
          utang: 0,
          created_at: new Date().getTime()
        });
      }
      
      console.log('✓ Default users created');
    }
    
  } catch (error) {
    console.error('Error initializing users:', error);
    throw error;
  }
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Hide all tabs
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Remove active class from all buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Show selected tab & mark button as active
      const selectedTab = document.getElementById(tabName);
      if (selectedTab) {
        selectedTab.classList.add('active');
        btn.classList.add('active');
        
        // Trigger render ketika tab dibuka
        if (tabName === 'recap') {
          renderRecapData();
        } else if (tabName === 'manage') {
          initManageTab();
        }
      }
    });
  });
}

/**
 * Setup recap tab navigation
 */
function setupRecapTabNavigation() {
  const recapButtons = document.querySelectorAll('.recap-tab-btn');
  const recapContents = document.querySelectorAll('.recap-content');
  
  recapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const recapTabName = btn.dataset.recapTab;
      
      // Hide all recap tabs
      recapContents.forEach(content => content.classList.remove('active'));
      
      // Remove active class from all buttons
      recapButtons.forEach(b => b.classList.remove('active'));
      
      // Show selected recap tab
      const selectedRecapTab = document.getElementById(recapTabName);
      if (selectedRecapTab) {
        selectedRecapTab.classList.add('active');
        btn.classList.add('active');
      }
    });
  });
}

let recapRenderInProgress = false;

/**
 * Render rekapitulasi data
 */
async function renderRecapData() {
  // Prevent concurrent renders
  if (recapRenderInProgress) return;
  recapRenderInProgress = true;
  
  try {
    await renderRiwayatRecap();
    await renderUtangRecap();
    await renderPembayaranRecap();
  } catch (error) {
    console.error('Error rendering recap:', error);
  } finally {
    recapRenderInProgress = false;
  }
}

/**
 * Render riwayat pengambilan recap
 */
async function renderRiwayatRecap() {
  try {
    const absensiDocs = await getCollection('absensi');
    const tbody = document.querySelector('#riwayatTable tbody');
    tbody.innerHTML = '';
    
    if (absensiDocs.length === 0) {
      document.getElementById('riwayatEmpty').style.display = 'block';
      return;
    }
    
    document.getElementById('riwayatEmpty').style.display = 'none';
    
    // Sort by timestamp descending
    absensiDocs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Ambil piketData untuk tahu siapa di setiap MBG
    const piketDoc = await getDocument('piket_order', 'current');
    const piketOrder = piketDoc?.order || [];
    
    // Get user map
    const users = await getCollection('users');
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u.name;
    });
    
    absensiDocs.forEach((item, index) => {
      const status1 = item.status_ambil[0] || 'normal';
      const status2 = item.status_ambil[1] || 'normal';
      
      let keterangan = '';
      if (status1 === 'pengganti' && item.diganti_dari[0]) {
        keterangan += `${item.pengambil_nama[0]} ganti ${item.diganti_dari[0]}`;
      }
      if (status2 === 'pengganti' && item.diganti_dari[1]) {
        if (keterangan) keterangan += '; ';
        keterangan += `${item.pengambil_nama[1]} ganti ${item.diganti_dari[1]}`;
      }
      
      // Format tanggal
      const tanggal = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : 'Tanpa tanggal';
      
      // MBG number berdasarkan pair_number (pair 1 = MBG 1, pair 2 = MBG 2, dst)
      const mbgNum = item.pair_number || '-';
      
      // Ambil anggota dari piketOrder berdasarkan pair number
      let anggota1 = item.pengambil_nama[0] || '-';
      let anggota2 = item.pengambil_nama[1] || '-';
      
      // Jika pair_number ada, bisa juga resolve dari piketOrder
      if (item.pair_number && piketOrder.length > 0) {
        const startIdx = (item.pair_number - 1) * 2;
        const id1 = piketOrder[startIdx];
        const id2 = piketOrder[startIdx + 1];
        anggota1 = userMap[id1] || item.pengambil_nama[0] || '-';
        anggota2 = userMap[id2] || item.pengambil_nama[1] || '-';
      }
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${tanggal}</td>
        <td>MBG ${mbgNum}</td>
        <td>${anggota1}</td>
        <td>${anggota2}</td>
        <td>${keterangan || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
    
  } catch (error) {
    console.error('Error rendering riwayat recap:', error);
  }
}

/**
 * Render status utang recap
 */
async function renderUtangRecap() {
  try {
    const users = await getCollection('users');
    const tbody = document.querySelector('#utangTable tbody');
    tbody.innerHTML = '';
    
    // Filter hanya yang punya utang !== 0
    const usersWithDebt = users.filter(u => u.utang !== 0);
    
    if (usersWithDebt.length === 0) {
      document.getElementById('utangEmpty').style.display = 'block';
      return;
    }
    
    document.getElementById('utangEmpty').style.display = 'none';
    
    // Sort by utang DESC (yang utang banyak di atas)
    usersWithDebt.sort((a, b) => b.utang - a.utang);
    
    usersWithDebt.forEach((user, index) => {
      const keterangan = user.utang > 0 ? 'Harus diganti' : 'Hutang sudah terbayar';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.name}</td>
        <td><strong>${user.utang > 0 ? '+' : ''}${user.utang}</strong></td>
        <td>${keterangan}</td>
      `;
      tbody.appendChild(tr);
    });
    
  } catch (error) {
    console.error('Error rendering utang recap:', error);
  }
}

/**
 * Setup real-time listeners
 */
function setupRealtimeListeners() {
  // Listen to users changes
  onCollectionChange('users', async (users, error) => {
    if (!error) {
      console.log('✓ Users updated');
      // Update pengambil fields & pengganti options
      await loadTopTwoPiket();
      await refreshPenggantiOptions();
      // Update recap
      await renderUtangRecap();
    }
  });
  
  // Listen to piket order changes
  onDocumentChange('piket_order', 'current', async (data, error) => {
    if (!error && data) {
      console.log('✓ Piket order updated');
      piketData = data.order || [];
      await renderPiketSlots();
      initSortableSlots();
    }
  });
  
  // Listen to iuran changes
  listenToIuranChanges();
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(isOnline) {
  const indicator = document.getElementById('connectionStatus');
  const statusText = document.getElementById('statusText');
  
  if (isOnline) {
    indicator.className = 'status-indicator online';
    statusText.textContent = 'Connected to Firebase ✓';
  } else {
    indicator.className = 'status-indicator offline';
    statusText.textContent = 'Offline';
  }
  
  // Update last sync time
  const now = new Date().toLocaleTimeString('id-ID');
  document.getElementById('lastSync').textContent = `Last sync: ${now}`;
}

/**
 * Show error message di header
 */
function showError(message) {
  console.error(message);
  alert(`❌ ${message}`);
}

/**
 * Simulate offline/online detection
 */
function setupConnectionDetection() {
  window.addEventListener('online', () => {
    console.log('✓ Back online');
    updateConnectionStatus(true);
  });
  
  window.addEventListener('offline', () => {
    console.log('✗ Gone offline');
    updateConnectionStatus(false);
  });
}

/**
 * Application startup
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 DOM loaded, starting app...');
  
  // Setup tab navigation first
  setupTabNavigation();
  setupRecapTabNavigation();
  
  // Setup connection detection
  setupConnectionDetection();
  
  // Initialize app
  await initApp();
});

// Handle page visibility untuk refresh data
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && appState.isInitialized) {
    console.log('Page became visible, refreshing data...');
    renderRecapData();
  }
});

/**
 * Setup utility event listeners (export, reset)
 */
function setupUtilityEventListeners() {
  // Export piket button
  const exportBtn = document.getElementById('exportPiketBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportPiketToExcel);
  }
  
  // Reset all data button
  const resetBtn = document.getElementById('resetAllDataBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllData);
  }
}
