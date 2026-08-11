import { Target, Compass, Shield, ShieldCheck, Heart, Sparkles, CheckCircle } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface KnowAICAIMLProps {
  setCurrentPage: (page: string) => void;
}

export default function KnowAICAIML({ setCurrentPage }: KnowAICAIMLProps) {
  useDocumentMeta(
    'About AICAIML',
    "AICAIML's vision, mission, and national commitments — India's council for accessible AI, Machine Learning, and Robotics education."
  );

  return (
    <div id="know-aicaiml-page" className="animate-slideup bg-white py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Page Top Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pale-blue text-corp-blue rounded-full text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-gold" aria-hidden="true" />
            <span>Executive Identity Statement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-navy font-heading text-gradient-animate">
            About AICAIML
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            AICAIML is India's online learning council for Artificial Intelligence, Machine Learning, and Robotics — delivering structured courses and verifiable certification to students, individual learners, and institutions nationwide.
          </p>
        </div>

        {/* 1. VISION SECTION */}
        <div className="bg-pale-blue/40 border border-corp-blue/10 rounded-2xl p-6 md:p-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-corp-blue text-white p-2.5 rounded-lg">
              <Compass className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-navy font-heading">Our Vision</h2>
          </div>
          <p className="text-slate-700 text-base md:text-lg leading-relaxed font-medium pl-1">
            "To make quality Artificial Intelligence, Machine Learning, and Robotics education accessible to every learner in India — regardless of location, background, or institution — through structured courses, verified certification, and a supportive national learning community."
          </p>
        </div>

        {/* 2. MISSION SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-corp-blue text-white p-2.5 rounded-lg">
              <Target className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-navy font-heading">Our Mission</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
            {[
              { text: 'Course Access: Publishing structured, self-paced courses in AI, ML, and Robotics — with free foundational tracks open to everyone.' },
              { text: 'Verified Certification: Issuing digital certificates with a unique verification code for every course a learner completes.' },
              { text: 'Learner Support for All: Serving individual students, working professionals, schools, colleges, universities, and organizations under one learning platform.' },
              { text: 'Practical, Applied Learning: Pairing course video content with lesson material, assessments, and hands-on sandbox exercises.' },
              { text: 'Educator Enablement: Equipping teachers and faculty coordinators with professional development tracks and classroom-ready resources.' },
              { text: 'Community & Mentorship: Connecting learners with a national network of peers, coordinators, and industry mentors.' },
              { text: 'Responsible AI Education: Building ethics, fairness, and safety directly into course content, not as an afterthought.' },
              { text: 'Reach Beyond Metro Cities: Extending affordable, credible AI/ML/Robotics education to learners in tier-2 and tier-3 towns.' }
            ].map((mission, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-5 hover:bg-slate-100/50 transition-colors flex gap-3">
                <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-slate-700 text-sm leading-relaxed">{mission.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ABOUT AICAIML NARRATIVE */}
        <div className="space-y-6 border-t border-slate-100 pt-12">
          <h2 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-gold" aria-hidden="true" />
            What AICAIML Does
          </h2>

          <div className="text-slate-700 text-sm md:text-base space-y-5 leading-relaxed pl-1 text-justify">
            <p>
              AICAIML is an online learning organization built around one goal: making Artificial Intelligence, Machine Learning, and Robotics education genuinely accessible. Every course we publish is designed to be followed independently, at the learner's own pace, whether that learner is a first-year engineering student, a working professional switching careers, or a school setting up its first AI curriculum.
            </p>
            <p>
              Our course library ranges from free, beginner-friendly foundations — no membership required — to deeper, member-only tracks with recorded lectures, downloadable resources, structured assessments, and a certificate on completion. Every certificate we issue carries a unique verification code, so anyone — an employer, an institution, a peer — can confirm it's genuine.
            </p>
            <p>
              We also support the people behind the learning: chapters and coordinators across states and districts, faculty development resources for educators, and a national community where learners can connect with mentors and each other. Institutions can bring AICAIML's curriculum on-campus through school, college, and university partnerships.
            </p>
            <p className="font-semibold text-corp-blue text-base border-l-4 border-gold pl-4 italic">
              "Learning should not depend on where you live or which institution you can afford."
            </p>
          </div>
        </div>

        {/* 4. OUR PURPOSE STATEMENT */}
        <div className="space-y-4 border-t border-slate-100 pt-12">
          <h2 className="text-2xl font-bold text-navy font-heading">Our Purpose</h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed pl-1 text-justify">
            To be a dependable place to learn AI, Machine Learning, and Robotics online — with real course content, honest assessment, and certification that means something. We exist to close the gap between people who want to learn these skills and the structured, affordable courses that can actually teach them.
          </p>
        </div>

        {/* 5. OUR COMMITMENT */}
        <div className="space-y-6 border-t border-slate-100 pt-12">
          <h2 className="text-2xl font-bold text-navy font-heading flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
            Our Commitments
          </h2>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1 text-sm text-slate-700">
            {[
              'Keep a genuinely free tier of courses open to every learner, permanently.',
              'Make every certificate independently verifiable, not just a downloadable image.',
              'Design courses for self-paced learning — no fixed class times required.',
              'Support educators and institutions who want to bring our curriculum into classrooms.',
              'Extend affordable access to learners outside major metro cities.',
              'Keep course content current as the AI, ML, and Robotics fields evolve.'
            ].map((commitment, index) => (
              <li key={index} className="flex gap-3 items-start bg-slate-50 border border-slate-100 rounded-lg p-4">
                <div className="bg-corp-blue/10 text-corp-blue p-1 rounded-md shrink-0">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                </div>
                <span>{commitment}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 6. CLOSING TAGLINE */}
        <div className="border-t border-slate-100 pt-12 text-center space-y-2">
          <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">AICAIML Slogan</span>
          <p className="text-2xl sm:text-3xl font-black font-heading tracking-widest text-corp-blue">
            LEARN. CERTIFY. GROW.
          </p>
        </div>

        {/* 7. SEVEN CHAKRAS */}
        <div className="border-t border-slate-100 pt-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-corp-blue text-white p-2.5 rounded-lg">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-navy font-heading">Seven Chakras</h2>
          </div>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed pl-1">
            Collaborative working groups covering human capital, social empowerment, safe and trusted AI, science, and resilient innovation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
            {[
              { title: 'Human Capital', text: 'Prepares the workforce for the AI age by supporting equitable skilling, reskilling, and workforce transitions.' },
              { title: 'Inclusion for Social Empowerment', text: 'Ensures AI serves diverse and underserved communities through language-agnostic models and accessibility features.' },
              { title: 'Safe and Trusted AI', text: 'Focuses on ethical AI governance, transparency, and building standardized safety testing protocols.' },
              { title: 'Science', text: 'Accelerates frontier research and scientific breakthroughs using artificial intelligence.' },
              { title: 'Resilience, Innovation, and Efficiency', text: 'Develops sustainable, resource-efficient AI systems to bolster climate and infrastructure.' },
              { title: 'Democratizing AI Resources', text: 'Promotes equitable access to essential AI compute infrastructure, foundational models, and open data for startups and academics.' },
              { title: 'AI for Economic Development & Social Good', text: 'Leverages AI to drive productivity, economic growth, healthcare, and education on a global scale.' }
            ].map((chakra, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-5 hover:bg-slate-100/50 transition-colors flex gap-3">
                <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-bold text-navy text-sm font-heading">{chakra.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{chakra.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
