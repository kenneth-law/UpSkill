import { Markdown } from '@/components/ui/markdown'

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Careers at UpSkill</h1>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-12 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Mission to Transform Education</h2>
          <Markdown
            content="At UpSkill, we're building the future of learning. We're looking for passionate individuals who want to make a real impact on how people learn and grow."
            className="text-lg mb-6"
          />
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">5+</div>
              <div className="text-sm">Countries</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">50k+</div>
              <div className="text-sm">Students</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">30+</div>
              <div className="text-sm">Team Members</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">100%</div>
              <div className="text-sm">Remote-Friendly</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Work With Us</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Meaningful Impact",
              description: "Build products that genuinely help students learn better and achieve their goals."
            },
            {
              title: "Innovation-First Culture",
              description: "Work at the intersection of education, AI, and cognitive science to solve real problems."
            },
            {
              title: "Growth Opportunities",
              description: "Develop your skills in a fast-growing startup with mentorship and learning resources."
            },
            {
              title: "Flexible Work",
              description: "Remote-friendly environment with flexible hours to support your work-life balance."
            },
            {
              title: "Competitive Benefits",
              description: "Comprehensive health coverage, equity options, and professional development budget."
            },
            {
              title: "Diverse & Inclusive",
              description: "We're committed to building a team that represents a variety of backgrounds and perspectives."
            }
          ].map((benefit, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
              <Markdown
                content={benefit.description}
                className="text-gray-600"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
        <div className="space-y-4">
          {[
          ].map((job, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <div className="text-gray-600 mt-1">{job.department}</div>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {job.location}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    {job.type}
                  </span>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                    Apply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Don't See a Perfect Fit?</h2>
        <Markdown
          content="We're always looking for talented individuals who are passionate about education and technology. Send us your resume and tell us how you can contribute to our mission."
          className="text-gray-700 mb-6 max-w-2xl mx-auto"
        />
        <button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
          Send General Application
        </button>
      </div>
    </div>
  )
}
