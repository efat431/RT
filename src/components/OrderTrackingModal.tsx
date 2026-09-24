import React, { useState } from 'react';
import {
  X,
  Search,
  Package,
  MapPin,
  Edit2,
  Trash2,
  Clock,
  Truck,
  CheckCircle2,
  Phone,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { EditDeliveryInfoModal } from './EditDeliveryInfoModal';
import { ConfirmModal } from './ConfirmModal';
import { formatWhatsAppLink } from '../utils/phone';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  const { orders, cancelCustomerOrder, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    setHasSearched(true);
    const cleanPhone = query.replace(/[^0-9]/g, '');

    const found = orders.find((o) => {
      if (o.orderNumber.toLowerCase() === query) return true;
      if (o.id.toLowerCase() === query) return true;
      if (cleanPhone.length >= 7 && o.customer.phone.replace(/[^0-9]/g, '').includes(cleanPhone)) return true;
      if (o.transactionId && o.transactionId.toLowerCase() === query) return true;
      return false;
    });

    setMatchedOrder(found || null);
  };

  const handleCancelOrder = () => {
    if (!matchedOrder) return;
    if (matchedOrder.shippingStatus !== 'Pending') {
      setActionFeedback('Only pending orders can be canceled. This order has already progressed to shipping.');
      setTimeout(() => setActionFeedback(null), 3500);
      return;
    }
    setIsCancelConfirmOpen(true);
  };

  const executeCancelOrder = () => {
    if (!matchedOrder) return;
    const res = cancelCustomerOrder(matchedOrder.id);
    if (res.success) {
      setActionFeedback(`Order #${matchedOrder.orderNumber} was successfully canceled and stock restored.`);
      setMatchedOrder(null);
      setTimeout(() => {
        setActionFeedback(null);
      }, 4000);
    } else {
      setActionFeedback(res.message || 'Failed to cancel order.');
      setTimeout(() => setActionFeedback(null), 3500);
    }
    setIsCancelConfirmOpen(false);
  };

  const isPending = matchedOrder?.shippingStatus === 'Pending';
  const supportWhatsApp = settings.footer?.supportWhatsApp || settings.phone || '+8801518739561';

  return (
    <div
      id="order-tracking-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs p-4 sm:p-6 md:p-8 lg:p-12 animate-in fade-in duration-150"
    >
      <div className="min-h-full w-full flex items-center justify-center">
        <div
          id="order-tracking-modal-content"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl lg:max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-auto max-h-[85vh]"
        >
        <div className="h-2 w-full rainbow-gradient-bg shrink-0" />

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Track Your Order & Post-Order Services
              </h2>
              <p className="text-xs text-slate-500">
                Enter your Order Number (e.g. RNG-...) or registered Phone Number
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="order-tracking-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order Number (e.g. RNG-1723...) or Phone..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <button
              id="order-tracking-search-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm hover:shadow active:scale-95 transition-all shrink-0"
            >
              Track Order
            </button>
          </form>

          {actionFeedback && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}
        </div>

        {/* Modal Body / Results */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!hasSearched && !matchedOrder && (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">Real-time Order Lookup</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Check delivery status, modify shipping information before dispatch, or cancel your pending order.
              </p>
            </div>
          )}

          {hasSearched && !matchedOrder && (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Matching Order Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find an order matching "{searchQuery}". Please verify your order number or phone number and try again.
              </p>
            </div>
          )}

          {matchedOrder && (
            <div className="space-y-4">
              {/* Order Confirmation / Summary Card */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Order Tracking ID
                    </span>
                    <span className="font-mono font-bold text-base text-slate-900">
                      {matchedOrder.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        matchedOrder.shippingStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : matchedOrder.shippingStatus === 'Shipped'
                          ? 'bg-blue-100 text-blue-800'
                          : matchedOrder.shippingStatus === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {matchedOrder.shippingStatus}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        matchedOrder.paymentStatus === 'PAID' || matchedOrder.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Payment: {matchedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-2">
                    <span className={matchedOrder.shippingStatus ? 'text-emerald-600' : ''}>1. Order Placed</span>
                    <span className={matchedOrder.shippingStatus !== 'Pending' ? 'text-emerald-600' : ''}>2. Processing</span>
                    <span className={matchedOrder.shippingStatus === 'Shipped' || matchedOrder.shippingStatus === 'Delivered' ? 'text-emerald-600' : ''}>3. Shipped</span>
                    <span className={matchedOrder.shippingStatus === 'Delivered' ? 'text-emerald-600' : ''}>4. Delivered</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width:
                          matchedOrder.shippingStatus === 'Delivered'
                            ? '100%'
                            : matchedOrder.shippingStatus === 'Shipped'
                            ? '75%'
                            : matchedOrder.shippingStatus === 'Processing'
                            ? '50%'
                            : '25%',
                      }}
                    />
                  </div>
                </div>

                {/* Recipient & Zone Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                      Delivery Address
                    </span>
                    <p className="font-bold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {matchedOrder.customer.fullName} ({matchedOrder.customer.phone})
                    </p>
                    <p className="text-slate-600 pl-4">{matchedOrder.customer.fullAddress}, {matchedOrder.customer.district}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      Zone: {matchedOrder.customer.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka (৳80)' : 'Outside Dhaka (৳150)'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                      Payment & Courier
                    </span>
                    <p className="font-bold text-slate-800">
                      Method: {matchedOrder.paymentMethod === 'dbbl' ? 'DBBL / NexusPay' : 'Cash on Delivery (COD)'}
                    </p>
                    {matchedOrder.transactionId && (
                      <p className="text-indigo-700 font-mono text-[11px] font-bold">
                        TrxID: {matchedOrder.transactionId}
                      </p>
                    )}
                    {matchedOrder.courierBooking ? (
                      <div className="pt-1 text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        <span>{matchedOrder.courierBooking.provider} Waybill: {matchedOrder.courierBooking.waybillId}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 block pt-1">
                        Courier not assigned yet (Dispatching soon)
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Ordered Items ({matchedOrder.items.length})
                  </span>
                  <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {matchedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.title}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 line-clamp-1">{item.product.title}</p>
                            <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800">
                          ৳ {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financials */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Items Subtotal:</span>
                      <span>৳ {matchedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Charge:</span>
                      <span>৳ {matchedOrder.deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Grand Total:</span>
                      <span className="text-rose-600 font-display font-bold">
                        ৳ {matchedOrder.totalAmount.toLocaleString()} BDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Action Buttons */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2.5">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        id="tracking-edit-delivery-btn"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-rose-300" />
                        Edit Delivery Info
                      </button>

                      <button
                        type="button"
                        id="tracking-cancel-order-btn"
                        onClick={handleCancelOrder}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Cancel / Delete Order
                      </button>
                    </>
                  ) : (
                    <div className="w-full p-3 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>Order is in "{matchedOrder.shippingStatus}" state and cannot be modified online.</span>
                      </div>
                      <a
                        href={formatWhatsAppLink(
                          supportWhatsApp,
                          `Hi Rongdhonu Trade! Inquiry regarding order #${matchedOrder.orderNumber}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <Phone className="w-3 h-3" />
                        Helpline
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Helpline: <strong>{supportWhatsApp}</strong> (Direct WhatsApp support available)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      </div>

      {/* Edit Delivery Modal */}
      {matchedOrder && (
        <EditDeliveryInfoModal
          order={matchedOrder}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => {
            setMatchedOrder(updated);
            setActionFeedback('Delivery information updated successfully!');
            setTimeout(() => setActionFeedback(null), 3000);
          }}
        />
      )}

      {/* Unified In-App Order Cancellation Confirmation Modal */}
      {matchedOrder && (
        <ConfirmModal
          isOpen={isCancelConfirmOpen}
          onClose={() => setIsCancelConfirmOpen(false)}
          title={`Cancel Order #${matchedOrder.orderNumber}?`}
          message={`Are you sure you want to cancel Order #${matchedOrder.orderNumber}?\n\nThis will permanently delete the order and restore all items back into store inventory.`}
          confirmText="Yes, Cancel Order"
          cancelText="Keep Order"
          variant="danger"
          onConfirm={executeCancelOrder}
        />
      )}
    </div>
  );
};
