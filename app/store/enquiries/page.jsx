'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/useAuth';
import Loading from '@/components/Loading';

export const dynamic = 'force-dynamic';

export default function EnquiriesPage() {
  const { user, getToken, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);

  const fetchEnquiries = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }

      const { data } = await axios.get('/api/store/enquiries', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEnquiries(data.enquiries || []);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load enquiries');
      setEnquiries([]);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchEnquiries();
  }, [authLoading, user]);

  const deleteEnquiry = async (id) => {
    if (!id) return;

    setDeletingId(id);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      await axios.delete('/api/store/enquiries', {
        headers: { Authorization: `Bearer ${token}` },
        data: { id },
      });

      setEnquiries((prev) => prev.filter((item) => item._id !== id));
      toast.success('Enquiry deleted');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to delete enquiry');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl text-slate-500">
          Enquiry <span className="text-slate-800 font-medium">Messages</span>
        </h1>
        <button
          onClick={() => fetchEnquiries(true)}
          disabled={refreshing}
          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {enquiries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          No enquiry messages yet.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {enquiries.map((item, idx) => (
                <tr key={item._id || idx} className="border-t border-gray-200 hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">{item.name || '-'}</td>
                  <td className="px-4 py-3">{item.email || '-'}</td>
                  <td className="px-4 py-3">{item.phone || '-'}</td>
                  <td className="px-4 py-3">{item.type || '-'}</td>
                  <td className="px-4 py-3 max-w-[420px]">
                    <p className="line-clamp-3 whitespace-pre-wrap">{item.message || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setConfirmDeleteItem(item)}
                      disabled={deletingId === item._id}
                      className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDeleteItem && (
        <div className="fixed inset-0 z-[1100] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Delete Enquiry</h3>
              <p className="text-sm text-slate-600 mt-1">
                This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete enquiry from <span className="font-semibold">{confirmDeleteItem.name || 'this customer'}</span>?
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                disabled={deletingId === confirmDeleteItem._id}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteItem._id;
                  await deleteEnquiry(id);
                  setConfirmDeleteItem(null);
                }}
                disabled={deletingId === confirmDeleteItem._id}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingId === confirmDeleteItem._id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
