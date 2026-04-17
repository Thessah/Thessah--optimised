import { NextResponse } from 'next/server'
import { sendMail } from '@/lib/email'
import connectDB from '@/lib/mongoose'
import EnquiryMessage from '@/models/EnquiryMessage'
import Product from '@/models/Product'

export async function POST(request) {
  try {
    const { name, email, phone, date, time, type, store, message, productId, image } = await request.json()
    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let enquiryStore = store || null

    try {
      await connectDB()

      if (!enquiryStore && productId) {
        const product = await Product.findById(productId).select('storeId').lean()
        enquiryStore = product?.storeId || null
      }

      await EnquiryMessage.create({
        name,
        email,
        phone,
        date: date || null,
        time: time || null,
        type: type || (productId ? 'Product Enquiry' : 'Appointment Request'),
        store: enquiryStore,
        message: message || '',
        productId: productId || null,
        image: image || null,
        source: productId ? 'product' : 'appointment',
      })
    } catch (dbError) {
      console.error('Failed to save enquiry message:', dbError)
      // Continue execution so email still works even if DB write fails.
    }

    const subject = `New Appointment Request — ${name}`
    const html = `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2 style="margin:0 0 8px 0;color:#008C6D">Appointment Request</h2>
        <p>A customer submitted a new appointment request:</p>
        <div style="background:#f7f7f7;padding:14px;border-radius:8px">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          ${date ? `<p><strong>Preferred Date:</strong> ${date}</p>` : ''}
          ${time ? `<p><strong>Preferred Time:</strong> ${time}</p>` : ''}
          ${type ? `<p><strong>Type:</strong> ${type}</p>` : ''}
          ${store ? `<p><strong>Preferred Store/City:</strong> ${store}</p>` : ''}
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        </div>
        <p style="margin-top:16px;color:#555">Sent from ${process.env.NEXT_PUBLIC_APP_URL || 'the website'}.</p>
      </div>
    `

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.EMAIL_TO || 'support@quickfynd.com'
    await sendMail({ to: adminEmail, subject, html })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Appointment error:', err)
    return NextResponse.json({ error: 'Failed to submit appointment' }, { status: 500 })
  }
}
