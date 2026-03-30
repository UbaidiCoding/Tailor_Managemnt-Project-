// js/app.js - Complete with Google Sheets Online Sync
(function() {
  const SHOP = {
    name: 'Wali Tailer',
    address: 'Sukkur Airport, New Jamia',
    phone: '0312345678999'
  };

  const STORAGE_KEY = 'wali_orders';
  const COUNTER_KEY = 'wali_last_id';
  const SYNC_KEY = 'wali_last_sync';
  
  // Google Sheets Web App URL
  const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycby5tByIG5I3hQKP6m1RoV2y0yG20GACZWNal-fuc1oXOneBJYQpj7dv8DefrBK6xyTu/exec';

  let orders = [];
  let lastId = 1;
  let editId = null;
  let isSyncing = false;

  // Professional measurement templates
  const measurementTemplates = {
    "Standard Suit": {
      upperBody: ["Length", "Shoulder", "Sleeves", "Chest", "Lap", "Neck", "Waist"],
      lowerBody: ["Shalwar Length", "Shalwar Waist", "Seat", "Bottom"],
      options: ["Front Pocket", "Side Pocket", "Front Pati", "Ban", "Kuf", "Shalwar Darz", "Halwar Pocket"]
    },
    "Complete Suit": {
      upperBody: ["Length", "Shoulder", "Sleeves", "Chest", "Lap", "Neck", "Waist", "Collar", "Daaman"],
      lowerBody: ["Shalwar Length", "Shalwar Waist", "Seat", "Bottom", "Geer"],
      options: ["Front Pocket", "Side Pocket", "Front Pati", "Ban", "Kuf", "Shalwar Darz", "Halwar Pocket"]
    },
    "Shalwar Kameez": {
      upperBody: ["Length", "Shoulder", "Sleeves", "Chest", "Waist", "Collar"],
      lowerBody: ["Shalwar Length", "Shalwar Waist", "Seat", "Bottom", "Geer"],
      options: ["Front Pocket", "Side Pocket"]
    },
    "Waistcoat": {
      upperBody: ["Length", "Chest", "Waist", "Shoulder", "Neck"],
      lowerBody: [],
      options: ["Front Pocket", "Button Style"]
    },
    "Sherwani": {
      upperBody: ["Length", "Shoulder", "Sleeves", "Chest", "Lap", "Neck", "Waist", "Collar", "Daaman"],
      lowerBody: ["Shalwar Length", "Shalwar Waist", "Seat", "Bottom", "Geer"],
      options: ["Front Pocket", "Side Pocket", "Front Pati", "Ban", "Kuf"]
    },
    "Trousers": {
      upperBody: [],
      lowerBody: ["Length", "Waist", "Seat", "Bottom", "Geer"],
      options: ["Side Pocket", "Back Pocket"]
    }
  };

  // DOM Elements
  const ordersContainer = document.getElementById('ordersContainer');
  const noOrdersMsg = document.getElementById('noOrdersMsg');
  const formSection = document.getElementById('orderFormSection');
  const formTitle = document.getElementById('formTitle');
  const orderForm = document.getElementById('orderForm');
  const editOrderId = document.getElementById('editOrderId');
  const customerNameIn = document.getElementById('customerName');
  const whatsappIn = document.getElementById('whatsapp');
  const deliveryDateIn = document.getElementById('deliveryDate');
  const orderIdDisplay = document.getElementById('orderIdDisplay');
  const orderStatusIn = document.getElementById('orderStatus');
  const totalAmountIn = document.getElementById('totalAmount');
  const advancePaidIn = document.getElementById('advancePaid');
  const balanceDisplay = document.getElementById('balanceDisplay');
  const specialNotes = document.getElementById('specialNotes');
  const upperBodyContainer = document.getElementById('upperBodyContainer');
  const lowerBodyContainer = document.getElementById('lowerBodyContainer');
  const optionsContainer = document.getElementById('optionsContainer');
  const cancelFormBtn = document.getElementById('cancelFormBtn');
  const newOrderBtn = document.getElementById('newOrderBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const importCsvBtn = document.getElementById('importCsvBtn');
  const customersBtn = document.getElementById('customersBtn');
  const customersPanel = document.getElementById('customersPanel');
  const closeCustomersBtn = document.getElementById('closeCustomersBtn');
  const customersList = document.getElementById('customersList');
  const searchInput = document.getElementById('searchInput');
  const filterStatus = document.getElementById('filterStatus');
  const filterPayment = document.getElementById('filterPayment');
  const measurementTemplate = document.getElementById('measurementTemplate');
  const applyTemplateBtn = document.getElementById('applyTemplateBtn');
  const historyModal = document.getElementById('historyModal');
  const historyContent = document.getElementById('historyContent');
  const closeHistoryModal = document.getElementById('closeHistoryModal');

  const statTotal = document.getElementById('statTotal');
  const statRevenue = document.getElementById('statRevenue');
  const statPendingBal = document.getElementById('statPendingBal');
  const statDelivered = document.getElementById('statDelivered');
  const statTodayAdv = document.getElementById('statTodayAdv');

  // Add sync button to action bar
  const actionBar = document.querySelector('.action-bar');
  const syncBtn = document.createElement('button');
  syncBtn.className = 'btn btn-outline';
  syncBtn.id = 'syncBtn';
  syncBtn.innerHTML = '☁️ Sync to Cloud';
  syncBtn.title = 'Sync with Google Sheets';
  actionBar.appendChild(syncBtn);

  const syncStatus = document.createElement('div');
  syncStatus.className = 'sync-status';
  syncStatus.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #0f172a; color: white; padding: 8px 16px; border-radius: 40px; font-size: 12px; z-index: 1000; display: none;';
  document.body.appendChild(syncStatus);

  // Helper Functions
  function formatOrderId(num) {
    return 'WT-' + String(num).padStart(5, '0');
  }

  function showSyncMessage(message, isError = false) {
    syncStatus.textContent = message;
    syncStatus.style.display = 'block';
    syncStatus.style.background = isError ? '#dc2626' : '#0f172a';
    setTimeout(() => {
      syncStatus.style.display = 'none';
    }, 3000);
  }

  function loadLastId() {
    const stored = localStorage.getItem(COUNTER_KEY);
    if (stored) lastId = parseInt(stored, 10) || 1;
  }

  function saveLastId() {
    localStorage.setItem(COUNTER_KEY, lastId);
  }

  function loadOrders() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { orders = JSON.parse(stored); } catch { orders = []; }
    } else {
      orders = [];
    }
    orders = orders.map(o => {
      if (!o.history) {
        o.history = [{
          date: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
          action: "created",
          details: "Initial order creation"
        }];
      }
      if (!o.measurements) {
        o.measurements = { upperBody: {}, lowerBody: {}, options: {}, custom: [] };
      }
      if (!o.creationDate) o.creationDate = new Date().toISOString().split('T')[0];
      if (!o.specialNotes) o.specialNotes = "";
      return o;
    });
  }

  function saveOrders() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    updateReportsAndRender();
    // Auto-sync to cloud after local save
    autoSyncToCloud();
  }

  // ========== GOOGLE SHEETS SYNC FUNCTIONS ==========
  
  // Sync local data to Google Sheets
  async function syncToGoogleSheets() {
    if (isSyncing) {
      showSyncMessage('Sync already in progress...');
      return;
    }
    
    isSyncing = true;
    showSyncMessage('☁️ Syncing to Google Sheets...');
    
    try {
      const syncData = {
        action: 'sync',
        shopName: SHOP.name,
        shopAddress: SHOP.address,
        shopPhone: SHOP.phone,
        orders: orders,
        lastId: lastId,
        syncTime: new Date().toISOString()
      };
      
      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncData)
      });
      
      // Update last sync time
      localStorage.setItem(SYNC_KEY, new Date().toISOString());
      showSyncMessage('✅ Synced successfully!');
      
      // Add to history for each order (optional)
      orders.forEach(order => {
        addHistoryEntry(order.id, "cloud_synced", { time: new Date().toLocaleString() });
      });
      
    } catch (error) {
      console.error('Sync error:', error);
      showSyncMessage('❌ Sync failed. Will retry later.', true);
    } finally {
      isSyncing = false;
    }
  }
  
  // Auto-sync to cloud (debounced)
  let syncTimeout;
  function autoSyncToCloud() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncToGoogleSheets();
    }, 5000); // Wait 5 seconds after last change
  }
  
  // Load data from Google Sheets
  async function loadFromGoogleSheets() {
    if (isSyncing) {
      showSyncMessage('Sync in progress...');
      return;
    }
    
    const confirmLoad = confirm('Load data from cloud? This will merge with existing local data.');
    if (!confirmLoad) return;
    
    isSyncing = true;
    showSyncMessage('☁️ Loading from cloud...');
    
    try {
      const response = await fetch(`${GOOGLE_SHEETS_URL}?action=load`, {
        method: 'GET',
        mode: 'cors'
      });
      
      const cloudData = await response.json();
      
      if (cloudData && cloudData.orders && cloudData.orders.length > 0) {
        // Merge cloud data with local data
        const existingIds = new Set(orders.map(o => o.id));
        const newOrders = cloudData.orders.filter(o => !existingIds.has(o.id));
        
        if (newOrders.length > 0) {
          orders = [...orders, ...newOrders];
          if (cloudData.lastId > lastId) {
            lastId = cloudData.lastId;
            saveLastId();
          }
          saveOrders();
          showSyncMessage(`✅ Loaded ${newOrders.length} new orders from cloud`);
        } else {
          showSyncMessage('No new orders found in cloud');
        }
      } else {
        showSyncMessage('No data found in cloud', true);
      }
      
    } catch (error) {
      console.error('Load error:', error);
      showSyncMessage('❌ Failed to load from cloud', true);
    } finally {
      isSyncing = false;
    }
  }
  
  // Manual sync trigger with options
  function showSyncOptions() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 300px;">
        <div class="modal-header">
          <h3>☁️ Cloud Sync Options</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div style="padding: 1rem;">
          <button class="btn btn-primary" style="width:100%; margin-bottom:10px;" id="syncUploadBtn">
            📤 Upload to Cloud
          </button>
          <button class="btn btn-outline" style="width:100%; margin-bottom:10px;" id="syncDownloadBtn">
            📥 Download from Cloud
          </button>
          <button class="btn btn-outline" style="width:100%;" id="syncCloseBtn">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('syncUploadBtn').onclick = () => {
      modal.remove();
      syncToGoogleSheets();
    };
    
    document.getElementById('syncDownloadBtn').onclick = () => {
      modal.remove();
      loadFromGoogleSheets();
    };
    
    document.getElementById('syncCloseBtn').onclick = () => modal.remove();
  }

  // Add sync button event listener
  document.getElementById('syncBtn').addEventListener('click', showSyncOptions);

  // Load from cloud on startup (optional)
  async function initialCloudSync() {
    const lastSync = localStorage.getItem(SYNC_KEY);
    const shouldSync = !lastSync || (new Date() - new Date(lastSync) > 24 * 60 * 60 * 1000); // 24 hours
    
    if (shouldSync && orders.length === 0) {
      // Try to load from cloud if no local data
      try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=load`, {
          method: 'GET',
          mode: 'cors'
        });
        const cloudData = await response.json();
        if (cloudData && cloudData.orders && cloudData.orders.length > 0) {
          orders = cloudData.orders;
          lastId = cloudData.lastId || 1;
          saveLastId();
          saveOrders();
          showSyncMessage('✅ Loaded data from cloud');
        }
      } catch (error) {
        console.log('No cloud data available');
      }
    }
  }

  // Measurement Input Rendering
  function renderMeasurementInputs(templateName = null) {
    let template = measurementTemplates["Standard Suit"];
    if (templateName && measurementTemplates[templateName]) {
      template = measurementTemplates[templateName];
    }

    upperBodyContainer.innerHTML = '';
    template.upperBody.forEach(name => {
      const div = document.createElement('div');
      div.className = 'meas-item';
      div.innerHTML = `
        <label>${name}</label>
        <input type="number" step="0.1" class="meas-upper" data-name="${name}" placeholder="inch">
      `;
      upperBodyContainer.appendChild(div);
    });

    lowerBodyContainer.innerHTML = '';
    template.lowerBody.forEach(name => {
      const div = document.createElement('div');
      div.className = 'meas-item';
      div.innerHTML = `
        <label>${name}</label>
        <input type="number" step="0.1" class="meas-lower" data-name="${name}" placeholder="inch">
      `;
      lowerBodyContainer.appendChild(div);
    });

    optionsContainer.innerHTML = '';
    template.options.forEach(name => {
      const div = document.createElement('div');
      div.className = 'option-item';
      div.innerHTML = `
        <input type="checkbox" class="option-checkbox" data-name="${name}">
        <label>${name}</label>
      `;
      optionsContainer.appendChild(div);
    });
  }

  function collectMeasurements() {
    const measurements = { upperBody: {}, lowerBody: {}, options: {}, custom: [] };
    document.querySelectorAll('.meas-upper').forEach(input => {
      const val = parseFloat(input.value);
      if (!isNaN(val) && val > 0) {
        measurements.upperBody[input.dataset.name] = val;
      }
    });
    document.querySelectorAll('.meas-lower').forEach(input => {
      const val = parseFloat(input.value);
      if (!isNaN(val) && val > 0) {
        measurements.lowerBody[input.dataset.name] = val;
      }
    });
    document.querySelectorAll('.option-checkbox').forEach(cb => {
      if (cb.checked) measurements.options[cb.dataset.name] = true;
    });
    return measurements;
  }

  function loadMeasurementsToForm(measurements) {
    if (!measurements) return;
    Object.entries(measurements.upperBody || {}).forEach(([name, val]) => {
      const input = document.querySelector(`.meas-upper[data-name="${name}"]`);
      if (input) input.value = val;
    });
    Object.entries(measurements.lowerBody || {}).forEach(([name, val]) => {
      const input = document.querySelector(`.meas-lower[data-name="${name}"]`);
      if (input) input.value = val;
    });
    Object.entries(measurements.options || {}).forEach(([name, checked]) => {
      const cb = document.querySelector(`.option-checkbox[data-name="${name}"]`);
      if (cb && checked) cb.checked = true;
    });
  }

  function updateBalanceField() {
    const total = parseFloat(totalAmountIn.value) || 0;
    const adv = parseFloat(advancePaidIn.value) || 0;
    balanceDisplay.value = total - adv;
  }

  totalAmountIn.addEventListener('input', updateBalanceField);
  advancePaidIn.addEventListener('input', updateBalanceField);

  function getNextOrderId() {
    const newNum = lastId++;
    saveLastId();
    return formatOrderId(newNum);
  }

  function addHistoryEntry(orderId, action, details = {}) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (!order.history) order.history = [];
    order.history.push({
      date: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
      action: action,
      details: details
    });
    if (order.history.length > 50) order.history = order.history.slice(-50);
  }

  function viewOrderHistory(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    let historyHtml = `<h4>Order: ${order.id} - ${order.customerName}</h4>`;
    if (!order.history || order.history.length === 0) {
      historyHtml += '<p>No history available</p>';
    } else {
      historyHtml += '<div style="margin-top: 1rem;">';
      [...order.history].reverse().forEach(entry => {
        let detailsText = typeof entry.details === 'object' ?
          Object.entries(entry.details).map(([k, v]) => `${k}: ${v}`).join(', ') :
          entry.details;
        historyHtml += `
          <div class="history-item">
            <div class="history-date">${entry.date}</div>
            <div class="history-action">${entry.action}</div>
            <div class="history-detail">${detailsText || ''}</div>
          </div>
        `;
      });
      historyHtml += '</div>';
    }
    historyContent.innerHTML = historyHtml;
    historyModal.style.display = 'flex';
  }

  // CRUD Operations
  function saveOrderFromForm(e) {
    e.preventDefault();
    if (!customerNameIn.value.trim() || !whatsappIn.value.trim() || !deliveryDateIn.value || !totalAmountIn.value) {
      alert('Please fill all required fields (*)');
      return;
    }

    const measurements = collectMeasurements();
    const total = parseFloat(totalAmountIn.value) || 0;
    const advance = parseFloat(advancePaidIn.value) || 0;
    const balance = total - advance;

    const orderData = {
      customerName: customerNameIn.value.trim(),
      whatsapp: whatsappIn.value.trim(),
      deliveryDate: deliveryDateIn.value,
      status: orderStatusIn.value,
      measurements: measurements,
      totalAmount: total,
      advancePaid: advance,
      balance: balance,
      creationDate: new Date().toISOString().split('T')[0],
      specialNotes: specialNotes.value.trim()
    };

    const editingId = editOrderId.value;
    if (editingId) {
      const index = orders.findIndex(o => o.id === editingId);
      if (index !== -1) {
        const changes = {};
        if (orders[index].status !== orderData.status) {
          changes.status = `${orders[index].status} → ${orderData.status}`;
        }
        if (orders[index].totalAmount !== orderData.totalAmount) {
          changes.amount = `Rs ${orders[index].totalAmount} → Rs ${orderData.totalAmount}`;
        }
        orders[index] = { ...orders[index], ...orderData, history: orders[index].history };
        addHistoryEntry(editingId, "order_updated", changes);
      }
    } else {
      const newId = getNextOrderId();
      orders.push({
        id: newId,
        ...orderData,
        history: [{
          date: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
          action: "order_created",
          details: { amount: total }
        }]
      });
    }
    saveOrders();
    resetFormAndHide();
  }

  function editOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    editOrderId.value = id;
    customerNameIn.value = order.customerName || '';
    whatsappIn.value = order.whatsapp || '';
    deliveryDateIn.value = order.deliveryDate || '';
    orderStatusIn.value = order.status || 'pending';
    totalAmountIn.value = order.totalAmount || 0;
    advancePaidIn.value = order.advancePaid || 0;
    specialNotes.value = order.specialNotes || '';
    updateBalanceField();
    renderMeasurementInputs();
    loadMeasurementsToForm(order.measurements);
    formTitle.innerText = '✏️ Edit order';
    formSection.style.display = 'block';
    window.scrollTo({ top: formSection.offsetTop - 20, behavior: 'smooth' });
  }

  function deleteOrder(id) {
    if (confirm('Delete order? This action cannot be undone.')) {
      orders = orders.filter(o => o.id !== id);
      saveOrders();
    }
  }

  // Professional Print Receipt (same as before - keeping it compact)
  function printOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    addHistoryEntry(order.id, "receipt_printed", {});

    const getMeas = (name) => {
      let val = order.measurements.upperBody[name];
      if (val !== undefined && val !== '') return val;
      val = order.measurements.lowerBody[name];
      if (val !== undefined && val !== '') return val;
      return '';
    };

    const buildTwoRowTable = (title, keys) => {
      if (keys.length === 0) return '';
      let html = `<div class="meas-section"><div class="meas-title">${title}</div><table class="meas-table"><tr>`;
      keys.forEach(key => html += `<th>${key}</th>`);
      html += `</tr><tr>`;
      keys.forEach(key => {
        const val = getMeas(key);
        html += `<td class="value-cell">${val !== '' ? val : '—'}</td>`;
      });
      html += `</tr><tr>`;
      keys.forEach(key => {
        const secondVal = order.measurements.lowerBody[key] || '';
        html += `<td class="value-cell second-row">${secondVal !== '' ? secondVal : '—'}</td>`;
      });
      html += `</tr></table></div>`;
      return html;
    };

    const group1 = ["Length", "Shoulder", "Sleeves"];
    const group2 = ["Chest", "Lap", "Neck"];
    const group3 = ["Waist", "Shalwar Length", "Shalwar Waist"];

    const options = ["Front Pocket", "Side Pocket", "Front Pati", "Ban", "Kuf", "Shalwar Darz", "Halwar Pocket"];
    let optionsHtml = '';
    options.forEach(opt => {
      const checked = order.measurements.options[opt] || false;
      const displayStatus = opt === "Front Pocket" ? (checked ? "Yes" : "No Pocket") :
                           opt === "Halwar Pocket" ? (checked ? "Yes" : "No") :
                           (checked ? "Size Noted" : "Not Noted");
      optionsHtml += `<div class="option-line">${opt}: ${displayStatus}</div>`;
    });

    const daaman = getMeas('Daaman') || 'Square Sacd';
    const geer = getMeas('Geer') || '';
    let sellaiType = '';
    const noteText = order.specialNotes || '';
    if (noteText.toLowerCase().includes('ss')) {
      const match = noteText.match(/ss\s*(\d+)/i);
      if (match) sellaiType = `SS ${match[1]}`;
    }
    if (!sellaiType && noteText) sellaiType = noteText.substring(0, 20);
    if (!sellaiType) sellaiType = 'SS 1';

    const receiptHTML = `
      <div class="print-receipt">
        <div class="receipt-header">
          <div class="shop-name">🧵 ${SHOP.name}</div>
          <div class="shop-address">${SHOP.address}</div>
          <div class="shop-phone">📞 ${SHOP.phone}</div>
        </div>
        <div class="customer-block">
          <div><strong>Customer:</strong> ${order.customerName}</div>
          <div><strong>Order ID:</strong> ${order.id}</div>
          <div><strong>Mobile:</strong> ${order.whatsapp}</div>
          <div><strong>Delivery Date:</strong> ${order.deliveryDate}</div>
        </div>
        ${buildTwoRowTable("Upper Body", group1)}
        ${buildTwoRowTable("Chest & Neck", group2)}
        ${buildTwoRowTable("Waist & Lower", group3)}
        <div class="daaman-line">Daaman: ${daaman}</div>
        <div class="options-block"><div class="section-title">Options</div>${optionsHtml}</div>
        <div class="extra-block">
          <div>Geer: ${geer || '—'}</div>
          <div>Sellai type: ${sellaiType}</div>
          <div>Note: ${noteText || '—'}</div>
        </div>
        <div class="payment-block">
          <div>Total: Rs ${order.totalAmount.toLocaleString()}</div>
          <div>Paid: Rs ${order.advancePaid.toLocaleString()}</div>
          <div>Remaining: Rs ${order.balance.toLocaleString()}</div>
        </div>
        <div class="thankyou-message">Thank you for coming — we will wait your next visit</div>
      </div>
    `;

    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; background: white; padding: 20px; font-size: 12px; }
          .print-receipt { max-width: 350px; margin: 0 auto; }
          .receipt-header { text-align: center; border-bottom: 1px dashed #333; padding-bottom: 8px; margin-bottom: 12px; }
          .shop-name { font-size: 18px; font-weight: bold; }
          .shop-address, .shop-phone { font-size: 10px; color: #444; }
          .customer-block { background: #f8f8f8; padding: 8px; margin-bottom: 12px; border-radius: 4px; }
          .meas-section { margin-bottom: 12px; }
          .meas-title { font-weight: bold; margin-bottom: 4px; font-size: 11px; background: #f0f0f0; display: inline-block; padding: 2px 8px; }
          .meas-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          .meas-table th, .meas-table td { border: 1px solid #ccc; padding: 5px 4px; text-align: center; }
          .meas-table th { background: #fafafa; font-size: 10px; }
          .daaman-line { margin: 8px 0; padding: 4px; background: #f9f9f9; border-left: 3px solid #333; }
          .options-block { margin: 10px 0; padding: 6px; background: #fafafa; }
          .option-line { font-size: 10px; margin: 3px 0; display: flex; justify-content: space-between; }
          .extra-block { margin: 8px 0; padding: 6px; background: #f9f9f9; }
          .payment-block { border-top: 1px dashed #333; border-bottom: 1px dashed #333; padding: 8px 0; margin: 12px 0; font-weight: bold; }
          .payment-block div { display: flex; justify-content: space-between; margin: 3px 0; }
          .thankyou-message { text-align: center; font-style: italic; margin-top: 12px; font-size: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${receiptHTML}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),800);}<\/script></body>
      </html>
    `);
    printWin.document.close();
  }

  // WhatsApp Functions
  function whatsappOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    let measText = '';
    Object.entries(order.measurements.upperBody || {}).forEach(([name, val]) => {
      measText += `${name}: ${val}″\n`;
    });
    Object.entries(order.measurements.lowerBody || {}).forEach(([name, val]) => {
      measText += `${name}: ${val}″\n`;
    });

    const message = `🧵 ${SHOP.name}\n📍 ${SHOP.address}\n📞 ${SHOP.phone}\n\nCustomer: ${order.customerName}\nOrder ID: ${order.id}\n\nMeasurements:\n${measText}\n${order.specialNotes ? `Note: ${order.specialNotes}\n` : ''}Delivery: ${order.deliveryDate}\nTotal: Rs ${order.totalAmount}\nPaid: Rs ${order.advancePaid}\nBalance: Rs ${order.balance}`;

    const url = `https://wa.me/${order.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    addHistoryEntry(order.id, "whatsapp_sent", { to: "customer" });
  }

  function whatsappOrderToShop(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    let measText = '';
    Object.entries(order.measurements.upperBody || {}).forEach(([name, val]) => {
      measText += `${name}: ${val}″\n`;
    });
    Object.entries(order.measurements.lowerBody || {}).forEach(([name, val]) => {
      measText += `${name}: ${val}″\n`;
    });

    const message = `🧵 ${SHOP.name} (ORDER COPY)\nOrder: ${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.whatsapp}\n\nMeasurements:\n${measText}\n${order.specialNotes ? `Note: ${order.specialNotes}\n` : ''}Delivery: ${order.deliveryDate}\nTotal: Rs ${order.totalAmount}\nPaid: Rs ${order.advancePaid}\nBalance: Rs ${order.balance}\nStatus: ${order.status}`;

    const url = `https://wa.me/${SHOP.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    addHistoryEntry(order.id, "whatsapp_sent", { to: "shop" });
  }

  // Customers Panel
  function showCustomers() {
    const customerMap = new Map();
    orders.forEach(order => {
      if (!customerMap.has(order.whatsapp)) {
        customerMap.set(order.whatsapp, {
          name: order.customerName,
          phone: order.whatsapp,
          orders: []
        });
      }
      customerMap.get(order.whatsapp).orders.push(order);
    });

    if (customerMap.size === 0) {
      customersList.innerHTML = '<div class="empty-state">No customers yet</div>';
    } else {
      let html = '';
      Array.from(customerMap.values())
        .sort((a, b) => b.orders.length - a.orders.length)
        .forEach(customer => {
          const totalSpent = customer.orders.reduce((sum, o) => sum + o.totalAmount, 0);
          const pendingBalance = customer.orders.reduce((sum, o) => sum + o.balance, 0);
          html += `
            <div class="customer-card" onclick="window.app.filterByCustomer('${customer.phone}')">
              <h4>👤 ${customer.name}</h4>
              <div class="customer-stats">📞 ${customer.phone}</div>
              <div class="customer-stats">🔄 ${customer.orders.length} orders</div>
              <div class="customer-stats">💰 Total: Rs ${totalSpent.toLocaleString()}</div>
              <div class="customer-stats">⚖️ Pending: Rs ${pendingBalance.toLocaleString()}</div>
            </div>
          `;
        });
      customersList.innerHTML = html;
    }
    customersPanel.style.display = 'block';
  }

  function filterByCustomer(phone) {
    searchInput.value = phone;
    customersPanel.style.display = 'none';
    renderOrderList();
  }

  // Filter and Render
  function filterOrders() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusVal = filterStatus.value;
    const paymentVal = filterPayment.value;

    return orders.filter(order => {
      const matchesSearch = order.customerName.toLowerCase().includes(searchTerm) ||
        order.whatsapp.includes(searchTerm);
      const matchesStatus = statusVal === '' || order.status === statusVal;
      let paymentStatus = order.balance <= 0 ? 'Paid' : (order.advancePaid > 0 ? 'Partial' : 'Pending');
      return matchesSearch && matchesStatus && (paymentVal === '' || paymentStatus === paymentVal);
    });
  }

  function renderOrderList() {
    const filtered = filterOrders();
    if (filtered.length === 0) {
      ordersContainer.innerHTML = '';
      noOrdersMsg.style.display = 'block';
      return;
    }
    noOrdersMsg.style.display = 'none';

    let html = '';
    filtered.forEach(order => {
      const paymentStatus = order.balance <= 0 ? 'Paid' : (order.advancePaid > 0 ? 'Partial' : 'Pending');
      const measCount = Object.keys(order.measurements.upperBody || {}).length +
        Object.keys(order.measurements.lowerBody || {}).length;

      html += `
        <div class="order-card">
          <div class="order-header">
            <span class="order-id">${order.id}</span>
            <span class="order-status status-${order.status}">${order.status}</span>
          </div>
          <div class="order-body">
            <p><strong>👤 ${order.customerName}</strong></p>
            <p>📞 ${order.whatsapp}</p>
            <p>📅 ${order.deliveryDate}</p>
            <div class="meas-preview">📏 ${measCount} measurements</div>
            <p>💰 Total: Rs ${order.totalAmount.toLocaleString()} | Adv: Rs ${order.advancePaid.toLocaleString()}</p>
            <p>⚖️ Balance: Rs ${order.balance.toLocaleString()} (${paymentStatus})</p>
            ${order.specialNotes ? `<p>📝 ${order.specialNotes.substring(0, 60)}${order.specialNotes.length > 60 ? '...' : ''}</p>` : ''}
          </div>
          <div class="order-footer">
            <div>
              <button class="btn-icon" onclick="window.app.editOrder('${order.id}')" title="Edit">✏️</button>
              <button class="btn-icon" onclick="window.app.whatsappOrder('${order.id}')" title="WhatsApp Customer">📲</button>
              <button class="btn-icon" onclick="window.app.whatsappOrderToShop('${order.id}')" title="Send to Shop">🏪</button>
              <button class="btn-icon" onclick="window.app.printOrder('${order.id}')" title="Print Receipt">🖨️</button>
              <button class="btn-icon" onclick="window.app.viewOrderHistory('${order.id}')" title="History">📜</button>
              <button class="btn-icon" onclick="window.app.deleteOrder('${order.id}')" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });
    ordersContainer.innerHTML = html;
  }

  // Reports
  function updateReports() {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const pendingBalance = orders.reduce((acc, o) => acc + (o.balance || 0), 0);
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const today = new Date().toISOString().split('T')[0];
    const todayAdvance = orders
      .filter(o => o.creationDate === today)
      .reduce((acc, o) => acc + (o.advancePaid || 0), 0);

    statTotal.innerText = totalOrders;
    statRevenue.innerText = totalRevenue.toLocaleString();
    statPendingBal.innerText = pendingBalance.toLocaleString();
    statDelivered.innerText = deliveredCount;
    statTodayAdv.innerText = todayAdvance.toLocaleString();
  }

  function updateReportsAndRender() {
    updateReports();
    renderOrderList();
  }

  // Export/Import
  function exportCSV() {
    if (!orders.length) {
      alert('No orders to export');
      return;
    }
    const headers = ['OrderID', 'Customer', 'WhatsApp', 'DeliveryDate', 'Total', 'Advance', 'Balance', 'Status', 'SpecialNotes', 'CreationDate'];
    const rows = orders.map(o => [
      o.id, o.customerName, o.whatsapp, o.deliveryDate,
      o.totalAmount, o.advancePaid, o.balance, o.status,
      o.specialNotes, o.creationDate
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wali_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    if (!orders.length) {
      alert('No orders to export');
      return;
    }
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wali_orders_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const lines = ev.target.result.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return;
        const newOrders = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          if (vals.length < 5) continue;
          newOrders.push({
            id: vals[0] || getNextOrderId(),
            customerName: vals[1],
            whatsapp: vals[2],
            deliveryDate: vals[3],
            totalAmount: parseFloat(vals[4]) || 0,
            advancePaid: parseFloat(vals[5]) || 0,
            balance: parseFloat(vals[6]) || 0,
            status: vals[7] || 'pending',
            specialNotes: vals[8] || '',
            creationDate: vals[9] || new Date().toISOString().split('T')[0],
            measurements: { upperBody: {}, lowerBody: {}, options: {}, custom: [] },
            history: [{
              date: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
              action: "imported",
              details: {}
            }]
          });
        }
        if (newOrders.length) {
          orders = orders.concat(newOrders);
          saveOrders();
          alert(`Imported ${newOrders.length} orders`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // Form Controls
  function resetFormAndHide() {
    orderForm.reset();
    editOrderId.value = '';
    editId = null;
    formSection.style.display = 'none';
    renderMeasurementInputs();
    updateBalanceField();
    formTitle.innerText = '➕ New order';
    if (orderIdDisplay) orderIdDisplay.value = '';
  }

  function showNewOrderForm() {
    resetFormAndHide();
    if (orderIdDisplay) orderIdDisplay.value = getNextOrderId();
    formSection.style.display = 'block';
    window.scrollTo({ top: formSection.offsetTop - 20, behavior: 'smooth' });
  }

  // Initialize
  async function init() {
    loadLastId();
    loadOrders();

    if (orders.length) {
      const maxNum = orders.reduce((mx, o) => {
        const match = o.id && o.id.match(/WT-0*(\d+)/);
        return match ? Math.max(mx, parseInt(match[1], 10)) : mx;
      }, 0);
      if (maxNum >= lastId) lastId = maxNum + 1;
      saveLastId();
    }

    renderMeasurementInputs();
    updateReportsAndRender();

    // Try to load from cloud on startup (if no data)
    if (orders.length === 0) {
      await initialCloudSync();
    }

    // Event Listeners
    orderForm.addEventListener('submit', saveOrderFromForm);
    cancelFormBtn.addEventListener('click', resetFormAndHide);
    newOrderBtn.addEventListener('click', showNewOrderForm);
    exportCsvBtn.addEventListener('click', exportCSV);
    exportJsonBtn.addEventListener('click', exportJSON);
    importCsvBtn.addEventListener('click', importCSV);
    customersBtn.addEventListener('click', showCustomers);
    closeCustomersBtn.addEventListener('click', () => customersPanel.style.display = 'none');
    closeHistoryModal.addEventListener('click', () => historyModal.style.display = 'none');
    window.addEventListener('click', (e) => {
      if (e.target === historyModal) historyModal.style.display = 'none';
    });
    searchInput.addEventListener('input', renderOrderList);
    filterStatus.addEventListener('change', renderOrderList);
    filterPayment.addEventListener('change', renderOrderList);
    applyTemplateBtn.addEventListener('click', () => renderMeasurementInputs(measurementTemplate.value));

    // Expose global functions
    window.app = {
      editOrder,
      deleteOrder,
      whatsappOrder,
      whatsappOrderToShop,
      printOrder,
      viewOrderHistory,
      filterByCustomer
    };
  }

  init();
})();