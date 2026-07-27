import { useState, useEffect } from 'react';
import { initialProjects, initialEvents, UpcomingEvent, Project } from '../cmsData';
import {
  Sparkles, Calendar, MapPin, Tag, ShieldCheck, ArrowRight, CheckCircle, Clock
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface EventsProjectsProps {
  onOpenRegisterEventModal: (event: UpcomingEvent) => void;
}

export default function EventsProjects({ onOpenRegisterEventModal }: EventsProjectsProps) {
  useDocumentMeta(
    'Projects & Events',
    'AICAIML national initiatives and upcoming conferences, workshops, and hackathons in AI, Machine Learning, and Robotics.'
  );
  const [projectFilter, setProjectFilter] = useState<'All' | 'Robotics' | 'AI Integration' | 'Machine Learning'>('All');
  const [eventFilter, setEventFilter] = useState<'All' | 'Conference' | 'Workshop' | 'Hackathon' | 'FDP'>('All');

  const [projectsList, setProjectsList] = useState<Project[]>(initialProjects);
  const [eventsList, setEventsList] = useState<UpcomingEvent[]>(initialEvents);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: Project[]) => {
        if (Array.isArray(data) && data.length > 0) setProjectsList(data);
      })
      .catch((err) => console.warn('Falling back to bundled projects list:', err));
  }, []);

  useEffect(() => {
    fetch('/api/events')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: UpcomingEvent[]) => {
        if (Array.isArray(data) && data.length > 0) setEventsList(data);
      })
      .catch((err) => console.warn('Falling back to bundled events list:', err));
  }, []);

  // Filtered lists
  const filteredProjects = projectFilter === 'All' 
    ? projectsList 
    : projectsList.filter(p => p.category === projectFilter);

  const filteredEvents = eventFilter === 'All'
    ? eventsList
    : eventsList.filter(e => e.category === eventFilter);

  return (
    <div id="events-projects-page" className="animate-slideup bg-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase text-corp-blue font-bold tracking-widest font-heading">Activities & Portfolios</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy font-heading text-gradient-animate">
            Our Projects & Upcoming Events
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Discover how AICAIML actively transforms deep tech sectors in India. Register interest to join physical and virtual congress pipelines.
          </p>
        </div>

        {/* SECTION 1: CORE PROJECTS */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-navy font-heading">Our Core Projects</h2>
              <p className="text-xs text-slate-500">Distributed initiatives transforming technical engineering curricula.</p>
            </div>
            
            {/* Project category filter — a toggle group, not tabs: it filters
                one continuous grid rather than switching between panels. */}
            <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2 mt-4 sm:mt-0">
              {(['All', 'Robotics', 'AI Integration', 'Machine Learning'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProjectFilter(filter)}
                  aria-pressed={projectFilter === filter}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    projectFilter === filter
                      ? 'bg-corp-blue text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProjects.map((proj) => (
              <Card key={proj.id} padding="none" interactive className="bg-slate-50 border-slate-200/60 flex flex-col md:flex-row">
                <img
                  src={proj.image}
                  alt={proj.title}
                  referrerPolicy="no-referrer"
                  width={176}
                  height={176}
                  loading="lazy"
                  className="w-full md:w-44 h-44 object-cover shrink-0 bg-slate-200"
                />
                <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>{proj.category}</span>
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{proj.status}</span>
                    </div>
                    <h3 className="font-bold text-navy text-base font-heading leading-tight">{proj.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{proj.description}</p>
                  </div>
                  <div className="border-t border-slate-200 pt-3 text-xs font-semibold text-corp-blue flex items-center justify-between">
                    <span>Impact Metric</span>
                    <span>{proj.impact}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 2: UPCOMING EVENTS */}
        <div className="space-y-8 border-t border-slate-100 pt-16">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-navy font-heading">Upcoming Events Calendar</h2>
              <p className="text-xs text-slate-500">Accelerate your professional network at our upcoming virtual/physical milestones.</p>
            </div>
            
            {/* Event category filter — same toggle-group semantics as above */}
            <div role="group" aria-label="Filter events by category" className="flex flex-wrap gap-2 mt-4 sm:mt-0">
              {(['All', 'Conference', 'Workshop', 'Hackathon', 'FDP'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter)}
                  aria-pressed={eventFilter === filter}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    eventFilter === filter
                      ? 'bg-corp-blue text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Events list */}
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                interactive
                className="hover:border-corp-blue/30 hover:bg-pale-blue/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-3 max-w-4xl">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-gold font-bold uppercase tracking-wider">{event.category}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" aria-hidden="true" /> {event.date}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" aria-hidden="true" /> {event.time}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {event.venue}</span>
                  </div>
                  <h3 className="text-xl font-bold text-navy font-heading">{event.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
                </div>
                <Button
                  id={`btn-reg-interest-page-${event.id}`}
                  variant="accent"
                  onClick={() => onOpenRegisterEventModal(event)}
                  className="w-full md:w-auto shrink-0"
                >
                  Register Interest
                </Button>
              </Card>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12 bg-slate-50 border rounded-xl border-dashed">
                <p className="text-sm text-slate-500">No upcoming events found matching the filter selection.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
