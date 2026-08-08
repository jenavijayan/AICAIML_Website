import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Clock, Layers, CheckCircle, Circle, PlayCircle, Download,
  Lock, Unlock, ShieldCheck, Sparkles, ArrowRight, ClipboardCheck
} from 'lucide-react';
import { initialCourses, Course } from '../cmsData';
import { useAuth } from '../context/AuthContext';
import CourseQuizCertificate from '../components/CourseQuizCertificate';
import { Badge, PageHero } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface CourseDetailProps {
  courseId: string;
  setCurrentPage: (page: string) => void;
  onBack: () => void;
}

export default function CourseDetail({ courseId, setCurrentPage, onBack }: CourseDetailProps) {
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
          const merged = data.map((apiCourse) => {
            const initial = initialCourses.find((c) => c.id === apiCourse.id);
            if (initial && !apiCourse.freeContent && initial.freeContent) {
              return { ...apiCourse, freeContent: initial.freeContent };
            }
            return apiCourse;
          });
          setCourses(merged);
        }
      })
      .catch((err) => console.warn('Falling back to bundled course list:', err));
  }, []);

  const course = courses.find((c) => c.id === courseId);
  useDocumentMeta(course?.title, course?.description);

  const [videoWatched, setVideoWatched] = useState(false);
  const [assessmentOpened, setAssessmentOpened] = useState(false);
  const [readLessons, setReadLessons] = useState<Set<number>>(new Set());
  const lessonRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maxWatchedTimeRef = useRef(0);

  const totalLessons = course?.premiumContent?.lessons.length ?? 0;

  // Auto-mark a lesson as read once the user has scrolled all the way past it
  // (its whole block has exited above the viewport) — no manual button.
  useEffect(() => {
    if (!totalLessons) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-lesson-index'));
          if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
            setReadLessons((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));
          }
        });
      },
      { threshold: 0 }
    );

    lessonRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [totalLessons]);

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const t = e.currentTarget.currentTime;
    if (t > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = t;
    }
  };

  const handleVideoSeeking = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    // Allow rewinding freely, but snap back any attempt to skip ahead of
    // the furthest point actually played (small tolerance for natural drift).
    if (video.currentTime > maxWatchedTimeRef.current + 0.75) {
      video.currentTime = maxWatchedTimeRef.current;
    }
  };

  const handleVideoEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    maxWatchedTimeRef.current = e.currentTarget.duration;
    setVideoWatched(true);
  };

  const goToMembership = () => {
    setCurrentPage('membership');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const levelBadgeVariant = (level: string): 'success' | 'info' | 'danger' => {
    if (level === 'Beginner') return 'success';
    if (level === 'Intermediate') return 'info';
    return 'danger';
  };

  if (!course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-500">Course not found.</p>
          <button onClick={onBack} className="text-corp-blue font-semibold underline">Back to Courses</button>
        </div>
      </div>
    );
  }

  const canViewPremium = course.access === 'membership' && hasPremiumAccess && user && course.premiumContent;
  const isLockedPremium = course.access === 'membership' && !canViewPremium;
  const allLessonsRead = totalLessons > 0 && readLessons.size === totalLessons;
  const assessmentUnlocked = videoWatched && allLessonsRead;

  return (
    <div id="course-detail-page">
      <style>{`
        #course-detail-page .text-gradient-animate-light {
          animation: none !important;
          background-image: none !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
          -webkit-text-fill-color: unset !important;
          color: #ffffff !important;
        }
      `}</style>

      <PageHero
        title={course.title}
        description={course.description}
        maxWidth="5xl"
        after={
          <div className="flex items-center gap-5 text-sm text-slate-300 pt-1">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" aria-hidden="true" />{course.duration}</span>
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" aria-hidden="true" />{course.modules} modules</span>
          </div>
        }
      >
        <button
          id="course-detail-back"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Courses
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gold uppercase tracking-wide bg-white/10 px-2.5 py-1 rounded-full">{course.category}</span>
          <Badge variant={levelBadgeVariant(course.level)}>{course.level}</Badge>
          {course.access === 'free' ? (
            <Badge variant="success" icon={Unlock}>Free for Everyone</Badge>
          ) : canViewPremium ? (
            <Badge variant="success" icon={ShieldCheck}>Unlocked</Badge>
          ) : (
            <Badge variant="warning" icon={Lock}>Members Only</Badge>
          )}
        </div>
      </PageHero>

      {/* CONTENT */}
      <section className="py-10 md:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {course.access === 'free' && course.freeContent && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-navy font-heading mb-4">About this course</h2>
                <p className="text-slate-600 leading-relaxed text-base">{course.freeContent.intro}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <h3 className="text-navy font-semibold text-sm uppercase tracking-wide mb-3">What you'll learn</h3>
                  <ul className="space-y-2.5">
                    {course.topics.slice(0, 4).map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-5 border border-slate-200">
                  <h3 className="text-navy font-semibold text-sm uppercase tracking-wide mb-3">Course overview</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Duration</span>
                      <span className="font-semibold text-navy">{course.duration}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Modules</span>
                      <span className="font-semibold text-navy">{course.modules}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Level</span>
                      <span className="font-semibold text-navy">{course.level}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Access</span>
                      <span className="font-semibold text-emerald-700">Free</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {canViewPremium && course.premiumContent && (
            <div className="space-y-8">
              <p className="text-slate-600 leading-relaxed">{course.premiumContent.intro}</p>

              {/* Video */}
              <div className="bg-white rounded-xl border border-corp-blue/10 overflow-hidden shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between gap-2 text-sm font-semibold text-navy border-b border-slate-100">
                  <span className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-corp-blue" />
                    {course.premiumContent.videoTitle}
                  </span>
                  {videoWatched && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Watched
                    </span>
                  )}
                </div>
                <video
                  className="w-full max-h-[420px] object-cover bg-navy"
                  src={course.premiumContent.videoUrl}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onSeeking={handleVideoSeeking}
                  onEnded={handleVideoEnded}
                />
                {!videoWatched && (
                  <p className="px-4 py-2 text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
                    Skipping ahead is disabled — play the video through to the end to mark it watched.
                  </p>
                )}
              </div>

              {/* Lessons */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-navy font-bold text-lg font-heading">Lessons</h3>
                  <span className="text-xs font-semibold text-slate-500">{readLessons.size}/{totalLessons} read</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Scroll all the way through each lesson below — it's marked read automatically once you've scrolled past it.</p>
                <div className="space-y-3">
                  {course.premiumContent.lessons.map((lesson, idx) => {
                    const isRead = readLessons.has(idx);
                    return (
                      <div
                        key={idx}
                        ref={(el) => { lessonRefs.current[idx] = el; }}
                        data-lesson-index={idx}
                        className={`flex gap-3 items-start rounded-lg p-4 border transition-colors ${
                          isRead ? 'bg-emerald-50 border-emerald-200' : 'bg-pale-blue/40 border-corp-blue/10'
                        }`}
                      >
                        {isRead ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-grow">
                          <h4 className="text-navy font-semibold text-sm">{lesson.title}</h4>
                          <p className="text-slate-500 text-sm mt-1 leading-relaxed">{lesson.summary}</p>
                        </div>
                        {isRead && (
                          <span className="text-[10px] font-bold text-emerald-700 shrink-0 mt-0.5">Read</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Downloadable resource */}
              <a
                href={course.premiumContent.resourceUrl}
                download
                className="flex items-center gap-2 bg-pale-blue/40 rounded-lg p-4 border border-corp-blue/10 text-sm font-semibold text-corp-blue hover:border-corp-blue/40 transition-colors w-fit"
              >
                <Download className="w-4 h-4" />
                {course.premiumContent.resourceLabel}
              </a>

              {/* Quiz & Certificate — gated behind video + lesson completion */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-navy font-bold text-lg font-heading mb-4">Assessment & Certificate</h3>
                {assessmentUnlocked && assessmentOpened ? (
                  <CourseQuizCertificate
                    courseId={course.id}
                    courseTitle={course.title}
                    quiz={course.premiumContent.quiz}
                    userId={user!.id}
                    userName={user!.name}
                  />
                ) : assessmentUnlocked ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Assessment unlocked
                    </div>
                    <p className="text-slate-600 text-sm">You've watched the lecture and read every lesson. Ready when you are.</p>
                    <button
                      id="start-assessment"
                      type="button"
                      onClick={() => setAssessmentOpened(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-[#B37612] text-white text-sm font-semibold rounded-md shadow-md transition-all"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Start Assessment
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                      <Lock className="w-4 h-4" />
                      Complete the lecture and all lessons to unlock the assessment
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className={`flex items-center gap-2 ${videoWatched ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {videoWatched ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        Watch the lecture video to the end
                      </li>
                      <li className={`flex items-center gap-2 ${allLessonsRead ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {allLessonsRead ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        Mark all {totalLessons} lessons as read ({readLessons.size}/{totalLessons})
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {isLockedPremium && (
            <div className="bg-pale-blue/40 border border-corp-blue/10 rounded-2xl p-8 md:p-12 text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-navy text-gold rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-navy font-heading">This course is for members only</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Unlock the full lesson videos, downloadable resources, quiz, and certificate with an AICAIML membership.
              </p>
              <div className="pt-2">
                {course.topics.length > 0 && (
                  <ul className="flex flex-wrap justify-center gap-2 mb-6">
                    {course.topics.map((topic, idx) => (
                      <li key={idx} className="text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
                        {topic}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  id="course-detail-unlock"
                  onClick={goToMembership}
                  className="px-6 py-3 bg-gold hover:bg-[#B37612] text-white text-sm font-semibold rounded-md shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{user ? 'Upgrade Membership to Unlock' : 'Unlock with Membership'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
