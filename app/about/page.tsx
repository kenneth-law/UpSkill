export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">About UpSkill</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
        <p className="text-gray-700 mb-6">
          UpSkill is an app created by the team ColonThree Inc for Melbourne Founder&apos;s hack 2025. 
          We are a group of 4 engineering/commerce students who really wished an app like this existed 
          and thought &quot;why tf not???&quot;
        </p>
        
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-6">
          Our mission is to transform the way people learn by converting any learning content into 
          engaging, gamified micro-learning experiences. With our sarcastic cat mascot, we make 
          studying addictive and effective.
        </p>
        
        <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
        <p className="text-gray-700 mb-6">
          The ColonThree Inc team consists of passionate students from diverse backgrounds in 
          engineering and commerce. United by our love for education and technology, we&apos;re 
          committed to making learning more accessible, engaging, and effective for everyone.
        </p>
        
        <h2 className="text-2xl font-semibold mb-4">Our Approach</h2>
        <p className="text-gray-700">
          UpSkill uses innovative learning techniques and gamification to help users master new 
          skills efficiently. Our three game modes - The Board, Judgement Cat, and Adaptive Quiz - 
          cater to different learning styles and preferences, ensuring everyone can find a method 
          that works for them.
        </p>
      </div>
    </div>
  )
}