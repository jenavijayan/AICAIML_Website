import { useState } from 'react';
import {
  BookOpen, Sparkles, Award, FileText, Heart, CheckCircle,
  ArrowRight, ShieldAlert, GraduationCap, Briefcase, Plus, Terminal
} from 'lucide-react';
import { Button, Card, IconBadge, TextField } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function Learners() {
  useDocumentMeta(
    'Learners, Associates & Career Center',
    'Free course sandboxes, a technical resume builder, and placement support for AICAIML learners and associates.'
  );
  const [activeCourse, setActiveCourse] = useState<number | null>(null);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);
  const [resumeName, setResumeName] = useState('');
  const [resumeSkills, setResumeSkills] = useState('');

  const freeCourses = [
    { title: 'Intro to Autonomous Systems', hours: '6 hours', topics: ['Sensor Fusion', 'PID Controllers', 'Lidar Tracking'] },
    { title: 'Python Microcontrollers & TinyML', hours: '8 hours', topics: ['Edge Compilation', 'GPIO controls', 'ESP32 deployment'] },
    { title: 'Ethical Foundations of Deep Models', hours: '4 hours', topics: ['Bias auditing', 'Data poisoning', 'Fairness metrics'] }
  ];

  return (
    <div id="learners-careers-page" className="animate-slideup bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Page Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase text-corp-blue font-bold tracking-widest font-heading">Education & Resource Portal</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy font-heading text-gradient-animate">
            Learners, Associates & Career Center
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Acquire industrial credentials, build specialized resumes, or explore edge hardware simulators co-designed with top technical council guidelines.
          </p>
        </div>

        {/* 4 CORE INFORMATIONAL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Free Learning Sandbox */}
          <Card interactive className="bg-slate-50 border-slate-200/60 p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <IconBadge icon={BookOpen} className="bg-corp-blue text-white mb-0" />
              <h3 className="text-xl font-bold text-navy font-heading">Free Learning Sandbox</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Unlock complimentary self-paced learning models covering autonomous rover simulators, tinyML microcontroller compilations, and model bias evaluations. Designed by academic council executives.
              </p>

              <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Active Curriculum Paths</span>
                <ul className="text-xs text-slate-700 space-y-1.5">
                  <li>• Python Scripting for Robotics Actuators</li>
                  <li>• Embedded Neural Networks & Micro-Controllers</li>
                  <li>• Fairness Metrics in Algorithmic Diagnostic Engines</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full uppercase">AVAILABLE NOW</span>
              <Button
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full sm:w-auto justify-center"
                onClick={() => setActiveCourse(activeCourse === null ? 0 : null)}
              >
                {activeCourse !== null ? 'Hide Courses' : 'Explore Free Courses'}
              </Button>
            </div>
          </Card>

          {/* Card 2: Learning (Paid Course) */}
          <Card interactive className="bg-slate-50 border-slate-200/60 p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <IconBadge icon={GraduationCap} className="bg-corp-blue text-white mb-0" />
              <h3 className="text-xl font-bold text-navy font-heading">Paid Specializations & Certifications</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Advanced industry-endorsed career credentials featuring extensive capstones, expert video lectures, live sandbox feedback, and cryptographically signed digital certificates. (UGC standard aligned).
              </p>

              <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-corp-blue uppercase tracking-widest">Expected Professional Capstones</span>
                <ul className="text-xs text-slate-700 space-y-1.5">
                  <li>• Industrial Autonomous Drone Pathing & Simulators</li>
                  <li>• Edge ML Acceleration on ARM Processors</li>
                  <li>• Advanced Large Language Fine-Tuning pipelines</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full uppercase">PHASE 2 - COMING SOON</span>
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto justify-center bg-slate-300 hover:bg-slate-300 text-slate-700 cursor-not-allowed"
                onClick={() => alert("Advanced Paid Specializations and UGC standard certificates will launch in Phase 2. Please register interest on our Home portal upcoming events.")}
              >
                Learn More
              </Button>
            </div>
          </Card>

          {/* Card 3: Free Resume Builder */}
          <Card interactive className="bg-slate-50 border-slate-200/60 p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <IconBadge icon={FileText} className="bg-corp-blue text-white mb-0" />
              <h3 className="text-xl font-bold text-navy font-heading">Free Technical Resume Builder</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Build ATS-optimized technical resumes pre-compiled with semantic tags for robotics, drone automation, embedded ML development, and computer vision sectors. Supported by council guidelines.
              </p>

              <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Resume Builder Parameters</span>
                <p className="text-[11px] text-slate-500">Automated formatting according to elite Indian computational research boards.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full uppercase">EXPLORE TRIAL PREVIEW</span>
              <Button
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                className="w-full sm:w-auto justify-center"
                onClick={() => setShowBuilderPreview(!showBuilderPreview)}
              >
                {showBuilderPreview ? 'Hide Builder' : 'Open Live Builder'}
              </Button>
            </div>
          </Card>

          {/* Card 4: Career Support */}
          <Card interactive className="bg-slate-50 border-slate-200/60 p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <IconBadge icon={Briefcase} className="bg-corp-blue text-white mb-0" />
              <h3 className="text-xl font-bold text-navy font-heading">Placement & Incubation Support</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Direct dispatch channel connecting certified candidates and MSME tech-transfer groups with venture capital circles, national accelerator programs, and corporate hiring managers.
              </p>

              <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-corp-blue uppercase tracking-widest">Active Hiring Partners</span>
                <p className="text-[11px] text-slate-500">Intel Technologies India, Nvidia AI Research, CSIR Labs, and 45+ Deep Tech Startups.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full uppercase">PHASE 2 - LAUNCHING</span>
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto justify-center bg-slate-300 hover:bg-slate-300 text-slate-700 cursor-not-allowed"
                onClick={() => alert("Career dispatch channels and corporate matchmaking algorithms are currently in beta testing. Complete membership enrollment to get notified on Phase 2 portal launches.")}
              >
                Inquire Support
              </Button>
            </div>
          </Card>

        </div>

        {/* INTERACTIVE COMPONENT 1: FREE COURSE EXPLORER DRAWER */}
        {activeCourse !== null && (
          <div className="bg-pale-blue/40 border border-corp-blue/15 rounded-2xl p-6 md:p-8 space-y-6 animate-slideup">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-gold" />
              <h4 className="font-bold text-navy font-heading text-lg">AICAIML Free Learning Modules</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {freeCourses.map((course, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">{course.hours}</span>
                  <h5 className="font-bold text-navy font-heading text-sm">{course.title}</h5>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {course.topics.map((t, i) => <li key={i}>• {t}</li>)}
                  </ul>
                  <Button
                    size="sm"
                    className="w-full justify-center mt-4"
                    onClick={() => alert(`Starting simulated course sandbox: ${course.title}. Login details and sandbox credentials have been dispatched to student registry portfolios.`)}
                  >
                    Start Simulated Class
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERACTIVE COMPONENT 2: TRIAL RESUME BUILDER PREVIEW */}
        {showBuilderPreview && (
          <div className="bg-pale-blue/40 border border-corp-blue/15 rounded-2xl p-6 md:p-8 space-y-6 animate-slideup max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gold" />
              <h4 className="font-bold text-navy font-heading text-lg">Trial Tech-Resume Builder Sandbox</h4>
            </div>

            <div className="space-y-4">
              <TextField
                label="Your Full Name"
                type="text"
                placeholder="e.g., Rajesh Kumar"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
              />
              <TextField
                label="Core Tech Skills (Comma separated)"
                type="text"
                placeholder="e.g., Python, TensorFlow, PyTorch, Lidar, TinyML"
                value={resumeSkills}
                onChange={(e) => setResumeSkills(e.target.value)}
              />

              {(resumeName || resumeSkills) && (
                <div className="border border-slate-300 bg-white rounded-xl p-5 font-mono text-[11px] text-slate-800 space-y-3">
                  <div className="border-b border-slate-300 pb-2 text-center">
                    <h5 className="font-bold text-sm uppercase text-navy font-heading">{resumeName || 'Rajesh Kumar'}</h5>
                    <p className="text-[10px] text-slate-500">Autonomous AI Specialist | AICAIML Member Ref: provisional</p>
                  </div>
                  <div>
                    <h6 className="font-bold text-navy uppercase text-[10px] border-b border-slate-200 mb-1">Professional Core Competencies</h6>
                    <p>{resumeSkills || 'Python, ROS, Computer Vision, Deep Learning, Edge ML'}</p>
                  </div>
                  <div>
                    <h6 className="font-bold text-navy uppercase text-[10px] border-b border-slate-200 mb-1">Accredited Certifications</h6>
                    <p>• AICAIML National AI Skills & Certification (Pending completion)</p>
                  </div>
                </div>
              )}

              <Button
                size="sm"
                className="w-full justify-center"
                onClick={() => {
                  alert("Pre-compilation succeeded. In Phase 2, this tool will render fully formatted PDF resume assets formatted with academic tags.");
                  setShowBuilderPreview(false);
                }}
              >
                Compile Trial PDF Asset
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
