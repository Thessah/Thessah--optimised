import React, { useState } from 'react';
import { X } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import Image from 'next/image';
import GoogleIcon from '../assets/google.png';
import LeftImage from '../assets/popup/imagepop.png';
import axios from 'axios';

const SignInModal = ({ open, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const validateEmail = (email) => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleGoogleSignIn = async () => {
    console.log('Google sign-in clicked');
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if welcome bonus was claimed from top bar
      const bonusClaimed = localStorage.getItem('welcomeBonusClaimed');
      if (bonusClaimed === 'true') {
        // Mark user as eligible for free shipping on first order
        localStorage.setItem('freeShippingEligible', 'true');
        localStorage.removeItem('welcomeBonusClaimed');
      }
      
      // Send welcome email for new users
      try {
        const token = await result.user.getIdToken();
        await axios.post('/api/send-welcome-email', {
          email: result.user.email,
          name: result.user.displayName
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the signup if email fails
      }
      
      onClose();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err?.message || 'Google sign-in failed');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setError('');
    if (!email) {
      setError('Enter your email to reset password.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister) {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }
    setLoading(true);
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        
        // Check if welcome bonus was claimed from top bar
        const bonusClaimed = localStorage.getItem('welcomeBonusClaimed');
        if (bonusClaimed === 'true') {
          // Mark user as eligible for free shipping on first order
          localStorage.setItem('freeShippingEligible', 'true');
          localStorage.removeItem('welcomeBonusClaimed');
        }
        
        // Send welcome email for new registrations
        try {
          const token = await userCredential.user.getIdToken();
          await axios.post('/api/send-welcome-email', {
            email: email,
            name: name
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the signup if email fails
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left visual panel */}
          <div className="relative hidden md:block bg-[#008C6D]">
            <Image
              src={LeftImage}
              alt="Welcome"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-90"
              priority
            />
          </div>

          {/* Right form panel */}
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-10 h-10 rounded-full bg-[#008C6D]/10 flex items-center justify-center mb-3">
                <span className="text-[#008C6D] font-bold">✨</span>
              </div>
              <h2 className="text-2xl font-bold">{isRegister ? 'Create your account' : 'Hello Again!'}</h2>
              <p className="text-sm text-gray-500 mt-1">{isRegister ? 'Sign up with email' : 'Sign in with email'}</p>
            </div>

            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full Name"
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {isRegister && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              )}

              {!isRegister && (
                <div className="flex justify-end">
                  <button type="button" onClick={handleResetPassword} className="text-xs text-[#008C6D] hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="bg-[#008C6D] hover:bg-[#00745A] text-white font-semibold py-2.5 rounded-lg transition text-base"
                disabled={loading}
              >
                {isRegister ? 'Sign Up' : 'Login'}
              </button>
            </form>

            {error && (
              <div className={`text-center text-xs mt-2 ${error.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-4 text-sm font-medium bg-white hover:bg-gray-50 transition shadow-sm"
              disabled={loading}
            >
              <Image src={GoogleIcon} alt="Google" width={20} height={20} style={{objectFit:'contain'}} />
              <span className="text-gray-700">Continue with Google</span>
            </button>

            <div className="text-center mt-4">
              <button
                className="text-sm text-[#008C6D] hover:underline font-medium"
                onClick={() => setIsRegister(v => !v)}
                type="button"
              >
                {isRegister ? 'Already have an account? Sign in' : 'New user? Create an account'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              By continuing, you agree to our <a href="/terms" className="underline">Terms of Use</a> and <a href="/privacy-policy" className="underline">Privacy Policy</a>.
            </p>

            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;
