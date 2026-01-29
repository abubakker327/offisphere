// backend/src/routes/salesAccountsRoutes.js
// Sales & Accounts cycle: masters, procurement, inventory, sales, payments, accounting

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// ---- Helpers ---------------------------------------------------------------

const safeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const computeTotals = (items = []) => {
  let subtotal = 0;
  let gstTotal = 0;
  (items || []).forEach((it) => {
    const qty = safeNumber(it.qty || it.quantity);
    const price = safeNumber(it.unit_price || it.price);
    const gstRate = safeNumber(it.gst_rate ?? it.gst_percent);
    const lineBase = qty * price;
    const lineGst = (lineBase * gstRate) / 100;
    subtotal += lineBase;
    gstTotal += lineGst;
  });
  return { subtotal, gst_total: gstTotal, total: subtotal + gstTotal };
};

const ensureBalanced = (entries = []) => {
  const debit = entries.reduce((acc, e) => acc + safeNumber(e.debit), 0);
  const credit = entries.reduce((acc, e) => acc + safeNumber(e.credit), 0);
  return Math.abs(debit - credit) < 0.01;
};

const postLedgerEntries = async (entries = []) => {
  if (!entries.length) return { ok: true };
  if (!ensureBalanced(entries)) {
    return {
      ok: false,
      message: "Ledger not balanced (debit/credit mismatch)",
    };
  }
  const { error } = await supabase.from("ledger_entries").insert(entries);
  if (error) {
    console.error("ledger_entries insert error:", error);
    return { ok: false, message: "Failed to write ledger entries" };
  }
  return { ok: true };
};

const insertStockLedger = async (rows = []) => {
  if (!rows.length) return { ok: true };
  const { error } = await supabase.from("stock_ledger").insert(rows);
  if (error) {
    console.error("stock_ledger insert error:", error);
    return { ok: false, message: "Failed to write stock ledger" };
  }
  return { ok: true };
};

const fetchProductsMap = async (productIds = []) => {
  if (!productIds.length) return {};
  const { data, error } = await supabase
    .from("products")
    .select("id, has_serial")
    .in("id", Array.from(new Set(productIds)));
  if (error) {
    console.error("fetchProductsMap error:", error);
    return {};
  }
  return (data || []).reduce((acc, p) => {
    acc[p.id] = { is_serialized: !!p.has_serial };
    return acc;
  }, {});
};

const validateSerials = async (items = []) => {
  const productIds = items.map((i) => i.product_id).filter(Boolean);
  const map = await fetchProductsMap(productIds);
  for (const it of items) {
    const needsSerial = map[it.product_id]?.is_serialized;
    if (needsSerial) {
      const list = Array.isArray(it.serials) ? it.serials : [];
      if (list.length !== safeNumber(it.qty || it.quantity)) {
        return {
          ok: false,
          message: "Serialized product requires serial count equal to quantity",
        };
      }
    }
  }
  return { ok: true };
};

// ---- Masters ---------------------------------------------------------------

router.get(
  "/masters/products",
  authenticate,
  authorize([]),
  async (_req, res) => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      console.error("List products error:", error);
      return res.status(500).json({ message: "Error fetching products" });
    }
    res.json(data || []);
  },
);

router.post(
  "/masters/products",
  authenticate,
  authorize([]),
  async (req, res) => {
    const {
      name,
      sku,
      category,
      unit,
      gst_percent,
      gst_rate,
      unit_price,
      has_serial,
      is_serialized,
      default_warehouse_id,
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const insertPayload = {
      name,
      sku: sku || null,
      category: category || null,
      unit: unit ?? null,
      gst_percent: gst_percent ?? gst_rate ?? null,
      unit_price: unit_price ?? null,
      has_serial:
        typeof has_serial === "boolean" ? has_serial : !!is_serialized,
      default_warehouse_id: default_warehouse_id || null,
    };

    const { data: createdData, error } = await supabase.from("products").insert([insertPayload]).select();
    if (error) {
      console.error("Create product error:", error);
      if (error.code === "23505") {
        return res.status(409).json({ message: "SKU already exists" });
      }
      return res
        .status(500)
        .json({ message: error.message || "Error creating product" });
    }
    res.status(201).json({ message: "Product created", data: createdData[0] });
  },
);

router.get(
  "/masters/vendors",
  authenticate,
  authorize([]),
  async (_req, res) => {
    const { data, error } = await supabase.from("vendors").select("*");
    if (error) {
      console.error("List vendors error:", error);
      return res.status(500).json({ message: "Error fetching vendors" });
    }
    res.json(data || []);
  },
);

router.post(
  "/masters/vendors",
  authenticate,
  authorize([]),
  async (req, res) => {
    const {
      name,
      email,
      gstin,
      address,
      contact_number,
      contact_person_name,
    } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const insertPayload = {
      name,
      email: email || null,
      gstin: gstin || null,
      address: address || null,
      contact_number: contact_number || null,
      contact_person_name: contact_person_name || null,
    };

    const { data: createdData, error } = await supabase.from("vendors").insert([insertPayload]).select();
    if (error) {
      console.error("Create vendor error:", error);
      return res
        .status(500)
        .json({ message: error.message || "Error creating vendor" });
    }
    res.status(201).json({ message: "Vendor created", data: createdData[0] });
  },
);

router.get(
  "/masters/customers",
  authenticate,
  authorize([]),
  async (_req, res) => {
    const { data, error } = await supabase.from("customers").select("*");
    if (error) {
      console.error("List customers error:", error);
      return res.status(500).json({ message: "Error fetching customers" });
    }
    res.json(data || []);
  },
);

router.post(
  "/masters/customers",
  authenticate,
  authorize([]),
  async (req, res) => {
    const {
      name,
      email,
      gstin,
      address,
      contact_number,
      contact_person_name,
    } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const insertPayload = {
      name,
      email: email || null,
      gstin: gstin || null,
      address: address || null,
      contact_number: contact_number || null,
      contact_person_name: contact_person_name || null,
    };

    const { data: createdData, error } = await supabase.from("customers").insert([insertPayload]).select();
    if (error) {
      console.error("Create customer error:", error);
      return res
        .status(500)
        .json({ message: error.message || "Error creating customer" });
    }
    res.status(201).json({ message: "Customer created", data: createdData[0] });
  },
);

router.get("/masters/tax", authenticate, authorize([]), async (_req, res) => {
  const { data, error } = await supabase.from("tax").select("*");
  if (error) {
    console.error("List tax error:", error);
    return res.status(500).json({ message: "Error fetching tax slabs" });
  }
  res.json(data || []);
});

router.post("/masters/tax", authenticate, authorize([]), async (req, res) => {
  const payload = req.body || {};
  const { error } = await supabase.from("tax").insert([payload]);
  if (error) {
    console.error("Create tax error:", error);
    return res.status(500).json({ message: "Error creating tax slab" });
  }
  res.status(201).json({ message: "Tax slab created" });
});

// ---- Procurement: PO + GRN -------------------------------------------------

router.post(
  "/procurement/po",
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const {
        vendor_id,
        warehouse_id,
        items = [],
        status = "draft",
        notes,
      } = req.body || {};
      if (!vendor_id || !items.length) {
        return res
          .status(400)
          .json({ message: "vendor_id and items are required" });
      }

      const totals = computeTotals(items);
      const poNumber = `PO-${Date.now()}`;
      const { data: poRow, error: poError } = await supabase
        .from("purchase_orders")
        .insert([
          {
            vendor_id,
            po_number: poNumber,
            status,
          },
        ])
        .select("id")
        .single();

      if (poError) {
        console.error("PO create error:", poError);
        return res
          .status(500)
          .json({ message: "Error creating purchase order" });
      }

      const itemsPayload = items.map((it) => ({
        po_id: poRow.id,
        product_id: it.product_id,
        quantity: it.qty || it.quantity,
        unit_price: it.unit_price || it.price || 0,
      }));

      const { error: itemError } = await supabase
        .from("purchase_order_items")
        .insert(itemsPayload);
      if (itemError) {
        console.error("PO items insert error:", itemError);
        return res
          .status(500)
          .json({ message: "Error creating purchase order items" });
      }

      res.status(201).json({ message: "Purchase order created", id: poRow.id });
    } catch (err) {
      console.error("PO create catch:", err);
      res.status(500).json({ message: "Error creating purchase order" });
    }
  },
);

router.get(
  "/procurement/po",
  authenticate,
  authorize([]),
  async (_req, res) => {
    const { data, error } = await supabase.from("purchase_orders").select("*");
    if (error) {
      console.error("PO list error:", error);
      return res
        .status(500)
        .json({ message: "Error fetching purchase orders" });
    }
    res.json(data || []);
  },
);

// PO items by PO id (used to auto-fill GRN product)
router.get(
  "/procurement/po/:id/items",
  authenticate,
  authorize([]),
  async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("po_id", id);
    if (error) {
      console.error("PO items list error:", error);
      return res
        .status(500)
        .json({ message: "Error fetching purchase order items" });
    }
    res.json(data || []);
  },
);

router.post(
  "/procurement/grn",
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const { po_id, items = [], received_by, remarks } = req.body || {};
      if (!po_id || !items.length) {
        return res
          .status(400)
          .json({ message: "po_id and items are required" });
      }

      const serialCheck = await validateSerials(items);
      if (!serialCheck.ok) {
        return res.status(400).json({ message: serialCheck.message });
      }

      const totals = computeTotals(items);
      const { data: grnRow, error: grnError } = await supabase
        .from("grn")
        .insert([
          {
            po_id,
            received_date: new Date().toISOString().slice(0, 10), // date-only for DATE column
            received_by: received_by || null,
            remarks: remarks || null,
          },
        ])
        .select("id")
        .single();

      if (grnError) {
        console.error("GRN create error:", grnError);
        return res.status(500).json({ message: "Error creating GRN" });
      }

      const itemsPayload = items.map((it) => ({
        grn_id: grnRow.id,
        product_id: it.product_id,
        quantity_received: it.qty || it.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("grn_items")
        .insert(itemsPayload);
      if (itemsError) {
        console.error("GRN items error:", itemsError);
        return res.status(500).json({ message: "Error creating GRN items" });
      }

      // Stock ledger +
      const ledgerRows = itemsPayload.map((it) => ({
        ref_type: "GRN",
        ref_id: grnRow.id,
        product_id: it.product_id,
        quantity: safeNumber(it.quantity_received),
        qty_delta: safeNumber(it.quantity_received),
        serials: it.serials || [],
      }));

      const stockResult = await insertStockLedger(ledgerRows);
      if (!stockResult.ok) {
        return res.status(500).json({ message: stockResult.message });
      }

      // Ledger entries (Inventory DR, AP Vendor CR)
      const entries = [
        {
          ledger: "Inventory",
          debit: totals.total,
          credit: 0,
          ref_type: "GRN",
          ref_id: grnRow.id,
        },
        {
          ledger: "AP_Vendor",
          debit: 0,
          credit: totals.total,
          ref_type: "GRN",
          ref_id: grnRow.id,
        },
      ];

      const ledgerResult = await postLedgerEntries(entries);
      if (!ledgerResult.ok) {
        return res.status(500).json({ message: ledgerResult.message });
      }

      res.status(201).json({ message: "GRN created", id: grnRow.id });
    } catch (err) {
      console.error("GRN catch error:", err);
      res.status(500).json({ message: "Error creating GRN" });
    }
  },
);

// ---- Sales: Quotation, SO, Delivery, Invoice --------------------------------

router.post(
  "/sales/quotation",
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const {
        customer_id,
        items = [],
        status = "draft",
        notes,
      } = req.body || {};
      if (!customer_id || !items.length) {
        return res
          .status(400)
          .json({ message: "customer_id and items are required" });
      }
      const quoteNumber = `Q-${Date.now()}`;
      const totals = computeTotals(items);
      const { data: row, error } = await supabase
        .from("sales_quotations")
        .insert([
          {
            customer_id,
            status,
            quote_number: quoteNumber,
          },
        ])
        .select("id")
        .single();
      if (error) {
        console.error("Quotation create error:", error);
        return res.status(500).json({ message: "Error creating quotation" });
      }
      const itemsPayload = items.map((it) => ({
        quotation_id: row.id,
        product_id: it.product_id,
        quantity: it.qty || it.quantity,
        unit_price: it.unit_price || it.price || 0,
      }));
      const { error: itemError } = await supabase
        .from("sales_quotation_items")
        .insert(itemsPayload);
      if (itemError) {
        console.error("Quotation items error:", itemError);
        return res
          .status(500)
          .json({ message: "Error creating quotation items" });
      }
      res.status(201).json({ message: "Quotation created", id: row.id });
    } catch (err) {
      console.error("Quotation catch:", err);
      res.status(500).json({ message: "Error creating quotation" });
    }
  },
);

// List quotations
router.get(
  "/sales/quotation",
  authenticate,
  authorize([]),
  async (req, res) => {
    const limit = Number(req.query.limit) || 50;
    const { data, error } = await supabase
      .from("sales_quotations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("List quotations error:", error);
      return res.status(500).json({ message: "Error fetching quotations" });
    }
    res.json(data || []);
  },
);

router.post("/sales/order", authenticate, authorize([]), async (req, res) => {
  try {
    const {
      quotation_id,
      customer_id,
      items = [],
      status = "draft",
      notes,
    } = req.body || {};
    if (!customer_id || !items.length) {
      return res
        .status(400)
        .json({ message: "customer_id and items are required" });
    }
    const totals = computeTotals(items);
    const soNumber = `SO-${Date.now()}`;
    const { data: row, error } = await supabase
      .from("sales_orders")
      .insert([
        {
          customer_id,
          so_number: soNumber,
        },
      ])
      .select("id")
      .single();
    if (error) {
      console.error("SO create error:", error);
      return res.status(500).json({ message: "Error creating sales order" });
    }
    const itemsPayload = items.map((it) => ({
      sales_order_id: row.id,
      product_id: it.product_id,
      quantity: it.qty || it.quantity,
      unit_price: it.unit_price || it.price || 0,
    }));
    const { error: itemError } = await supabase
      .from("sales_order_items")
      .insert(itemsPayload);
    if (itemError) {
      console.error("SO items error:", itemError);
      return res
        .status(500)
        .json({ message: "Error creating sales order items" });
    }
    res.status(201).json({ message: "Sales order created", id: row.id });
  } catch (err) {
    console.error("SO catch:", err);
    res.status(500).json({ message: "Error creating sales order" });
  }
});

// List sales orders
router.get("/sales/order", authenticate, authorize([]), async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const { data, error } = await supabase
    .from("sales_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Sales orders list error:", error);
    return res.status(500).json({ message: "Error fetching sales orders" });
  }
  res.json(data || []);
});

router.post(
  "/sales/delivery",
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const {
        sales_order_id,
        warehouse_id,
        items = [],
        notes,
      } = req.body || {};
      if (!sales_order_id || !items.length) {
        return res
          .status(400)
          .json({ message: "sales_order_id and items are required" });
      }

      const serialCheck = await validateSerials(items);
      if (!serialCheck.ok) {
        return res.status(400).json({ message: serialCheck.message });
      }

      // If the client passed an SO number instead of UUID, resolve it
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let resolvedOrderId = sales_order_id;
      if (!uuidRegex.test(sales_order_id)) {
        const { data: soRow, error: soError } = await supabase
          .from("sales_orders")
          .select("id")
          .eq("so_number", sales_order_id)
          .single();
        if (soError || !soRow) {
          return res
            .status(400)
            .json({ message: "Invalid sales_order_id/so_number" });
        }
        resolvedOrderId = soRow.id;
      }

      const dcNumber = `DC-${Date.now()}`;

      const { data: row, error } = await supabase
        .from("delivery_challans")
        .insert([
          {
            sales_order_id: resolvedOrderId || null,
            dc_number: dcNumber,
          },
        ])
        .select("id")
        .single();
      if (error) {
        console.error("DC create error:", error);
        return res
          .status(500)
          .json({ message: "Error creating delivery challan" });
      }

      // If you have a delivery items table, insert here; skipping because dc_items is absent in schema
      const itemsPayload = items.map((it) => ({
        delivery_challan_id: row.id,
        sales_order_item_id: it.sales_order_item_id || null,
        product_id: it.product_id,
        qty: it.qty || it.quantity,
        serials: it.serials || [],
        warehouse_id: it.warehouse_id || warehouse_id || null,
      }));

      // Stock ledger -
      const ledgerRows = itemsPayload.map((it) => ({
        ref_type: "DELIVERY",
        ref_id: row.id,
        product_id: it.product_id,
        warehouse_id: it.warehouse_id || warehouse_id || null,
        quantity: -safeNumber(it.qty),
        qty_delta: -safeNumber(it.qty),
        serials: it.serials || [],
      }));
      const stockResult = await insertStockLedger(ledgerRows);
      if (!stockResult.ok) {
        return res.status(500).json({ message: stockResult.message });
      }

      res.status(201).json({ message: "Delivery created", id: row.id });
    } catch (err) {
      console.error("Delivery catch:", err);
      res.status(500).json({ message: "Error creating delivery" });
    }
  },
);

router.post("/sales/invoice", authenticate, authorize([]), async (req, res) => {
  try {
    const { delivery_id, customer_id, items = [], notes } = req.body || {};
    if (!customer_id || !items.length) {
      return res
        .status(400)
        .json({ message: "customer_id and items are required" });
    }
    const invoiceNumber = `INV-${Date.now()}`;
    const totals = computeTotals(items);
    const { data: row, error } = await supabase
      .from("sales_invoices")
      .insert([
        {
          customer_id,
          invoice_number: invoiceNumber,
        },
      ])
      .select("id")
      .single();
    if (error) {
      console.error("Invoice create error:", error);
      return res.status(500).json({ message: "Error creating invoice" });
    }
    const itemsPayload = items.map((it) => ({
      sales_invoice_id: row.id,
      product_id: it.product_id,
      qty: it.qty || it.quantity,
      unit_price: it.unit_price || it.price || 0,
    }));
    // If you have an invoice items table, insert here; skipping because invoice_items is absent in schema

    // Ledger entries: AR DR, Revenue CR, GST Payable CR
    const entries = [
      {
        ledger: "AR_Customer",
        debit: totals.total,
        credit: 0,
        ref_type: "INVOICE",
        ref_id: row.id,
      },
      {
        ledger: "Revenue",
        debit: 0,
        credit: totals.subtotal,
        ref_type: "INVOICE",
        ref_id: row.id,
      },
      {
        ledger: "GST_Payable",
        debit: 0,
        credit: totals.gst_total,
        ref_type: "INVOICE",
        ref_id: row.id,
      },
    ];
    const ledgerResult = await postLedgerEntries(entries);
    if (!ledgerResult.ok) {
      return res.status(500).json({ message: ledgerResult.message });
    }

    res.status(201).json({ message: "Invoice created", id: row.id });
  } catch (err) {
    console.error("Invoice catch:", err);
    res.status(500).json({ message: "Error creating invoice" });
  }
});

// List sales invoices
router.get("/sales/invoice", authenticate, authorize([]), async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const { data, error } = await supabase
    .from("sales_invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Sales invoices list error:", error);
    return res.status(500).json({ message: "Error fetching sales invoices" });
  }
  res.json(data || []);
});

// ---- Payments --------------------------------------------------------------

router.post("/payments/in", authenticate, authorize([]), async (req, res) => {
  try {
    const {
      invoice_id,
      customer_id,
      amount,
      mode,
      currency = "INR",
      date,
      notes,
    } = req.body || {};
    if (!amount || !invoice_id) {
      return res
        .status(400)
        .json({ message: "invoice_id and amount are required" });
    }

    // Accept either UUID or invoice_number and resolve to UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let resolvedInvoiceId = invoice_id;
    let resolvedCustomerId = customer_id;
    if (!uuidRegex.test(invoice_id)) {
      const { data: invRow, error: invErr } = await supabase
        .from("sales_invoices")
        .select("id, customer_id")
        .eq("invoice_number", invoice_id)
        .single();
      if (invErr || !invRow) {
        return res
          .status(400)
          .json({ message: "Invalid invoice_id/invoice_number" });
      }
      resolvedInvoiceId = invRow.id;
      if (!resolvedCustomerId) resolvedCustomerId = invRow.customer_id;
    }

    if (!resolvedCustomerId) {
      return res
        .status(400)
        .json({
          message: "customer_id is required (provide or inferred from invoice)",
        });
    }
    const paymentMethod =
      mode && String(mode).trim() ? String(mode).trim() : "cash";
    const paymentDirection = "inward";

    const { data: row, error } = await supabase
      .from("payments")
      .insert([
        {
          type: "in",
          payment_direction: paymentDirection,
          reference_type: "invoice",
          reference_id: resolvedInvoiceId,
          customer_id: resolvedCustomerId,
          amount,
          method: paymentMethod,
          currency: currency || "INR",
          notes: notes || "",
        },
      ])
      .select("id")
      .single();
    if (error) {
      console.error("Payment in error:", error);
      return res.status(500).json({ message: "Error recording payment" });
    }

    const entries = [
      {
        ledger: "Cash_Bank",
        debit: safeNumber(amount),
        credit: 0,
        ref_type: "PAYMENT_IN",
        ref_id: row.id,
      },
      {
        ledger: "AR_Customer",
        debit: 0,
        credit: safeNumber(amount),
        ref_type: "PAYMENT_IN",
        ref_id: row.id,
      },
    ];
    const ledgerResult = await postLedgerEntries(entries);
    if (!ledgerResult.ok) {
      return res.status(500).json({ message: ledgerResult.message });
    }
    res.status(201).json({ message: "Payment recorded", id: row.id });
  } catch (err) {
    console.error("Payment in catch:", err);
    res.status(500).json({ message: "Error recording payment" });
  }
});

router.post("/payments/out", authenticate, authorize([]), async (req, res) => {
  try {
    const {
      vendor_id,
      po_id,
      grn_id,
      amount,
      mode,
      currency = "INR",
      date,
      notes,
    } = req.body || {};
    if (!vendor_id || !amount) {
      return res
        .status(400)
        .json({ message: "vendor_id and amount are required" });
    }
    // Resolve PO number to UUID if needed (reference_id must be UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let resolvedPoId = po_id;
    if (po_id && !uuidRegex.test(po_id)) {
      const { data: poRow, error: poErr } = await supabase
        .from("purchase_orders")
        .select("id")
        .eq("po_number", po_id)
        .single();
      if (poErr || !poRow) {
        return res.status(400).json({ message: "Invalid po_id/po_number" });
      }
      resolvedPoId = poRow.id;
    }

    const referenceId = grn_id || resolvedPoId || vendor_id;
    const refType = "purchase";

    const paymentMethod =
      mode && String(mode).trim() ? String(mode).trim() : "cash";
    const paymentDirection = "outward";

    const { data: row, error } = await supabase
      .from("payments")
      .insert([
        {
          type: "out",
          payment_direction: paymentDirection,
          reference_type: refType,
          reference_id: referenceId,
          vendor_id,
          amount,
          method: paymentMethod,
          currency: currency || "INR",
          notes: notes || "",
        },
      ])
      .select("id")
      .single();
    if (error) {
      console.error("Payment out error:", error);
      return res
        .status(500)
        .json({ message: "Error recording vendor payment" });
    }

    const entries = [
      {
        ledger: "AP_Vendor",
        debit: safeNumber(amount),
        credit: 0,
        ref_type: "PAYMENT_OUT",
        ref_id: row.id,
      },
      {
        ledger: "Cash_Bank",
        debit: 0,
        credit: safeNumber(amount),
        ref_type: "PAYMENT_OUT",
        ref_id: row.id,
      },
    ];
    const ledgerResult = await postLedgerEntries(entries);
    if (!ledgerResult.ok) {
      return res.status(500).json({ message: ledgerResult.message });
    }
    res.status(201).json({ message: "Vendor payment recorded", id: row.id });
  } catch (err) {
    console.error("Payment out catch:", err);
    res.status(500).json({ message: "Error recording vendor payment" });
  }
});

// List payments (both in/out)
router.get("/payments", authenticate, authorize([]), async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("List payments error:", error);
    return res.status(500).json({ message: "Error fetching payments" });
  }
  res.json(data || []);
});

// ---- Inventory -------------------------------------------------------------

router.get(
  "/inventory/stock-ledger",
  authenticate,
  authorize([]),
  async (req, res) => {
    const { product_id, warehouse_id } = req.query;
    let query = supabase
      .from("stock_ledger")
      .select("*, products(name)")
      .order("created_at", { ascending: false });
    if (product_id) query = query.eq("product_id", product_id);
    if (warehouse_id) query = query.eq("warehouse_id", warehouse_id);
    const { data, error } = await query;
    if (error) {
      console.error("Stock ledger error:", error);
      return res.status(500).json({ message: "Error fetching stock ledger" });
    }
    res.json(data || []);
  },
);

// ---- Accounting ------------------------------------------------------------

router.get(
  "/accounting/ledger",
  authenticate,
  authorize([]),
  async (req, res) => {
    const { ledger, ref_type } = req.query;
    let query = supabase.from("ledger_entries").select("*");
    if (ledger) query = query.eq("ledger", ledger);
    if (ref_type) query = query.eq("ref_type", ref_type);
    // Order by created_at or fallback to id
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    const { data, error } = await query;
    if (error) {
      console.error("Ledger list error:", error);
      return res.status(500).json({ message: "Error fetching ledger entries" });
    }
    res.json(data || []);
  },
);

module.exports = router;
