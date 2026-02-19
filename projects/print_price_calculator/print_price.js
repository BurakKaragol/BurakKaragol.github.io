/* Print Price Calculator - Final Logic v6 */

// ================= CONSTANTS & STATE =================
const STORAGE_KEY = 'pp_calculator_v6';

const DEFAULT_STATE = {
  materials: [
    { id: 'm1', name: 'PLA (Standart)', price: 400, type: 'FDM', vendor: 'Genel', color: '#10b981' },
    { id: 'm2', name: 'PETG', price: 500, type: 'FDM', vendor: 'Genel', color: '#f59e0b' },
    { id: 'm3', name: 'TPU (Esnek)', price: 750, type: 'FDM', vendor: 'Genel', color: '#3b82f6' }
  ],
  printers: [
    {
      id: 'p1', name: 'Bambu Lab P1S',
      power: 150,
      purchasePrice: 35000,
      lifespanHours: 5000,
      maintenanceHourly: 5
    },
    {
      id: 'p2', name: 'Ender 3 V2',
      power: 150,
      purchasePrice: 10000,
      lifespanHours: 3000,
      maintenanceHourly: 3
    }
  ],
  settings: {
    electricityPrice: 4.5, // ₺/kWh
    longPrintThreshold: 12, // Hours
    longPrintMultiplier: 1.15, // 15% increase
    currency: 'TRY'
  }
};

let state = loadState();

// ================= DOM ELEMENTS =================
const els = {
  // Inputs
  selMaterial: document.getElementById('selMaterial'),
  selPrinter: document.getElementById('selPrinter'),
  inpWeight: document.getElementById('inpWeight'),
  inpTime: document.getElementById('inpTime'),

  inpMarkup: document.getElementById('inpMarkup'),
  inpLabor: document.getElementById('inpLabor'),
  inpQty: document.getElementById('inpQty'),
  inpFailed: document.getElementById('inpFailed'),

  chkCustomerMode: document.getElementById('chkCustomerMode'),

  resultPanel: document.getElementById('resultPanel'),

  // Pickers
  pickerOverlay: document.getElementById('pickerOverlay'),
  pickerTitle: document.getElementById('pickerTitle'),
  pickerColumns: document.getElementById('pickerColumns'),
  btnPickerDone: document.getElementById('btnPickerDone'),

  // Result Labels
  lblTotalPrice: document.getElementById('lblTotalPrice'),
  lblUnitPrice: document.getElementById('lblUnitPrice'),

  // Breakdown values
  valMaterial: document.getElementById('valMaterial'),
  valMachine: document.getElementById('valMachine'),
  valLabor: document.getElementById('valLabor'),
  valProfit: document.getElementById('valProfit'),

  // Bars
  barMaterial: document.getElementById('barMaterial'),
  barMachine: document.getElementById('barMachine'),
  barLabor: document.getElementById('barLabor'),
  barProfit: document.getElementById('barProfit'),

  // Buttons
  btnReset: document.getElementById('btnReset'),
  btnAddMaterialQuick: document.getElementById('btnAddMaterialQuick'),
  btnAddPrinterQuick: document.getElementById('btnAddPrinterQuick'),
  btnEditMaterials: document.getElementById('btnEditMaterials'),
  btnEditPrinters: document.getElementById('btnEditPrinters'),
  btnOpenSettings: document.getElementById('btnOpenSettings'),

  // Modals
  modalOverlay: document.getElementById('modalOverlay'),
  modalMaterials: document.getElementById('modalMaterials'),
  modalPrinters: document.getElementById('modalPrinters'),
  modalSettings: document.getElementById('modalSettings'),

  // Forms
  listMaterials: document.getElementById('listMaterials'),
  listPrinters: document.getElementById('listPrinters'),

  editMatId: document.getElementById('editMatId'),
  editMatName: document.getElementById('editMatName'),
  editMatPrice: document.getElementById('editMatPrice'),
  editMatColor: document.getElementById('editMatColor'),
  editMatType: document.getElementById('editMatType'),
  editMatVendor: document.getElementById('editMatVendor'),

  editPrintId: document.getElementById('editPrintId'),
  editPrintName: document.getElementById('editPrintName'),
  editPrintPower: document.getElementById('editPrintPower'),
  editPrintPrice: document.getElementById('editPrintPrice'),
  editPrintLifespan: document.getElementById('editPrintLifespan'),
  editPrintMaint: document.getElementById('editPrintMaint'),

  // Settings Form
  setElecPrice: document.getElementById('setElecPrice'),
  setRiskThreshold: document.getElementById('setRiskThreshold'),
  setRiskMultiplier: document.getElementById('setRiskMultiplier'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),

  btnSaveMat: document.getElementById('btnSaveMat'),
  btnCancelMat: document.getElementById('btnCancelMat'),
  btnSavePrint: document.getElementById('btnSavePrint'),
  btnCancelPrint: document.getElementById('btnCancelPrint'),
};

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  populateDropdowns();
  attachEventListeners();
  initMobileUx();
  recalc();
});

function loadState() {
  const s = localStorage.getItem(STORAGE_KEY);
  // Deep merge to ensure new fields exist if loading old state
  if (!s) return structuredClone(DEFAULT_STATE);

  const stored = JSON.parse(s);
  const merged = { ...DEFAULT_STATE, ...stored };
  merged.settings = { ...DEFAULT_STATE.settings, ...stored.settings };

  // Migrate old printers to have defaults if missing
  merged.printers = merged.printers.map(p => ({
    purchasePrice: 0, lifespanHours: 5000, maintenanceHourly: 2,
    ...p
  }));

  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function populateDropdowns() {
  const matSel = els.selMaterial.value;
  const printSel = els.selPrinter.value;

  els.selMaterial.innerHTML = '';
  state.materials.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name} - ${m.price}₺/kg`;
    els.selMaterial.appendChild(opt);
  });
  if (matSel) els.selMaterial.value = matSel;

  els.selPrinter.innerHTML = '';
  state.printers.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    els.selPrinter.appendChild(opt);
  });
  if (printSel) els.selPrinter.value = printSel;
}

function attachEventListeners() {
  [
    els.selMaterial, els.selPrinter, els.inpMarkup,
    els.inpLabor, els.inpQty, els.inpFailed,
    els.inpWeight
  ].forEach(el => el.addEventListener('input', recalc));

  els.inpTime.addEventListener('input', recalc);

  els.chkCustomerMode.addEventListener('change', () => {
    document.body.classList.toggle('customer-mode', els.chkCustomerMode.checked);
    recalc();
  });

  // Reset
  els.btnReset.addEventListener('click', () => {
    els.inpWeight.value = '';
    els.inpTime.value = '';
    recalc();
  });

  // Modals
  els.btnAddMaterialQuick.addEventListener('click', () => openModal('material'));
  els.btnEditMaterials.addEventListener('click', () => openModal('material'));
  els.btnAddPrinterQuick.addEventListener('click', () => openModal('printer'));
  els.btnEditPrinters.addEventListener('click', () => openModal('printer'));
  els.btnOpenSettings.addEventListener('click', () => openModal('settings'));

  // Modal Actions
  els.btnSaveMat.addEventListener('click', saveMaterial);
  els.btnCancelMat.addEventListener('click', closeModal);
  els.btnSavePrint.addEventListener('click', savePrinter);
  els.btnCancelPrint.addEventListener('click', closeModal);
  els.btnSaveSettings.addEventListener('click', saveSettings);

  // Mobile Sheet
  if (window.innerWidth <= 768) {
    const toggleSheet = (e) => {
      if (e.target.closest('button')) return;
      els.resultPanel.classList.toggle('expanded');
    };
    els.resultPanel.querySelector('.mobile-drag-handle').addEventListener('click', toggleSheet);
    els.resultPanel.addEventListener('click', (e) => {
      if (e.clientY > window.innerHeight - 100 && !els.resultPanel.classList.contains('expanded')) {
        els.resultPanel.classList.add('expanded');
      }
    });
  }
}

function initMobileUx() {
  if (window.innerWidth <= 768) {
    els.inpTime.readOnly = true;
    els.inpWeight.readOnly = true;
    els.inpTime.addEventListener('click', () => openPicker('time'));
    els.inpWeight.addEventListener('click', () => openPicker('weight'));
  }
}

// Picker logic
let currentPickerType = null;
function openPicker(type) {
  currentPickerType = type;
  els.pickerOverlay.classList.remove('hidden');
  els.pickerColumns.innerHTML = '';

  if (type === 'time') {
    els.pickerTitle.textContent = 'Baskı Süresi';
    let [h, m] = [0, 0];
    if (els.inpTime.value.includes(':')) { [h, m] = els.inpTime.value.split(':').map(Number); }
    createColumn('hours', 0, 99, h || 0);
    createColumn('minutes', 0, 59, m || 0);
  }
  else if (type === 'weight') {
    els.pickerTitle.textContent = 'Ağırlık (g)';
    let val = parseInt(els.inpWeight.value) || 0;
    createColumn('w_100', 0, 9, Math.floor(val / 100) % 10);
    createColumn('w_10', 0, 9, Math.floor(val / 10) % 10);
    createColumn('w_1', 0, 9, val % 10);
  }
  els.btnPickerDone.onclick = () => closePicker(true);
}

function createColumn(id, min, max, initial) {
  const col = document.createElement('div');
  col.className = 'picker-column';
  for (let i = min; i <= max; i++) {
    const item = document.createElement('div');
    item.className = 'picker-item';
    item.textContent = i.toString().padStart(2, '0');
    item.dataset.val = i;
    col.appendChild(item);
  }
  els.pickerColumns.appendChild(col);
  setTimeout(() => {
    // Simple pixel precision offset
    col.scrollTop = (initial - min) * 44;
  }, 10);

  // Highlight logic (center)
  let isScrolling;
  col.addEventListener('scroll', () => {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
      const idx = Math.round(col.scrollTop / 44);
      // Could add visual class .selected here
    }, 50);
  });
}

function closePicker(save) {
  if (save) {
    const cols = els.pickerColumns.querySelectorAll('.picker-column');
    const vals = Array.from(cols).map(c => {
      // Calculate index from scroll
      const index = Math.round(c.scrollTop / 44);
      const items = c.querySelectorAll('.picker-item');
      return items[index] ? parseInt(items[index].dataset.val) : 0;
    });

    if (currentPickerType === 'time') els.inpTime.value = `${vals[0]}:${vals[1].toString().padStart(2, '0')}`;
    else if (currentPickerType === 'weight') els.inpWeight.value = vals[0] * 100 + vals[1] * 10 + vals[2];
    recalc();
  }
  els.pickerOverlay.classList.add('hidden');
}


// ================= ADVANCED CALCULATION ENGINE =================
function parseTime(str) {
  if (!str) return 0;
  if (String(str).includes(':')) {
    const [h, m] = String(str).split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  }
  return parseFloat(str) || 0;
}

function recalc() {
  // 1. Gather Inputs
  const matId = els.selMaterial.value;
  const printId = els.selPrinter.value;
  const weight = parseFloat(els.inpWeight.value) || 0;
  const timeHours = parseTime(els.inpTime.value);
  const markupPct = parseFloat(els.inpMarkup.value) || 0;
  const laborHours = parseFloat(els.inpLabor.value) || 0;
  const qty = parseFloat(els.inpQty.value) || 1;
  const failRate = parseFloat(els.inpFailed.value) || 0;
  const isCustomerMode = els.chkCustomerMode.checked;

  const material = state.materials.find(m => m.id === matId);
  const printer = state.printers.find(p => p.id === printId);
  if (!material || !printer) return;

  // --- FORMULA START ---

  // A. Material Cost
  // Cost = (PricePerKg / 1000) * Weight
  const materialCostBase = (material.price / 1000) * weight;

  // B. Machine Cost (Detailed)
  // 1. Electricity: (PowerW / 1000) * Time * PricePerKwh
  const elecCost = (printer.power / 1000) * timeHours * state.settings.electricityPrice;

  // 2. Depreciation: (PrinterPrice / LifespanHours) * Time
  const lifespan = printer.lifespanHours || 5000;
  const hourlyDepreciation = (printer.purchasePrice || 0) / lifespan;
  const depreciationCost = hourlyDepreciation * timeHours;

  // 3. Maintenance: HourlyRate * Time
  const maintCost = (printer.maintenanceHourly || 0) * timeHours;

  const totalMachineCost = elecCost + depreciationCost + maintCost;

  // C. Labor Cost
  const laborRate = 200; // Fixed
  const laborCost = laborHours * laborRate;

  // D. Risk & Failure
  // Base Risk from Fail Rate User Input
  let riskMultiplier = 1 + (failRate / 100);

  // Long Print Risk Multiplier (Advanced)
  // If time > Threshold, increase multiplier
  if (timeHours > state.settings.longPrintThreshold) {
    // e.g. Threshold 12, Multiplier 1.2
    // We apply this extra risk to the Machine & Material components, 
    // as those are lost if it fails late.
    riskMultiplier *= state.settings.longPrintMultiplier;
  }

  // --- TOTALS ---
  // Production Cost = (Mat + Machine) * Risk + Labor
  const productionCost = (materialCostBase + totalMachineCost) * riskMultiplier + laborCost;

  // E. Profit
  const profit = productionCost * (markupPct / 100);
  const unitPrice = productionCost + profit;
  const totalPrice = unitPrice * qty;

  // --- FORMULA END ---

  // 3. Update UI
  const fmt = (n) => `₺${n.toFixed(2)}`;

  els.lblTotalPrice.textContent = fmt(totalPrice);
  els.lblUnitPrice.textContent = qty > 1 ? `Birim: ${fmt(unitPrice)}` : `Birim Fiyat`;

  // Breakdown Values for Chart
  let totalMat = materialCostBase * riskMultiplier * qty;
  let totalMachine = totalMachineCost * riskMultiplier * qty;
  let totalLabor = laborCost * qty;
  let totalProfit = profit * qty;

  const maxVal = totalPrice || 1;

  if (isCustomerMode) {
    const scale = 1 + (markupPct / 100);

    els.valMaterial.textContent = fmt(totalMat * scale);
    els.valMachine.textContent = fmt(totalMachine * scale);
    els.valLabor.textContent = fmt(totalLabor * scale);
    els.valProfit.textContent = '-';

    els.barMaterial.style.width = `${((totalMat * scale) / maxVal) * 100}%`;
    els.barMachine.style.width = `${((totalMachine * scale) / maxVal) * 100}%`;
    els.barLabor.style.width = `${((totalLabor * scale) / maxVal) * 100}%`;
    els.barProfit.style.width = `0%`;

    els.valMachine.previousElementSibling.textContent = "Üretim Hizmeti";
  } else {
    els.valMaterial.textContent = fmt(totalMat);
    els.valMachine.textContent = fmt(totalMachine);
    els.valLabor.textContent = fmt(totalLabor);
    els.valProfit.textContent = fmt(totalProfit);

    els.barMaterial.style.width = `${(totalMat / maxVal) * 100}%`;
    els.barMachine.style.width = `${(totalMachine / maxVal) * 100}%`;
    els.barLabor.style.width = `${(totalLabor / maxVal) * 100}%`;
    els.barProfit.style.width = `${(totalProfit / maxVal) * 100}%`;

    els.valMachine.previousElementSibling.textContent = "Enerji & Makine";
  }
}

// ================= MODAL LOGIC =================
function openModal(type) {
  els.modalOverlay.classList.remove('hidden');
  // Hide all
  [els.modalMaterials, els.modalPrinters, els.modalSettings].forEach(m => m.classList.add('hidden'));

  if (type === 'material') {
    els.modalMaterials.classList.remove('hidden');
    renderMaterialList();
    clearMatForm();
  } else if (type === 'printer') {
    els.modalPrinters.classList.remove('hidden');
    renderPrinterList();
    clearPrintForm();
  } else if (type === 'settings') {
    els.modalSettings.classList.remove('hidden');
    loadSettingsForm();
  }
}

function closeModal() {
  els.modalOverlay.classList.add('hidden');
}

// ... Material Logic ...
function renderMaterialList() {
  els.listMaterials.innerHTML = '';
  state.materials.forEach(m => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `<span>${m.name}</span> <button onclick="editMaterial('${m.id}')" class="btn icon-only">✎</button>`;
    els.listMaterials.appendChild(div);
  });
}
function editMaterial(id) {
  const m = state.materials.find(x => x.id === id);
  if (m) {
    els.editMatId.value = m.id;
    els.editMatName.value = m.name;
    els.editMatPrice.value = m.price;
    els.editMatColor.value = m.color;
    els.editMatType.value = m.type;
    els.editMatVendor.value = m.vendor;
  }
}
function clearMatForm() { els.editMatId.value = ''; els.editMatName.value = ''; els.editMatPrice.value = ''; }
function saveMaterial() {
  const id = els.editMatId.value;
  const name = els.editMatName.value;
  const data = { name, price: parseFloat(els.editMatPrice.value) || 0, color: els.editMatColor.value, type: els.editMatType.value, vendor: els.editMatVendor.value };

  if (id) {
    const idx = state.materials.findIndex(x => x.id === id);
    if (idx > -1) state.materials[idx] = { ...state.materials[idx], ...data };
  } else {
    state.materials.push({ id: 'm' + Date.now(), ...data });
  }
  saveState(); populateDropdowns(); openModal('material'); recalc();
}

// ... Printer Logic ...
function renderPrinterList() {
  els.listPrinters.innerHTML = '';
  state.printers.forEach(p => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `<span>${p.name}</span> <button onclick="editPrinter('${p.id}')" class="btn icon-only">✎</button>`;
    els.listPrinters.appendChild(div);
  });
}

function editPrinter(id) {
  const p = state.printers.find(x => x.id === id);
  if (!p) return;
  els.editPrintId.value = p.id;
  els.editPrintName.value = p.name;
  els.editPrintPower.value = p.power;
  els.editPrintPrice.value = p.purchasePrice || '';
  els.editPrintLifespan.value = p.lifespanHours || '';
  els.editPrintMaint.value = p.maintenanceHourly || '';
}

function clearPrintForm() {
  els.editPrintId.value = '';
  els.editPrintName.value = '';
  els.editPrintPower.value = '';
  els.editPrintPrice.value = '';
  els.editPrintLifespan.value = '';
  els.editPrintMaint.value = '';
}

function savePrinter() {
  const id = els.editPrintId.value;
  const name = els.editPrintName.value.trim();
  if (!name) return;

  const data = {
    name,
    power: parseFloat(els.editPrintPower.value) || 0,
    purchasePrice: parseFloat(els.editPrintPrice.value) || 0,
    lifespanHours: parseFloat(els.editPrintLifespan.value) || 0,
    maintenanceHourly: parseFloat(els.editPrintMaint.value) || 0,
  };

  if (id) {
    const idx = state.printers.findIndex(x => x.id === id);
    if (idx > -1) state.printers[idx] = { ...state.printers[idx], ...data };
  } else {
    state.printers.push({ id: 'p' + Date.now(), ...data });
  }

  saveState();
  populateDropdowns();
  openModal('printer');
  recalc();
}

// ... Settings Logic ...
function loadSettingsForm() {
  els.setElecPrice.value = state.settings.electricityPrice;
  els.setRiskThreshold.value = state.settings.longPrintThreshold || 12;
  els.setRiskMultiplier.value = state.settings.longPrintMultiplier || 1.1;
}

function saveSettings() {
  state.settings.electricityPrice = parseFloat(els.setElecPrice.value) || 0;
  state.settings.longPrintThreshold = parseFloat(els.setRiskThreshold.value) || 12;
  state.settings.longPrintMultiplier = parseFloat(els.setRiskMultiplier.value) || 1.0;

  saveState();
  closeModal();
  recalc();
}

window.editPrinter = editPrinter;
window.editMaterial = editMaterial;
window.closeModal = closeModal;
