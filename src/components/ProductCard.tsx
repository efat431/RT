import React, { useState } from 'react';
import { Star, ShoppingCart, ShoppingBag, Eye, Check, Images, Heart, Share2 } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    quickBuy,
    setQuickViewProduct,
    categories,
    wishlist,
    toggleWishlist,
    copyProductLink,
  } = useStore();
  const [isAdded, setIsAdded] = useState(false);

  const category = categories.find((c) => c.id === product.categoryId);
  const isSavedInWishlist = wishlist.includes(product.id);
  const hasVariants = Boolean(
    (product.sizes && product.sizes.length > 0) ||
    (product.colors && product.colors.length > 0)
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      setQuickViewProduct(product);
      return;
    }
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      setQuickViewProduct(product);
      return;
    }
    quickBuy(product);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;
  const hasMultipleImages = Boolean(product.images && product.images.length > 1);
  const secondaryImage = hasMultipleImages && product.images ? product.images[1] : null;

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div
      onClick={() => setQuickViewProduct(product)}
      className="group relative bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
    >
      {/* Dynamic Rainbow Top Accent on hover */}
      <div className="h-1 w-full bg-transparent group-hover:rainbow-gradient-bg transition-all duration-300" />

      {/* Image Container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
            secondaryImage ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
          }`}
        />

        {/* Alternate angle reveal on hover if multiple images exist */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.title} view 2`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}

        {/* Multiple Photos Indicator Badge */}
        {hasMultipleImages && (
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-xs z-10 transition-opacity group-hover:opacity-90">
            <Images className="w-3 h-3 text-rose-400" />
            {product.images?.length}
          </span>
        )}

        {/* Floating Action Buttons: Wishlist & Share Link */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 items-center">
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs ${
              isSavedInWishlist
                ? 'bg-white text-rose-500 shadow-md scale-105'
                : 'bg-white/80 hover:bg-white text-slate-500 hover:text-rose-500 opacity-90 group-hover:opacity-100'
            }`}
            title={isSavedInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Toggle Wishlist"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                isSavedInWishlist ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyProductLink(product.id);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Copy direct product link"
            aria-label="Share Link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider text-white bg-rose-600 shadow-sm flex items-center gap-1">
              {discountPercent}% OFF
            </span>
          )}
          {isLowStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm">
              Low Stock: {product.stock} left
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-sm">
              Sold Out
            </span>
          )}
          {hasVariants && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-xs">
              {product.sizes && product.sizes.length > 0 ? `${product.sizes.length} Sizes` : ''}
              {product.sizes && product.sizes.length > 0 && product.colors && product.colors.length > 0 ? ' • ' : ''}
              {product.colors && product.colors.length > 0 ? `${product.colors.length} Colors` : ''}
            </span>
          )}
        </div>

        {/* Quick View Button on hover (Desktop) */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
          <button
            type="button"
            id={`quick-view-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="px-4 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-xs transform translate-y-2 group-hover:translate-y-0 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Quick view product details"
          >
            <Eye className="w-4 h-4 text-rose-600" />
            <span>Quick View</span>
          </button>
        </div>

        {/* Mobile Quick View Action Badge (Visible on touch/small screens) */}
        <button
          type="button"
          id={`mobile-quick-view-btn-${product.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setQuickViewProduct(product);
          }}
          className="sm:hidden absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold shadow-md flex items-center gap-1 backdrop-blur-xs active:scale-95 transition-transform"
          title="Quick View"
          aria-label="Quick View"
        >
          <Eye className="w-3 h-3 text-rose-600" />
          <span>Quick View</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 text-xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 hover:text-rose-600 transition-colors uppercase tracking-wider truncate max-w-[55%]">
              {category ? category.name : 'Category'}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500 font-bold text-[10px] sm:text-xs shrink-0">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              <span>{typeof product.rating === 'number' ? product.rating.toFixed(1) : product.rating}</span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal hidden xs:inline">
                ({product.reviewsCount})
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-rose-600 transition-colors mt-1 line-clamp-2 leading-tight sm:leading-snug min-h-[2rem] sm:min-h-0">
            {product.title}
          </h3>

          {/* Description snippet */}
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed hidden xs:block">
            {product.description}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="pt-1.5 sm:pt-2 border-t border-slate-100 space-y-2 sm:space-y-3">
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1 sm:gap-1.5 truncate">
              <span className="text-sm sm:text-lg font-bold font-display text-slate-900">
                ৳ {product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through truncate">
                  ৳ {product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Two CTA buttons: Add to Cart & Quick Buy */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              id={`add-to-cart-btn-${product.id}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="py-1.5 sm:py-2 px-1 sm:px-2.5 rounded-lg sm:rounded-xl border border-rose-500 text-rose-600 hover:bg-rose-50 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95"
              title="Add to shopping cart"
            >
              {isAdded ? (
                <>
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Add</span>
                </>
              )}
            </button>

            <button
              id={`buy-now-btn-${product.id}`}
              onClick={handleQuickBuy}
              disabled={isOutOfStock}
              className="py-1.5 sm:py-2 px-1 sm:px-2.5 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-black active:bg-slate-950 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs hover:shadow-sm active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
              title="Buy now immediately"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
