import React, { useRef } from "react";
import {
  X, Download, CheckCircle, Package, MapPin,
  Banknote, Store, Phone, Mail, Calendar, Hash,
} from "lucide-react";
import { Order } from "../services/firebaseService";

interface OrderReceiptProps {
  order: Order;
  onClose: () => void;
}

export default function OrderReceipt({ order, onClose }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDate = (ts: any) => {
    const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const handleDownload = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Receipt - ${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a1a; }
            .receipt { max-width: 480px; margin: 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; }
            .header { text-align: center; padding-bottom: 24px; border-bottom: 2px dashed #e5e7eb; margin-bottom: 24px; }
            .logo { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #1e3a8a; }
            .logo span { color: #7c3aed; font-size: 28px; }
            .title { font-size: 13px; color: #6b7280; margin-top: 4px; }
            .badge { display: inline-block; margin-top: 12px; padding: 4px 16px; background: #dcfce7; color: #166534; border-radius: 999px; font-size: 12px; font-weight: 600; }
            .order-id { font-size: 11px; color: #9ca3af; margin-top: 8px; }
            .section { margin-bottom: 20px; }
            .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
            .row .key { font-size: 13px; color: #6b7280; }
            .row .val { font-size: 13px; font-weight: 600; color: #1a1a1a; text-align: right; max-width: 60%; }
            .divider { border: none; border-top: 1px dashed #e5e7eb; margin: 16px 0; }
            .total-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
            .total-label { font-size: 15px; font-weight: 700; color: #1a1a1a; }
            .total-amount { font-size: 22px; font-weight: 900; color: #7c3aed; }
            .cod-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; margin-top: 16px; }
            .cod-title { font-size: 13px; font-weight: 700; color: #166534; }
            .cod-sub { font-size: 11px; color: #4ade80; margin-top: 3px; }
            .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">CEM<span>X</span>PRESS</div>
              <div class="title">Order Confirmation Receipt</div>
              <div class="badge">✓ Order Placed Successfully</div>
              <div class="order-id">Order ID: #${order.id.slice(-8).toUpperCase()}</div>
            </div>

            <div class="section">
              <div class="section-label">Order Details</div>
              <div class="row"><span class="key">Material</span><span class="val">${order.materialName}</span></div>
              <div class="row"><span class="key">Shop</span><span class="val">${order.shopName}</span></div>
              <div class="row"><span class="key">Quantity</span><span class="val">${order.quantity}</span></div>
              ${order.unitPrice ? `<div class="row"><span class="key">Unit Price</span><span class="val">₹${order.unitPrice.toLocaleString("en-IN")}</span></div>` : ""}
              <div class="row"><span class="key">Date</span><span class="val">${formatDate(order.createdAt)}</span></div>
            </div>

            <hr class="divider" />

            <div class="section">
              <div class="section-label">Delivery</div>
              <div class="row"><span class="key">Address</span><span class="val">${order.deliveryAddress}</span></div>
              ${order.notes ? `<div class="row"><span class="key">Notes</span><span class="val">${order.notes}</span></div>` : ""}
            </div>

            <hr class="divider" />

            <div class="section">
              <div class="section-label">Buyer</div>
              <div class="row"><span class="key">Name</span><span class="val">${order.buyerName}</span></div>
              <div class="row"><span class="key">Phone</span><span class="val">${order.buyerPhone}</span></div>
              <div class="row"><span class="key">Email</span><span class="val">${order.buyerEmail}</span></div>
            </div>

            <hr class="divider" />

            <div class="total-row">
              <span class="total-label">Total Payable</span>
              <span class="total-amount">${order.totalAmount > 0 ? `₹${order.totalAmount.toLocaleString("en-IN")}` : "As negotiated"}</span>
            </div>

            <div class="cod-box">
              <div class="cod-title">💵 Cash on Delivery</div>
              <div class="cod-sub">Pay in cash when your order arrives at your doorstep</div>
            </div>

            <div class="footer">
              Thank you for your order!<br/>
              CemXpress — Building Materials Marketplace<br/>
              This is a computer-generated receipt.
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success header */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-xl">Order Placed!</h2>
          <p className="text-emerald-100 text-sm mt-1">Your order has been confirmed</p>
          <div className="mt-3 inline-block bg-white/20 rounded-lg px-3 py-1">
            <p className="text-white text-xs font-mono font-semibold">
              #{order.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Receipt body */}
        <div ref={receiptRef} className="p-5 space-y-4">

          {/* Order info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Package size={13} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400">Material</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{order.materialName}</p>
              </div>
              {order.quantity && (
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                  {order.quantity}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Store size={13} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400">Shop</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{order.shopName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <MapPin size={13} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400">Delivery Address</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{order.deliveryAddress}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Order Date</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-xl font-black text-violet-600 dark:text-violet-400">
                {order.totalAmount > 0 ? `₹${order.totalAmount.toLocaleString("en-IN")}` : "As negotiated"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full">
              <Banknote size={13} />
              <span className="text-xs font-semibold">COD</span>
            </div>
          </div>

          {/* Note */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            The seller will contact you to confirm delivery details.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download size={15} />
            Download Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Track Order
          </button>
        </div>
      </div>
    </div>
  );
}