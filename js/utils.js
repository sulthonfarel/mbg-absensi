/**
 * Utility Functions
 */

/**
 * Export piket order ke Excel profesional dengan SheetJS
 */
async function exportPiketToExcel() {
  try {
    // Check if XLSX library available
    if (typeof XLSX === 'undefined') {
      showStatusMessage('piketStatus', '✗ Error: Library Excel belum ter-load. Refresh halaman!', 'error');
      console.error('XLSX library not available');
      return;
    }
    
    // Get piket data
    const piketDoc = await getDocument('piket_order', 'current');
    const piketOrder = piketDoc?.order || [];
    
    // Get users
    const users = await getCollection('users');
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u;
    });
    
    // Prepare data untuk worksheet
    const data = [];
    
    // Add title
    data.push(['URUTAN PIKET PENGAMBILAN MBG']);
    data.push(['Terakhir update:', new Date().toLocaleDateString('id-ID')]);
    data.push([]); // Empty row
    
    // Add headers
    data.push(['No. MBG', 'Anggota 1', 'Jurusan', 'Anggota 2', 'Jurusan']);
    
    // Add data rows
    for (let i = 0; i < piketOrder.length; i += 2) {
      const slot = Math.floor(i / 2) + 1;
      const user1 = userMap[piketOrder[i]];
      const user2 = userMap[piketOrder[i + 1]];
      
      data.push([
        `MBG ${slot}`,
        user1?.name || 'Unknown',
        user1?.jurusan || '-',
        user2?.name || 'Unknown',
        user2?.jurusan || '-'
      ]);
    }
    
    // Create workbook dan worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Piket MBG');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // No. MBG
      { wch: 20 },  // Anggota 1
      { wch: 12 },  // Jurusan
      { wch: 20 },  // Anggota 2
      { wch: 12 }   // Jurusan
    ];
    
    // Style headers & title
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 11 },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
    
    const titleStyle = {
      font: { bold: true, size: 14, color: { rgb: '1E40AF' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
    
    const dateStyle = {
      font: { size: 10 },
      alignment: { horizontal: 'left', vertical: 'center' }
    };
    
    const dataStyle = {
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } }
      }
    };
    
    // Apply styles ke title
    ws['A1'].s = titleStyle;
    ws['A2'].s = dateStyle;
    
    // Apply style ke header row (row 4 = index 3)
    const headerRow = 4;
    for (let col = 0; col < 5; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow - 1, c: col });
      ws[cellRef].s = headerStyle;
    }
    
    // Apply style ke data rows
    for (let row = 5; row < data.length; row++) {
      for (let col = 0; col < 5; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col });
        if (ws[cellRef]) {
          ws[cellRef].s = dataStyle;
        }
      }
    }
    
    // Set print options
    ws.pageSetup = {
      paperSize: ws.pageSetup?.paperSize || 1,
      orientation: 'portrait'
    };
    
    // Generate filename
    const filename = `Piket-MBG-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, filename);
    
    showStatusMessage('piketStatus', '✓ Piket berhasil di-ekspor ke Excel!', 'success');
  } catch (error) {
    showStatusMessage('piketStatus', `✗ Error ekspor: ${error.message}`, 'error');
    console.error(error);
  }
}

/**
 * Reset semua data absensi, iuran, piket (keep users)
 */
async function resetAllData() {
  const confirm_msg = `⚠️ RESET DATA AKAN MENGHAPUS:
- Semua riwayat absensi
- Semua data iuran
- Urutan piket di-reset ke default
- Angka "ambil" dan "utang" di-reset ke 0

Data siswa tetap aman. Lanjutkan?`;
  
  if (!confirm(confirm_msg)) return;
  
  try {
    // Reset users: ambil & utang ke 0, tapi keep name, nis, jurusan
    const users = await getCollection('users');
    for (const user of users) {
      await updateDocument('users', user.id, {
        ambil: 0,
        utang: 0
      });
    }
    console.log('✓ Users reset');
    
    // Delete semua absensi
    const absensi = await getCollection('absensi');
    for (const doc of absensi) {
      await deleteDocument('absensi', doc.id);
    }
    console.log('✓ Absensi deleted');
    
    // Delete semua iuran
    const iuran = await getCollection('iuran');
    for (const doc of iuran) {
      await deleteDocument('iuran', doc.id);
    }
    console.log('✓ Iuran deleted');
    
    // Reset piket order ke default (urutan user IDs)
    const defaultOrder = users.map(u => u.id);
    await updateDocument('piket_order', 'current', {
      order: defaultOrder,
      last_updated: new Date().getTime()
    });
    console.log('✓ Piket reset');
    
    // Reload app
    alert('✓ Semua data berhasil di-reset! Halaman akan di-refresh.');
    location.reload();
    
  } catch (error) {
    alert(`✗ Error reset: ${error.message}`);
    console.error(error);
  }
}
