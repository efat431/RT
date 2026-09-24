import { Order } from '../types';
import { getAuthToken } from './authApi';

export interface OrderApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  orders?: Order[];
  order?: Order;
  data?: T;
  trackingCode?: string;
  tracking_code?: string;
  consignmentId?: string;
  consignment_id?: string;
}

const API_BASE = '/api';

function getHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Client service to communicate with Cloudflare D1 Database via Cloudflare Worker/API.
 * Strongly validates HTTP status, JSON payload, and D1 database responses.
 */
export const orderApi = {
  /**
   * Fetches all orders from Cloudflare D1 central database
   */
  async getOrders(search?: string): Promise<{ success: boolean; orders: Order[]; error?: string }> {
    try {
      const url = new URL(`${API_BASE}/orders`, window.location.origin);
      if (search) url.searchParams.set('search', search);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: Failed to fetch orders from D1 (${errorText || res.statusText})`);
      }

      const data: OrderApiResponse = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        return { success: true, orders: data.orders };
      }
      return { success: false, orders: [], error: data.error || 'Invalid orders payload returned by server' };
    } catch (err: any) {
      console.warn('orderApi.getOrders error:', err?.message || err);
      return { success: false, orders: [], error: err?.message || 'Network error fetching orders' };
    }
  },

  /**
   * Permanently saves a new order to Cloudflare D1 database.
   * Awaits D1 confirmation and returns the canonical inserted order.
   */
  async createOrder(order: Order): Promise<OrderApiResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ order }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: Database rejected order creation`;
        return { success: false, error: errorMsg };
      }

      return {
        success: true,
        order: data.order || order,
        message: data.message || 'Order successfully persisted in Cloudflare D1',
      };
    } catch (err: any) {
      console.error('orderApi.createOrder error:', err);
      return { success: false, error: err?.message || 'Network error creating order' };
    }
  },

  /**
   * Updates an existing order in Cloudflare D1 database.
   * Strongly verifies response and returns updated canonical order.
   */
  async updateOrder(orderId: string, updates: Partial<Order>): Promise<OrderApiResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ updates }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: Failed to update order in D1`;
        return { success: false, error: errorMsg };
      }

      return {
        success: true,
        order: data.order,
        message: data.message || 'Order successfully updated in Cloudflare D1',
      };
    } catch (err: any) {
      console.error('orderApi.updateOrder error:', err);
      return { success: false, error: err?.message || 'Network error updating order' };
    }
  },

  /**
   * Permanently deletes an order from Cloudflare D1 database.
   */
  async deleteOrder(orderId: string): Promise<OrderApiResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        headers: getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || `HTTP ${res.status}: Failed to delete order` };
      }

      return { success: true, message: data.message || 'Order deleted from D1' };
    } catch (err: any) {
      console.error('orderApi.deleteOrder error:', err);
      return { success: false, error: err?.message || 'Network error deleting order' };
    }
  },

  /**
   * Dispatches parcel via secure server-side proxy (keeps credentials safe on Cloudflare)
   */
  async dispatchCourier(order: Order): Promise<OrderApiResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE}/courier/dispatch`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ order }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || `HTTP ${res.status}: Courier dispatch rejected`,
        };
      }

      return {
        success: true,
        trackingCode: data.tracking_code || data.trackingCode,
        consignmentId: data.consignment_id || data.consignmentId,
        data: data.data,
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error dispatching courier' };
    }
  },

  /**
   * Checks courier parcel tracking status via secure server-side proxy
   */
  async checkCourierStatus(consignmentId: string): Promise<any> {
    try {
      const url = new URL(`${API_BASE}/courier/status/${encodeURIComponent(consignmentId)}`, window.location.origin);
      const res = await fetch(url.toString(), {
        headers: getHeaders(),
      });
      return await res.json().catch(() => ({ success: false }));
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },
};
