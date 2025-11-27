import React, { useEffect, useMemo, useState } from "react";
import "./Analytics.css";
import axios from "axios";
import { url } from "../../assets/assets";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie
} from "recharts";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

/* ---------- helpers ---------- */
const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => new Date().toISOString().slice(0, 10);

/** Indian Rupee display */
const fmt = (n) => {
  if (n == null || isNaN(n)) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN");
};
/** Prevent Excel from auto-sci-notating phones; invisible LRM keeps it text. */
const excelText = (s) => `\u200E${s ?? ""}`;

const years = (() => {
  const current = new Date().getFullYear();
  const start = 2020;
  const end = current + 2;
  const arr = [];
  for (let y = end; y >= start; y--) arr.push(String(y));
  return arr;
})();

const qs = (obj) => {
  const p = [];
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  });
  return p.length ? `?${p.join("&")}` : "";
};

/* ---------- reusable UI ---------- */
function MonthYear({ label, valueMonth, valueYear, onChange }) {
  return (
    <div className="control">
      <label>{label}</label>
      <div className="control-row">
        <select value={valueMonth} onChange={(e) => onChange({ month: e.target.value })}>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={valueYear} onChange={(e) => onChange({ year: e.target.value })}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

function DateRange({ from, to, onChange }) {
  const toDateObj = (iso) => (iso ? parseISO(iso) : null);
  const toISO = (d) => (d ? format(d, "yyyy-MM-dd") : "");

  const [start, setStart] = useState(toDateObj(from));
  const [end, setEnd] = useState(toDateObj(to));

  useEffect(() => setStart(toDateObj(from)), [from]);
  useEffect(() => setEnd(toDateObj(to)), [to]);

  const onFromChange = (d) => {
    if (!d) { setStart(null); onChange({ from: "" }); return; }
    if (end && d > end) {
      setStart(end); setEnd(d);
      onChange({ from: toISO(end), to: toISO(d) });
    } else { setStart(d); onChange({ from: toISO(d) }); }
  };

  const onToChange = (d) => {
    if (!d) { setEnd(null); onChange({ to: "" }); return; }
    if (start && d < start) {
      setEnd(start); setStart(d);
      onChange({ from: toISO(d), to: toISO(start) });
    } else { setEnd(d); onChange({ to: toISO(d) }); }
  };

  return (
    <div className="control">
      <label>Date range</label>
      <div className="control-row daterow">
        <DatePicker selected={start} onChange={onFromChange} dateFormat="dd-MM-yyyy"
          placeholderText="From" showMonthDropdown showYearDropdown dropdownMode="select"
          calendarStartDay={1} showPopperArrow={false} className="date-input" />
        <span>to</span>
        <DatePicker selected={end} onChange={onToChange} dateFormat="dd-MM-yyyy"
          placeholderText="To" showMonthDropdown showYearDropdown dropdownMode="select"
          calendarStartDay={1} showPopperArrow={false} className="date-input" />
      </div>
    </div>
  );
}

/* ---------- data hook ---------- */
const useFetch = (fn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    (async () => {
      try { setLoading(true); const res = await fn(); if (on) setData(res); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading };
};

export default function Analytics() {
  /* -------- KPI range -------- */
  const [kFrom, setKFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 28); return d.toISOString().slice(0, 10);
  });
  const [kTo, setKTo] = useState(todayISO());
  const kpiNew = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/new-customers${qs({ from: kFrom, to: kTo })}`);
    return r.data?.data || { series: [], summary: {} };
  }, [kFrom, kTo]);
  const kpiRepeat = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/repeat-rate${qs({ from: kFrom, to: kTo })}`);
    return r.data?.data || { totalUsers: 0, repeatUsers: 0, repeatRate: 0 };
  }, [kFrom, kTo]);
  const kpiRevenue = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/revenue-total${qs({ from: kFrom, to: kTo })}`);
    return r.data?.data || { total: 0 };
  }, [kFrom, kTo]);

  /* -------- New Customers -------- */
  const now = new Date();
  const [ncMonth, setNcMonth] = useState(pad(now.getMonth() + 1));
  const [ncYear, setNcYear] = useState(String(now.getFullYear()));
  const nc = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/new-customers${qs({ month: `${ncYear}-${ncMonth}` })}`);
    return r.data?.data || { series: [], summary: {} };
  }, [ncMonth, ncYear]);

  /* -------- Revenue by week -------- */
  const [revMonth, setRevMonth] = useState(pad(now.getMonth() + 1));
  const [revYear, setRevYear] = useState(String(now.getFullYear()));
  const rev = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/revenue-month${qs({ month: `${revYear}-${revMonth}` })}`);
    return r.data?.data || { rows: [] };
  }, [revMonth, revYear]);

  /* -------- Top/Least sellers -------- */
  const [topMonth, setTopMonth] = useState(pad(now.getMonth() + 1));
  const [topYear, setTopYear] = useState(String(now.getFullYear()));
  const [leastMonth, setLeastMonth] = useState(pad(now.getMonth() + 1));
  const [leastYear, setLeastYear] = useState(String(now.getFullYear()));
  const top = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/top-dishes${qs({ month: `${topYear}-${topMonth}`, limit: 10 })}`);
    return Array.isArray(r.data?.data) ? r.data.data : [];
  }, [topMonth, topYear]);
  const least = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/least-dishes${qs({ month: `${leastYear}-${leastMonth}`, limit: 10 })}`);
    return Array.isArray(r.data?.data) ? r.data.data : [];
  }, [leastMonth, leastYear]);

  /* -------- Popular combos -------- */
  const [comboMonth, setComboMonth] = useState(pad(now.getMonth() + 1));
  const [comboYear, setComboYear] = useState(String(now.getFullYear()));
  const combos = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/popular-combos${qs({ month: `${comboYear}-${comboMonth}`, limit: 10 })}`);
    return Array.isArray(r.data?.data) ? r.data.data : [];
  }, [comboMonth, comboYear]);
  const nameMap = useFetch(async () => {
    const r = await axios.get(`${url}/api/analytics/dish-name-map${qs({ month: `${comboYear}-${comboMonth}` })}`);
    const map = {}; (r.data?.data || []).forEach(x => { map[x.id] = x.name; });
    return map;
  }, [comboMonth, comboYear]);

  /* -------- Export contacts (PER-ORDER) -------- */
  const [ecFrom, setEcFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 28); return d.toISOString().slice(0, 10);
  });
  const [ecTo, setEcTo] = useState(todayISO());
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  async function fetchOrdersForExport() {
    setOrdersLoading(true);
    try {
      const r = await axios.get(`${url}/api/analytics/contacts${qs({ from: ecFrom, to: ecTo })}`);
      setOrders(Array.isArray(r.data?.data) ? r.data.data : []);
    } finally {
      setOrdersLoading(false);
    }
  }
  useEffect(() => { fetchOrdersForExport(); }, [ecFrom, ecTo]);

  function downloadContactsCsv() {
    const header = [
      "S.No", "Date", "Time", "FirstName", "LastName", "PhoneNumber", "TableNumber", "FoodItems", "Quantities", "TotalAmount"
    ];
    const rows = orders.map((o, i) => {
      const dt = new Date(o.createdAt || Date.now());
      const date = dt.toISOString().slice(0, 10);
      const time = dt.toTimeString().slice(0, 5);
      const items = Array.isArray(o.items) ? o.items : [];
      const foodNames = items.map(it => it?.name ?? "").join("|");
      const quantities = items.map(it => Number(it?.quantity ?? 0)).join("|");
      const total = Number(o.amount || 0);
      return [
        i + 1,
        date,
        time,
        o.firstName || "",
        o.lastName || "",
        excelText(o.phoneNumber || ""), // Excel-safe, still parseable
        o.tableNumber ?? "",
        foodNames,
        quantities,
        total
      ];
    });

    const csv =
      [header.join(",")]
        .concat(rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `customer_data_${ecFrom}_${ecTo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* -------- transforms -------- */
  const kpis = useMemo(() => {
    const s = kpiNew.data?.summary || {};
    return [
      { label: "New Today", value: s.today || 0 },
      { label: "Last 7 Days", value: s.d7 || 0 },
      { label: "Repeat Rate %", value: Math.round((kpiRepeat.data?.repeatRate || 0) * 10) / 10 },
      { label: "Rev (This Period)", value: kpiRevenue.data?.total || 0 },
    ];
  }, [kpiNew.data, kpiRepeat.data, kpiRevenue.data]);

  /* ---- NEW: build a full month series for New Customers ---- */
  const { seriesFull, dayTicks } = useMemo(() => {
    const yr = Number(ncYear);
    const mo = Number(ncMonth);
    const daysInMonth = new Date(yr, mo, 0).getDate();

    // Map API series -> { 'YYYY-MM-DD': count }
    const raw = Array.isArray(nc.data?.series) ? nc.data.series : [];
    const byDate = new Map(raw.map(d => [String(d.date).slice(0, 10), Number(d.count) || 0]));

    // Full month with zeros for missing days
    const full = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const iso = `${ncYear}-${ncMonth}-${pad(day)}`;
      return { day: String(day), dateISO: iso, count: byDate.get(iso) ?? 0 };
    });

    // Choose sparse ticks so labels don't clutter
    const step = Math.max(1, Math.ceil(daysInMonth / 10)); // ~10 ticks
    const ticks = Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
      .filter((_, i) => i % step === 0 || i === 0 || i === daysInMonth - 1);

    return { seriesFull: full, dayTicks: ticks };
  }, [nc.data, ncMonth, ncYear]);

  const revData = (rev.data?.rows || []).map((r) => ({
    week: `W${r._id.week}`,
    revenue: Number(r.totalRevenue || 0),
  }));
  const topData = (top.data || []).map(r => ({ name: r.name || r.itemId, qty: r.totalQty }));
  const leastData = (least.data || []).map(r => ({ name: r.name || r.itemId, qty: r.totalQty }));

  const colorScale = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#22c55e", "#e11d48", "#0ea5e9"];
  const pieData = (combos.data || []).map((p, i) => {
    const nm = nameMap.data || {};
    const a = nm[p._id.a] || p._id.a;
    const b = nm[p._id.b] || p._id.b;
    return { name: `${a} + ${b}`, value: p.count, fill: colorScale[i % colorScale.length] };
  });

  return (
    <div className="analytics add">
      <div className="page-head">
        <h3>Analytics</h3>
        <div className="filters">
          <DateRange
            from={kFrom}
            to={kTo}
            onChange={({ from, to }) => {
              if (from !== undefined) setKFrom(from);
              if (to !== undefined) setKTo(to);
            }}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        {kpis.map((k) => (
          <div className="kpi kpi-glow" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">
              {k.label.startsWith("Rev") ? fmt(k.value) : k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Export customer contacts */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Export customer Details</div>
          <div className="export-controls">
            <DateRange
              from={ecFrom}
              to={ecTo}
              onChange={({ from, to }) => {
                if (from !== undefined) setEcFrom(from);
                if (to !== undefined) setEcTo(to);
              }}
            />
            <button
              className="btn"
              onClick={downloadContactsCsv}
              disabled={ordersLoading || orders.length === 0}
              title={ordersLoading ? "Loading..." : `Export ${orders.length} rows`}
            >
              {ordersLoading ? "Preparing..." : `Export CSV (${orders.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* New customers */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">New customers</div>
          <MonthYear
            label="Jump to month"
            valueMonth={ncMonth}
            valueYear={ncYear}
            onChange={({ month, year }) => {
              if (month) setNcMonth(month);
              if (year) setNcYear(year);
            }}
          />
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seriesFull}>
              <defs>
                <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="tomato" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="tomato" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              {/* show day numbers as ticks; sparse to avoid clutter */}
              <XAxis
                dataKey="day"
                ticks={dayTicks}
                tick={{ fontSize: 11 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(lab) => {
                  const iso = `${ncYear}-${ncMonth}-${pad(lab)}`;
                  return format(parseISO(iso), "dd/MM/yyyy");
                }}
                formatter={(v) => [`${v}`, "count"]}
              />
              <Line type="monotone" dataKey="count" stroke="tomato" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by week */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Revenue by week ({revYear}-{revMonth}) — ₹</div>
          <MonthYear
            label="Select month"
            valueMonth={revMonth}
            valueYear={revYear}
            onChange={({ month, year }) => {
              if (month) setRevMonth(month);
              if (year) setRevYear(year);
            }}
          />
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revData} barSize={28}>
              <defs>
                <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7750" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ff7750" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="revenue" fill="url(#gradBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top / Least dishes */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Top 10 dishes (qty)</div>
            <MonthYear
              label="Month"
              valueMonth={topMonth}
              valueYear={topYear}
              onChange={({ month, year }) => {
                if (month) setTopMonth(month);
                if (year) setTopYear(year);
              }}
            />
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#1f7ae0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Least 10 dishes (qty)</div>
            <MonthYear
              label="Month"
              valueMonth={leastMonth}
              valueYear={leastYear}
              onChange={({ month, year }) => {
                if (month) setLeastMonth(month);
                if (year) setLeastYear(year);
              }}
            />
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leastData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Popular combos */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Popular item pairs</div>
          <MonthYear
            label="Month"
            valueMonth={comboMonth}
            valueYear={comboYear}
            onChange={({ month, year }) => {
              if (month) setComboMonth(month);
              if (year) setComboYear(year);
            }}
          />
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={130} stroke="#fff" strokeWidth={1} isAnimationActive />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="legend-list">
          {pieData.map((d) => (
            <span className="legend-item" key={d.name}>
              <i style={{ background: d.fill }} />
              {d.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}