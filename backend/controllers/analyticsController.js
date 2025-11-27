import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

/* ===== Helpers ===== */
function monthRange(monthStr) {
  if (!monthStr) return null;
  const [y, m] = monthStr.split("-").map(Number);
  if (!y || !m) return null;
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1); // exclusive
  return { start, end };
}
function rangeQuery({ from, to, month }) {
  const query = {};
  if (month) {
    const r = monthRange(month);
    if (r) query.createdAt = { $gte: r.start, $lt: r.end };
    return query;
  }
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) {
      const t = new Date(to);
      if (to.length <= 10) t.setHours(23, 59, 59, 999);
      query.createdAt.$lt = t;
    }
  }
  return query;
}
function clampRange(aStart, aEnd, bStart, bEnd) {
  const s = new Date(Math.max(aStart.getTime(), bStart.getTime()));
  const e = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
  return s <= e ? { start: s, end: e } : null;
}
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/* ===== 1) New customers ===== */
export async function newCustomers(req, res) {
  try {
    const { from, to, month } = req.query;

    let windowStart, windowEnd;
    if (month) {
      const r = monthRange(month);
      if (r) { windowStart = r.start; windowEnd = new Date(r.end.getTime() - 1); }
    } else if (from || to) {
      windowStart = from ? new Date(from) : new Date(0);
      windowEnd = to ? new Date(to) : new Date();
      if (!to || to.length <= 10) windowEnd.setHours(23, 59, 59, 999);
    } else {
      windowEnd = new Date();
      windowStart = new Date(windowEnd);
      windowStart.setDate(windowEnd.getDate() - 27);
      windowStart = startOfDay(windowStart);
    }

    const matchSeries = { createdAt: { $gte: windowStart, $lte: windowEnd } };
    const series = await userModel.aggregate([
      { $match: matchSeries },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: { $dateFromParts: { year: "$_id.y", month: "$_id.m", day: "$_id.d" } },
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = new Date(todayStart); todayEnd.setHours(23, 59, 59, 999);
    const last7Start  = startOfDay(new Date(now)); last7Start.setDate(now.getDate() - 6);
    const last14Start = startOfDay(new Date(now)); last14Start.setDate(now.getDate() - 13);
    const last21Start = startOfDay(new Date(now)); last21Start.setDate(now.getDate() - 20);
    const last28Start = startOfDay(new Date(now)); last28Start.setDate(now.getDate() - 27);

    const fetchCount = async (s, e) =>
      userModel.countDocuments({ createdAt: { $gte: s, $lte: e } });

    const clampAndCount = async (s, e) => {
      const inter = clampRange(s, e, windowStart, windowEnd);
      if (!inter) return 0;
      return fetchCount(inter.start, inter.end);
    };

    const summary = {
      today: await clampAndCount(todayStart, todayEnd),
      d7: await clampAndCount(last7Start, now),
      d14: await clampAndCount(last14Start, now),
      d21: await clampAndCount(last21Start, now),
      d28: await clampAndCount(last28Start, now),
    };

    res.json({ success: true, data: { series, summary } });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}

/* ===== 2) Repeat rate ===== */
export async function repeatRate(req, res) {
  try {
    const { from, to, month } = req.query;
    const match = rangeQuery({ from, to, month });
    const agg = await orderModel.aggregate([
      Object.keys(match).length ? { $match: match } : { $match: {} },
      { $group: { _id: "$userId", c: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          repeatUsers: { $sum: { $cond: [{ $gt: ["$c", 1] }, 1, 0] } },
        },
      },
    ]);
    const { totalUsers = 0, repeatUsers = 0 } = agg[0] || {};
    const repeatRate = totalUsers ? (repeatUsers / totalUsers) * 100 : 0;
    res.json({ success: true, data: { totalUsers, repeatUsers, repeatRate } });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}

/* ===== 3) Top/Least sellers ===== */
export async function dishRank(req, res) {
  try {
    const { from, to, month } = req.query;
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const order = String(req.query.order || "desc") === "asc" ? 1 : -1;
    const match = rangeQuery({ from, to, month });

    const rows = await orderModel.aggregate([
      Object.keys(match).length ? { $match: match } : { $match: {} },
      { $unwind: "$items" },
      {
        $group: {
          _id: { id: "$items.itemId", name: "$items.name" },
          totalQty: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalQty: order, revenue: order } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          itemId: "$_id.id",
          name: "$_id.name",
          totalQty: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}

/* ===== 4) Revenue by ISO week ===== */
export async function revenueByWeek(req, res) {
  try {
    const monthStr = String(req.query.month || "");
    const r = monthRange(monthStr);
    const now = new Date();
    const start = r?.start || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = r?.end || new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const rows = await orderModel.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { week: { $isoWeek: "$createdAt" } },
          totalRevenue: { $sum: "$amount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.week": 1 } },
    ]);

    const label = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
    res.json({ success: true, data: { month: label, rows } });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}

/* ===== 5) Popular pairs ===== */
export async function popularCombos(req, res) {
  try {
    const { from, to, month } = req.query;
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const match = rangeQuery({ from, to, month });

    const pairs = await orderModel.aggregate([
      Object.keys(match).length ? { $match: match } : { $match: {} },
      {
        $project: {
          items: {
            $map: { input: "$items", as: "it", in: { $toString: "$$it.itemId" } },
          },
        },
      },
      { $addFields: { items: { $setUnion: ["$items", []] } } },
      { $match: { "items.1": { $exists: true } } },
      { $set: { itemsCopy: "$items" } },
      { $unwind: { path: "$items", includeArrayIndex: "i" } },
      { $unwind: { path: "$itemsCopy", includeArrayIndex: "j" } },
      { $match: { $expr: { $lt: ["$i", "$j"] } } },
      { $group: { _id: { a: "$items", b: "$itemsCopy" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    res.json({ success: true, data: pairs });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}

/* ===== 6) Total revenue over range ===== */
export async function revenueTotal(req, res) {
  try {
    const { from, to, month } = req.query;
    const match = rangeQuery({ from, to, month });
    const agg = await orderModel.aggregate([
      Object.keys(match).length ? { $match: match } : { $match: {} },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const total = agg[0]?.total || 0;
    res.json({ success: true, data: { total } });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}

/* ===== 7) Dish name map ===== */
export async function dishNameMap(req, res) {
  try {
    const { from, to, month } = req.query;
    const match = rangeQuery({ from, to, month });
    const rows = await orderModel.aggregate([
      Object.keys(match).length ? { $match: match } : { $match: {} },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $toString: "$items.itemId" },
          name: { $first: "$items.name" },
        },
      },
      { $project: { _id: 0, id: "$_id", name: 1 } },
    ]);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}

/* ===== 8) Contacts export (PER-ORDER rows, full info) =====
   Returns: createdAt, first/last name, phoneNumber, tableNumber, items[], amount
*/
export async function contactsByRange(req, res) {
  try {
    const { from, to, month } = req.query;
    const match = rangeQuery({ from, to, month });

    const rows = await orderModel.aggregate([
      Object.keys(match).length ? { $match: match } : { $match: {} },
      { $sort: { createdAt: -1 } },
      // Convert string userId to ObjectId when possible
      {
        $addFields: {
          userObjId: {
            $convert: { input: "$userId", to: "objectId", onError: null, onNull: null }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userObjId",
          foreignField: "_id",
          as: "u"
        }
      },
      { $set: { phoneNumber: { $first: "$u.phoneNumber" } } },
      {
        $project: {
          _id: 0,
          createdAt: 1,
          firstName: { $ifNull: ["$firstName", ""] },
          lastName:  { $ifNull: ["$lastName", ""] },
          phoneNumber: { $ifNull: ["$phoneNumber", ""] },
          tableNumber: 1,
          items: 1,
          amount: 1
        }
      }
    ]);

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Error" });
  }
}
