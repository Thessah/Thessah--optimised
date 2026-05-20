"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { Lock, User, Mail, Eye, EyeOff } from "lucide-react";

export default function StoreSettings() {
  const { user, getToken } = useAuth();
  const [name, setName] = useState(user?.displayName || user?.name || "");
  const [image, setImage] = useState(user?.photoURL || user?.image || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  
  // Credentials section
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentialsData, setCredentialsData] = useState({
    username: "",
    credentialEmail: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    // Load store info from session
    const stored = localStorage.getItem('storeInfo');
    if (stored) {
      const info = JSON.parse(stored);
      setStoreInfo(info);
      setCredentialsData(prev => ({
        ...prev,
        username: info.username || "",
        credentialEmail: info.email || ""
      }));
    }
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      await axios.post("/api/store/profile/update", { name, image, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message);
    }
    setSaving(false);
  };

  const handleCredentialsUpdate = async (e) => {
    e.preventDefault();
    
    if (credentialsData.password !== credentialsData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (credentialsData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSavingCredentials(true);
    try {
      const token = await getToken();
      await axios.post("/api/store/credentials", {
        storeId: storeInfo?.id,
        username: credentialsData.username,
        email: credentialsData.credentialEmail,
        password: credentialsData.password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Login credentials updated successfully!");
      setCredentialsData({
        ...credentialsData,
        password: "",
        confirmPassword: ""
      });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update credentials");
    }
    setSavingCredentials(false);
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-56 bg-slate-50 border-r flex flex-col gap-2 p-6">
        <Link href="/store/settings" className="mb-2 px-4 py-2 rounded bg-blue-600 text-white text-center hover:bg-blue-700 transition">Settings</Link>
        <Link href="/store/settings/team-members" className="px-4 py-2 rounded bg-slate-200 text-slate-700 text-center hover:bg-slate-300 transition">Team Members</Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-start mt-10 p-6">
        <div className="max-w-2xl w-full space-y-6">
          {/* Profile Settings */}
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Store Profile Settings
            </h2>
            <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  required 
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Profile Image URL</span>
                <input 
                  type="text" 
                  value={image} 
                  onChange={e => setImage(e.target.value)} 
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  placeholder="https://ik.imagekit.io/..."
                />
              </label>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400" 
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile Changes"}
              </button>
            </form>
          </div>

          {/* Login Credentials */}
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lock className="w-6 h-6 text-red-600" />
                Login Credentials
              </h2>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showCredentials ? "Hide" : "Show"}
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              Set username and password for direct store dashboard access without email authentication
            </p>

            {showCredentials && (
              <form onSubmit={handleCredentialsUpdate} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </span>
                  <input 
                    type="text" 
                    value={credentialsData.username} 
                    onChange={e => setCredentialsData({...credentialsData, username: e.target.value})} 
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    placeholder="Choose a username"
                    required 
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email (Optional)
                  </span>
                  <input 
                    type="email" 
                    value={credentialsData.credentialEmail} 
                    onChange={e => setCredentialsData({...credentialsData, credentialEmail: e.target.value})} 
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    placeholder="email@example.com"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    New Password
                  </span>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={credentialsData.password} 
                      onChange={e => setCredentialsData({...credentialsData, password: e.target.value})} 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10" 
                      placeholder="••••••••"
                      minLength={6}
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">Minimum 6 characters</span>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={credentialsData.confirmPassword} 
                    onChange={e => setCredentialsData({...credentialsData, confirmPassword: e.target.value})} 
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    placeholder="••••••••"
                    minLength={6}
                    required 
                  />
                </label>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <strong>Note:</strong> After setting these credentials, you can login using username/password directly without Firebase authentication.
                </div>

                <button 
                  type="submit" 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2" 
                  disabled={savingCredentials}
                >
                  <Lock className="w-5 h-5" />
                  {savingCredentials ? "Updating..." : "Update Login Credentials"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

