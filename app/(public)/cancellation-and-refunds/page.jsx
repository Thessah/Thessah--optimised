export const metadata = {
  title: 'Cancellation & Refund Policy - Thessah Jewellery – Where Elegance Meets Craftsmanship',
  description: 'Thessah Jewellery offers beautifully crafted designs made to shine forever. Find luxury jewellery pieces perfect for weddings, gifts, and everyday elegance.',
};

export default function CancellationAndRefunds() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Breadcrumb at top */}
      <nav className="mb-6 px-2 py-2 bg-gradient-to-b from-gray-100 to-transparent rounded-t-lg shadow-sm w-full">
        <span className="text-green-700">Home</span>
        <span className="mx-2">{'>'}</span>
        <a href="/product/" className="text-gray-700 font-medium hover:underline">Product</a>
        <span className="mx-2">{'>'}</span>
        <span className="text-brown-700 font-semibold">Sunlit Symphony Gold Necklace Set</span>
      </nav>

      {/* Product Title and Price centered full width */}
      <div className="w-full text-center my-12">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-2 text-gray-800">Sunlit Symphony Gold Necklace Set</h1>
        <div className="text-3xl font-bold mb-1 text-gray-900">₹8 20 135</div>
        <div className="text-xs text-gray-500 mb-2">Incl. taxes and charges</div>
        <div className="text-sm text-[#a55a4a] mt-2">*Price is indicative. Price will vary based on grammage of actual product and prevailing rate.</div>
        {/* Actions will be added in next step */}
      </div>

      {/* ...existing code... */}

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Order Cancellation</h2>
      <p className="mb-3">
        <strong>Before Shipment:</strong> Orders can be cancelled within
        <strong> 1–2 hours</strong> of placing the order or before the order is
        shipped. A full refund will be issued for all prepaid orders.
      </p>
      <p className="mb-3">
        <strong>After Shipment:</strong> Once the order has been shipped,
        cancellation is not possible. Customers may request a return after
        delivery, subject to eligibility conditions.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Return Eligibility</h2>
      <p className="mb-3">
        Returns are accepted only if the product received is:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Incorrect item delivered</li>
        <li>Damaged or defective product</li>
        <li>Product not matching the description shown on the website</li>
      </ul>
      <p className="mb-4">
        Customers must provide clear photos or videos as proof within
        <strong> 24–48 hours</strong> of delivery.
      </p>

      <h3 className="text-lg font-semibold mt-4 mb-2">Non-Returnable Items</h3>
      <ul className="list-disc pl-6 mb-4">
        <li>Personal care products</li>
        <li>Food and perishable items</li>
        <li>Innerwear and hygiene-sensitive products</li>
        <li>Customized or personalized items</li>
        <li>Products clearly marked as “Non-Returnable”</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Return Process</h2>
      <ol className="list-decimal pl-6 mb-4">
        <li>Contact our support team with order details and issue description.</li>
        <li>Submit required photos or videos for verification.</li>
        <li>Once approved, return pickup will be arranged (where available).</li>
        <li>
          The product must be unused, unwashed, and returned in original
          packaging.
        </li>
      </ol>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Refund Policy</h2>
      <p className="mb-3">
        Refunds will be processed using the same payment method used during
        checkout.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>UPI / Wallet</li>
        <li>Net Banking</li>
        <li>Credit / Debit Cards</li>
        <li>COD refunds will be transferred to the customer’s bank account</li>
      </ul>
      <p className="mb-4">
        Refunds are generally processed within
        <strong> 3–5 business days</strong> after successful inspection of the
        returned product.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Exchange Policy</h2>
      <p className="mb-3">
        Exchanges are allowed in cases of damaged products, incorrect items
        delivered, or size-related issues, subject to product availability.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Contact Information</h2>
      <p className="mb-2">
        For any cancellation, return, or refund-related queries, please contact
        us:
      </p>

      <p className="mb-1">
        <strong>Business Name:</strong> Thessah
      </p>
      <p className="mb-1">
        <strong>Email:</strong> support@thessah.com
      </p>
      <p className="mb-1">
        <strong>Website:</strong> https://www.thessah.com
      </p>

      <p className="text-sm text-gray-600 mt-6">
        Nilaas reserves the right to modify or update this policy at any time in
        accordance with operational or regulatory requirements.
      </p>
    </div>
  );
}
