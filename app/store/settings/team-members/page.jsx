'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2, UserPlus, Mail, Shield, User, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function TeamMembers() {
  const { user, getToken } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/store/team-members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setInviting(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        '/api/store/team-members',
        {
          email: inviteEmail.trim(),
          role: inviteRole,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);

      // Refresh list
      fetchTeamMembers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const token = await getToken();
      await axios.delete(`/api/store/team-members?id=${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Member removed');
      fetchTeamMembers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const token = await getToken();
      await axios.put(
        '/api/store/team-members',
        {
          memberId,
          role: newRole,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Role updated');
      fetchTeamMembers();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update role');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'invited':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col gap-2 p-6 shadow-sm">
        <Link
          href="/store/settings"
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-center hover:bg-gray-200 transition text-sm font-medium"
        >
          Settings
        </Link>
        <Link
          href="/store/settings/team-members"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-center hover:bg-blue-700 transition text-sm font-medium"
        >
          Team Members
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h1>
            <p className="text-gray-600">Manage who has access to your store and invite new team members.</p>
          </div>

          {/* Invite Button */}
          {!showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition mb-8"
            >
              <UserPlus className="w-5 h-5" />
              Invite Team Member
            </button>
          )}

          {/* Invite Form */}
          {showInviteForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Send Invite</h2>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="team@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    disabled={inviting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    disabled={inviting}
                  >
                    <option value="member">Member (view & edit products)</option>
                    <option value="admin">Admin (full access)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    • <strong>Member:</strong> Can add/edit products and view orders<br />
                    • <strong>Admin:</strong> Can manage all settings and team members
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                  >
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteForm(false);
                      setInviteEmail('');
                      setInviteRole('member');
                    }}
                    disabled={inviting}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Team Members List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Team Members ({teamMembers.length})
              </h2>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-gray-600">
                <p>Loading team members...</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-600">
                <p>No team members yet. Invite someone to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{member.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(member.status)}`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-100 text-red-600 font-medium transition text-sm"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Team Member Permissions</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li><strong>Member:</strong> Can create and edit products, view orders and analytics</li>
              <li><strong>Admin:</strong> Can manage all settings, invite team members, and access billing</li>
              <li><strong>Pending invites expire in 7 days</strong> — send a reminder if not accepted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
