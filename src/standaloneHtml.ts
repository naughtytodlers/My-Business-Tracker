import { SHEET_ID, DEFAULT_APPS_SCRIPT_URL } from './constants';

export const STANDALONE_HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Business Tracker - Naughty Toddlers</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Canvas Confetti -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">

  <!-- Clean Header with Middle-Aligned Naughty Toddlers Logo -->
  <nav class="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
      <!-- 3-Column Grid guarantees the center column is strictly aligned in the middle -->
      <div class="grid grid-cols-3 items-center">

        <!-- Left: Status Indicator + "My Business Tracker" moved underneath -->
        <div class="flex flex-col items-start gap-1 justify-self-start py-0.5">
          <div class="flex items-center gap-2">
            <button id="connection-status-btn" onclick="openModal()" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer" title="Click to check Google Sheet connection">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span id="connection-status-text" class="font-semibold">Connected</span>
            </button>

            <button onclick="fetchSheetData()" id="refresh-btn" class="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Refresh data from Google Sheet">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>

          <!-- My Business Tracker in brand color without INR badge -->
          <div class="flex items-center">
            <span class="text-xs sm:text-sm font-black tracking-tight whitespace-nowrap bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-2xs">My Business Tracker</span>
          </div>
        </div>

        <!-- Center: Single-Line Naughty Toddlers Logo strictly in the Middle -->
        <div class="flex items-center justify-center text-center justify-self-center py-1">
          <svg viewBox="0 0 760 92" class="h-9 sm:h-10.5 w-auto select-none drop-shadow-xs max-w-full" fill="none">
            <defs>
              <filter id="nt-sh" x="-10%" y="-10%" width="125%" height="135%">
                <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.14" />
              </filter>
              <linearGradient id="gp1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF5C9D"/><stop offset="100%" stopColor="#D90E63"/></linearGradient>
              <linearGradient id="go" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFA63D"/><stop offset="100%" stopColor="#E05B00"/></linearGradient>
              <linearGradient id="gy" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFE454"/><stop offset="100%" stopColor="#E6A100"/></linearGradient>
              <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4AE361"/><stop offset="100%" stopColor="#0EA822"/></linearGradient>
              <linearGradient id="gcy" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#42C6FF"/><stop offset="100%" stopColor="#008BE0"/></linearGradient>
              <linearGradient id="gpr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A855F7"/><stop offset="100%" stopColor="#6317A6"/></linearGradient>
              <linearGradient id="gbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BEFF"/><stop offset="100%" stopColor="#007CD1"/></linearGradient>
              <linearGradient id="gvi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C084FC"/><stop offset="100%" stopColor="#791BB8"/></linearGradient>
              <linearGradient id="gp2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF66A9"/><stop offset="100%" stopColor="#DE116A"/></linearGradient>
            </defs>
            <g filter="url(#nt-sh)" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" stroke="#FFF" stroke-width="3.5" paint-order="stroke fill" stroke-linejoin="round" transform="translate(15, 66)">
              <text x="0" y="0" font-size="68" fill="url(#gp1)" letter-spacing="-2">N</text>
              <text x="54" y="-3" font-size="62" fill="url(#go)">a</text>
              <text x="98" y="-4" font-size="62" fill="url(#gy)">u</text>
              <text x="146" y="-3" font-size="64" fill="url(#gg)">g</text>
              <text x="198" y="-4" font-size="66" fill="url(#gcy)">h</text>
              <text x="250" y="-3" font-size="64" fill="url(#gpr)">t</text>
              <text x="286" y="-3" font-size="64" fill="url(#gp2)">y</text>
              <!-- Toddlers beside Naughty with capital 'T' -->
              <text x="350" y="0" font-size="68" fill="url(#gbl)">T</text>
              <text x="398" y="-2" font-size="64" fill="url(#gg)">o</text>
              <text x="450" y="-2" font-size="66" fill="url(#gpr)">d</text>
              <text x="506" y="-2" font-size="66" fill="url(#gcy)">d</text>
              <text x="562" y="-2" font-size="66" fill="url(#go)">l</text>
              <text x="598" y="-4" font-size="62" fill="url(#gvi)">e</text>
              <text x="647" y="-4" font-size="62" fill="url(#gy)">r</text>
              <text x="688" y="-4" font-size="62" fill="url(#gp1)">s</text>
            </g>
          </svg>
        </div>

        <!-- Right: Direct Google Sheet Link -->
        <div class="justify-self-end">
          <a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer" title="Open Google Sheet in new tab">
            <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            <span class="hidden sm:inline">Google Sheet</span>
          </a>
        </div>

      </div>
    </div>
  </nav>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4">

    <!-- 1. KPI Summary Cards (Compact) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Income</p>
          <p id="total-income" class="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1.5">₹0.00</p>
        </div>
        <p id="income-count" class="text-[11px] text-emerald-600 font-semibold mt-2 pt-1 border-t border-slate-100">+0 records</p>
        <div class="absolute bottom-0 inset-x-0 h-1 bg-emerald-500"></div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Expenses</p>
          <p id="total-expense" class="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1.5">₹0.00</p>
        </div>
        <p id="expense-count" class="text-[11px] text-rose-600 font-semibold mt-2 pt-1 border-t border-slate-100">-0 records</p>
        <div class="absolute bottom-0 inset-x-0 h-1 bg-rose-500"></div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Net Savings</p>
          <p id="net-balance" class="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1.5">₹0.00</p>
        </div>
        <p id="balance-status" class="text-[11px] text-slate-500 font-medium mt-2 pt-1 border-t border-slate-100">Balanced</p>
        <div id="balance-bar" class="absolute bottom-0 inset-x-0 h-1 bg-emerald-500"></div>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Savings Rate</p>
          <p id="savings-rate" class="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-1.5">0.0%</p>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2.5">
          <div id="savings-rate-bar" class="bg-indigo-600 h-1.5 rounded-full" style="width: 0%"></div>
        </div>
        <div class="absolute bottom-0 inset-x-0 h-1 bg-indigo-500"></div>
      </div>
    </div>

    <!-- 2. Side-by-Side: Left = "New Transaction", Right = "Visual Diagrams" -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">

      <!-- LEFT: New Transaction Form (Placed in prime spot) -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
        <div class="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 class="text-sm sm:text-base font-bold text-slate-900">New Transaction</h2>
            <p class="text-[11px] text-slate-500">Directly logs to Google Sheet Data tab</p>
          </div>
        </div>

        <form id="transaction-form" onsubmit="handleFormSubmit(event)" class="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
          <div class="space-y-3">
            <!-- Type Selector -->
            <div class="grid grid-cols-2 gap-2">
              <button type="button" id="type-expense-btn" onclick="setType('Expense')" class="py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Expense</span>
              </button>
              <button type="button" id="type-income-btn" onclick="setType('Income')" class="py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border bg-slate-50 text-slate-600 border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Income</span>
              </button>
            </div>

            <!-- Date & Category -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Date</label>
                <input type="date" id="tx-date" required onchange="if(this.value>getTodayStr()){this.value=getTodayStr();}" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex justify-between">
                  <span>Category</span>
                  <span class="text-[10px] text-slate-400 font-normal">Settings Tab</span>
                </label>
                <select id="tx-category" required onchange="handleCategoryChange(this.value)" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                  <!-- Dynamically populated -->
                </select>
              </div>
            </div>

            <!-- Conditional Item & Seller Details Grid (Stock Purchased only) -->
            <div id="stock-purchased-fields" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex justify-between">
                  <span>Item</span>
                  <span class="text-[10px] text-purple-600 font-semibold">Stock</span>
                </label>
                <select id="tx-item" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                  <option value="">Select Item</option>
                  <option value="Soft Toys">Soft Toys</option>
                  <option value="Mechanical Toys">Mechanical Toys</option>
                  <option value="Learning Toys">Learning Toys</option>
                  <option value="Kids Water Bottle">Kids Water Bottle</option>
                  <option value="Kids School Bags">Kids School Bags</option>
                </select>
                <div class="flex items-center justify-between mt-1 px-0.5">
                  <button type="button" onclick="promptAddNewItem()" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">+ Add Item</button>
                  <span id="items-count-label" class="text-[10px] text-slate-400">Master Catalog</span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex justify-between">
                  <span>Seller Details</span>
                  <span class="text-[10px] text-indigo-600 font-semibold">Supplier</span>
                </label>
                <select id="tx-seller" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                  <option value="">Select Seller Details</option>
                  <option value="Selvamani articles, Chennai">Selvamani articles, Chennai</option>
                  <option value="Baybee Pvt Ltd, Chennai">Baybee Pvt Ltd, Chennai</option>
                </select>
                <div class="flex items-center justify-between mt-1 px-0.5">
                  <button type="button" onclick="promptAddNewSeller()" class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer">+ Add Seller</button>
                  <span id="sellers-count-label" class="text-[10px] text-slate-400">Master Catalog</span>
                </div>
              </div>
            </div>

            <!-- Amount in INR -->
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex justify-between">
                <span>Amount (₹ INR)</span>
                <span class="text-[10px] font-semibold text-indigo-600">Indian Rupee</span>
              </label>
              <input type="number" step="1" min="1" id="tx-amount" required placeholder="0" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-base font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              
              <!-- Quick Chips in INR -->
              <div class="flex items-center gap-1 mt-1.5 flex-wrap">
                <span class="text-[10px] text-slate-400 font-semibold mr-0.5">Quick:</span>
                <button type="button" onclick="quickAddAmount(100)" class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">+₹100</button>
                <button type="button" onclick="quickAddAmount(500)" class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">+₹500</button>
                <button type="button" onclick="quickAddAmount(1000)" class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">+₹1k</button>
                <button type="button" onclick="quickAddAmount(2000)" class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">+₹2k</button>
                <button type="button" onclick="quickAddAmount(5000)" class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">+₹5k</button>
              </div>
            </div>

            <!-- Note -->
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Note (optional)</label>
              <input type="text" id="tx-note" placeholder="e.g. Toddler supplies, toys, monthly rent..." class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>

            <div id="form-error" class="hidden p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700"></div>
          </div>

          <div class="pt-1">
            <button type="submit" id="submit-btn" class="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <span>Save Expense Entry</span>
            </button>
          </div>
        </form>
      </div>

      <!-- RIGHT: Visual Diagrams (Pie Diagram & Monthly Bar Graph in clean tabs) -->
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between h-full">
        <!-- Top Tabs + Flow Badge -->
        <div class="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            <button type="button" id="tab-btn-pie" onclick="switchDiagramView('pie')" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 shadow-2xs">
              Pie Diagram
            </button>
            <button type="button" id="tab-btn-bar" onclick="switchDiagramView('bar')" class="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900">
              Bar Graph &amp; Flow
            </button>
          </div>

          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-xs font-semibold whitespace-nowrap shrink-0 border border-slate-200 self-start sm:self-auto">
            <span class="text-slate-500 text-[11px]">Total:</span>
            <span id="grand-total-label" class="font-extrabold text-slate-900 font-mono text-xs">₹0</span>
          </div>
        </div>

        <!-- Diagram Content Container -->
        <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <!-- VIEW 1: PIE DIAGRAM -->
          <div id="view-pie" class="space-y-3 flex-1 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs sm:text-sm font-bold text-slate-900">Category Distribution</h3>
                <p class="text-[11px] text-slate-500">Interactive category donut</p>
              </div>
              <div class="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button type="button" id="pie-tab-expense" onclick="switchPieTab('Expense')" class="px-2 py-0.5 rounded text-[11px] bg-white text-rose-700 shadow-2xs font-bold">Expenses</button>
                <button type="button" id="pie-tab-income" onclick="switchPieTab('Income')" class="px-2 py-0.5 rounded text-[11px] text-slate-600 hover:text-slate-900">Income</button>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-4 py-1 flex-1">
              <div class="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg id="pie-donut-svg" class="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="46" fill="transparent" stroke="#f1f5f9" stroke-width="15" />
                  <g id="pie-donut-slices"></g>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span id="pie-center-label" class="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Spent</span>
                  <span id="pie-center-amount" class="text-xs sm:text-sm font-extrabold text-slate-900 font-mono tracking-tight mt-0.5">₹0</span>
                  <span id="pie-center-count" class="text-[10px] font-bold text-indigo-600">0 cats</span>
                </div>
              </div>

              <div id="pie-legends-container" class="flex-1 w-full space-y-1.5 max-h-[145px] overflow-y-auto pr-1"></div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span id="pie-footer-count">0 active categories</span>
              <span id="pie-footer-total" class="font-bold text-slate-700">Total: ₹0</span>
            </div>
          </div>

          <!-- VIEW 2: BAR GRAPH & FLOW -->
          <div id="view-bar" class="hidden space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-[11px] font-bold mb-1">
                <span class="text-emerald-700">Income (<span id="income-pct">50%</span>)</span>
                <span class="text-rose-700">Expense (<span id="expense-pct">50%</span>)</span>
              </div>
              <div class="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex shadow-inner p-0.5">
                <div id="chart-income-bar" style="width: 50%" class="bg-emerald-500 rounded-l-md transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"></div>
                <div id="chart-expense-bar" style="width: 50%" class="bg-rose-500 rounded-r-md transition-all duration-500 flex items-center justify-center text-[9px] font-bold text-white"></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                <span>Monthly Inflow vs Outflow</span>
                <div class="flex items-center gap-2 text-[10px]">
                  <span class="text-emerald-700 flex items-center gap-0.5"><span class="w-2 h-2 rounded-xs bg-emerald-500"></span>In</span>
                  <span class="text-rose-700 flex items-center gap-0.5"><span class="w-2 h-2 rounded-xs bg-rose-500"></span>Out</span>
                </div>
              </div>
              <div id="monthly-bargraph-container" class="h-28 flex items-end justify-between gap-3 px-2 border-b border-slate-200"></div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div class="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-center">
                <span class="text-[10px] font-bold text-emerald-800 uppercase">Earned</span>
                <p id="chart-income-sum" class="text-xs sm:text-sm font-extrabold text-emerald-700 font-mono">₹0</p>
              </div>
              <div class="p-2 rounded-lg bg-rose-50/70 border border-rose-100 text-center">
                <span class="text-[10px] font-bold text-rose-800 uppercase">Spent</span>
                <p id="chart-expense-sum" class="text-xs sm:text-sm font-extrabold text-rose-700 font-mono">₹0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 3. Full-Width Transaction History Table with DISTINCT LIGHT GREY HEADER -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <!-- Light Grey Header (Distinct contrast from white cards, clear structural divider) -->
      <div class="p-3.5 sm:p-4 bg-slate-200 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-slate-300/90 border border-slate-400/40 text-slate-800 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <svg class="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">Transaction History</h2>
            <p id="tx-records-count" class="text-[11px] text-slate-600 font-semibold">0 records from Google Sheet</p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <input type="text" id="tx-search" oninput="renderTransactions()" placeholder="Search transactions..." class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <select id="tx-filter-type" onchange="renderTransactions()" class="px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-semibold">
            <option value="All">All Types</option>
            <option value="Income">Income Only</option>
            <option value="Expense">Expense Only</option>
          </select>
        </div>
      </div>

      <!-- From-To Date Range Search & Shortcuts Bar -->
      <div class="px-3 sm:px-4 py-2.5 bg-slate-50 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
        <div class="flex items-center gap-2 flex-wrap">
          <div class="inline-flex items-center gap-1 font-bold text-slate-700 text-xs shrink-0">
            <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>Filter Dates:</span>
          </div>

          <div class="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From:</span>
            <input type="date" id="tx-date-from" onchange="if(this.value>getTodayStr()){this.value=getTodayStr();}renderTransactions()" class="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer" title="From Date (up to today)">
          </div>

          <div class="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To:</span>
            <input type="date" id="tx-date-to" onchange="if(this.value>getTodayStr()){this.value=getTodayStr();}renderTransactions()" class="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer" title="To Date (up to today)">
          </div>

          <button type="button" id="tx-date-clear-btn" onclick="clearDateFilter()" class="hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-colors cursor-pointer" title="Clear Date Filter">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            <span>Clear Dates</span>
          </button>
        </div>

        <div class="flex items-center gap-1 text-[11px] font-semibold text-slate-600 flex-wrap self-start sm:self-auto">
          <span class="text-slate-400 mr-0.5">Quick:</span>
          <button type="button" onclick="setQuickDateRange('this-month')" class="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs">This Month</button>
          <button type="button" onclick="setQuickDateRange('last-month')" class="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs">Last Month</button>
          <button type="button" onclick="setQuickDateRange('last-30')" class="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs">Last 30 Days</button>
          <button type="button" onclick="setQuickDateRange('this-year')" class="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs">This Year</button>
          <button type="button" onclick="setQuickDateRange('all')" class="px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs">All</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-300 bg-slate-200/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              <th class="py-2.5 px-4 sm:px-5">Date</th>
              <th class="py-2.5 px-4">Type &amp; Category</th>
              <th class="py-2.5 px-4">Note</th>
              <th class="py-2.5 px-4 sm:px-5 text-right">Amount (₹ INR)</th>
            </tr>
          </thead>
          <tbody id="transactions-tbody" class="divide-y divide-slate-100 text-xs sm:text-sm">
            <!-- Dynamically populated via JS -->
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <!-- Clean Brand Footer without technical URLs or links -->
  <footer class="border-t border-slate-200/80 bg-white py-5 mt-12 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p class="font-semibold text-slate-700">
        Naughty Toddlers • <span class="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 bg-clip-text text-transparent font-black">My Business Tracker</span>
      </p>
      <p class="text-slate-400 text-[11px]">
        Keep your business transactions organized and up to date
      </p>
    </div>
  </footer>

  <!-- Connection Setup Modal Popup -->
  <div id="connection-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs hidden">
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
      <div class="p-5 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Google Sheet Connection</h2>
          <p class="text-xs text-slate-500 mt-0.5">Enter your Google Apps Script Web App URL</p>
        </div>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
      </div>

      <div class="p-5 space-y-3.5">
        <div class="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-1">
          <p class="font-bold text-slate-800">Target Google Sheet ID:</p>
          <p class="font-mono text-[11px] bg-white p-1 rounded border border-slate-200 break-all select-all">${SHEET_ID}</p>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Web App URL</label>
          <input type="url" id="modal-url-input" placeholder="https://script.google.com/macros/s/.../exec" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          <p class="text-[11px] text-slate-500 mt-1">Deploy Apps Script as <strong>Web App</strong> with <strong>Who has access: Anyone</strong>.</p>
        </div>

        <div id="modal-error" class="hidden p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700"></div>

        <div class="flex items-center gap-2 pt-1">
          <button onclick="saveAndTestUrl()" id="modal-save-btn" class="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer">
            Save & Connect
          </button>
          <button onclick="useDemoMode()" class="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer">
            Use Demo Mode
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- JavaScript Logic -->
  <script>
    const STORAGE_KEY = 'google_apps_script_url';
    let currentType = 'Expense';
    let pieViewType = 'Expense';
    let activeDiagramView = 'pie';
    let categories = {
      income: ['Salary & Wages', 'Freelance / Consulting', 'Investments & Dividends', 'Rental Income', 'Other Income'],
      expense: ['Housing & Rent', 'Groceries & Supermarket', 'Food & Dining Out', 'Transportation & Fuel', 'Utilities (Power/Water/Net)', 'Shopping', 'Healthcare', 'Other']
    };
    let transactions = [];

    const NT_COLORS = ['#FA1F7C', '#00A3FF', '#FF7300', '#16A34A', '#7C3AED', '#FFB800', '#0284C7', '#C026D3', '#EA580C', '#64748B'];

    function getTodayStr() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    window.addEventListener('DOMContentLoaded', () => {
      const todayStr = getTodayStr();
      const dateEl = document.getElementById('tx-date');
      const fromEl = document.getElementById('tx-date-from');
      const toEl = document.getElementById('tx-date-to');
      if (dateEl) {
        dateEl.value = todayStr;
        dateEl.max = todayStr;
      }
      if (fromEl) fromEl.max = todayStr;
      if (toEl) toEl.max = todayStr;

      let activeUrl = '';
      try {
        const params = new URLSearchParams(window.location.search);
        const queryUrl = params.get('scriptUrl') || params.get('url');
        if (queryUrl && queryUrl.startsWith('https://script.google.com/macros/s/')) {
          activeUrl = queryUrl.trim();
          localStorage.setItem(STORAGE_KEY, activeUrl);
        }
      } catch (e) {}

      if (!activeUrl) {
        activeUrl = localStorage.getItem(STORAGE_KEY) || '';
      }

      if (activeUrl) {
        document.getElementById('modal-url-input').value = activeUrl;
        updateConnectionStatus(true);
        fetchSheetData();
      } else {
        // Try fetching shared config from server
        try {
          fetch('/api/config')
            .then((r) => r.json())
            .then((cfg) => {
              if (cfg && cfg.scriptUrl) {
                activeUrl = cfg.scriptUrl;
                localStorage.setItem(STORAGE_KEY, activeUrl);
                document.getElementById('modal-url-input').value = activeUrl;
                updateConnectionStatus(true);
                fetchSheetData();
              }
            })
            .catch(() => {});
        } catch (e) {}
      }
      populateCategories();
    });

    function openModal() { document.getElementById('connection-modal').classList.remove('hidden'); }
    function closeModal() { document.getElementById('connection-modal').classList.add('hidden'); }

    function updateConnectionStatus(connected) {
      const btn = document.getElementById('connection-status-btn');
      const text = document.getElementById('connection-status-text');
      if (connected) {
        btn.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer';
        text.innerText = 'Sheet Connected';
      } else {
        btn.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer';
        text.innerText = 'Demo Mode';
      }
    }

    function switchDiagramView(view) {
      activeDiagramView = view;
      const tabPie = document.getElementById('tab-btn-pie');
      const tabBar = document.getElementById('tab-btn-bar');
      const viewPie = document.getElementById('view-pie');
      const viewBar = document.getElementById('view-bar');

      if (view === 'pie') {
        tabPie.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 shadow-2xs';
        tabBar.className = 'px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900';
        viewPie.classList.remove('hidden');
        viewBar.classList.add('hidden');
      } else {
        tabBar.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 shadow-2xs';
        tabPie.className = 'px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900';
        viewBar.classList.remove('hidden');
        viewPie.classList.add('hidden');
      }
    }

    async function saveAndTestUrl() {
      const input = document.getElementById('modal-url-input').value.trim();
      const errBox = document.getElementById('modal-error');
      const saveBtn = document.getElementById('modal-save-btn');

      if (!input || !input.startsWith('https://script.google.com/macros/s/')) {
        errBox.innerText = 'Please enter a valid Google Apps Script Web App URL.';
        errBox.classList.remove('hidden');
        return;
      }

      errBox.classList.add('hidden');
      saveBtn.innerText = 'Connecting...';
      saveBtn.disabled = true;

      try {
        localStorage.setItem(STORAGE_KEY, input);
        await fetchSheetData();
        updateConnectionStatus(true);
        closeModal();
      } catch (err) {
        errBox.innerText = 'Connection test failed: ' + err.message;
        errBox.classList.remove('hidden');
      } finally {
        saveBtn.innerText = 'Save & Connect';
        saveBtn.disabled = false;
      }
    }

    function useDemoMode() {
      updateConnectionStatus(false);
      closeModal();
      transactions = [
        { id: '1', date: '2026-10-01', type: 'Income', category: 'Salary & Wages', amount: 85000, note: 'Monthly salary' },
        { id: '2', date: '2026-10-01', type: 'Expense', category: 'Housing & Rent', amount: 22000, note: 'Apartment rent' },
        { id: '3', date: '2026-10-02', type: 'Expense', category: 'Groceries & Supermarket', amount: 5450, note: 'Supermarket run' },
        { id: '4', date: '2026-10-02', type: 'Expense', category: 'Food & Dining Out', amount: 1850, note: 'Dinner with family' },
        { id: '5', date: '2026-10-03', type: 'Income', category: 'Freelance / Consulting', amount: 25000, note: 'Web project payment' },
        { id: '6', date: '2026-10-03', type: 'Expense', category: 'Utilities (Power/Water/Net)', amount: 2199, note: 'Broadband bills' }
      ];
      renderDashboard();
      renderTransactions();
    }

    function setType(type) {
      currentType = type;
      const expenseBtn = document.getElementById('type-expense-btn');
      const incomeBtn = document.getElementById('type-income-btn');
      const submitBtn = document.getElementById('submit-btn');

      if (type === 'Expense') {
        expenseBtn.className = 'py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer';
        incomeBtn.className = 'py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border bg-slate-50 text-slate-600 border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer';
        submitBtn.className = 'w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer';
        submitBtn.innerText = 'Save Expense Entry';
      } else {
        incomeBtn.className = 'py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer';
        expenseBtn.className = 'py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border bg-slate-50 text-slate-600 border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer';
        submitBtn.className = 'w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer';
        submitBtn.innerText = 'Save Income Entry';
      }

      populateCategories();
    }

    function switchPieTab(type) {
      pieViewType = type;
      const tabExp = document.getElementById('pie-tab-expense');
      const tabInc = document.getElementById('pie-tab-income');
      if (type === 'Expense') {
        tabExp.className = 'px-2 py-0.5 rounded text-[11px] bg-white text-rose-700 shadow-2xs font-bold';
        tabInc.className = 'px-2 py-0.5 rounded text-[11px] text-slate-600 hover:text-slate-900';
      } else {
        tabInc.className = 'px-2 py-0.5 rounded text-[11px] bg-white text-emerald-700 shadow-2xs font-bold';
        tabExp.className = 'px-2 py-0.5 rounded text-[11px] text-slate-600 hover:text-slate-900';
      }
      renderPieChart();
    }

    function handleCategoryChange(cat) {
      const fields = document.getElementById('stock-purchased-fields');
      const itemSelect = document.getElementById('tx-item');
      const sellerSelect = document.getElementById('tx-seller');
      if (cat && cat.trim().toLowerCase() === 'stock purchased') {
        fields.classList.remove('hidden');
      } else {
        fields.classList.add('hidden');
        if (itemSelect) itemSelect.value = '';
        if (sellerSelect) sellerSelect.value = '';
      }
    }

    function populateCategories() {
      const select = document.getElementById('tx-category');
      select.innerHTML = '';
      const list = currentType === 'Income' ? categories.income : categories.expense;
      list.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        select.appendChild(opt);
      });
      handleCategoryChange(select.value);
    }

    function quickAddAmount(val) {
      const input = document.getElementById('tx-amount');
      const current = parseFloat(input.value) || 0;
      input.value = (current + val).toFixed(0);
    }

    async function fetchSheetData() {
      const url = localStorage.getItem(STORAGE_KEY);
      if (!url) return;

      const refreshBtn = document.getElementById('refresh-btn');
      refreshBtn.classList.add('animate-spin');

      try {
        const queryUrl = new URL(url);
        queryUrl.searchParams.set('action', 'getData');
        queryUrl.searchParams.set('t', Date.now());

        const res = await fetch(queryUrl.toString(), { method: 'GET', redirect: 'follow' });
        const data = await res.json();

        if (data.categories) {
          if (data.categories.income?.length) categories.income = data.categories.income;
          if (data.categories.expense?.length) categories.expense = data.categories.expense;
          populateCategories();
        }

        if (data.items && Array.isArray(data.items) && data.items.length) {
          updateItemsDropdown(data.items);
        }
        if (data.sellers && Array.isArray(data.sellers) && data.sellers.length) {
          updateSellersDropdown(data.sellers);
        }

        if (data.transactions) {
          transactions = data.transactions;
          renderDashboard();
          renderTransactions();
        }
      } catch (err) {
        console.error('Fetch failed', err);
      } finally {
        refreshBtn.classList.remove('animate-spin');
      }
    }

    function updateItemsDropdown(items) {
      const select = document.getElementById('tx-item');
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '<option value="">Select Item</option>';
      items.forEach(it => {
        const opt = document.createElement('option');
        opt.value = it;
        opt.innerText = it;
        select.appendChild(opt);
      });
      if (currentVal && items.includes(currentVal)) select.value = currentVal;
      const countLabel = document.getElementById('items-count-label');
      if (countLabel) countLabel.innerText = items.length + ' items';
    }

    function updateSellersDropdown(sellers) {
      const select = document.getElementById('tx-seller');
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '<option value="">Select Seller Details</option>';
      sellers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s;
        select.appendChild(opt);
      });
      if (currentVal && sellers.includes(currentVal)) select.value = currentVal;
      const countLabel = document.getElementById('sellers-count-label');
      if (countLabel) countLabel.innerText = sellers.length + ' sellers';
    }

    async function promptAddNewItem() {
      const name = prompt('Enter new Item name for Stock Purchased catalog:');
      if (!name || !name.trim()) return;
      const clean = name.trim();
      const select = document.getElementById('tx-item');
      if (select) {
        const opt = document.createElement('option');
        opt.value = clean;
        opt.innerText = clean;
        select.appendChild(opt);
        select.value = clean;
      }
      const url = localStorage.getItem(STORAGE_KEY);
      if (url) {
        try {
          const u = new URL(url);
          u.searchParams.set('action', 'saveItem');
          u.searchParams.set('name', encodeURIComponent(clean));
          fetch(u.toString(), { method: 'GET', redirect: 'follow' });
        } catch(e) {}
      }
    }

    async function promptAddNewSeller() {
      const name = prompt('Enter new Seller name/details for Stock Purchased catalog:');
      if (!name || !name.trim()) return;
      const clean = name.trim();
      const select = document.getElementById('tx-seller');
      if (select) {
        const opt = document.createElement('option');
        opt.value = clean;
        opt.innerText = clean;
        select.appendChild(opt);
        select.value = clean;
      }
      const url = localStorage.getItem(STORAGE_KEY);
      if (url) {
        try {
          const u = new URL(url);
          u.searchParams.set('action', 'saveSeller');
          u.searchParams.set('name', encodeURIComponent(clean));
          fetch(u.toString(), { method: 'GET', redirect: 'follow' });
        } catch(e) {}
      }
    }

    async function handleFormSubmit(e) {
      e.preventDefault();
      const date = document.getElementById('tx-date').value;
      const category = document.getElementById('tx-category').value;
      const amount = parseFloat(document.getElementById('tx-amount').value);
      const note = document.getElementById('tx-note').value;
      const errBox = document.getElementById('form-error');
      const submitBtn = document.getElementById('submit-btn');

      if (!amount || amount <= 0) {
        errBox.innerText = 'Please enter a valid amount.';
        errBox.classList.remove('hidden');
        return;
      }

      const todayStr = getTodayStr();
      if (date > todayStr) {
        errBox.innerText = 'Future dates are not allowed. Entries can only be recorded up to today.';
        errBox.classList.remove('hidden');
        return;
      }

      errBox.classList.add('hidden');
      submitBtn.disabled = true;
      const prevText = submitBtn.innerText;
      submitBtn.innerText = 'Saving...';

      const isStockPurchased = category && category.trim().toLowerCase() === 'stock purchased';
      const item = isStockPurchased ? (document.getElementById('tx-item')?.value || '') : '';
      const sellerDetails = isStockPurchased ? (document.getElementById('tx-seller')?.value || '') : '';

      const record = { date, type: currentType, category, amount, note, item, sellerDetails };

      try {
        const scriptUrl = localStorage.getItem(STORAGE_KEY);
        if (scriptUrl) {
          const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(record),
            redirect: 'follow'
          });
          await response.json();
        }

        transactions.unshift({ id: 'tx-' + Date.now(), ...record });

        if (window.confetti) {
          window.confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.8 },
            colors: currentType === 'Income' ? ['#10b981', '#38beff', '#ffa133'] : ['#fa1f7c', '#a855f7', '#ff6b00']
          });
        }

        document.getElementById('tx-amount').value = '';
        document.getElementById('tx-note').value = '';

        renderDashboard();
        renderTransactions();
      } catch (err) {
        errBox.innerText = 'Save error: ' + err.message;
        errBox.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = prevText;
      }
    }

    function renderDashboard() {
      const totalInc = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const totalExp = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const net = totalInc - totalExp;
      const grand = totalInc + totalExp;
      const savingsRate = totalInc > 0 ? Math.max(0, (net / totalInc) * 100) : 0;

      const incPct = grand > 0 ? (totalInc / grand) * 100 : 50;
      const expPct = grand > 0 ? (totalExp / grand) * 100 : 50;

      document.getElementById('total-income').innerText = formatINR(totalInc);
      document.getElementById('total-expense').innerText = formatINR(totalExp);
      document.getElementById('net-balance').innerText = formatINR(net);
      document.getElementById('savings-rate').innerText = savingsRate.toFixed(1) + '%';
      document.getElementById('savings-rate-bar').style.width = Math.min(100, savingsRate) + '%';

      const incCount = transactions.filter(t => t.type === 'Income').length;
      const expCount = transactions.filter(t => t.type === 'Expense').length;
      document.getElementById('income-count').innerText = '+' + incCount + ' records';
      document.getElementById('expense-count').innerText = '-' + expCount + ' records';

      document.getElementById('grand-total-label').innerText = formatINR(grand, false);
      document.getElementById('chart-income-bar').style.width = incPct + '%';
      document.getElementById('chart-expense-bar').style.width = expPct + '%';
      document.getElementById('chart-income-bar').innerText = incPct > 12 ? incPct.toFixed(0) + '%' : '';
      document.getElementById('chart-expense-bar').innerText = expPct > 12 ? expPct.toFixed(0) + '%' : '';
      document.getElementById('income-pct').innerText = incPct.toFixed(0) + '%';
      document.getElementById('expense-pct').innerText = expPct.toFixed(0) + '%';
      document.getElementById('chart-income-sum').innerText = formatINR(totalInc, false);
      document.getElementById('chart-expense-sum').innerText = formatINR(totalExp, false);

      renderMonthlyBarGraph();
      renderPieChart();
    }

    function renderMonthlyBarGraph() {
      const container = document.getElementById('monthly-bargraph-container');
      container.innerHTML = '';

      const monthlyData = {};
      transactions.forEach(t => {
        const mKey = t.date ? t.date.substring(0, 7) : '2026-10';
        if (!monthlyData[mKey]) monthlyData[mKey] = { inc: 0, exp: 0 };
        if (t.type === 'Income') monthlyData[mKey].inc += Number(t.amount);
        else monthlyData[mKey].exp += Number(t.amount);
      });

      const months = Object.keys(monthlyData).sort().slice(-5);
      const maxVal = Math.max(...months.flatMap(m => [monthlyData[m].inc, monthlyData[m].exp]), 10000);

      if (months.length === 0) {
        container.innerHTML = '<div class="w-full text-center text-xs text-slate-400 py-6">No monthly data</div>';
        return;
      }

      months.forEach(mKey => {
        const item = monthlyData[mKey];
        const incPct = (item.inc / maxVal) * 100;
        const expPct = (item.exp / maxVal) * 100;

        let label = mKey;
        try {
          const [y, m] = mKey.split('-');
          label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
        } catch(e) {}

        const col = document.createElement('div');
        col.className = 'flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer';
        col.title = label + ' - In: ' + formatINR(item.inc, false) + ' | Out: ' + formatINR(item.exp, false);

        col.innerHTML = \`
          <div class="w-full flex items-end justify-center gap-1 h-full pb-0.5">
            <div class="w-1/2 max-w-[16px] h-full flex items-end">
              <div style="height: \${Math.max(6, incPct)}%" class="w-full bg-emerald-500 rounded-t-xs transition-all duration-300"></div>
            </div>
            <div class="w-1/2 max-w-[16px] h-full flex items-end">
              <div style="height: \${Math.max(6, expPct)}%" class="w-full bg-rose-500 rounded-t-xs transition-all duration-300"></div>
            </div>
          </div>
          <span class="text-[10px] font-semibold text-slate-600 mt-1">\${label}</span>
        \`;
        container.appendChild(col);
      });
    }

    function renderPieChart() {
      const radius = 46;
      const circumference = 2 * Math.PI * radius;
      const slicesGroup = document.getElementById('pie-donut-slices');
      const legendsBox = document.getElementById('pie-legends-container');
      slicesGroup.innerHTML = '';
      legendsBox.innerHTML = '';

      const targetTxs = transactions.filter(t => t.type === pieViewType);
      const catTotals = {};
      targetTxs.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
      });

      const totalAmount = Object.values(catTotals).reduce((a, b) => a + b, 0);
      const sorted = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);

      document.getElementById('pie-center-label').innerText = 'Total ' + pieViewType;
      document.getElementById('pie-center-amount').innerText = formatINR(totalAmount, false);
      document.getElementById('pie-center-count').innerText = sorted.length + ' cats';
      document.getElementById('pie-footer-count').innerText = sorted.length + ' active categories';
      document.getElementById('pie-footer-total').innerText = 'Total: ' + formatINR(totalAmount, false);

      if (sorted.length === 0) {
        legendsBox.innerHTML = '<div class="text-center text-xs text-slate-400 py-4">No records for ' + pieViewType.toLowerCase() + '.</div>';
        return;
      }

      let cumulativePct = 0;
      sorted.forEach(([cat, amt], idx) => {
        const pct = totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
        const color = NT_COLORS[idx % NT_COLORS.length];

        const dashArray = ((pct / 100) * circumference) + ' ' + circumference;
        const dashOffset = -((cumulativePct / 100) * circumference);
        cumulativePct += pct;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '60');
        circle.setAttribute('cy', '60');
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'transparent');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', '15');
        circle.setAttribute('stroke-dasharray', dashArray);
        circle.setAttribute('stroke-dashoffset', dashOffset);
        circle.setAttribute('class', 'transition-all duration-200 cursor-pointer');
        circle.addEventListener('mouseenter', () => {
          document.getElementById('pie-center-label').innerText = cat;
          document.getElementById('pie-center-amount').innerText = formatINR(amt, false);
          document.getElementById('pie-center-count').innerText = pct.toFixed(0) + '%';
        });
        circle.addEventListener('mouseleave', () => {
          document.getElementById('pie-center-label').innerText = 'Total ' + pieViewType;
          document.getElementById('pie-center-amount').innerText = formatINR(totalAmount, false);
          document.getElementById('pie-center-count').innerText = sorted.length + ' cats';
        });
        slicesGroup.appendChild(circle);

        const row = document.createElement('div');
        row.className = 'p-1 px-1.5 rounded-lg border border-transparent hover:bg-slate-50 transition-all text-xs cursor-pointer';
        row.innerHTML = \`
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 truncate pr-1">
              <span class="w-2 h-2 rounded-full shrink-0" style="background-color: \${color}"></span>
              <span class="font-semibold text-slate-800 text-[11px] truncate">\${cat}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <span class="font-bold text-slate-900 font-mono text-[11px]">\${formatINR(amt, false)}</span>
              <span class="text-[10px] text-slate-500 font-mono w-7 text-right">\${pct.toFixed(0)}%</span>
            </div>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1 mt-0.5 overflow-hidden">
            <div class="h-full rounded-full" style="width: \${pct}%; background-color: \${color}"></div>
          </div>
        \`;
        legendsBox.appendChild(row);
      });
    }

    function clearDateFilter() {
      const fromEl = document.getElementById('tx-date-from');
      const toEl = document.getElementById('tx-date-to');
      if (fromEl) fromEl.value = '';
      if (toEl) toEl.value = '';
      renderTransactions();
    }

    function setQuickDateRange(range) {
      const now = new Date();
      const todayStr = getTodayStr();
      const fromEl = document.getElementById('tx-date-from');
      const toEl = document.getElementById('tx-date-to');
      if (!fromEl || !toEl) return;

      if (range === 'all') {
        fromEl.value = '';
        toEl.value = todayStr;
      } else if (range === 'this-month') {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        const endOfMonth = year + '-' + month + '-' + String(lastDay).padStart(2, '0');
        fromEl.value = year + '-' + month + '-01';
        toEl.value = endOfMonth > todayStr ? todayStr : endOfMonth;
      } else if (range === 'last-month') {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = prev.getFullYear();
        const month = String(prev.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, prev.getMonth() + 1, 0).getDate();
        const endOfMonth = year + '-' + month + '-' + String(lastDay).padStart(2, '0');
        fromEl.value = year + '-' + month + '-01';
        toEl.value = endOfMonth > todayStr ? todayStr : endOfMonth;
      } else if (range === 'this-year') {
        const year = now.getFullYear();
        fromEl.value = year + '-01-01';
        toEl.value = todayStr;
      } else if (range === 'last-30') {
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const py = past.getFullYear();
        const pm = String(past.getMonth() + 1).padStart(2, '0');
        const pd = String(past.getDate()).padStart(2, '0');
        fromEl.value = py + '-' + pm + '-' + pd;
        toEl.value = todayStr;
      }
      renderTransactions();
    }

    function renderTransactions() {
      const search = document.getElementById('tx-search').value.toLowerCase();
      const typeFilter = document.getElementById('tx-filter-type').value;
      const dateFrom = document.getElementById('tx-date-from')?.value || '';
      const dateTo = document.getElementById('tx-date-to')?.value || '';
      const todayStr = getTodayStr();

      const clearBtn = document.getElementById('tx-date-clear-btn');
      if (clearBtn) {
        if (dateFrom || dateTo) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }

      const filtered = transactions.filter(t => {
        // Exclude future dates - keep till today / present day
        if (t.date && t.date > todayStr) return false;

        if (typeFilter !== 'All' && t.type !== typeFilter) return false;
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        if (!search) return true;
        return (
          t.category.toLowerCase().includes(search) ||
          (t.note && t.note.toLowerCase().includes(search)) ||
          t.date.includes(search) ||
          t.amount.toString().includes(search)
        );
      });

      document.getElementById('tx-records-count').innerText = filtered.length + ' records (INR ₹)';
      const tbody = document.getElementById('transactions-tbody');
      tbody.innerHTML = '';

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs">No matching transactions for the selected dates/filters.</td></tr>';
        return;
      }

      filtered.forEach(tx => {
        const isInc = tx.type === 'Income';
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors';
        tr.innerHTML = \`
          <td class="py-2.5 px-4 text-xs text-slate-600 font-mono whitespace-nowrap">\${tx.date}</td>
          <td class="py-2.5 px-4 whitespace-nowrap">
            <span class="font-bold text-slate-800 text-xs">\${tx.category}</span>
            <span class="text-[10px] ml-1 px-1.5 py-0.5 rounded font-semibold \${isInc ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">\${tx.type}</span>
          </td>
          <td class="py-2.5 px-4 text-xs text-slate-500 max-w-xs truncate">\${tx.note || '<span class="text-slate-300 italic">None</span>'}</td>
          <td class="py-2.5 px-4 text-right font-mono font-bold text-xs whitespace-nowrap \${isInc ? 'text-emerald-600' : 'text-rose-600'}">
            \${isInc ? '+' : '-'}\${formatINR(tx.amount)}
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function formatINR(val, showDecimals = true) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0
      }).format(val || 0);
    }
  </script>
</body>
</html>
`;
