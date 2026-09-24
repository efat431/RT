import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Star,
  ShoppingCart,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Images,
  Heart,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  Trash2,
  Share2,
  Link,
} from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { FormattedDescription } from './FormattedDescription';
import { ConfirmModal } from './ConfirmModal';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const {
    addToCart,
    quickBuy,
    categories,
    settings,
    wishlist,
    toggleWishlist,
    reviews,
    addProductReview,
    deleteProductReview,
    copyProductLink,
    currentUser,
    isAdminLoggedIn,
    hasPermission,
    trackEvent,
  } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [addedNotice, setAddedNotice] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

  // Track ViewContent event to Meta, TikTok, and GTM
  useEffect(() => {
    if (product) {
      trackEvent('ViewContent', {
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'BDT',
      });
    }
  }, [product?.id]);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Permission to manage/delete reviews
  const canDeleteReview = Boolean(
    isAdminLoggedIn ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'sub_admin' && hasPermission('canManageProducts'))
  );

  // Extract all images (primary + any gallery photos)
  const imageList = useMemo(() => {
    if (!product) return [];
    const set = new Set<string>();
    if (product.imageUrl) set.add(product.imageUrl.trim());
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && img.trim()) set.add(img.trim());
      });
    }
    return Array.from(set);
  }, [product]);

  // Reset selected image, tab, size, color, and quantity when product changes
  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    setActiveTab('overview');
    setReviewSuccessMsg('');
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    } else {
      setSelectedSize(undefined);
    }
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(undefined);
    }
    if (currentUser?.name) {
      setReviewAuthor(currentUser.name);
    } else {
      setReviewAuthor('');
    }
  }, [product?.id, currentUser]);

  // Lock body scroll and handle Escape key while modal is active
  useEffect(() => {
    if (!product) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose]);

  // If no product is selected, render nothing (all Hooks called above)
  if (!product) return null;

  const category = categories.find((c) => c.id === product.categoryId);
  const activeImage = imageList[selectedImageIdx] || product.imageUrl;
  const isSavedInWishlist = wishlist.includes(product.id);
  const productReviews = Array.isArray(reviews)
    ? reviews.filter((r) => r && r.productId === product.id)
    : [];

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 800);
  };

  const handleQuickBuy = () => {
    quickBuy(product, selectedSize, selectedColor);
    onClose();
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !reviewComment.trim()) return;

    addProductReview({
      productId: product.id,
      author: reviewAuthor.trim() || 'Verified Shopper',
      rating: reviewRating,
      comment: reviewComment.trim(),
      verifiedPurchase: true,
    });

    setReviewComment('');
    setReviewSuccessMsg('Thank you! Your verified review has been submitted.');
    setTimeout(() => setReviewSuccessMsg(''), 4000);
  };

  return createPortal(
    <div
      id="quick-view-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[99999] flex items-start sm:items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] flex flex-col md:flex-row">
        <button
          id="close-quick-view-btn"
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 z-30 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image Container with Gallery Slideshow */}
        <div className="relative bg-slate-100 flex flex-col justify-between overflow-hidden md:w-1/2 shrink-0">
          <div className="relative aspect-4/3 sm:aspect-square md:aspect-auto md:h-full w-full max-h-56 sm:max-h-72 md:max-h-none overflow-hidden flex items-center justify-center bg-slate-900/5">
            <img
              src={activeImage}
              alt={`${product.title} - photo ${selectedImageIdx + 1}`}
              className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
            />

            {/* Stock Badges */}
            {product.stock <= 5 && product.stock > 0 && (
              <span className="absolute top-3.5 left-3.5 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-md z-10">
                Only {product.stock} Left!
              </span>
            )}
            {product.stock === 0 && (
              <span className="absolute top-3.5 left-3.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-white text-[11px] font-bold shadow-md z-10">
                Out of Stock
              </span>
            )}

            {/* Wishlist Button Overlay */}
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-3.5 right-12 sm:right-14 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
                isSavedInWishlist
                  ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-500'
                  : 'bg-white/90 hover:bg-white text-slate-600 hover:text-rose-600'
              }`}
              title={isSavedInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label="Toggle Wishlist"
            >
              <Heart className={`w-4 h-4 ${isSavedInWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* Prev / Next Arrows if multiple images */}
            {imageList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIdx((prev) =>
                      prev > 0 ? prev - 1 : imageList.length - 1
                    );
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-transform hover:scale-110 z-10 cursor-pointer"
                  title="Previous photo"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIdx((prev) =>
                      prev < imageList.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-transform hover:scale-110 z-10 cursor-pointer"
                  title="Next photo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Photo Counter */}
                <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs z-10">
                  <Images className="w-3.5 h-3.5 text-rose-400" />
                  {selectedImageIdx + 1} / {imageList.length}
                </span>
              </>
            )}
          </div>

          {/* Thumbnail Strip if multiple images are provided */}
          {imageList.length > 1 && (
            <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selectedImageIdx === idx
                      ? 'border-rose-600 ring-2 ring-rose-200 scale-105'
                      : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400'
                  }`}
                  title={`View photo ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details Container with Internal Smooth Scroll */}
        <div className="p-4 sm:p-6 md:p-7 flex flex-col justify-between space-y-4 md:w-1/2 overflow-y-auto max-h-[calc(100vh-14rem)] md:max-h-[calc(100vh-2.5rem)]">
          <div>
            {category && (
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-lg">
                {category.name}
              </span>
            )}
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-display text-slate-900 mt-2">
              {product.title}
            </h2>

            {/* Star Rating & Reviews Tab Trigger */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <div
                onClick={() => setActiveTab('reviews')}
                className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {typeof product.rating === 'number' ? product.rating.toFixed(1) : product.rating}
                </span>
                <span className="text-xs text-rose-600 underline font-semibold">
                  ({productReviews.length} {productReviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyProductLink(product.id)}
                  title="Copy direct product link to clipboard"
                  className="text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Share URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                    isSavedInWishlist
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSavedInWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isSavedInWishlist ? 'Saved' : 'Wishlist'}</span>
                </button>
              </div>
            </div>

            {/* Price & Discount Percentage */}
            <div className="flex items-center gap-2.5 flex-wrap mt-3.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900">
                ৳ {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm sm:text-base font-semibold text-slate-400 line-through">
                  ৳ {product.originalPrice.toLocaleString()}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider text-white bg-rose-600 shadow-xs flex items-center gap-1">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* View Switcher Tabs: Overview vs Reviews */}
            <div className="flex items-center gap-2 mt-4 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Product Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Customer Reviews ({productReviews.length})
              </button>
            </div>

            {/* Tab 1: Overview with Formatted Description */}
            {activeTab === 'overview' && (
              <div className="mt-3 space-y-3 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                <FormattedDescription content={product.description} />

                {product.specs && product.specs.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Key Specifications
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {product.specs.map((sp, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {sp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Reviews & Add Review Form */}
              {activeTab === 'reviews' && (
                <div className="mt-3 space-y-3 max-h-56 overflow-y-auto pr-1">
                  {/* Write a Review Box */}
                  <form
                    onSubmit={handleReviewSubmit}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Write a Customer Review
                      </span>
                      {/* Interactive Star Picker */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= reviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        placeholder="Your Name (e.g. Tanvir Ahmed)"
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <textarea
                        rows={2}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this item..."
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      {reviewSuccessMsg ? (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {reviewSuccessMsg}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Your review will help other Bangladeshi shoppers.
                        </span>
                      )}
                      <button
                        type="submit"
                        className="px-3 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Submit
                      </button>
                    </div>
                  </form>

                  {/* Reviews List */}
                  <div className="space-y-2">
                    {productReviews.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">
                        No reviews yet for this product. Be the first to review!
                      </p>
                    ) : (
                      productReviews.map((r) => (
                        <div
                          key={r.id}
                          className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-2xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800">
                                {r.author}
                              </span>
                              {r.verifiedPurchase && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < r.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">{r.comment}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100/60">
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '')}
                            </span>
                            {canDeleteReview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Delete Customer Review?',
                                    message: `Are you sure you want to delete this review by "${r.author || r.authorName || 'Shopper'}"?`,
                                    confirmText: 'Delete Review',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      deleteProductReview(r.id);
                                    },
                                  });
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                                title="Delete this review (Admin action)"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Review</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Variant Selectors: Size & Color */}
            {((product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)) && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Available Sizes:
                      </span>
                      <span className="text-xs font-extrabold text-rose-600">
                        {selectedSize ? `Selected: ${selectedSize}` : 'Choose a size'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-slate-900 text-white shadow-xs scale-105 ring-2 ring-slate-900/20'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Available Colors:
                      </span>
                      <span className="text-xs font-extrabold text-rose-600">
                        {selectedColor ? `Selected: ${selectedColor}` : 'Choose a color'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.colors.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedColor === col
                              ? 'bg-rose-600 text-white shadow-xs scale-105 ring-2 ring-rose-300'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${selectedColor === col ? 'bg-white' : 'bg-rose-500'}`} />
                          <span>{col}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors font-bold disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-slate-800 bg-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="modal-add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="py-3 px-4 rounded-xl border-2 border-rose-500 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-95 transition-all disabled:opacity-50"
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  id="modal-quick-buy-btn"
                  onClick={handleQuickBuy}
                  disabled={product.stock === 0}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-black active:bg-slate-950 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  Buy Now
                </button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-slate-500 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>Fast BD Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>100% Authentic</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>Easy 7-Day Return</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Confirm Modal for QuickView */}
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
        />
      </div>,
      document.body
    );
  };
