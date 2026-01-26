import Image from 'next/image';

export const metadata = {
  title: 'About Thessah - Thessah Jewellery – Where Elegance Meets Craftsmanship',
  description: 'Thessah Jewellery offers beautifully crafted designs made to shine forever. Find luxury jewellery pieces perfect for weddings, gifts, and everyday elegance.',
};

export default function AboutPage() {
  const sections = [
    {
      id: 1,
      title: 'Initial Foray',
      content: 'The journey of Tanishq started with the launch of 15k gold watches studded with precious stones in 1994. But, it soon grew into a 22K jeweller who presented a stunning range of gold and diamond jewellery. The term Tanishq was coined by Mr. Xerxes Desai by marrying the words "Ta" representing TATA and "nishq" meaning a gold ornament and Tanishq\'s very first state-of-art jewellery factory with a proper kanigar park was set up in Hosur in Tamil Nadu'
    },
    {
      id: 2,
      title: 'Timeless Appeal',
      content: 'At Tanishq, jewellery is not a product but a manifestation of artistry and our exquisite range of jewel pieces strike the perfect balance between traditional charm and contemporary appeal. With designs that capture the beauty and celebration of special occasions in the life of the Indian woman, Tanishq aims to be an integral part of her journey. As India\'s leading wedding jeweller, we understand the varied needs of every regional bride and that has stood as our inspiration behind creating special wedding collections catering to every community across India through Rivuah.'
    },
    {
      id: 3,
      title: 'Epitomizing Excellence',
      content: 'At Tanishq, we strive to deliver excellence, consistently. We\'ve brought to the market a whole new standard of business ethics and product reliability. In the process bringing about a transformation in which jewellery is bought or sold in India. With innovations like the Karatmeter to check the purity of gold, we stand out over the customers\' hearts. Our constant endeavour is to maintain the highest standard and quality of our gold, diamonds and precious stones used in our jewel pieces. We implement extensive quality checks and only source our diamonds ethically from known, trusted and certified suppliers. At Tanishq, we also take great pride in offering an unparalleled retail experience that takes into consideration our customer\'s unique needs and preferences.'
    },
    {
      id: 4,
      title: 'Success Secrets',
      content: 'Our understanding of the ethos of the current Indian jewellery market and our constant evolution along with its changing demands and preferences is why Tanishq enjoys the distinct honour of being coveted by Indian women. Furthermore, our adherence to stringent standards in terms of quality and strict and uniform guidelines across all 300+ stores have helped in establishing ourselves further as the most trusted jewellery brand in the country.'
    }
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-red-700 mb-4">
            About Tanishq
          </h1>
          <p className="text-lg text-gray-600">
            Our journey, values, and commitment to excellence
          </p>
        </div>
      </div>

      {/* Brand Story Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Brand Story Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif text-gray-900">
            Brand Story
          </h2>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section, index) => (
            <div key={section.id} className="border-l-4 border-red-600 pl-6 sm:pl-8">
              <h3 className="text-2xl font-serif text-gray-900 mb-4">
                {section.title}
              </h3>
              <p className="text-gray-700 leading-relaxed text-justify">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Why Choose Us Section */}
        <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-gray-200">
          <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-8 text-center">
            Why Choose Tanishq
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Authentic', desc: 'Certified genuine gold and diamonds' },
              { title: 'Trusted', desc: '300+ stores across India' },
              { title: 'Innovative', desc: 'Latest designs and technology' },
              { title: 'Excellence', desc: 'Unparalleled quality standards' }
            ].map((item, idx) => (
              <div key={idx} className="bg-amber-50 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-gray-200">
          <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-8 text-center">
            Our Values
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Quality First',
                desc: 'Every piece undergoes rigorous quality checks to ensure authenticity and excellence.'
              },
              {
                title: 'Customer Centric',
                desc: 'We understand and cater to the unique needs and preferences of every customer.'
              },
              {
                title: 'Ethical Practice',
                desc: 'We source diamonds ethically from known, trusted and certified suppliers.'
              },
              {
                title: 'Innovation',
                desc: 'Constantly evolving with market demands and introducing cutting-edge designs.'
              }
            ].map((value, idx) => (
              <div key={idx} className="bg-white border-l-4 border-red-600 pl-6 py-4">
                <h4 className="text-xl font-serif text-gray-900 mb-2">
                  {value.title}
                </h4>
                <p className="text-gray-700">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
