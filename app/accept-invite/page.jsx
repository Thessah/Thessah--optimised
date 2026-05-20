'use client';
import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, getToken } = useAuth();
  
  const [status, setStatus] = useState('loading'); // loading, success, error, accepting
  const [inviteData, setInviteData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No invite token provided');
      return;
    }

    if (!user) {
      // User not authenticated - redirect to login with return URL
      router.push(`/auth/signin?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }

    // Verify and process the invite
    processInvite();
  }, [token, user, router]);

  const processInvite = async () => {
    try {
      setStatus('accepting');
      const authToken = await getToken();

      // Call API to accept invite
      const { data } = await axios.post(
        '/api/store/accept-invite',
        { inviteToken: token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setInviteData(data);
      setStatus('success');
      
      // Redirect to store dashboard after 2 seconds
      setTimeout(() => {
        router.push('/store/dashboard');
      }, 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(
        error?.response?.data?.error ||
        error.message ||
        'Failed to process invite'
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Invite</h1>
            <p className="text-gray-600">Please wait while we process your invitation...</p>
          </div>
        )}

        {status === 'accepting' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accepting Invite</h1>
            <p className="text-gray-600">Setting up your access...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome! 🎉</h1>
            <p className="text-gray-600 mb-4">
              You've successfully accepted the invite to join the store.
            </p>
            {inviteData?.storeName && (
              <p className="text-sm text-gray-500 mb-6">
                <strong>Store:</strong> {inviteData.storeName}
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to your dashboard...
            </p>
            <Link
              href="/store/dashboard"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Invalid</h1>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                This invite may have expired or is no longer valid.
              </p>
              <p className="text-sm text-gray-500">
                Ask the store owner to send you a new invite.
              </p>
            </div>
            <div className="mt-6 space-y-2">
              <Link
                href="/store/dashboard"
                className="block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/"
                className="block px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
              >
                Home
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AcceptInvite() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading invitation...</p>
          </div>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
