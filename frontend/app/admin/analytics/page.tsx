"use client";

import { useEffect, useState, useCallback } from "react";
import { MonthlyAnalytics, AnalyticsSummary, fetchAnalytics } from "@/lib/notifications";
import styles from "./analytics.module.css";

/* ── Mock data -------------------------------------------------------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MOCK_DATA: MonthlyAnalytics[] = MONTHS.map((m) => ({
  month: m,
  revenue: Math.round(4000 + Math.random() * 8000),
  cost: Math.round(2000 + Math.random() * 5000),
  profit: 0,
})).map((d) => ({ ...d, profit: d.revenue - d.cost }));

const MOCK_SUMMARY: AnalyticsSummary = {
  totalRevenue: MOCK_DATA.reduce((s, d) => s + d.revenue, 0),
  totalCost: MOCK_DATA.reduce((s, d) => s + d.cost, 0),
  totalProfit: MOCK_DATA.reduce((s, d) => s + d.profit, 0),
  monthly: MOCK_DATA,
};

function fmt(n: number): string {
  return "$" + n.toLocaleString();
}

export default function AdminAnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAnalytics(year, "admin");
      setSummary(data);
    } catch {
      setSummary(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  if (loading || !summary) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const maxVal = Math.max(...summary.monthly.map((d) => Math.max(d.revenue, d.cost, Math.abs(d.profit))), 1);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Monthly revenue, cost &amp; profit overview</p>
        </div>
        <select
          className={styles.yearSelect}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Revenue</div>
          <div className={`${styles.summaryValue} ${styles.green}`}>{fmt(summary.totalRevenue)}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Cost</div>
          <div className={`${styles.summaryValue} ${styles.red}`}>{fmt(summary.totalCost)}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Net Profit</div>
          <div className={`${styles.summaryValue} ${summary.totalProfit >= 0 ? styles.green : styles.red}`}>
            {fmt(summary.totalProfit)}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Monthly Breakdown</div>
        <div className={styles.chart}>
          {summary.monthly.map((d) => (
            <div key={d.month} className={styles.barGroup}>
              <div className={styles.bars}>
                <div
                  className={`${styles.bar} ${styles.barRevenue}`}
                  style={{ height: `${(d.revenue / maxVal) * 180}px` }}
                  title={`Revenue: ${fmt(d.revenue)}`}
                />
                <div
                  className={`${styles.bar} ${styles.barCost}`}
                  style={{ height: `${(d.cost / maxVal) * 180}px` }}
                  title={`Cost: ${fmt(d.cost)}`}
                />
                <div
                  className={`${styles.bar} ${styles.barProfit}`}
                  style={{ height: `${(Math.abs(d.profit) / maxVal) * 180}px` }}
                  title={`Profit: ${fmt(d.profit)}`}
                />
              </div>
              <span className={styles.barLabel}>{d.month}</span>
            </div>
          ))}
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#4ade80" }} /> Revenue
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#f87171" }} /> Cost
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#60a5fa" }} /> Profit
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableTitle}>Monthly Details</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {summary.monthly.map((d) => (
              <tr key={d.month}>
                <td>{d.month}</td>
                <td>{fmt(d.revenue)}</td>
                <td>{fmt(d.cost)}</td>
                <td className={d.profit >= 0 ? styles.positive : styles.negative}>
                  {d.profit >= 0 ? "+" : ""}{fmt(d.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
