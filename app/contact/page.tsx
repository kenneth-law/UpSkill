export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-gray-700 mb-6">
              Have questions, feedback, or need support? We&apos;d love to hear from you! 
              Our team is here to help with any inquiries you might have about UpSkill.
            </p>
            
            <h3 className="text-xl font-medium mb-2">Email</h3>
            <p className="text-gray-700 mb-6">
              <a href="mailto:colonthreehelp@gmail.com" className="text-indigo-600 hover:underline">
                colonthreehelp@gmail.com
              </a>
            </p>
            
            <h3 className="text-xl font-medium mb-2">Office Location</h3>
            <p className="text-gray-700 mb-2">Monash Generator</p>
            <p className="text-gray-700 mb-6">
              Building 60, Building 60/23 College Walk<br />
              Clayton VIC 3168<br />
              Australia
            </p>
            
            <h3 className="text-xl font-medium mb-2">Hours</h3>
            <p className="text-gray-700">
              Monday - Friday: 9:00 AM - 5:00 PM AEST<br />
              Saturday - Sunday: Closed
            </p>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Connect With Us</h2>
            <p className="text-gray-700 mb-6">
              We&apos;re always looking to connect with users, educators, and potential partners. 
              If you&apos;re interested in collaborating or have suggestions for improving UpSkill, 
              we&apos;d be thrilled to hear from you.
            </p>
            
            <h3 className="text-xl font-medium mb-2">For Partnerships</h3>
            <p className="text-gray-700 mb-6">
              If you&apos;re interested in partnering with UpSkill or exploring integration opportunities, 
              please reach out to us at{" "}
              <a href="mailto:colonthreehelp@gmail.com" className="text-indigo-600 hover:underline">
                colonthreehelp@gmail.com
              </a>{" "}
              with the subject line &quot;Partnership Inquiry.&quot;
            </p>
            
            <h3 className="text-xl font-medium mb-2">For Media Inquiries</h3>
            <p className="text-gray-700 mb-6">
              For press or media-related questions, please contact us at{" "}
              <a href="mailto:colonthreehelp@gmail.com" className="text-indigo-600 hover:underline">
                colonthreehelp@gmail.com
              </a>{" "}
              with the subject line &quot;Media Inquiry.&quot;
            </p>
            
            <h3 className="text-xl font-medium mb-2">For Support</h3>
            <p className="text-gray-700">
              Need help with UpSkill? Our support team is ready to assist you. Email us at{" "}
              <a href="mailto:colonthreehelp@gmail.com" className="text-indigo-600 hover:underline">
                colonthreehelp@gmail.com
              </a>{" "}
              with the subject line &quot;Support Request.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}