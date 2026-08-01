import { useState, useEffect, useRef } from 'react';
import {
  Shield, ShieldCheck, Brain, Cpu, Network, BookOpen, GraduationCap,
  Award, ChevronRight, ChevronLeft, Users, Check, UserCheck, ArrowRight,
  Sparkles, Target,
  Building, Server
} from 'lucide-react';
import {
  initialProjects, initialEvents, initialNews, initialTestimonials,
  initialPartners, leadershipMessages, Project, UpcomingEvent, NewsUpdate, Testimonial, Partner, LeadershipMessage
} from '../cmsData';
import { Button, IconButton, Card, IconBadge } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { resolveAssetUrl } from '../lib/assetPaths';

interface HomeProps {
  setCurrentPage: (page: string) => void;
  setSelectedCategory: (cat: 'student' | 'msme' | 'corporate' | 'school' | 'university' | null) => void;
  onOpenRegisterEventModal: (event: UpcomingEvent) => void;
}

export default function Home({
  setCurrentPage,
  setSelectedCategory,
  onOpenRegisterEventModal
}: HomeProps) {
  useDocumentMeta();

  const [newsList, setNewsList] = useState<NewsUpdate[]>(initialNews);
  const [projectsList, setProjectsList] = useState<Project[]>(initialProjects);
  const [eventsList, setEventsList] = useState<UpcomingEvent[]>(initialEvents);
  const [testimonialsList, setTestimonialsList] = useState<Testimonial[]>(initialTestimonials);
  const [partnersList, setPartnersList] = useState<Partner[]>(initialPartners);

  useEffect(() => {
    fetch('/api/news')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data: NewsUpdate[]) => {
        if (Array.isArray(data) && data.length > 0) setNewsList(data);
      })
      .catch((err) => console.warn('Falling back to bundled news list:', err));
  }, []);

  useEffect(() => {
    fetch('/api/projects')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data: Project[]) => {
        if (Array.isArray(data) && data.length > 0) setProjectsList(data);
      })
      .catch((err) => console.warn('Falling back to bundled projects list:', err));
  }, []);

  useEffect(() => {
    fetch('/api/events')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data: UpcomingEvent[]) => {
        if (Array.isArray(data) && data.length > 0) setEventsList(data);
      })
      .catch((err) => console.warn('Falling back to bundled events list:', err));
  }, []);

  useEffect(() => {
    fetch('/api/testimonials')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data: Testimonial[]) => {
        if (Array.isArray(data) && data.length > 0) setTestimonialsList(data);
      })
      .catch((err) => console.warn('Falling back to bundled testimonials list:', err));
  }, []);

  useEffect(() => {
    fetch('/api/partners')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data: Partner[]) => {
        if (Array.isArray(data) && data.length > 0) setPartnersList(data);
      })
      .catch((err) => console.warn('Falling back to bundled partners list:', err));
  }, []);

  // Testimonial Carousel Index
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  
  const heroAssets = [
    { type: 'video' as const, src: resolveAssetUrl('/videos/IMAGE3.mp4'), poster: resolveAssetUrl('/images/IMAGE1.jpg') },
    { type: 'image' as const, src: resolveAssetUrl('/images/IMAGE1.jpg') },
    { type: 'image' as const, src: resolveAssetUrl('/images/IMAGE2.jpg') },
    { type: 'image' as const, src: resolveAssetUrl('/images/hero-poster.jpg') },
  ];
  const [heroBgIndex, setHeroBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % heroAssets.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const heroCurrentAsset = heroAssets[heroBgIndex];

  const handleNextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonialsList.length);
  };

  const handlePrevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonialsList.length) % testimonialsList.length);
  };

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.play().catch(() => {});
      }
    });
  }, []);

  const handleEnrollCategory = (cat: 'student' | 'msme' | 'corporate' | 'school' | 'university') => {
    setSelectedCategory(cat);
    setCurrentPage('membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="home-portal" className="animate-slideup">

      {/* SECTION 1: HERO BANNER */}
      <section className="relative bg-navy text-white overflow-hidden min-h-[640px] flex items-center py-20">
        {/* Rotating background: cycles through videos and images */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {heroCurrentAsset.type === 'video' ? (
            <video
              key={heroBgIndex}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={heroCurrentAsset.poster}
              className="absolute inset-0 w-full h-full object-cover animate-fadeIn"
            >
              <source src={heroCurrentAsset.src} type="video/mp4" />
              <img src={heroCurrentAsset.poster} alt="" aria-hidden="true" />
            </video>
          ) : (
            <img
              key={heroBgIndex}
              src={heroCurrentAsset.src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover animate-fadeIn"
            />
          )}
        </div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 z-[1]" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl mx-auto lg:mx-0 bg-navy/70 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-xs font-semibold text-gold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Building India's Deep Tech Talent</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight leading-tight text-gradient-animate-light">
              Learn AI. Lead Change. Build the Future.
            </h1>

            <p className="text-base md:text-lg text-slate-200 leading-relaxed">
              The Apex Body of Artificial Intelligence & Machine Learning Building India’s AI & ML Future. The All India Council for Artificial Intelligence & Machine Learning (AICAIML) builds a comprehensive ecosystem that fosters AI innovation — democratizing AI access, promoting ethical and responsible AI, and developing indigenous AI capabilities in alignment with the Government of India’s AI Mission.
            </p>

            <div className="flex items-center gap-2 text-sm font-semibold text-white/90 pt-1">
              <ShieldCheck className="w-5 h-5 text-gold" />
              <span>We connect learning, research, industry, and public impact to create a stronger, smarter, and more inclusive AI ecosystem.</span>
            </div>

            <div className="flex flex-wrap gap-4 pt-3">
              <Button
                id="hero-btn-get-started"
                size="lg"
                variant="accent"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  setCurrentPage('courses');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Get Started
              </Button>
              <button
                id="hero-btn-vision"
                onClick={() => {
                  setCurrentPage('know-aicaiml');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-transparent border border-white/40 text-white hover:bg-white/10 text-base font-semibold rounded-md transition-all"
              >
                Discover Our Vision
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: DIGITAL ECOSYSTEM (Icon Grid) */}
      <section className="py-16 bg-pale-blue/50 border-y border-corp-blue/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-navy font-heading">The AICAIML Online Learning Ecosystem</h2>
            <p className="text-slate-600 text-sm mt-2">Everything a student, individual, or institution needs to learn, certify, and stay connected — all online.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: 'Course Library', desc: 'Self-paced courses in AI, Machine Learning, and Robotics — free foundational tracks plus advanced member-only courses.' },
              { icon: Award, title: 'Certification Registry', desc: 'Every course completion is backed by a verifiable digital certificate with a unique lookup code.' },
              { icon: Cpu, title: 'Practical Sandboxes', desc: 'Hands-on simulation and lab access so learners apply what they study in real project settings.' },
              { icon: Network, title: 'Network Forum', desc: 'Connects students, individual professionals, MSMEs, and academic researchers for knowledge sharing and mentorship.' },
              { icon: Users, title: 'Campus & Community Chapters', desc: 'State and district chapters supporting local student groups, coordinators, and institutional partners.' },
              { icon: Brain, title: 'Responsible AI Framework', desc: 'Course content and research guided by clear standards on model interpretability, bias evaluation, and ethical deployment.' }
            ].map((eco, idx) => {
              const IconComp = eco.icon;
              return (
                <Card key={idx} interactive>
                  <IconBadge icon={IconComp} />
                  <h3 className="text-navy font-bold text-lg font-heading mb-2">{eco.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{eco.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR PROJECTS (CMS Card Grid) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-base text-corp-blue font-bold tracking-wide uppercase font-heading">
              Why AICAIML
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              We believe learning AI, ML, and Robotics shouldn't feel like ticking boxes. Every course on AICAIML is designed around depth over speed — practical projects, real-world applications, and a curriculum built by people who've actually worked in the industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Industry-Aligned Curriculum', desc: 'Courses built around what the AI and Robotics industry actually needs today.' },
              { icon: Cpu, title: 'Hands-On Learning', desc: 'Projects and real applications, so you walk away able to do, not just know.' },
              { icon: Users, title: 'A Growing Community', desc: "Connect with learners, mentors, and practitioners building India's deep tech future together." }
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <Card key={idx} interactive>
                  <IconBadge icon={IconComp} />
                  <h3 className="text-navy font-bold text-lg font-heading mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3A: LEADERSHIP MESSAGES */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase text-corp-blue font-bold tracking-widest bg-corp-blue/10 px-3 py-1 rounded-full">
              Leadership Messages
            </span>
            <h2 className="text-3xl font-extrabold text-navy sm:text-4xl font-heading tracking-tight mt-2">
              Words of Support & Vision
            </h2>
            <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
              Advancing artificial intelligence, machine learning, and robotics in line with national initiatives and governance frameworks.
            </p>
            <div className="h-1 w-16 bg-gold mx-auto rounded-full mt-4"></div>
          </div>

          <div className="space-y-16 md:space-y-24">
            {leadershipMessages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Photo */}
                <div className="w-full md:w-2/5 shrink-0">
                  <div className="relative max-w-[200px] mx-auto md:max-w-[220px]">
                    <div className="absolute -inset-2 bg-gradient-to-br from-gold/20 to-corp-blue/20 rounded-2xl blur-md"></div>
                    <img
                      src={msg.photoUrl}
                      alt={msg.name}
                      loading="lazy"
                      className="relative w-full aspect-[3/4] object-cover object-top rounded-2xl shadow-lg"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <span className="text-4xl md:text-5xl font-serif text-gold/30 leading-none select-none">"</span>
                  <blockquote className="text-base md:text-lg text-navy leading-relaxed mt-2 mb-4 font-serif italic">
                    {msg.quote}
                  </blockquote>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-navy font-heading">
                      {msg.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {msg.designation}
                    </p>
                  </div>

                  <div className="mt-4 w-10 h-1 bg-gold rounded-full mx-auto md:mx-0"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2A: COURSES TEASER */}
      <section className="py-16 bg-pale-blue/50 border-y border-corp-blue/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs uppercase text-corp-blue font-bold tracking-widest">Courses</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl font-heading">
                Start Where You Are, Grow Where You Want To
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                From foundational AI concepts to advanced Robotics and Machine Learning, AICAIML's courses are built for beginners and professionals alike.
              </p>
              <Button
                id="courses-teaser-cta"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  setCurrentPage('courses');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Explore Courses
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, label: 'Foundational AI' },
                { icon: Cpu, label: 'Machine Learning' },
                { icon: Network, label: 'Robotics' },
                { icon: GraduationCap, label: 'Career Readiness' }
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col items-start gap-3">
                    <div className="bg-pale-blue text-corp-blue p-2.5 rounded-lg">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="text-navy font-bold text-sm font-heading">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2B: AI IN ACTION (Video Showcase) */}
      <section className="py-16 md:py-24 bg-pale-blue/40 border-y border-corp-blue/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-base text-corp-blue font-bold tracking-wide uppercase font-heading">
              AI in Action
            </h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl font-heading">
              A Glimpse Into the Technology We Champion
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                src: resolveAssetUrl('/videos/showcase-v1.mp4'),
                title: 'Human-AI Collaboration',
                desc: 'Where human intent meets machine capability.'
              },
              {
                src: resolveAssetUrl('/videos/showcase-v2.mp4'),
                title: 'Immersive Computing',
                desc: 'Next-generation interfaces for how we learn and build.'
              },
              {
                src: resolveAssetUrl('/videos/showcase-v3.mp4'),
                title: 'Autonomous Decision-Making',
                desc: 'Robotics systems that plan, adapt, and execute.'
              },
              {
                src: resolveAssetUrl('/videos/v11.mp4'),
                title: 'Precision Robotics',
                desc: 'Fine motor control engineered for real-world tasks.'
              }
            ].map((video, idx) => (
              <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-corp-blue/30 transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                  <video
                    ref={el => { if (el) videoRefs.current[idx] = el; }}
                    onCanPlay={() => videoRefs.current[idx]?.play().catch(() => {})}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full aspect-[4/3] bg-slate-900 flex items-center justify-center text-white text-xs';
                      fallback.textContent = 'Video playback unavailable';
                      target.parentNode?.insertBefore(fallback, target.nextSibling);
                    }}
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                    src={video.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    controlsList="nodownload"
                    disablePictureInPicture
                    disableRemotePlayback
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-sm font-heading mb-1 drop-shadow-md">{video.title}</h3>
                    <p className="text-slate-200 text-xs leading-relaxed drop-shadow-md">{video.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: DIGITAL ECOSYSTEM (Icon Grid) */}
      <section className="py-16 bg-pale-blue/50 border-y border-corp-blue/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-navy font-heading">The AICAIML Online Learning Ecosystem</h2>
            <p className="text-slate-600 text-sm mt-2">Everything a student, individual, or institution needs to learn, certify, and stay connected — all online.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: 'Course Library', desc: 'Self-paced courses in AI, Machine Learning, and Robotics — free foundational tracks plus advanced member-only courses.' },
              { icon: Award, title: 'Certification Registry', desc: 'Every course completion is backed by a verifiable digital certificate with a unique lookup code.' },
              { icon: Cpu, title: 'Practical Sandboxes', desc: 'Hands-on simulation and lab access so learners apply what they study in real project settings.' },
              { icon: Network, title: 'Network Forum', desc: 'Connects students, individual professionals, MSMEs, and academic researchers for knowledge sharing and mentorship.' },
              { icon: Users, title: 'Campus & Community Chapters', desc: 'State and district chapters supporting local student groups, coordinators, and institutional partners.' },
              { icon: Brain, title: 'Responsible AI Framework', desc: 'Course content and research guided by clear standards on model interpretability, bias evaluation, and ethical deployment.' }
            ].map((eco, idx) => {
              const IconComp = eco.icon;
              return (
                <Card key={idx} interactive>
                  <IconBadge icon={IconComp} />
                  <h3 className="text-navy font-bold text-lg font-heading mb-2">{eco.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{eco.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR PROJECTS (CMS Card Grid) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-base text-corp-blue font-bold uppercase tracking-wider font-heading">National Initiatives</h2>
              <h3 className="text-3xl font-extrabold text-navy font-heading mt-1">Our Core Projects</h3>
              <p className="text-slate-500 text-sm mt-1">Transforming technical ecosystems through direct execution frameworks.</p>
            </div>
            <button
              onClick={() => setCurrentPage('events-projects')}
              className="mt-4 md:mt-0 text-accent-sky hover:text-corp-blue font-semibold text-sm flex items-center gap-1.5"
            >
              <span>View All Projects</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projectsList.slice(0, 4).map((proj) => (
              <div key={proj.id} className="flex flex-col sm:flex-row gap-6 bg-slate-50 rounded-xl p-5 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                <img
                  src={proj.image}
                  alt={proj.title}
                  referrerPolicy="no-referrer"
                  width={160}
                  height={128}
                  loading="lazy"
                  className="w-full sm:w-40 h-32 object-cover rounded-lg shrink-0 bg-slate-200"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-accent-sky uppercase tracking-widest">{proj.category}</span>
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">{proj.status}</span>
                  </div>
                  <h4 className="text-navy font-bold text-base font-heading">{proj.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">{proj.description}</p>
                  <p className="text-xs text-corp-blue font-semibold pt-1">Impact: {proj.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: UPCOMING EVENTS (CMS List with CTAs) */}
      <section className="py-16 bg-navy text-white relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <span className="text-xs uppercase text-gold font-bold tracking-widest">Connect & Engage</span>
              <h3 className="text-3xl font-extrabold font-heading text-white mt-1">Upcoming Events</h3>
              <p className="text-slate-300 text-sm mt-1">Register for executive seminars, robotics congresses, and AI hackathons.</p>
            </div>
            <button
              onClick={() => setCurrentPage('events-projects')}
              className="mt-4 md:mt-0 text-gold hover:text-white font-semibold text-sm flex items-center gap-1.5"
            >
              <span>View All Events Calendar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {eventsList.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-gold font-bold uppercase">{event.category}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-300">{event.date}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-300">{event.venue}</span>
                  </div>
                  <h4 className="text-xl font-bold font-heading text-white">{event.title}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{event.description}</p>
                </div>
                <Button
                  id={`btn-reg-interest-${event.id}`}
                  variant="accent"
                  className="w-full md:w-auto shrink-0"
                  onClick={() => onOpenRegisterEventModal(event)}
                >
                  Register Interest
                </Button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 6: ASSOCIATE PARTNERS (Logo Strip Marquee) */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-wider mb-8">
            Strategic Academic & Industry Partners Supporting AICAIML Guidelines
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-75">
            {partnersList.map((partner) => (
              <div key={partner.id} className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                <div className="bg-navy text-white text-xs font-mono font-black p-1.5 rounded">
                  {partner.logoPlaceholder}
                </div>
                <span className="text-sm font-semibold text-navy font-heading tracking-tight">
                  {partner.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: TESTIMONIALS (Interactive quote slider) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs uppercase text-corp-blue font-bold tracking-widest">Endorsements</span>
            <h3 className="text-3xl font-bold text-navy font-heading mt-1">Ecosystem Feedback</h3>
          </div>

          <div className="relative bg-pale-blue/30 border border-corp-blue/10 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="absolute top-6 left-6 text-corp-blue/10 font-serif text-7xl select-none">“</div>

            <div className="relative z-10 space-y-6">
              <p className="text-base md:text-lg text-slate-700 italic leading-relaxed">
                {testimonialsList[testimonialIndex].quote}
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonialsList[testimonialIndex].avatarUrl}
                  alt={testimonialsList[testimonialIndex].name}
                  width={48}
                  height={48}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover border-2 border-corp-blue/25"
                />
                <div>
                  <h4 className="text-navy font-bold text-sm font-heading">{testimonialsList[testimonialIndex].name}</h4>
                  <p className="text-xs text-slate-500">{testimonialsList[testimonialIndex].designation}</p>
                  <p className="text-xs font-semibold text-corp-blue">{testimonialsList[testimonialIndex].organization}</p>
                </div>
              </div>
            </div>

            {/* Slider navigations */}
            <div className="flex gap-2 justify-end mt-4 md:mt-0">
              <IconButton
                icon={ChevronLeft}
                label="Previous testimonial"
                onClick={handlePrevTestimonial}
                className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-full"
              />
              <IconButton
                icon={ChevronRight}
                label="Next testimonial"
                onClick={handleNextTestimonial}
                className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: ABOUT THE NETWORK FORUM (Summary block) */}
      <section className="py-16 bg-pale-blue border-t border-b border-corp-blue/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="bg-corp-blue/10 text-corp-blue text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Community</span>
              <h2 className="text-3xl font-extrabold text-navy font-heading">
                Be Part of Something Bigger
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                AICAIML is a community of learners, educators, and industry practitioners building India's AI and Robotics talent pipeline together.
              </p>
              <div className="space-y-3">
                {[
                  'Unified platform bridging academic research and industrial execution.',
                  'Formulates strategic advisory on ethical AI guidelines and bias testing.',
                  'Empowers students and faculty with practical edge-robotics toolkits.'
                ].map((point, index) => (
                  <div key={index} className="flex gap-2.5 items-start text-sm text-slate-700">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <Button
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  setCurrentPage('know-aicaiml');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Learn More about Know AICAIML
              </Button>
            </div>

            {/* Visual Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 space-y-6">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-corp-blue" />
                <h4 className="text-navy font-bold text-lg font-heading">AICAIML Operational Objectives</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                By developing a cryptographically secure certification registry, localized agricultural IoT networks, and simulated robotics sandboxes, we establish robust pipelines supporting tomorrow’s technological needs.
              </p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-pale-blue/50 p-4 rounded-xl">
                  <span className="block text-2xl font-black text-navy">500+</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Clubs Launched</span>
                </div>
                <div className="bg-pale-blue/50 p-4 rounded-xl">
                  <span className="block text-2xl font-black text-navy">12+</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">National Papers</span>
                </div>
                <div className="bg-pale-blue/50 p-4 rounded-xl">
                  <span className="block text-2xl font-black text-navy">50k+</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Students Reached</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: MEMBERSHIP CATEGORIES */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-navy font-heading">Membership Categories</h2>
            <p className="text-slate-600 text-sm mt-2">Unlock institutional and professional benefits by selecting the relevant category</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Student Forum', category: 'student', icon: GraduationCap, desc: 'For diploma, undergraduate, and postgraduate technical students looking for certifications, robotics clubs, and hackathon platforms.' },
              { title: 'MSME Network Forum', category: 'msme', icon: Building, desc: 'For proprietorships, partnerships, LLPs, and startups seek mentoring, academic tech-transfer, and networking scopes.' },
              { title: 'Corporate & Associate Partners', category: 'corporate', icon: Server, desc: 'For established hardware/software industries seeking university research alliances and pre-trained technical graduates.' },
              { title: 'School / College Institutional', category: 'school', icon: BookOpen, desc: 'For registered secondary schools and polytechnic colleges looking to establish AI & Robotics clubs on campus.' },
              { title: 'University Partnership', category: 'university', icon: Shield, desc: 'For state, central, and deemed universities seeking advanced Centers of Excellence (CoE) and faculty training plans.' },
              { title: 'Faculty & Researchers', category: 'student', icon: UserCheck, desc: 'For educators seeking UGC-aligned FDP certifications on Generative AI pipelines and academic research sandboxes.' }
            ].map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <Card key={idx} className="bg-slate-50 hover:bg-slate-100/80 border-slate-200/60 flex flex-col justify-between transition-all">
                  <div>
                    <div className="text-corp-blue bg-white p-3 rounded-lg w-fit mb-4 shadow-sm border border-slate-100">
                      <IconComp className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <h4 className="text-navy font-bold text-lg font-heading mb-2">{cat.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">{cat.desc}</p>
                  </div>

                  {cat.category ? (
                    <Button
                      id={`btn-apply-cat-${cat.category}`}
                      size="sm"
                      className="w-full"
                      onClick={() => handleEnrollCategory(cat.category as any)}
                    >
                      Apply for {cat.title}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setCurrentPage('membership');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Learn More
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 10: BENEFITS OF JOINING */}
      <section className="py-16 bg-gradient-to-br from-navy to-[#071F3F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs uppercase text-gold font-bold tracking-widest">Growth Ecosystem</span>
            <h2 className="text-3xl font-bold font-heading text-white">Benefits of Joining the Council</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Membership in AICAIML goes beyond standard credentials. It unlocks direct access to nationwide hackathons, academic funding structures, hardware simulation sandboxes, and executive policy frameworks designed to empower technical initiatives.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4">
              <div className="flex gap-2.5 items-center">
                <Check className="w-5 h-5 text-gold shrink-0" />
                <span>UGC and AICTE Aligned FDP Certifications</span>
              </div>
              <div className="flex gap-2.5 items-center">
                <Check className="w-5 h-5 text-gold shrink-0" />
                <span>Free Simulated Sandbox Research Access</span>
              </div>
              <div className="flex gap-2.5 items-center">
                <Check className="w-5 h-5 text-gold shrink-0" />
                <span>Placement & Internship Assistance Portals</span>
              </div>
              <div className="flex gap-2.5 items-center">
                <Check className="w-5 h-5 text-gold shrink-0" />
                <span>Industry-Academia Collaboration Scopes</span>
              </div>
            </div>
            <div className="pt-6">
              <Button
                variant="accent"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => {
                  setCurrentPage('membership');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Read Full Membership Benefits
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11: NEWS & ANNOUNCEMENTS (CMS feed) */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12">
            <div>
              <span className="text-xs uppercase text-corp-blue font-bold tracking-widest">Media Desk</span>
              <h3 className="text-3xl font-extrabold text-navy font-heading mt-1">News & Announcements</h3>
              <p className="text-slate-500 text-sm mt-1">Latest council announcements, press statements, and deep tech policy changes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsList.map((news) => (
              <Card key={news.id} interactive className="bg-slate-50 border-slate-200/60 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span className="text-accent-sky uppercase tracking-widest">{news.category}</span>
                    <span>{news.date}</span>
                  </div>
                  <h4 className="font-bold text-navy text-base font-heading line-clamp-2">{news.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{news.summary}</p>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs font-bold border-t border-slate-200/60 mt-4">
                  <span className="text-slate-400">{news.readTime}</span>
                  <button onClick={() => {
                    alert(`Read detail: ${news.title}\n\nSummary: ${news.summary}`);
                  }} className="text-corp-blue hover:text-navy flex items-center gap-1">
                    <span>Read article</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 12: CLOSING BANNER */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-navy to-corp-blue text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading">
            Ready to Build Your Future in AI, ML & Robotics?
          </h2>
          <p className="text-slate-300 text-base">
            Start your journey with AICAIML today.
          </p>
          <Button
            id="closing-banner-cta"
            variant="accent"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => {
              setCurrentPage('courses');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Explore Courses
          </Button>
        </div>
      </section>

    </div>
  );
}
