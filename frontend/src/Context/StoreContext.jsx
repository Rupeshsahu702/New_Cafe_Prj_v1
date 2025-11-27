// frontend/src/Context/StoreContext.jsx
import { createContext, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  // Prefer env; fallback to same host the browser is using
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    `http://${window.location.hostname}:4000`;
  const url = API_BASE;

  const [food_list, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false); // <--- ADDED

  const currency = "₹";
  const deliveryCharge = 0;

  // ---------- Guest cart persistence ----------
  const LS_KEY_CART = "guest_cart";
  const LS_KEY_ADDONS = "guest_addons";

  const readGuestCart = () => {
    try {
      const raw = localStorage.getItem(LS_KEY_CART);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const writeGuestCart = (data) => {
    try {
      localStorage.setItem(LS_KEY_CART, JSON.stringify(data || {}));
    } catch {
      /* ignore */
    }
  };

  // ---------- CHEESE ADD-ONS ----------
  // Counts per category: Pasta and Moburg
  const [cheeseAddOns, setCheeseAddOns] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_ADDONS);
      return raw ? JSON.parse(raw) : { pasta: 0, moburg: 0 };
    } catch {
      return { pasta: 0, moburg: 0 };
    }
  });

  const persistCheese = (obj) => {
    try {
      localStorage.setItem(LS_KEY_ADDONS, JSON.stringify(obj));
    } catch {
      /* ignore */
    }
  };

  const updateCheeseAddOns = (next) => {
    setCheeseAddOns((prev) => {
      const merged = { ...prev, ...next };
      persistCheese(merged);
      return merged;
    });
  };

  // Rs 20 per extra cheese
  const getAddOnTotal = () =>
    20 * (Number(cheeseAddOns.pasta || 0) + Number(cheeseAddOns.moburg || 0));

  // Grand total with add-ons and delivery
  const getGrandTotal = () => {
    const base = getTotalCartAmount();
    if (base === 0) return 0;
    return base + deliveryCharge + getAddOnTotal();
  };

  // Create order snapshot INCLUDING add-ons (so admin/bill show them)
  const buildClientCartSnapshot = () => {
    const items = [];

    // regular items from cart
    Object.entries(cartItems || {}).forEach(([id, qty]) => {
      const quantity = Number(qty) || 0;
      if (quantity <= 0) return;
      const prod = (food_list || []).find((p) => String(p._id) === String(id));
      if (!prod) return;
      items.push({
        itemId: String(prod._id),
        name: String(prod.name || ""),
        price: Number(prod.price || 0),
        quantity,
      });
    });

    // add-on lines (synthetic ids)
    if (Number(cheeseAddOns.pasta) > 0) {
      items.push({
        itemId: "addon:cheese:pasta",
        name: "Extra Cheese (Pasta)",
        price: 20,
        quantity: Number(cheeseAddOns.pasta),
      });
    }
    if (Number(cheeseAddOns.moburg) > 0) {
      items.push({
        itemId: "addon:cheese:moburg",
        name: "Extra Cheese (Moburg)",
        price: 20,
        quantity: Number(cheeseAddOns.moburg),
      });
    }

    return items;
  };

  // ---------- keep localStorage in sync when logged out ----------
  useEffect(() => {
    if (!token) writeGuestCart(cartItems);
  }, [cartItems, token]);

  const addToCart = async (itemId) => {
    if (!itemId) return;
    setCartItems((prev) => {
      const next = { ...prev, [itemId]: (prev[itemId] || 0) + 1 };
      return next;
    });
    if (token) {
      await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
    }
  };

  const removeFromCart = async (itemId) => {
    if (!itemId) return;
    setCartItems((prev) => {
      const qty = (prev[itemId] || 0) - 1;
      const next = { ...prev };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = qty;
      return next;
    });
    if (token) {
      await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      try {
        if (cartItems[item] > 0) {
          const itemInfo = food_list.find(
            (product) => String(product._id) === String(item)
          );
          if (itemInfo) totalAmount += Number(itemInfo.price || 0) * cartItems[item];
        }
      } catch {
        // ignore lookup errors
      }
    }
    return totalAmount;
  };

  // Ensure every item has a stable string _id
  const normalizeIds = (list) =>
    (list || []).map((it) => {
      const id = it?._id ?? it?.id ?? it?.itemId;
      return { ...it, _id: id != null ? String(id) : undefined };
    });

  // Fetch items from backend
  const fetchFoodList = async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      const dbItems = Array.isArray(response?.data?.data) ? response.data.data : [];
      setFoodList(normalizeIds(dbItems));
    } catch (err) {
      console.error("Error fetching food list:", err);
      setFoodList([]); // safe fallback if API fails
    }
  };

  /**
   * Load server cart, merge any guest cart, persist merged on server,
   * then set state to the merged result.
   * Accepts either {token: <jwt>} or a bare string token.
   */
  const loadCartData = async (tokenOrObj) => {
    const hdrs =
      typeof tokenOrObj === "string" ? { token: tokenOrObj } : tokenOrObj;

    const res = await axios.post(url + "/api/cart/get", {}, { headers: hdrs });
    const serverCart = res?.data?.cartData || {};

    const guestCart = readGuestCart();
    let merged = serverCart;
    const guestHasItems = Object.values(guestCart).some((q) => Number(q) > 0);

    if (guestHasItems) {
      const mergeRes = await axios.post(
        url + "/api/cart/merge",
        { cart: guestCart },
        { headers: hdrs }
      );
      merged = mergeRes?.data?.cartData || serverCart;
      writeGuestCart({});
    }

    setCartItems(merged);
    writeGuestCart(merged);
    return merged;
  };

  // -----------------------------
  // Clamp cheese counts to cart
  // -----------------------------
  const getCategory = (item) => {
    const raw =
      item?.category ||
      item?.categoryName ||
      item?.menu_category ||
      item?.menu_name ||
      "";
    return String(raw).toLowerCase();
  };

  const computeCheeseCaps = (cart, items) => {
    let pastaMax = 0;
    let moburgMax = 0;

    const map = new Map((items || []).map((it) => [String(it._id), it]));

    Object.entries(cart || {}).forEach(([id, qty]) => {
      const quantity = Number(qty) || 0;
      if (quantity <= 0) return;

      const prod = map.get(String(id));
      if (!prod) return;

      const cat = getCategory(prod);
      if (cat.includes("pasta")) pastaMax += quantity;
      if (cat.includes("moburg")) moburgMax += quantity;
    });

    return { pastaMax, moburgMax };
  };

  // whenever cart or menu changes, clamp add-ons so they never exceed allowed max
  useEffect(() => {
    const { pastaMax, moburgMax } = computeCheeseCaps(cartItems, food_list);

    setCheeseAddOns((prev) => {
      const clamped = {
        pasta: Math.min(prev.pasta || 0, pastaMax),
        moburg: Math.min(prev.moburg || 0, moburgMax),
      };
      // only persist if something changed
      if (
        clamped.pasta !== prev.pasta ||
        clamped.moburg !== prev.moburg
      ) {
        persistCheese(clamped);
        return clamped;
      }
      return prev;
    });
  }, [cartItems, food_list]); // clamp on either change

  // initial boot
  useEffect(() => {
    async function loadData() {
      try {
        await fetchFoodList();
        const saved = localStorage.getItem("token");
        if (saved) {
          setToken(saved);
          await loadCartData({ token: saved });
        } else {
          setCartItems(readGuestCart());
        }
      } catch (error) {
        console.error("Initial data load failed", error);
      } finally {
        setIsAuthReady(true); // <--- ADDED
      }
    }
    loadData();
  }, []);

  const contextValue = {
    // config
    url,
    currency,
    deliveryCharge,

    // data
    food_list,
    setFoodList,
    menu_list,

    // cart
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,

    // auth
    token,
    setToken,
    loadCartData,
    isAuthReady, // <--- ADDED

    // add-ons
    cheeseAddOns,
    setCheeseAddOns,
    updateCheeseAddOns,
    getAddOnTotal,
    getGrandTotal,
    buildClientCartSnapshot,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;