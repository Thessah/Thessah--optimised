'use client'

import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Sparkles,
  Download,
  Copy,
  Loader2,
  Trash2,
  ImageIcon,
  RefreshCw,
  Upload,
  Wand2,
  LayoutTemplate,
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'

const DEFAULT_BRIEF = `Create a premium Instagram/Facebook daily gold rate post for THESSAH Gold & Jewellery.

Match the layout, colors, and style of the uploaded reference image as closely as possible.

Must include:
- THESSAH logo and brand name
- DAILY GOLD RATE UPDATE with today's date
- Live gold rates per gram (AED): 24K, 22K, 21K, 18K
- Gold bar icon for 24K, ring for 22K, necklace for 21K, bangle for 18K
- Footer: Visit THESSAH Today

Contact:
- +971 58 837 5912 | +971 4 272 4515
- info@thessah.ae | www.thessah.ae
- Hind Plaza 2, Shop No. 06, Gold Souq Extension, Al Ras, Deira, Dubai

Size: 1080×1350 portrait (4:5). Luxury Dubai gold souq quality.`

export default function AdsPostPage() {
  const { getToken } = useAuth()
  const fileInputRef = useRef(null)

  const [mode, setMode] = useState('template')
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [post, setPost] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [liveRates, setLiveRates] = useState(null)
  const [ratesLoading, setRatesLoading] = useState(true)

  const [referenceFile, setReferenceFile] = useState(null)
  const [referencePreview, setReferencePreview] = useState(null)
  const [customDetails, setCustomDetails] = useState(DEFAULT_BRIEF)
  const [includeRates, setIncludeRates] = useState(true)

  const fetchLiveRates = async () => {
    try {
      setRatesLoading(true)
      const res = await axios.get('/api/gold-rate')
      setLiveRates(res.data)
    } catch {
      toast.error('Could not load live gold rates')
    } finally {
      setRatesLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveRates()
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (referencePreview) URL.revokeObjectURL(referencePreview)
    }
  }, [])

  const setPostPreview = async (data, token) => {
    setPost(data)
    if (data.imageBase64) {
      const bytes = Uint8Array.from(atob(data.imageBase64), (c) => c.charCodeAt(0))
      setPreviewUrl(URL.createObjectURL(new Blob([bytes], { type: 'image/png' })))
    } else if (data.imageUrl && token) {
      const imageRes = await axios.get(data.imageUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        timeout: 30000,
      })
      setPreviewUrl(URL.createObjectURL(imageRes.data))
    } else {
      throw new Error('No image returned from server')
    }
  }

  const clearPost = async (postId, revokePreview = true) => {
    if (postId) {
      try {
        const token = await getToken()
        if (token) {
          await axios.delete(`/api/store/ads-post/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        }
      } catch {
        // temp file may already be gone
      }
    }
    if (revokePreview && previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setPost(null)
  }

  const handleReferenceChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Use PNG, JPG, or WebP')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Reference image must be under 8 MB')
      return
    }

    if (referencePreview) URL.revokeObjectURL(referencePreview)
    setReferenceFile(file)
    setReferencePreview(URL.createObjectURL(file))
  }

  const handleCreateTemplate = async () => {
    try {
      setGenerating(true)
      if (post?.postId) await clearPost(post.postId, true)

      const token = await getToken()
      if (!token) {
        toast.error('Please sign in again')
        return
      }

      const res = await axios.post(
        '/api/store/ads-post/generate',
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 90000 }
      )

      if (!res.data?.success) throw new Error(res.data?.error || 'Generation failed')

      await setPostPreview(res.data, token)
      toast.success(`Template post ready (${res.data.backgroundSource})`)
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.error || error.message || 'Failed to create post', {
        duration: 6000,
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateAi = async () => {
    if (!referenceFile) {
      toast.error('Upload a reference design image first')
      return
    }

    try {
      setGenerating(true)
      if (post?.postId) await clearPost(post.postId, true)

      const token = await getToken()
      if (!token) {
        toast.error('Please sign in again')
        return
      }

      const form = new FormData()
      form.append('referenceImage', referenceFile)
      form.append('customDetails', customDetails)
      form.append('includeRates', includeRates ? 'true' : 'false')

      const res = await axios.post('/api/store/ads-post/generate-ai', form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      })

      if (!res.data?.success) throw new Error(res.data?.error || 'AI generation failed')

      await setPostPreview(res.data, token)
      toast.success(`AI post ready (Gemini: ${res.data.geminiModel || 'image'})`)
    } catch (error) {
      console.error(error)
      const msg = error.response?.data?.error || error.message || 'Failed to generate AI post'
      toast.error(msg, { duration: 8000 })
    } finally {
      setGenerating(false)
    }
  }

  const handleCreatePost = () => {
    if (mode === 'ai') handleCreateAi()
    else handleCreateTemplate()
  }

  const handleDownload = async () => {
    if (!post?.postId || !previewUrl) return

    try {
      setDownloading(true)
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = `thessah-gold-rate-${post.dateShort?.replace(/\./g, '-') || 'post'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Downloaded — cleaning up temp file')
      await clearPost(post.postId, true)
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyCaption = async () => {
    if (!post?.caption) return
    try {
      await navigator.clipboard.writeText(post.caption)
      toast.success('Caption copied')
    } catch {
      toast.error('Could not copy caption')
    }
  }

  const handleDiscard = async () => {
    await clearPost(post?.postId, true)
    toast.success('Post discarded')
  }

  return (
    <div className="text-slate-700 max-w-5xl">
      <div className="mb-8">
        <p className="text-sm text-slate-500">Social Media</p>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Sparkles size={24} className="text-amber-500" />
          Instagram Ads Post
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Create a 1080×1350 daily gold rate post using the built-in template, or upload a
          reference design and let Gemini AI generate a matching poster with your details and live
          rates.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode('template')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
            mode === 'template'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <LayoutTemplate size={16} />
          Template Post
        </button>
        <button
          type="button"
          onClick={() => setMode('ai')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
            mode === 'ai'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Wand2 size={16} />
          AI Design (Gemini)
        </button>
      </div>

      {/* Live rates */}
      <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-slate-800">Current Live Rates</h2>
          <button
            type="button"
            onClick={fetchLiveRates}
            disabled={ratesLoading}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600"
          >
            <RefreshCw size={14} className={ratesLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        {ratesLoading ? (
          <p className="text-sm text-slate-500">Loading rates…</p>
        ) : liveRates?.rates ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ['24K', liveRates.rates.perGram24K],
              ['22K', liveRates.rates.perGram22K],
              ['21K', liveRates.rates.perGram21K ?? Math.round(liveRates.rates.perGram24K * (21 / 24))],
              ['18K', liveRates.rates.perGram18K],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-md border px-3 py-2">
                <span className="text-amber-600 font-semibold">{label}</span>
                <span className="block text-slate-800 font-medium">{value} AED/g</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-red-500">Rates unavailable</p>
        )}
      </div>

      {/* AI options */}
      {mode === 'ai' && (
        <div className="mb-6 p-4 border border-amber-200 rounded-lg bg-amber-50/50 space-y-4">
          <h2 className="font-medium text-slate-800 flex items-center gap-2">
            <Wand2 size={18} className="text-amber-600" />
            Gemini AI Design Settings
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reference design image <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Upload a sample post (e.g. Star Mint style or your navy/gold mockup). Gemini will
              match this layout for THESSAH.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleReferenceChange}
              className="hidden"
            />
            <div className="flex flex-wrap items-start gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-amber-400 rounded-lg text-sm text-amber-800 bg-white hover:bg-amber-50"
              >
                <Upload size={16} />
                {referenceFile ? 'Change reference' : 'Upload reference'}
              </button>
              {referencePreview && (
                <div className="border rounded-lg overflow-hidden w-32 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={referencePreview} alt="Reference preview" className="w-full h-auto" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="customDetails" className="block text-sm font-medium text-slate-700 mb-2">
              Post details &amp; instructions
            </label>
            <textarea
              id="customDetails"
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              rows={12}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="Describe what you want on the post…"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRates}
              onChange={(e) => setIncludeRates(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            Include live gold rates from API in the prompt
          </label>

          <p className="text-xs text-slate-500">
            Requires <code className="bg-white px-1 rounded">GEMINI_API_KEY</code> in .env.
            Generation may take 30–90 seconds.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          type="button"
          onClick={handleCreatePost}
          disabled={generating || (mode === 'ai' && !referenceFile)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 disabled:opacity-60 transition shadow-sm"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {mode === 'ai' ? 'Generating with Gemini…' : 'Generating post…'}
            </>
          ) : (
            <>
              {mode === 'ai' ? <Wand2 size={18} /> : <Sparkles size={18} />}
              {mode === 'ai' ? 'Generate AI Post' : 'Create Template Post'}
            </>
          )}
        </button>

        {post && previewUrl && (
          <>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-60 transition"
            >
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Download (1080×1350)
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition"
            >
              <Trash2 size={16} />
              Discard
            </button>
          </>
        )}
      </div>

      {generating && !post && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Loader2 size={40} className="animate-spin text-amber-600 mb-4" />
          <p className="text-slate-600 font-medium">
            {mode === 'ai' ? 'Gemini is creating your poster…' : 'Creating your Instagram post…'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {mode === 'ai'
              ? 'Analyzing reference → generating image → preparing download'
              : 'Fetching live rates → compositing template'}
          </p>
        </div>
      )}

      {post && previewUrl && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <ImageIcon size={18} />
              Preview (4:5)
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-md bg-slate-100 max-w-sm mx-auto lg:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Gold rate post preview" className="w-full h-auto" />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {post.width}×{post.height}px · Source: {post.backgroundSource}
              {post.geminiModel ? ` · ${post.geminiModel}` : ''}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Instagram Caption</h3>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
            <textarea
              readOnly
              value={post.caption}
              rows={16}
              className="w-full border border-slate-200 rounded-lg p-4 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            {post.rates && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
                <p className="font-medium text-amber-800 mb-1">Rates used in this post</p>
                <ul className="text-slate-700 space-y-0.5">
                  <li>24K: {post.rates.perGram24K} AED</li>
                  <li>22K: {post.rates.perGram22K} AED</li>
                  <li>21K: {post.rates.perGram21K} AED</li>
                  <li>18K: {post.rates.perGram18K} AED</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!generating && !post && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <ImageIcon size={48} className="mb-3 opacity-40" />
          <p className="text-sm text-center px-4">
            {mode === 'ai'
              ? 'Upload a reference design, edit the details, then click Generate AI Post'
              : 'Click Create Template Post for the built-in THESSAH design'}
          </p>
        </div>
      )}
    </div>
  )
}
