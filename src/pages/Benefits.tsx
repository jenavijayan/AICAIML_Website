import { useState } from 'react';
import {
  GraduationCap, UserCheck, BookOpen, Building, Server, Users,
  Check, ArrowRight, ShieldCheck, Cpu, Briefcase, Zap, Star
} from 'lucide-react';
import { Button, TabList, TabPanel } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface BenefitsProps {
  onJoinClick: (category: 'student' | 'msme' | 'corporate' | 'school' | 'university') => void;
}

// Hoisted to module scope — this was previously re-created on every render
// inside the component body.
const BENEFIT_TABS = [
    {
      id: 'students',
      label: 'For Students',
      icon: GraduationCap,
      category: 'student' as const,
      tagline: 'Empower your academic path with elite technical resources.',
      bullets: [
        { title: 'National AI/ML & Robotics Certifications', desc: 'Secure cryptographically signed, standard certificates aligned with top-tier industrial requisites.' },
        { title: 'Campus Robotics Sandbox Access', desc: 'Free access to simulation assets, IoT sandboxes, and drone testing simulation portals.' },
        { title: 'Premium Hackathons & Challenges', desc: 'Compete in fully funded state and national-level AICAIML robotics hackathons with cash awards.' },
        { title: 'Placement & Internship Channel', desc: 'Gain direct visibility with premium corporate and startup partners hiring technical talent.' },
        { title: 'Free Technical Resume Builder', desc: 'Access automated resume templates custom-styled for deep-tech sectors.' }
      ]
    },
    {
      id: 'faculty',
      label: 'For Faculty & Researchers',
      icon: UserCheck,
      category: 'student' as const, // Uses Student form for faculty as described in guidelines
      tagline: 'Advance your educational curriculum and pedagogical standards.',
      bullets: [
        { title: 'UGC-Aligned FDP Participation', desc: 'Access fully certified 5-day programs on Generative AI pipelines and fine-tuning methodologies.' },
        { title: 'Research Grants & Research Funding', desc: 'Submit proposals for collaborative research projects in Edge-ML and IoT agriculture.' },
        { title: 'Academic Review Board Seating', desc: 'Join peer-review committees for national AI/ML & Robotics congress papers.' },
        { title: 'Industry Collaboration Panels', desc: 'Participate as academic advisors on MSME tech-transfer and policy audit boards.' },
        { title: 'Expert Lecture Dispatches', desc: 'Invite elite computational scientists and industrial engineers to lecture on campus.' }
      ]
    },
    {
      id: 'schools',
      label: 'For Schools & Colleges',
      icon: BookOpen,
      category: 'school' as const,
      tagline: 'Standardize your technical curriculum and campus tech clubs.',
      bullets: [
        { title: 'Establish Campus AI & Robotics Clubs', desc: 'AICAIML provides structural bylaws, standard curriculum, and student executive badges.' },
        { title: 'FDP Training for Science Teachers', desc: 'Prepare STEM educators to teach basic python scripting, hardware microcontrollers, and logic.' },
        { title: 'Discounted Lab Kits & Hardware', desc: 'Obtain specialized robotics kits, edge processors, and sensor suites at subsidised rates.' },
        { title: 'State & National Level Expo Hosting', desc: 'Incur options to host AICAIML-partnered student robotics exhibitions and regional expos.' },
        { title: 'Academic Accreditation Badges', desc: 'Feature AICAIML Institutional partner recognition badges on promotional collaterals.' }
      ]
    },
    {
      id: 'msmes',
      label: 'For MSMEs & Startups',
      icon: Building,
      category: 'msme' as const,
      tagline: 'Bridge resource constraints through rapid academia-industry alliances.',
      bullets: [
        { title: 'Academic Tech-Transfer Pathways', desc: 'License validated algorithm modules, crop forecasting logic, or drone micro-controllers.' },
        { title: 'Strategic Internship Channels', desc: 'Hire top-tier vetted engineering students specializing in computational models.' },
        { title: 'Policy Advisory & Regulatory Audits', desc: 'Acquire early advisories on compliance, ethical AI audits, and model bias certifications.' },
        { title: 'Startup Acceleration Cohorts', desc: 'Apply to receive specialized technical mentoring, sandboxed credits, and seed fund matchmaking.' },
        { title: 'Network Forum Joint Events', desc: 'Present deep-tech solutions at exclusive corporate-investor networking assemblies.' }
      ]
    },
    {
      id: 'corporate',
      label: 'For Corporate Partners',
      icon: Server,
      category: 'corporate' as const,
      tagline: 'Secure deep tech talent pipelines and support research initiatives.',
      bullets: [
        { title: 'University Research Alliances', desc: 'Fund advanced research sandboxes or joint Centers of Excellence at accredited colleges.' },
        { title: 'Pre-Vetted Professional Recruits', desc: 'Access graduates with cryptographically verified AICAIML skills and project portfolios.' },
        { title: 'Advisory Panel Representation', desc: 'Nominate senior engineers to chair curriculum guidelines and national technology boards.' },
        { title: 'Corporate CSR Implementation', desc: 'Channel CSR funds into Tier-2/3 technical training, women-in-STEM, or rural sandboxes.' },
        { title: 'Sponsorship and Exposure Scopes', desc: 'Headline national AI/ML & Robotics congresses, hackathons, and research journals.' }
      ]
    },
    {
      id: 'all',
      label: 'For All Members',
      icon: Users,
      category: 'student' as const,
      tagline: 'Join a premier deep tech community advancing national technology.',
      bullets: [
        { title: 'Executive Newsletter & Advisories', desc: 'Receive bi-weekly summaries on technological milestones, policy changes, and events.' },
        { title: 'Digital Membership Certificate', desc: 'Obtain verified member credentials signed by the executive board secretariat.' },
        { title: 'Council Group Networking Forum', desc: 'Access Slack and Discord portals connecting over 50,000+ deep-tech professionals.' },
        { title: 'Discounted Access on Premium Events', desc: 'Register for physical summits and technical congresses at member-only pricing.' },
        { title: 'Advancement Recognition Badges', desc: 'Display council associate seals on portfolios, research papers, or resumes.' }
      ]
    }
  ];

export default function Benefits({ onJoinClick }: BenefitsProps) {
  useDocumentMeta(
    'Membership Benefits',
    'Professional validation, university sandboxes, hardware mentoring, and credential networks unlocked by AICAIML membership.'
  );
  const [activeTabId, setActiveTabId] = useState<string>(BENEFIT_TABS[0].id);
  const activeTab = BENEFIT_TABS.find((t) => t.id === activeTabId) ?? BENEFIT_TABS[0];

  return (
    <div id="benefits-page" className="animate-slideup bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase text-corp-blue font-bold tracking-widest">Growth Ecosystem</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy font-heading text-gradient-animate">
            Membership Benefits
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Unlock professional validation, collaborative university sandboxes, hardware mentoring frameworks, and secure credential networks by choosing the relevant category.
          </p>
        </div>

        {/* Tab Selection Area — real ARIA tabs (was color-only active state) */}
        <div className="border-b border-slate-200 pb-4 mb-4">
          <TabList
            idPrefix="benefits"
            items={BENEFIT_TABS.map((tab) => ({ id: tab.id, label: tab.label, icon: tab.icon }))}
            activeId={activeTabId}
            onChange={setActiveTabId}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2"
            tabClassName={(selected) =>
              `flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                selected
                  ? 'bg-navy border-navy text-white shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`
            }
          />
        </div>

        {/* Tab Contents */}
        <TabPanel idPrefix="benefits" id={activeTab.id} activeId={activeTabId}>
          <div className="bg-pale-blue/30 border border-corp-blue/10 rounded-2xl p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

              {/* Left Tagline Column */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-fit">
                  <activeTab.icon className="w-8 h-8 text-corp-blue" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold text-navy font-heading">{activeTab.label}</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{activeTab.tagline}</p>

                <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs text-gold font-bold">
                    <Star className="w-4 h-4 fill-current" aria-hidden="true" />
                    <span>PREMIER STATUS REGISTERED</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Our professional credentials align with top tech guidelines, providing members with validated advancement status inside the corporate deep tech network.
                  </p>
                  <Button
                    id="benefit-tab-cta-enroll"
                    variant="accent"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full justify-center"
                    onClick={() => onJoinClick(activeTab.category)}
                  >
                    Apply Now for this Category
                  </Button>
                </div>
              </div>

              {/* Right Detailed Bullets Column */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-navy font-bold text-base uppercase tracking-wider font-heading border-b border-slate-200 pb-3">
                  Key Privileges & Deliverables
                </h3>

                <div className="space-y-6">
                  {activeTab.bullets.map((bullet, index) => (
                    <div key={index} className="flex gap-4 items-start bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                      <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg shrink-0 mt-0.5">
                        <Check className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-bold text-navy text-sm font-heading">{bullet.title}</h4>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed">{bullet.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </TabPanel>

      </div>
    </div>
  );
}
