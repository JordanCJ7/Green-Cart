"use client";

import { useEffect, useState, useCallback } from "react";
import { MonthlyAnalytics, AnalyticsSummary, fetchAnalytics } from "@/lib/notifications";
import styles from "./analytics.module.css";

/* ── Mock data -------------------------------------------------------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MOCK_DATA: MonthlyAnalytics[] = MONTHS.map((m) => {
  const spending = Math.round(100 + Math.random() * 400);
  const savings = Math.round(spending * (0.05 + Math.random() * 0.15));
  return { month: m, revenue: spending, cost: spending - savings, profit: savings };
});

const MOCK_SUMMARY: AnalyticsSummary = {
  totalRevenue: MOCK_DATA.reduce((s, d) => s + d.revenue, 0),
  totalCost: MOCK_DATA.reduce((s, d) => s + d.cost, 0),
  totalProfit: MOCK_DATA.reduce((s, d) => s + d.profit, 0),
  monthly: MOCK_DATA,
};

function fmt(n: number): string {
  return "$" + n.toLocaleString();
}

export default function CustomerAnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAnalytics(year, "customer");
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

  const maxVal = Math.max(...summary.monthly.map((d) => d.revenue), 1);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Spending</h1>
          <p className={styles.subtitle}>Track your monthly spending &amp; savings</p>
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
          <div className={styles.summaryLabel}>Total Spent</div>
          <div className={`${styles.summaryValue} ${styles.amber}`}>{fmt(summary.totalRevenue)}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Net Cost</div>
          <div className={`${styles.summaryValue} ${styles.blue}`}>{fmt(summary.totalCost)}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Saved</div>
          <div className={`${styles.summaryValue} ${styles.green}`}>{fmt(summary.totalProfit)}</div>
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
                  className={`${styles.bar} ${styles.barSpending}`}
                  style={{ height: `${(d.revenue / maxVal) * 180}px` }}
                  title={`Spent: ${fmt(d.revenue)}`}
                />
                <div
                  className={`${styles.bar} ${styles.barSavings}`}
                  style={{ height: `${(d.profit / maxVal) * 180}px` }}
                  title={`Saved: ${fmt(d.profit)}`}
                />
              </div>
              <span className={styles.barLabel}>{d.month}</span>
            </div>
          ))}
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#16a34a" }} /> Spending
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#2563eb" }} /> Savings
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
              <th>Spent</th>
              <th>Net Cost</th>
              <th>Saved</th>
            </tr>
          </thead>
          <tbody>
            {summary.monthly.map((d) => (
              <tr key={d.month}>
                <td>{d.month}</td>
                <td>{fmt(d.revenue)}</td>
                <td>{fmt(d.cost)}</td>
                <td style={{ color: "#16a34a", fontWeight: 600 }}>{fmt(d.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
