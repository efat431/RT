import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Banknote,
  Check,
  RefreshCw,
  Copy,
  Building2,
  QrCode,
  Upload,
  AlertCircle,
  TicketPercent,
  Tag,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DeliveryZone, PaymentMethod, Coupon } from '../types';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    createOrder,
    orders,
    settings,
    setRecentSuccessOrder,
    currentUser,
    applyCoupon,
    trackEvent,
  } = useStore();

  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('inside_dhaka');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cod');
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [district, setDistrict] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Promo Code / Coupon State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPromoBox, setShowPromoBox] = useState(false);

  // DBBL Bank & NexusPay Payment State
  const [senderBank, setSenderBank] = useState('NexusPay App');
  const [senderAccountOrPhone, setSenderAccountOrPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [depositSlipUrl, setDepositSlipUrl] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (!fullName && currentUser.name) setFullName(currentUser.name);
      if (!phone && currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser, isCartOpen]);

  if (!isCartOpen) return null;

  const deliveryFee =
    deliveryZone === 'inside_dhaka' ? settings.insideDhakaFee : settings.outsideDhakaFee;
  const effectiveDiscount = appliedCoupon?.discountType === 'free_shipping' ? deliveryFee : discountAmount;
  const grandTotal = Math.max(0, cartSubtotal + deliveryFee - effectiveDiscount);

  const handleApplyPromo = (codeToApply?: string) => {
    const code = codeToApply || promoCodeInput;
    const result = applyCoupon(code, cartSubtotal, deliveryFee);
    if (result.success && result.coupon) {
      setAppliedCoupon(result.coupon);
      setDiscountAmount(result.discountAmount);
      setPromoFeedback({ type: 'success', text: result.message });
      setPromoCodeInput(result.coupon.code);
    } else {
      setPromoFeedback({ type: 'error', text: result.message });
    }
  };

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setPromoFeedback(null);
    setPromoCodeInput('');
  };

  // Active DBBL Bank Settings from Admin Settings or defaults
  const dbblBank = settings.dbblBank || {
    bankName: 'Dutch-Bangla Bank PLC',
    accountHolderName: 'Rongdhonu Trade',
    accountNumber: '148.151.0029341',
    branchName: 'Uttara Branch, Dhaka',
    routingNumber: '090264000',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=DBBL-NEXUSPAY-1481510029341',
    instructions: 'Send money or transfer via Dutch-Bangla Bank / NexusPay app or internet banking. Copy our Account Number, complete transfer, and paste the Transaction ID (TrxID) below with an optional deposit slip screenshot.',
  };

  const handleCopyAccountNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(dbblBank.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Deposit slip image size must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositSlipUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    // 1. Honeypot check (Bot Detection)
    if (honeypot.trim()) {
      setErrorMessage('Submission rejected: automated bot activity detected.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) {
      setErrorMessage('Please enter a valid 11-digit Bangladeshi phone number (e.g. 017xxxxxxxx).');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter your full street address.');
      return;
    }

    // 2. Client Cooldown Timer (Anti-Spam / Rapid Re-submission)
    const LAST_ORDER_KEY = 'rongdhonu_last_order_timestamp';
    const lastTimestamp = parseInt(localStorage.getItem(LAST_ORDER_KEY) || '0', 10);
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastTimestamp) / 1000);
    const cooldownDuration = settings.orderCooldownSeconds || 60;

    if (elapsedSeconds < cooldownDuration) {
      const waitTime = cooldownDuration - elapsedSeconds;
      setErrorMessage(`Please wait ${waitTime}s before placing another order.`);
      return;
    }

    // 3. Rate-Limiting by Recipient Phone Number
    const pendingCount = (orders || []).filter((o) => {
      const oPhone = o.customer.phone.replace(/[^0-9]/g, '');
      const isPending =
        o.shippingStatus === 'Pending' ||
        o.paymentStatus === 'DUE' ||
        o.paymentStatus === 'UNVERIFIED' ||
        o.paymentStatus === 'Pending COD';
      return oPhone === cleanPhone && isPending;
    }).length;

    if (pendingCount >= 2) {
      setErrorMessage(
        'You already have pending orders under verification. Please wait for them to be processed.'
      );
      return;
    }

    // 4. Validate DBBL Bank Transfer Fields if selected
    if (selectedPayment === 'dbbl') {
      if (!transactionId.trim() || transactionId.trim().length < 4) {
        setErrorMessage('Please enter your Bank / NexusPay Transaction ID (TrxID) of at least 4 characters.');
        return;
      }

      if (!senderAccountOrPhone.trim()) {
        setErrorMessage('Please enter your Sender Account Number or Mobile Number for payment verification.');
        return;
      }
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      localStorage.setItem(LAST_ORDER_KEY, Date.now().toString());

      if (selectedPayment === 'dbbl') {
        setProcessingStatusText('Recording DBBL bank transfer details & generating order voucher...');
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newOrder = await createOrder({
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          customer: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            district: district.trim(),
            deliveryZone,
            fullAddress: address.trim(),
            notes: notes.trim(),
            email: currentUser?.email,
            userId: currentUser?.id,
          },
          items: [...cart],
          subtotal: cartSubtotal,
          deliveryFee,
          totalAmount: grandTotal,
          couponCode: appliedCoupon?.code,
          discountAmount: effectiveDiscount,
          paymentMethod: 'dbbl',
          paymentStatus: 'UNVERIFIED',
          transactionId: transactionId.trim(),
          dbblDetails: {
            senderBank: senderBank.trim() || 'Dutch-Bangla Bank / NexusPay',
            senderAccountOrPhone: senderAccountOrPhone.trim(),
            transactionId: transactionId.trim(),
            depositSlipUrl: depositSlipUrl || undefined,
          },
        });

        setIsSubmitting(false);
        setProcessingStatusText('');
        setIsCartOpen(false);
        setStep('cart');
        setRecentSuccessOrder(newOrder);
      } else {
        // Cash on Delivery (COD) Flow
        const newOrder = await createOrder({
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          customer: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            district: district.trim(),
            deliveryZone,
            fullAddress: address.trim(),
            notes: notes.trim(),
            email: currentUser?.email,
            userId: currentUser?.id,
          },
          items: [...cart],
          subtotal: cartSubtotal,
          deliveryFee,
          totalAmount: grandTotal,
          couponCode: appliedCoupon?.code,
          discountAmount: effectiveDiscount,
          paymentMethod: 'cod',
          paymentStatus: 'DUE',
        });

        setIsSubmitting(false);
        setIsCartOpen(false);
        setStep('cart');
        setRecentSuccessOrder(newOrder);
      }
    } catch (err) {
      setIsSubmitting(false);
      setProcessingStatusText('');
      setErrorMessage('An unexpected error occurred while placing your order. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              <h2 className="font-display font-bold text-lg text-slate-800">
                {step === 'cart' ? `Shopping Cart (${cartCount})` : 'Delivery & Checkout'}
              </h2>
            </div>
            <button
              id="close-cart-drawer-btn"
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-700 text-lg">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore our premium Men's Accessories, Modern Gadgets, and Handpicked Gifts.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : step === 'cart' ? (
              /* Step 1: Cart Items List */
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 relative group"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {item.product.title}
                      </h4>
                      <p className="text-xs text-rose-600 font-bold font-display mt-0.5">
                        ৳ {item.product.price.toLocaleString()} BDT
                      </p>
                      {(item.selectedSize || item.selectedColor) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {item.selectedSize && (
                            <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded-md">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md">
                              Color: {item.selectedColor}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.quantity - 1)
                            }
                            className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Total: ৳ {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Promo Code / Coupon Section */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <TicketPercent className="w-4 h-4 text-rose-500" />
                        Have a Promo Code / Voucher?
                      </span>
                      {appliedCoupon && (
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-[10px] font-bold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {appliedCoupon ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold font-mono uppercase">{appliedCoupon.code}</span>
                            <span className="text-[11px] block text-emerald-700">
                              {appliedCoupon.description} (-৳ {effectiveDiscount.toLocaleString()} BDT)
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            id="cart-coupon-input"
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                            placeholder="Enter promo code or voucher"
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyPromo()}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
                          >
                            Apply
                          </button>
                        </div>

                        {promoFeedback && (
                          <p
                            className={`text-[11px] font-medium ${
                              promoFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {promoFeedback.text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2: Checkout Form */
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                {/* Honeypot field for bot protection */}
                <input
                  type="text"
                  name="website_anti_bot"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none', position: 'absolute', opacity: 0 }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {processingStatusText && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>{processingStatusText}</span>
                  </div>
                )}

                {/* Shipping Zone Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Delivery Zone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryZone('inside_dhaka')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deliveryZone === 'inside_dhaka'
                          ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">
                        Inside Dhaka
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 block mt-0.5">
                        ৳ {settings.insideDhakaFee} BDT (24-48h)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryZone('outside_dhaka')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        deliveryZone === 'outside_dhaka'
                          ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">
                        Outside Dhaka
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 block mt-0.5">
                        ৳ {settings.outsideDhakaFee} BDT (48-72h)
                      </span>
                    </button>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Customer & Delivery Details
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="customer-fullname-input"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tanvir Hossain"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Phone Number (11-digit) *
                    </label>
                    <input
                      id="customer-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      maxLength={14}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        District / City *
                      </label>
                      <input
                        id="customer-district-input"
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Dhaka / Chittagong / ..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Zone
                      </label>
                      <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 capitalize">
                        {deliveryZone === 'inside_dhaka' ? 'Inside Dhaka (৳80)' : 'Outside Dhaka (৳150)'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Complete Street Address *
                    </label>
                    <textarea
                      id="customer-address-input"
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / Road / Sector / Thana (e.g. Sector 3, Uttara, Dhaka 1230)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Order Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special delivery instructions or gift wrapping notes"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* PAYMENT METHOD SELECTION (ZERO-FEE DIRECT DBBL BANK TRANSFER & CASH ON DELIVERY) */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Payment Method
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Option 1: Cash on Delivery */}
                    <button
                      id="pay-method-cod-btn"
                      type="button"
                      onClick={() => setSelectedPayment('cod')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPayment === 'cod'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          Cash on Delivery
                        </span>
                        {selectedPayment === 'cod' && (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Pay cash upon parcel arrival
                      </span>
                    </button>

                    {/* Option 2: Direct Dutch-Bangla Bank Transfer / NexusPay */}
                    <button
                      id="pay-method-dbbl-btn"
                      type="button"
                      onClick={() => setSelectedPayment('dbbl')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPayment === 'dbbl'
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          DBBL / NexusPay
                        </span>
                        {selectedPayment === 'dbbl' && (
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Direct Bank & Bangla QR
                      </span>
                    </button>
                  </div>

                  {/* INLINE DBBL DIRECT BANK TRANSFER & NEXUSPAY DETAILS */}
                  {selectedPayment === 'dbbl' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-4">
                      {/* Bank Header */}
                      <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                            DBBL
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white leading-tight">
                              {dbblBank.bankName}
                            </h5>
                            <span className="text-[10px] text-indigo-300">
                              NexusPay & Bank Transfer (0% Fee)
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                          Zero Surcharge
                        </span>
                      </div>

                      {/* Dynamic Bank Account Information Card */}
                      <div className="p-3 bg-slate-800/80 rounded-xl border border-indigo-900/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Account Name:</span>
                          <span className="font-bold text-white">{dbblBank.accountHolderName}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 px-2.5 bg-slate-900/90 rounded-lg border border-indigo-500/40">
                          <div>
                            <span className="text-[10px] text-indigo-300 uppercase tracking-wider block font-medium">
                              DBBL Account Number
                            </span>
                            <span className="font-mono font-extrabold text-sm text-amber-300 tracking-wider">
                              {dbblBank.accountNumber}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyAccountNumber}
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedAccount ? 'Copied!' : 'Copy'}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-700/60">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Branch:</span>
                            <span className="text-slate-200 font-medium">{dbblBank.branchName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Routing No:</span>
                            <span className="font-mono text-slate-200 font-medium">{dbblBank.routingNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Instructions & QR Code Preview */}
                      <div className="flex items-start gap-3 p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-[11px]">
                        {dbblBank.qrCodeUrl && (
                          <div className="shrink-0 text-center">
                            <img
                              src={dbblBank.qrCodeUrl}
                              alt="NexusPay QR Code"
                              className="w-14 h-14 rounded-lg bg-white p-1 object-contain cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setShowQrModal(true)}
                              title="Click to zoom QR Code"
                            />
                            <span className="text-[9px] text-indigo-300 block mt-0.5">NexusPay QR</span>
                          </div>
                        )}
                        <p className="text-slate-300 leading-relaxed text-[11px] flex-1">
                          {dbblBank.instructions}
                        </p>
                      </div>

                      {/* Customer DBBL Transfer Verification Form */}
                      <div className="space-y-2.5 pt-1">
                        <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                          Provide Your Transfer Verification Details
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Sender Bank / App *
                            </label>
                            <select
                              value={senderBank}
                              onChange={(e) => setSenderBank(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="NexusPay App">NexusPay App</option>
                              <option value="DBBL Rocket">DBBL Rocket</option>
                              <option value="Dutch-Bangla Bank Net Banking">Dutch-Bangla Net Banking</option>
                              <option value="City Touch / City Bank">City Touch / City Bank</option>
                              <option value="BRAC Bank / Astha">BRAC Bank / Astha</option>
                              <option value="Islami Bank / CellFin">Islami Bank / CellFin</option>
                              <option value="bKash to Bank">bKash (Send to Bank)</option>
                              <option value="Nagad to Bank">Nagad (Send to Bank)</option>
                              <option value="Other Bank (BEFTN/NPSB)">Other Bank (BEFTN/NPSB)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-300 mb-1">
                              Sender Account / Mobile No *
                            </label>
                            <input
                              id="sender-account-input"
                              type="text"
                              value={senderAccountOrPhone}
                              onChange={(e) => setSenderAccountOrPhone(e.target.value)}
                              placeholder="e.g. 017xxxxxxxx or Acc No"
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required={selectedPayment === 'dbbl'}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Bank Transaction ID (TrxID / Ref) *
                          </label>
                          <input
                            id="dbbl-transaction-id-input"
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="e.g. DBBL-9284102 or NPSB Trx ID"
                            className="w-full px-3 py-2 bg-slate-800 border border-indigo-500/50 rounded-xl text-xs font-mono font-bold text-amber-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                            required={selectedPayment === 'dbbl'}
                          />
                        </div>

                        {/* Deposit Slip Upload (Optional) */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            Upload Payment Screenshot / Deposit Slip (Optional)
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl text-xs text-slate-300 cursor-pointer flex items-center justify-center gap-2 transition-colors">
                              <Upload className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{depositSlipUrl ? 'Change Screenshot' : 'Choose Image File'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleSlipUpload}
                                className="hidden"
                              />
                            </label>
                            {depositSlipUrl && (
                              <button
                                type="button"
                                onClick={() => setDepositSlipUrl('')}
                                className="px-2.5 py-2 rounded-xl bg-rose-900/60 text-rose-300 hover:bg-rose-900 text-xs font-bold transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          {depositSlipUrl && (
                            <div className="mt-2 p-1.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center gap-2">
                              <img
                                src={depositSlipUrl}
                                alt="Slip preview"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-600"
                              />
                              <span className="text-[10px] text-emerald-400 font-medium">
                                Screenshot attached ready for admin review
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800">
                        <span className="flex items-center gap-1 text-indigo-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          Admin Verified Manual Deposit
                        </span>
                        <span className="text-amber-400">Order Status: UNVERIFIED</span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Footer Summary & Actions */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    ৳ {cartSubtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold text-slate-800">
                    ৳ {deliveryFee.toLocaleString()}
                  </span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      Promo Discount ({appliedCoupon?.code}):
                    </span>
                    <span>-৳ {effectiveDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-rose-600 font-display">
                    ৳ {grandTotal.toLocaleString()} BDT
                  </span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  id="cart-proceed-checkout-btn"
                  onClick={() => {
                    setStep('checkout');
                    trackEvent(
                      'InitiateCheckout',
                      {
                        content_ids: cart.map((i) => i.product.id),
                        contents: cart.map((i) => ({
                          id: i.product.id,
                          name: i.product.title,
                          price: i.product.price,
                          quantity: i.quantity,
                        })),
                        num_items: cartCount,
                        value: grandTotal,
                        currency: 'BDT',
                      },
                      {
                        fullName,
                        phone,
                        district,
                        deliveryZone,
                        email: currentUser?.email,
                      }
                    );
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  Proceed to Checkout ({cartCount} Items)
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    id="place-order-submit-btn"
                    form="checkout-form"
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                        <span>Placing Order...</span>
                      </>
                    ) : selectedPayment === 'cod' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirm Order (Cash on Delivery)</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span>Submit DBBL Transfer (৳ {grandTotal.toLocaleString()})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Zoom Modal */}
      {showQrModal && dbblBank.qrCodeUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">NexusPay / Bangla QR</h4>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={dbblBank.qrCodeUrl}
              alt="Scan with NexusPay"
              className="w-56 h-56 mx-auto rounded-xl border border-slate-200"
            />
            <p className="text-xs text-slate-500">
              Scan using NexusPay, Dutch-Bangla Net Banking, or any Bangladeshi bank app supporting Bangla QR.
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
