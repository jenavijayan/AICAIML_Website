import { useState, useEffect } from 'react';
import {
  BookOpen, Lock, Unlock, Clock, Layers, ChevronRight,
  Sparkles, GraduationCap, ArrowRight, ShieldCheck
} from 'lucide-react';
import { initialCourses, Course } from '../cmsData';
import { useAuth } from '../context/AuthContext';
import { Button, Badge, Card, PageHero } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface CoursesProps {
  setCurrentPage: (page: string) => void;
  onSelectCourse: (courseId: string) => void;
}

export default function Courses({ setCurrentPage, onSelectCourse }: CoursesProps) {
  useDocumentMeta(
    'Courses',
    'Free foundational AI, Machine Learning and Robotics courses, plus advanced membership-only tracks with certification.'
  );
  const { user, hasPremiumAccess } = useAuth();
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  useEffect(() => {
    fetch('/api/courses')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data: Course[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        }
      })
      .catch((err) => console.warn('Falling back to bundled course list:', err));
  }, []);

  const freeCourses = courses.filter((c) => c.access === 'free');
  const membershipCourses = courses.filter((c) => c.access === 'membership');

  const goToMembership = () => {
    setCurrentPage('membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const levelBadgeVariant = (level: string): 'success' | 'info' | 'danger' => {
    if (level === 'Beginner') return 'success';
    if (level === 'Intermediate') return 'info';
    return 'danger';
  };

  return (
    <div id="courses-page" className="animate-slideup">

      <PageHero
        eyebrow="Learning Portal"
        eyebrowIcon={BookOpen}
        title="Courses"
        description="Start learning today with fully free foundational courses — no membership required. Unlock advanced, hands-on tracks with an AICAIML membership."
        size="lg"
      />

      {/* FREE COURSES */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase text-emerald-700 font-bold tracking-widest">
              <Unlock className="w-3.5 h-3.5" />
              Free & Open Access
            </span>
            <h2 className="text-3xl font-bold text-navy font-heading">Start Learning at No Cost</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              These foundational courses are completely free — the full lesson content is available right here on this page, no sign-up or membership required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {freeCourses.map((course) => (
              <Card key={course.id} padding="none" interactive className="flex flex-col">
                <div className="p-6 flex flex-col gap-3 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-corp-blue uppercase tracking-wide">{course.category}</span>
                    <Badge variant={levelBadgeVariant(course.level)}>{course.level}</Badge>
                  </div>
                  <Badge variant="success" icon={Unlock} className="w-fit">Free for Everyone</Badge>
                  <h3 className="text-navy font-bold text-lg font-heading">{course.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{course.duration}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" aria-hidden="true" />{course.modules} modules</span>
                  </div>
                </div>

                <button
                  id={`view-free-course-${course.id}`}
                  onClick={() => onSelectCourse(course.id)}
                  className="flex items-center justify-between px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold transition-colors border-t border-emerald-100"
                >
                  <span className="flex items-center gap-1.5">
                    <Unlock className="w-4 h-4" aria-hidden="true" />
                    View Free Content
                  </span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIP COURSES */}
      <section className="py-16 md:py-24 bg-pale-blue/50 border-y border-corp-blue/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase text-gold font-bold tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              Membership Required
            </span>
            <h2 className="text-3xl font-bold text-navy font-heading">Advanced & Hands-On Tracks</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Deeper, project-based courses with mentorship, sandbox lab access, and verifiable certification — unlocked with any AICAIML membership.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {membershipCourses.map((course) => {
              if (hasPremiumAccess && user && course.premiumContent) {
                return (
                  <Card key={course.id} padding="none" className="relative border-emerald-300 flex flex-col">
                    <Badge variant="success" icon={ShieldCheck} className="absolute top-4 right-4 z-10">Unlocked</Badge>
                    <div className="p-6 flex flex-col gap-3 flex-grow">
                      <span className="text-[11px] font-bold text-corp-blue uppercase tracking-wide">{course.category}</span>
                      <h3 className="text-navy font-bold text-lg font-heading pr-16">{course.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{course.duration}</span>
                        <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" aria-hidden="true" />{course.modules} modules</span>
                      </div>
                    </div>

                    <button
                      id={`view-premium-course-${course.id}`}
                      onClick={() => onSelectCourse(course.id)}
                      className="flex items-center justify-between px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-semibold transition-colors border-t border-emerald-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <Unlock className="w-4 h-4" aria-hidden="true" />
                        View Course Content
                      </span>
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </Card>
                );
              }

              return (
                <Card key={course.id} padding="none" className="relative flex flex-col">
                  <span className="absolute top-4 right-4 bg-navy text-gold text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                    <Lock className="w-3 h-3" aria-hidden="true" />
                    Members Only
                  </span>
                  <div className="p-6 flex flex-col gap-3 flex-grow">
                    <span className="text-[11px] font-bold text-corp-blue uppercase tracking-wide">{course.category}</span>
                    <h3 className="text-navy font-bold text-lg font-heading pr-16">{course.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{course.duration}</span>
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" aria-hidden="true" />{course.modules} modules</span>
                    </div>
                    <ul className="space-y-1.5 pt-2">
                      {course.topics.slice(0, 3).map((topic, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="w-1 h-1 rounded-full bg-corp-blue/50 shrink-0"></span>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    id={`unlock-course-${course.id}`}
                    onClick={goToMembership}
                    className="flex items-center justify-center gap-1.5 px-6 py-3 bg-navy hover:bg-corp-blue text-white text-sm font-semibold transition-colors"
                  >
                    <Lock className="w-4 h-4" aria-hidden="true" />
                    <span>{user ? 'Upgrade Membership to Unlock' : 'Unlock with Membership'}</span>
                  </button>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="hidden md:flex bg-pale-blue text-corp-blue p-3 rounded-xl">
                <GraduationCap className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-navy font-heading text-lg">Ready to unlock the full curriculum?</h4>
                <p className="text-slate-500 text-xs mt-1">Membership starts with the Student category and includes certification eligibility.</p>
              </div>
            </div>
            <Button id="courses-cta-join" variant="accent" icon={Sparkles} onClick={goToMembership} className="shrink-0">
              Explore Membership Plans
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
