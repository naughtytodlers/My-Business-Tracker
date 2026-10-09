import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Layers,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Wallet
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR } from '../utils/currency';
import { MechanicalGearToy, PinwheelToy } from './PlayfulToysAmbient';

interface ChartsSectionProps {
  transactions: Transaction[];
}

// Lush modern color palettes with matching gradients for high visual impact
const CATEGORY_PALETTES = [
  { solid: '#F43F5E', gradFrom: '#FB7185', gradTo: '#E11D48', light: '#FFF1F2' }, // Vibrant Rose
  { solid: '#0EA5E9', gradFrom: '#38BDF8', gradTo: '#0284C7', light: '#F0F9FF' }, // Sky Cyan
  { solid: '#F59E0B', gradFrom: '#FBBF24', gradTo: '#D97706', light: '#FFFBEB' }, // Warm Amber
  { solid: '#10B981', gradFrom: '#34D399', gradTo: '#059669', light: '#ECFDF5' }, // Fresh Mint
  { solid: '#8B5CF6', gradFrom: '#A78BFA', gradTo: '#7C3AED', light: '#F5F3FF' }, // Royal Violet
  { solid: '#EC4899', gradFrom: '#F472B6', gradTo: '#DB2777', light: '#FDF2F8' }, // Pink
  { solid: '#06B6D4', gradFrom: '#22D3EE', gradTo: '#0891B2', light: '#ECFEFF' }, // Teal
  { solid: '#E11D48', gradFrom: '#F43F5E', gradTo: '#BE123C', light: '#FFF1F2' }, // Crimson
  { solid: '#6366F1', gradFrom: '#818CF8', gradTo: '#4F46E5', light: '#EEF2FF' }, // Indigo
  { solid: '#64748B', gradFrom: '#94A3B8', gradTo: '#475569', light: '#F8FAFC' }, // Slate
];

// Playful category icon badge helper (kid-friendly & business matching)
const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('transport') || c.includes('car') || c.includes('travel') || c.includes('auto')) return '🚗';
  if (c.includes('house') || c.includes('util') || c.includes('rent') || c.includes('bill') || c.includes('power')) return '🏡';
  if (c.includes('food') || c.includes('dining') || c.includes('snack') || c.includes('tea') || c.includes('lunch')) return '🍼';
  if (c.includes('stock') || c.includes('purchase') || c.includes('item') || c.includes('product') || c.includes('inventory')) return '📦';
  if (c.includes('toy') || c.includes('game') || c.includes('play')) return '🧸';
  if (c.includes('market') || c.includes('ad') || c.includes('promo')) return '🚀';
  if (c.includes('salary') || c.includes('wage') || c.includes('staff')) return '💼';
  if (c.includes('sales') || c.includes('order') || c.includes('revenue')) return '🛍️';
  if (c.includes('cloth') || c.includes('wear') || c.includes('dress')) return '👕';
  return '🧩';
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ transactions }) => {
  // Main view tab: 'pie' (Category Pie Diagram) or 'bar' (Monthly Bar Graph & Flow Ratio)
  const [activeDiagramTab, setActiveDiagramTab] = useState<'pie' | 'bar'>('pie');
  const [categoryViewType, setCategoryViewType] = useState<'Expense' | 'Income'>('Expense');
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const [hoveredBarMonth, setHoveredBarMonth] = useState<string | null>(null);

  // Totals
  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const grandTotal = totalIncome + totalExpense;
  const netBalance = totalIncome - totalExpense;
  const incomePercent = grandTotal > 0 ? (totalIncome / grandTotal) * 100 : 0;
  const expensePercent = grandTotal > 0 ? (totalExpense / grandTotal) * 100 : 0;

  // Category breakdown for Pie Diagram
  const targetTransactions = transactions.filter((t) => t.type === categoryViewType);
  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  targetTransactions.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { amount: 0, count: 0 };
    }
    categoryTotals[cat].amount += Number(t.amount) || 0;
    categoryTotals[cat].count += 1;
  });

  const typeTotal = categoryViewType === 'Expense' ? totalExpense : totalIncome;

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([cat, data], idx) => {
      const percentage = typeTotal > 0 ? (data.amount / typeTotal) * 100 : 0;
      const palette = CATEGORY_PALETTES[idx % CATEGORY_PALETTES.length];
      return {
        category: cat,
        amount: data.amount,
        count: data.count,
        percentage,
        palette,
        index: idx,
      };
    });

  // SVG Donut metrics (viewBox 0 0 160 160, center 80, 80, radius 54)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const donutSlices = sortedCategories.map((item, idx) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = `${-(cumulativePercent / 100) * circumference}`;
    cumulativePercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      index: idx,
    };
  });

  // Generate rolling 6-month timeline up to present month
  const rolling6Months = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
    }
    return months;
  }, []);

  // Compute monthly data
  const monthlyData = useMemo(() => {
    const dataMap: Record<string, { income: number; expense: number; count: number }> = {};
    rolling6Months.forEach((m) => {
      dataMap[m] = { income: 0, expense: 0, count: 0 };
    });

    transactions.forEach((t) => {
      const monthKey = t.date ? t.date.substring(0, 7) : '';
      if (monthKey && dataMap[monthKey]) {
        if (t.type === 'Income') {
          dataMap[monthKey].income += Number(t.amount) || 0;
        } else {
          dataMap[monthKey].expense += Number(t.amount) || 0;
        }
        dataMap[monthKey].count += 1;
      }
    });

    return dataMap;
  }, [transactions, rolling6Months]);

  const maxMonthValue = useMemo(() => {
    const values = rolling6Months.flatMap((m) => [
      monthlyData[m]?.income || 0,
      monthlyData[m]?.expense || 0,
    ]);
    return Math.max(...values, 3000);
  }, [monthlyData, rolling6Months]);

  const formatMonthLabel = (mKey: string) => {
    try {
      const [year, month] = mKey.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'short' });
    } catch {
      return mKey;
    }
  };

  const currentMonthKey = rolling6Months[rolling6Months.length - 1];
  const activeCategory = hoveredSlice !== null ? sortedCategories[hoveredSlice] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between h-full relative">
      {/* Top Header with Diagram Switcher, Badge & Pleasant Mechanical Toy Accent */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-purple-50/25 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Main Tab Pill */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveDiagramTab('pie')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeDiagramTab === 'pie'
                ? 'bg-white text-purple-700 shadow-xs ring-1 ring-purple-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className={`w-3.5 h-3.5 ${activeDiagramTab === 'pie' ? 'text-purple-600' : 'text-slate-500'}`} />
            <span>Pie Diagram</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDiagramTab('bar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeDiagramTab === 'bar'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 ${activeDiagramTab === 'bar' ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>Bar Graph &amp; Flow</span>
          </button>
        </div>

        {/* Total Flow Badge + Playful Mechanical Clockwork Accent */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Subtle spinning pinwheel toy in corner */}
          <div className="hidden sm:block opacity-90 scale-90">
            <PinwheelToy />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-xs font-semibold whitespace-nowrap shrink-0 border border-slate-200 shadow-2xs">
            <Wallet className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-slate-500 font-medium text-[11px]">Total Volume:</span>
            <span className="font-extrabold text-slate-900 font-mono text-xs">
              {formatINR(grandTotal, { showDecimals: false })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Diagram Body */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
        {activeDiagramTab === 'pie' ? (
          /* ========================================================================= */
          /* VIEW A: CATEGORY PIE / DONUT DIAGRAM                                      */
          /* ========================================================================= */
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            {/* Sub-Header with Expenses / Income Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                  <span>Category Distribution</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Interactive donut chart with toy-coded categories
                </p>
              </div>

              {/* Expenses / Income Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold border border-slate-200/70 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryViewType('Expense');
                    setHoveredSlice(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                    categoryViewType === 'Expense'
                      ? 'bg-rose-500 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryViewType('Income');
                    setHoveredSlice(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                    categoryViewType === 'Income'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Top Category Spotlight Chip */}
            {sortedCategories.length > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-[11px] font-semibold text-purple-950">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs">🏆</span>
                  <span className="text-slate-500 font-medium">Top Category:</span>
                  <strong className="text-purple-900 truncate">{sortedCategories[0].category}</strong>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono font-bold text-purple-800">
                  <span>{formatINR(sortedCategories[0].amount, { showDecimals: false })}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-200/70 text-purple-900">
                    {sortedCategories[0].percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            )}

            {/* Circular Pie Chart + Slices Legend Layout */}
            <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-7 py-1 flex-1 justify-center">
              {/* Vibrant SVG Donut with Radial Depth & Smooth Gradients */}
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 shrink-0 flex items-center justify-center">
                {sortedCategories.length === 0 ? (
                  <div className="w-40 h-40 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-3 bg-slate-50/50">
                    <PieChartIcon className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="text-xs font-medium text-slate-400">No {categoryViewType.toLowerCase()} records</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-full h-full -rotate-90 transform filter drop-shadow-sm" viewBox="0 0 160 160">
                      <defs>
                        {donutSlices.map((slice) => (
                          <linearGradient
                            key={`grad-${slice.category}`}
                            id={`donut-grad-${slice.index}`}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor={slice.palette.gradFrom} />
                            <stop offset="100%" stopColor={slice.palette.gradTo} />
                          </linearGradient>
                        ))}
                      </defs>

                      {/* Donut Background Track */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth="19"
                      />

                      {/* Slices with Gradient Fill & Smooth Hover Expansion */}
                      {donutSlices.map((slice) => {
                        const isHovered = hoveredSlice === slice.index;
                        return (
                          <circle
                            key={slice.category}
                            cx="80"
                            cy="80"
                            r={radius}
                            fill="transparent"
                            stroke={`url(#donut-grad-${slice.index})`}
                            strokeWidth={isHovered ? 23 : 19}
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            strokeLinecap="butt"
                            className="transition-all duration-200 cursor-pointer"
                            onMouseEnter={() => setHoveredSlice(slice.index)}
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        );
                      })}
                    </svg>

                    {/* Donut Center Label (Frosted Circle Card with Toy Icon) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3">
                      <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-full bg-white/95 backdrop-blur-xs shadow-md border border-purple-100 flex flex-col items-center justify-center p-2 transition-transform duration-200">
                        <span className="text-base leading-none mb-0.5">
                          {activeCategory ? getCategoryIcon(activeCategory.category) : (categoryViewType === 'Expense' ? '💸' : '💰')}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 truncate max-w-[85px]">
                          {activeCategory ? activeCategory.category : `Total ${categoryViewType}`}
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-900 font-mono tracking-tight truncate max-w-[95px] mt-0.5">
                          {activeCategory
                            ? formatINR(activeCategory.amount, { showDecimals: false })
                            : formatINR(typeTotal, { showDecimals: false })}
                        </span>
                        <span
                          className="text-[10px] font-extrabold mt-0.5 px-1.5 py-0.2 rounded-full shadow-2xs"
                          style={{
                            backgroundColor: activeCategory ? activeCategory.palette.light : '#F3E8FF',
                            color: activeCategory ? activeCategory.palette.solid : '#7E22CE',
                          }}
                        >
                          {activeCategory
                            ? `${activeCategory.percentage.toFixed(1)}%`
                            : `${sortedCategories.length} categories`}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Category Legend List (Card-based with Toy-themed Badges & Micro Progress Bars) */}
              <div className="flex-1 w-full space-y-2 max-h-[210px] sm:max-h-[230px] overflow-y-auto pr-1 scrollbar-thin">
                {sortedCategories.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No {categoryViewType.toLowerCase()} data recorded yet.
                  </div>
                ) : (
                  sortedCategories.map((item, idx) => {
                    const isHovered = hoveredSlice === idx;
                    const toyIcon = getCategoryIcon(item.category);
                    return (
                      <div
                        key={item.category}
                        onMouseEnter={() => setHoveredSlice(idx)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        className={`p-2 px-3 rounded-xl transition-all cursor-pointer border ${
                          isHovered
                            ? 'bg-purple-50/70 border-purple-300 shadow-2xs ring-1 ring-purple-400/20'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 shadow-2xs"
                              style={{ backgroundColor: item.palette.light }}
                            >
                              {toyIcon}
                            </span>
                            <span className="font-bold text-slate-800 text-xs truncate">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                              ({item.count} tx)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-slate-900 font-mono text-xs">
                              {formatINR(item.amount, { showDecimals: false })}
                            </span>
                            <span
                              className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md min-w-[34px] text-center"
                              style={{
                                backgroundColor: item.palette.light,
                                color: item.palette.solid,
                              }}
                            >
                              {item.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Modern Rounded Micro Progress Track */}
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(2, item.percentage)}%`,
                              background: `linear-gradient(90deg, ${item.palette.gradFrom}, ${item.palette.gradTo})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>{sortedCategories.length} active categories contributing</span>
              </span>
              <span className="font-extrabold text-slate-800 font-mono text-xs">
                Total {categoryViewType}: {formatINR(typeTotal, { showDecimals: false })}
              </span>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: MONTHLY BAR GRAPH & FLOW (VISUALLY RICH & WELL-BALANCED)          */
          /* ========================================================================= */
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            {/* 1. Visual Cash Flow Ratio & Net Health Gauge */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50 to-purple-50/30 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Cash Flow Ratio
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      netBalance >= 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {netBalance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {netBalance >= 0 ? 'Surplus' : 'Deficit'} {formatINR(Math.abs(netBalance), { showDecimals: false })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Inflow {incomePercent.toFixed(0)}%
                  </span>
                  <span className="text-rose-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Outflow {expensePercent.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Multi-segment Gradient Track */}
              <div className="w-full h-4 bg-slate-200/80 rounded-full overflow-hidden flex p-0.5 shadow-inner">
                {grandTotal === 0 ? (
                  <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-500 font-semibold">
                    No transactions yet
                  </div>
                ) : (
                  <>
                    <div
                      style={{ width: `${incomePercent}%` }}
                      className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-l-full transition-all duration-500 h-full flex items-center justify-center text-[9px] font-extrabold text-white"
                      title={`Inflow: ${formatINR(totalIncome, { showDecimals: false })} (${incomePercent.toFixed(0)}%)`}
                    >
                      {incomePercent >= 15 && `${incomePercent.toFixed(0)}%`}
                    </div>
                    <div
                      style={{ width: `${expensePercent}%` }}
                      className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-r-full transition-all duration-500 h-full flex items-center justify-center text-[9px] font-extrabold text-white"
                      title={`Outflow: ${formatINR(totalExpense, { showDecimals: false })} (${expensePercent.toFixed(0)}%)`}
                    >
                      {expensePercent >= 15 && `${expensePercent.toFixed(0)}%`}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Rolling 6-Month Inflow vs Outflow Dual Bar Graph with Skyline Plane */}
            <div className="flex-1 flex flex-col justify-end py-1">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span>6-Month Trend Overview</span>
                  <span className="text-[10px] text-slate-400 font-semibold">(Rolling window)</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-2xs" />
                    Inflow (Green)
                  </span>
                  <span className="text-rose-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-gradient-to-t from-rose-600 to-pink-500 shadow-2xs" />
                    Outflow (Pink)
                  </span>
                </div>
              </div>

              {/* Chart Canvas with Subtle Grid Lines */}
              <div className="relative h-44 sm:h-48 w-full border-b border-slate-200 pb-1.5">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-slate-300 w-full" />
                </div>

                {/* Bars columns */}
                <div className="relative h-full flex items-end justify-between gap-2 sm:gap-4 px-1 sm:px-3 z-10">
                  {rolling6Months.map((mKey) => {
                    const data = monthlyData[mKey] || { income: 0, expense: 0, count: 0 };
                    const incomeHeightPct = maxMonthValue > 0 ? (data.income / maxMonthValue) * 100 : 0;
                    const expenseHeightPct = maxMonthValue > 0 ? (data.expense / maxMonthValue) * 100 : 0;
                    const isHovered = hoveredBarMonth === mKey;
                    const isCurrent = mKey === currentMonthKey;
                    const hasActivity = data.income > 0 || data.expense > 0;

                    return (
                      <div
                        key={mKey}
                        className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                        onMouseEnter={() => setHoveredBarMonth(mKey)}
                        onMouseLeave={() => setHoveredBarMonth(null)}
                      >
                        {/* Hover Popup Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-16 z-30 bg-slate-900/95 text-white rounded-xl p-2 px-3 text-[11px] shadow-xl whitespace-nowrap pointer-events-none border border-slate-700 animate-in fade-in zoom-in-95 duration-100">
                            <p className="font-extrabold text-slate-300 text-[10px] mb-0.5">{formatMonthLabel(mKey)} Performance</p>
                            <p className="font-bold text-emerald-400 flex items-center justify-between gap-2 font-mono">
                              <span>Inflow:</span>
                              <span>+{formatINR(data.income, { showDecimals: false })}</span>
                            </p>
                            <p className="font-bold text-rose-400 flex items-center justify-between gap-2 font-mono">
                              <span>Outflow:</span>
                              <span>-{formatINR(data.expense, { showDecimals: false })}</span>
                            </p>
                          </div>
                        )}

                        {/* Dual Bar Column */}
                        <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full pb-0.5">
                          {/* Income Bar */}
                          <div className="w-1/2 max-w-[22px] h-full flex flex-col items-center justify-end">
                            {hasActivity && data.income > 0 && (
                              <span className="text-[9px] font-mono font-bold text-emerald-600 mb-0.5 hidden sm:inline">
                                {data.income >= 1000 ? `${(data.income / 1000).toFixed(1)}k` : data.income}
                              </span>
                            )}
                            <div
                              style={{ height: `${Math.max(data.income > 0 ? 8 : 2, incomeHeightPct)}%` }}
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                data.income > 0
                                  ? isHovered
                                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/40'
                                    : 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-2xs shadow-emerald-500/20'
                                  : 'bg-slate-200/50'
                              }`}
                            />
                          </div>

                          {/* Expense Bar */}
                          <div className="w-1/2 max-w-[22px] h-full flex flex-col items-center justify-end">
                            {hasActivity && data.expense > 0 && (
                              <span className="text-[9px] font-mono font-bold text-rose-600 mb-0.5 hidden sm:inline">
                                {data.expense >= 1000 ? `${(data.expense / 1000).toFixed(1)}k` : data.expense}
                              </span>
                            )}
                            <div
                              style={{ height: `${Math.max(data.expense > 0 ? 8 : 2, expenseHeightPct)}%` }}
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                data.expense > 0
                                  ? isHovered
                                    ? 'bg-gradient-to-t from-rose-600 to-pink-500 shadow-md shadow-rose-500/40'
                                    : 'bg-gradient-to-t from-rose-500 to-pink-500 shadow-2xs shadow-rose-500/20'
                                  : 'bg-slate-200/50'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Month Label with 'Now' indicator */}
                        <div className="mt-1.5 flex flex-col items-center">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-tight ${
                              isCurrent ? 'text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200' : 'text-slate-600'
                            }`}
                          >
                            {formatMonthLabel(mKey)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Executive Financial Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Total Inflow Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                    Total Inflow
                  </span>
                  <p className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 tracking-tight">
                    {formatINR(totalIncome, { showDecimals: false })}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Total Outflow Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white border border-rose-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">
                    Total Outflow
                  </span>
                  <p className="text-base sm:text-lg font-black text-rose-700 font-mono mt-0.5 tracking-tight">
                    {formatINR(totalExpense, { showDecimals: false })}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
