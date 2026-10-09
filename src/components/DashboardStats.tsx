import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  PiggyBank,
  IndianRupee
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR } from '../utils/currency';

interface DashboardStatsProps {
  transactions: Transaction[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ transactions }) => {
  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const incomeCount = transactions.filter((t) => t.type === 'Income').length;
  const expenseCount = transactions.filter((t) => t.type === 'Expense').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
      {/* Total Income */}
      <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {formatINR(totalIncome)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="font-bold text-emerald-600">+{incomeCount}</span>
          <span>inflow {incomeCount === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-90" />
      </div>

      {/* Total Expenses */}
      <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-rose-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {formatINR(totalExpense)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="font-bold text-rose-600">-{expenseCount}</span>
          <span>outflow {expenseCount === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500 opacity-90" />
      </div>

      {/* Net Balance */}
      <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-indigo-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Net Savings Balance
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                netBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p
              className={`text-xl sm:text-2xl font-extrabold tracking-tight font-mono ${
                netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatINR(netBalance)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span
            className={`font-semibold ${
              netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {netBalance >= 0 ? 'Surplus' : 'Deficit'}
          </span>
          <span>across all accounts</span>
        </div>
        <div
          className={`absolute bottom-0 inset-x-0 h-1 ${
            netBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
      </div>

      {/* Savings Rate */}
      <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs relative overflow-hidden group hover:border-indigo-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Savings Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {savingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
            />
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-90" />
      </div>
    </div>
  );
};
