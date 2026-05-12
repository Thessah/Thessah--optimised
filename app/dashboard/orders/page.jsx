'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Loading from '@/components/Loading'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import DashboardSidebar from '@/components/DashboardSidebar'

export default function DashboardOrdersPage() {
  const [user, setUser] = useState(undefined)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [buyNowGlobalEnabled, setBuyNowGlobalEnabled] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null))
    return () => unsub()
  }, [])

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return
      try {
        setLoadingOrders(true)
        const token = await auth.currentUser.getIdToken(true)
        const { data } = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const list = Array.isArray(data?.orders) ? data.orders : (Array.isArray(data) ? data : [])
        setOrders(list)
      } catch (err) {
        console.error('[DASHBOARD ORDERS] Fetch error:', err?.response?.data || err.message)
        toast.error(err?.response?.data?.error || 'Failed to load orders')
      } finally {
        setLoadingOrders(false)
      }
    }
    loadOrders()
  }, [user])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await axios.get('/api/store/settings')
        setBuyNowGlobalEnabled(data?.settings?.buyNowGlobalEnabled !== false)
      } catch {
        setBuyNowGlobalEnabled(true)
      }
    }
    loadSettings()
  }, [])

  if (user === undefined) return <Loading />

  if (user === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-800 mb-3">Dashboard / {buyNowGlobalEnabled ? 'Orders' : 'Enquiries'}</h1>
        <p className="text-slate-600 mb-6">Please sign in to view your {buyNowGlobalEnabled ? 'orders' : 'enquiries'}.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg">Go to Home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-6">
      <DashboardSidebar />

        <main className="md:col-span-3">
          <h1 className="text-2xl font-semibold text-slate-800 mb-6">{buyNowGlobalEnabled ? 'My Orders' : 'My Enquiries'}</h1>
          {!buyNowGlobalEnabled && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Buy Now is disabled globally. Ordering is off; only enquiry mode is available.
            </div>
          )}
          {loadingOrders ? (
            <Loading />
          ) : orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <p className="text-slate-600">{buyNowGlobalEnabled ? 'No orders found.' : 'No enquiries found.'}</p>
              <Link href="/wishlist" className="inline-block mt-3 px-4 py-2 bg-slate-800 text-white rounded-lg">{buyNowGlobalEnabled ? 'Shop Now' : 'Go to Wishlist'}</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderId = order._id || order.id
                const isExpanded = expandedOrder === orderId
                const orderItems = order.orderItems || []
                const totalItems = orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
                
                return (
                  <div key={orderId} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Order Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Order ID</p>
                            <p className="font-semibold text-slate-800 break-all">{orderId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Date</p>
                            <p className="text-sm text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Total</p>
                            <p className="text-sm font-semibold text-slate-800">AED{(order.total || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Status</p>
                            <select
                              className={`inline-block px-3 py-1 text-xs font-medium rounded-full border focus:outline-none ${
                                order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                order.status === 'OUT_FOR_DELIVERY' ? 'bg-teal-100 text-teal-700' :
                                order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'WAREHOUSE_RECEIVED' ? 'bg-indigo-100 text-indigo-700' :
                                order.status === 'PICKED_UP' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'PICKUP_REQUESTED' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'WAITING_FOR_PICKUP' ? 'bg-yellow-50 text-yellow-700' :
                                order.status === 'CONFIRMED' ? 'bg-orange-100 text-orange-700' :
                                order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'RETURN_REQUESTED' ? 'bg-pink-100 text-pink-700' :
                                order.status === 'RETURNED' ? 'bg-pink-200 text-pink-800' :
                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}
                              value={order.status || 'ORDER_PLACED'}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  const token = await auth.currentUser.getIdToken(true);
                                  await axios.post('/api/orders/update-status', { orderId, status: newStatus }, {
                                    headers: { Authorization: `Bearer ${token}` },
                                  });
                                  toast.success('Order status updated!');
                                  setOrders((prev) => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
                                } catch (err) {
                                  toast.error(err?.response?.data?.error || 'Failed to update status');
                                }
                              }}
                            >
                              <option value="ORDER_PLACED">Order Placed</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="PICKUP_REQUESTED">Pickup Requested</option>
                              <option value="WAITING_FOR_PICKUP">Waiting for Pickup</option>
                              <option value="PICKED_UP">Picked Up</option>
                              <option value="WAREHOUSE_RECEIVED">Warehouse Received</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="RETURN_REQUESTED">Return Requested</option>
                              <option value="RETURNED">Returned</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : orderId)}
                            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                          {/* Pick Up Button: show if not picked up or shipped */}
                          {order.status !== 'PICKED_UP' && order.status !== 'SHIPPED' && order.status !== 'DELIVERED' && (
                            <button
                              className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
                              onClick={async () => {
                                try {
                                  const token = await auth.currentUser.getIdToken(true)
                                  await axios.post('/api/orders/pickup', { orderId }, {
                                    headers: { Authorization: `Bearer ${token}` },
                                  })
                                  toast.success('Pickup requested!')
                                  // Optionally refresh orders
                                  setOrders((prev) => prev.map(o => o._id === orderId ? { ...o, status: 'PICKED_UP' } : o))
                                } catch (err) {
                                  toast.error(err?.response?.data?.error || 'Failed to request pickup')
                                }
                              }}
                            >
                              Pick Up
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Details (Expandable) */}
                    {isExpanded && (
                      <div className="p-6 space-y-6">
                        {/* Products */}
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 mb-3">Order Items ({totalItems})</h3>
                          <div className="space-y-3">
                            {orderItems.map((item, idx) => {
                              const product = item.productId || item.product || {}
                              return (
                                <div key={idx} className="flex items-start gap-4 pb-3 border-b border-slate-100 last:border-0">
                                  <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {product.images?.[0] ? (
                                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-800 truncate">{product.name || 'Product'}</h4>
                                    <p className="text-sm text-slate-600 mt-1">Quantity: {item.quantity}</p>
                                    <p className="text-sm text-slate-600">Price: AED{(item.price || 0).toFixed(2)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-slate-800">AED{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Tracking Information */}
                        {(order.trackingId || order.trackingUrl || order.courier) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Tracking Information
                            </h3>
                            <div className="space-y-2 text-sm">
                              {order.courier && (
                                <div className="flex">
                                  <span className="text-slate-600 w-24">Courier:</span>
                                  <span className="font-medium text-slate-800">{order.courier}</span>
                                </div>
                              )}
                              {order.trackingId && (
                                <div className="flex">
                                  <span className="text-slate-600 w-24">Tracking ID:</span>
                                  <span className="font-mono font-medium text-slate-800">{order.trackingId}</span>
                                </div>
                              )}
                              {order.trackingUrl && (
                                <div className="flex">
                                  <span className="text-slate-600 w-24">Track Order:</span>
                                  <a 
                                    href={order.trackingUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    Click here to track
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Shipping Address */}
                        {(order.shippingAddress || order.addressId) && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800 mb-2">Shipping Address</h3>
                            <div className="text-sm text-slate-600 space-y-1">
                              {order.shippingAddress ? (
                                <>
                                  <p className="font-medium text-slate-800">{order.shippingAddress.name}</p>
                                  <p>{order.shippingAddress.street}</p>
                                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                                  <p>{order.shippingAddress.country}</p>
                                  {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                                </>
                              ) : order.addressId && (
                                <p>Address ID: {order.addressId.toString()}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Payment & Summary */}
                        <div className="border-t border-slate-200 pt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">Subtotal:</span>
                            <span className="text-slate-800">AED{((order.total || 0) - (order.shippingFee || 0)).toFixed(2)}</span>
                          </div>
                          {order.shippingFee > 0 && (
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-slate-600">Shipping:</span>
                              <span className="text-slate-800">AED{(order.shippingFee || 0).toFixed(2)}</span>
                            </div>
                          )}
                          {order.isCouponUsed && (
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-green-600">Discount Applied:</span>
                              <span className="text-green-600">-AED{(order.coupon?.discount || 0).toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-slate-800 pt-2 border-t border-slate-200">
                            <span>Total:</span>
                            <span>AED{(order.total || 0).toFixed(2)}</span>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-slate-600">Payment: </span>
                            <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                              {order.paymentMethod} {order.isPaid ? '(Paid)' : '(Pending)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    )
}
 
// fetch orders after user is known
// placed after component to avoid re-definition on every render
// but in Next.js client components, we can inline via useEffect above
// augment the existing effect to load orders
