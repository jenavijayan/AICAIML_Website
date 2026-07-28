import { Mail, Phone, MapPin, Linkedin, Twitter, Youtube, ArrowUp } from 'lucide-react';
import logo from '../images/logo-web.png';

interface FooterProps {
  setCurrentPage: (page: string) => void;
}

export default function Footer({ setCurrentPage }: FooterProps) {
  const handlePageClick = (pageId: string) => {
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer id="global-footer" className="bg-navy text-white pt-16 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* About Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handlePageClick('home')}>
              <div className="bg-white rounded-full p-1.5 shrink-0">
                <img src={logo} alt="AICAIML Logo" width={56} height={56} loading="lazy" className="w-14 h-14 object-contain rounded-full" />
              </div>
              <span className="text-xl font-bold tracking-wider text-white font-heading">
                AICAIML
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Advancing Artificial Intelligence, Machine Learning, and Robotics across India through transformative educational curriculum, incubation ecosystems, and strategic academia-industry partnerships.
            </p>
            <div className="flex items-center gap-3 pt-4">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="bg-white/10 p-2 rounded-md hover:bg-accent-sky hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="bg-white/10 p-2 rounded-md hover:bg-accent-sky hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="bg-white/10 p-2 rounded-md hover:bg-accent-sky hover:text-white transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 border-b border-white/10 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <button onClick={() => handlePageClick('home')} className="hover:text-gold transition-colors text-left w-full">
                  Home Portal
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('know-aicaiml')} className="hover:text-gold transition-colors text-left w-full">
                  Know AICAIML
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('courses')} className="hover:text-gold transition-colors text-left w-full">
                  Courses
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('learners')} className="hover:text-gold transition-colors text-left w-full">
                  Learners & Associates
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('events-projects')} className="hover:text-gold transition-colors text-left w-full">
                  Events & Projects
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('membership')} className="hover:text-gold transition-colors text-left w-full">
                  Membership Options
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('benefits-view')} className="hover:text-gold transition-colors text-left w-full">
                  Membership Benefits
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('verification')} className="hover:text-gold transition-colors text-left w-full">
                  Verify Certificate / Membership
                </button>
              </li>
            </ul>
          </div>

          {/* Membership Categories Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 border-b border-white/10 pb-2">
              Membership Categories
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <button onClick={() => handlePageClick('membership')} className="hover:text-gold transition-colors text-left">
                  Student Forum
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('membership')} className="hover:text-gold transition-colors text-left">
                  MSME Network Forum
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('membership')} className="hover:text-gold transition-colors text-left">
                  Corporate & Associate Partners
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('membership')} className="hover:text-gold transition-colors text-left">
                  School / College Institutional
                </button>
              </li>
              <li>
                <button onClick={() => handlePageClick('membership')} className="hover:text-gold transition-colors text-left">
                  University Partnership
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6 border-b border-white/10 pb-2">
              National Secretariat
            </h3>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>
                  52A First Floor, Vijay Block, Laxmi Nagar, Delhi 110092
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold shrink-0" />
                <span>
                  <a href="tel:+917305764999" className="hover:text-gold transition-colors">+91 73057 64999</a>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold shrink-0" />
                <a href="mailto:info@aicaiml.org" className="hover:text-gold transition-colors">
                  info@aicaiml.org
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Lower copyright bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div>
            <p>&copy; {currentYear} AICAIML (All India Council for Artificial Intelligence and Machine Learning). All rights reserved.</p>
            <p className="text-xs text-slate-500 mt-1">Regd No: 144510-DEL-2026 under section 8 of Companies Act. Advancing national technology goals.</p>
          </div>
          <div className="flex gap-6">
            <button onClick={() => handlePageClick('privacy')} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => handlePageClick('terms')} className="hover:text-white transition-colors">
              Terms of Use & Disclosures
            </button>
          </div>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1 text-xs text-slate-300 hover:text-gold bg-white/5 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
