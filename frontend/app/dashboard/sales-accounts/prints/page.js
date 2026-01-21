"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const DOC_TYPES = [
  {
    id: "invoice",
    label: "Invoice",
    title: "TAX INVOICE",
    numberLabel: "Invoice #",
    refLabel: "Delivery Ref",
  },
  {
    id: "sales_order",
    label: "Sales Order",
    title: "SALES ORDER",
    numberLabel: "SO #",
    refLabel: "Quotation Ref",
  },
  {
    id: "delivery",
    label: "Delivery Challan",
    title: "DELIVERY CHALLAN",
    numberLabel: "DC #",
    refLabel: "SO Ref",
  },
  {
    id: "po",
    label: "Purchase Order",
    title: "PURCHASE ORDER",
    numberLabel: "PO #",
    refLabel: "Vendor Ref",
  },
];

const defaultItems = [
  { description: 'Interactive Flat Panel 75"', qty: 1, rate: 100000 },
  { description: "Wall Mount Kit", qty: 1, rate: 5000 },
];

export default function PrintDocsPage() {
  const [docType, setDocType] = useState("invoice");
  const [docNumber, setDocNumber] = useState("INV-0001");
  const [refNumber, setRefNumber] = useState("DEL-1234");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [fromInfo, setFromInfo] = useState({
    name: "Matrix Office",
    address: "3rd Floor, Tech Park, Bengaluru, KA",
    contact: "+91 98765 43210",
    gst: "29AAAAA0000A1Z5",
  });
  const [toInfo, setToInfo] = useState({
    name: "ABC School",
    address: "12, MG Road, Bengaluru, KA",
    contact: "+91 90000 11111",
    gst: "29BBBBB0000B2Z6",
  });
  const [items, setItems] = useState(defaultItems);
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (acc, it) => acc + (Number(it.qty) || 0) * (Number(it.rate) || 0),
      0,
    );
    const gst = subtotal * 0.18;
    return { subtotal, gst, total: subtotal + gst };
  }, [items]);

  const docMeta = DOC_TYPES.find((d) => d.id === docType) || DOC_TYPES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.2)]">
          Printable Docs
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Printable Docs
          </h1>
          <p className="text-sm text-slate-500">
            A4-styled previews for Invoice, Sales Order, Delivery Challan, and
            Purchase Order. Adjust fields, then print.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 text-xs">
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-500">Document type</label>
            <select
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-500">
              {docMeta.numberLabel}
            </label>
            <input
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-500">
              {docMeta.refLabel}
            </label>
            <input
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-500">Issue date</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-500">
              Due / Delivery date
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 text-xs">
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-500">
              From (Seller / Your company)
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-28"
              value={`${fromInfo.name}\n${fromInfo.address}\n${fromInfo.contact}\nGST: ${fromInfo.gst}`}
              onChange={(e) => {
                const lines = e.target.value.split("\n");
                setFromInfo((p) => ({
                  ...p,
                  name: lines[0] || "",
                  address: lines[1] || "",
                  contact: lines[2] || "",
                  gst: (lines[3] || "").replace(/^GST:\s*/i, ""),
                }));
              }}
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-500">
              To (Customer / Vendor)
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-28"
              value={`${toInfo.name}\n${toInfo.address}\n${toInfo.contact}\nGST: ${toInfo.gst}`}
              onChange={(e) => {
                const lines = e.target.value.split("\n");
                setToInfo((p) => ({
                  ...p,
                  name: lines[0] || "",
                  address: lines[1] || "",
                  contact: lines[2] || "",
                  gst: (lines[3] || "").replace(/^GST:\s*/i, ""),
                }));
              }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold rounded-full text-white shadow"
            style={{ background: "var(--brand-gradient)" }}
          >
            Print / Save as PDF
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_20px_40px_rgba(15,23,42,0.08)] border border-slate-100 p-8 max-w-5xl mx-auto print:w-[210mm] print:h-[297mm]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-blue-600">
              {docMeta.title}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Matrix Office
            </h2>
            <div className="text-xs text-slate-500 whitespace-pre-line">
              {fromInfo.address}
              {"\n"}
              {fromInfo.contact}
              {"\n"}
              GST: {fromInfo.gst}
            </div>
          </div>
          <div className="text-xs text-right space-y-1">
            <div className="text-slate-500">{docMeta.numberLabel}</div>
            <div className="font-semibold text-slate-900">{docNumber}</div>
            <div className="text-slate-500">{docMeta.refLabel}</div>
            <div className="text-slate-900">{refNumber}</div>
            <div className="text-slate-500">Issue date</div>
            <div className="text-slate-900">{issueDate}</div>
            <div className="text-slate-500">Due / Delivery</div>
            <div className="text-slate-900">{dueDate}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-6">
          <div className="border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] uppercase text-slate-500">
              Bill / Ship To
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {toInfo.name}
            </div>
            <div className="text-slate-500 whitespace-pre-line">
              {toInfo.address}
              {"\n"}
              {toInfo.contact}
              {"\n"}
              GST: {toInfo.gst}
            </div>
          </div>
          <div className="border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] uppercase text-slate-500">
              Ship From
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {fromInfo.name}
            </div>
            <div className="text-slate-500 whitespace-pre-line">
              {fromInfo.address}
              {"\n"}
              {fromInfo.contact}
              {"\n"}
              GST: {fromInfo.gst}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 mb-6">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2 w-10">#</th>
                <th className="text-left px-3 py-2">Description</th>
                <th className="text-right px-3 py-2 w-16">Qty</th>
                <th className="text-right px-3 py-2 w-24">Rate</th>
                <th className="text-right px-3 py-2 w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
                return (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="px-3 py-2 text-slate-600">{idx + 1}</td>
                    <td className="px-3 py-2 text-slate-900">
                      {it.description}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {it.qty}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">
                      {Number(it.rate).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900 font-medium">
                      {amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 text-xs">
          <div className="flex-1 text-slate-600">
            <div className="font-semibold text-slate-900 mb-1">
              Terms & Notes
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li>Goods once sold will not be taken back.</li>
              <li>Payment due within 15 days.</li>
              <li>Prices inclusive of freight within city limits.</li>
            </ul>
          </div>
          <div className="w-full md:w-72 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>GST (18%)</span>
              <span>{totals.gst.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 font-semibold text-sm border-t border-slate-200 pt-2">
              <span>Total</span>
              <span>{totals.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500 flex justify-between">
          <div>
            <div className="font-semibold text-slate-900">
              Authorized Signatory
            </div>
            <div className="text-slate-500">Matrix Office</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-slate-900">
              Thank you for your business
            </div>
            <div className="text-slate-500">
              Please quote {docMeta.numberLabel} on all correspondence.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
