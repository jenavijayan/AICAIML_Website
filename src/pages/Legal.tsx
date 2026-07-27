import { useState } from 'react';
import { ShieldCheck, Scale, FileText, Globe, KeyRound, Gavel } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface LegalProps {
  initialSection: 'privacy' | 'terms';
}

export default function Legal({ initialSection }: LegalProps) {
  const [activeSection, setActiveSection] = useState<'privacy' | 'terms'>(initialSection);
  useDocumentMeta(
    activeSection === 'privacy' ? 'Privacy Policy' : 'Terms of Use',
    activeSection === 'privacy'
      ? "AICAIML's privacy policy covering data collection, use, and protection."
      : "AICAIML's terms of use and legal disclosures for the platform."
  );

  return (
    <div id="legal-documents-page" className="animate-slideup bg-white py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Toggle selectors */}
        <div className="flex border-b border-slate-200 justify-center gap-4">
          <button
            id="tab-legal-privacy"
            onClick={() => setActiveSection('privacy')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeSection === 'privacy'
                ? 'border-corp-blue text-corp-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            Privacy Policy
          </button>
          <button
            id="tab-legal-terms"
            onClick={() => setActiveSection('terms')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeSection === 'terms'
                ? 'border-corp-blue text-corp-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4.5 h-4.5" />
            Terms of Use & Disclosures
          </button>
        </div>

        {/* POLICY CONTENT RENDERING */}
        {activeSection === 'privacy' ? (
          <article className="prose max-w-none text-slate-800 space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold font-heading text-navy text-gradient-animate">AICAIML Privacy Policy</h1>
              <p className="text-xs text-slate-500">Effective Date: July 17, 2026 | Last Updated: July 17, 2026</p>
            </div>

            <p className="text-sm leading-relaxed text-justify">
              The All India Council for Artificial Intelligence and Machine Learning (AICAIML) is committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, share, and protect your personal and organizational information when you interact with the AICAIML Portal, apply for membership, or participate in council programmes.
            </p>

            {/* 1 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">1. Information We Collect</h2>
              <div className="space-y-2 text-sm leading-relaxed pl-1">
                <p><strong>Personal Information:</strong> We collect your full name, email address, mobile number, date of birth, year of study, roll/registration number, department, and physical signature/declaration checklists when you apply for Student memberships.</p>
                <p><strong>Organization & Institutional Data:</strong> We collect business name, website URL, corporate address, MSME registration certificate IDs, GST/CIN numbers, partnership categories, and authorized representative details when entities register.</p>
                <p><strong>Professional Credentials:</strong> We collect curriculum outlines, details of existing campus clubs, principal/head designations, and technical interests to verify partnership requests.</p>
                <p><strong>Technical Data:</strong> We automatically log web logs, IP addresses, cookie states, browser agent attributes, and frame telemetry to maintain security compliance on sandbox simulate consoles.</p>
              </div>
            </div>

            {/* 2 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">2. How We Use Your Information</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                We use collected information to: process and verify membership enrollments against academic/commercial registries; dispatch cryptographically signed digital certificates; maintain secure sandbox login environments; catalog upcoming event interests; send simulated email receipts; evaluate curriculum standards; and protect our platform from automated spam submissions.
              </p>
            </div>

            {/* 3 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">3. Information Sharing and Disclosure</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                AICAIML does not sell or lease your personal information to third-party advertisers. We only share verified credentials with authorized corporate hiring managers (Intel Technologies India, Nvidia AI Research, etc.) for direct internship dispatch. We may disclose data when legally required under central regulatory frameworks or statutory mandates.
              </p>
            </div>

            {/* 4 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">4. Data Security & Storage</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                All data is logged securely in centralized, industry-standard encrypted storage servers. Access is restricted to vetted secretariat reviewers. We apply end-to-end security layers; however, as no network transition is absolutely secure, we advise caution during file transfers.
              </p>
            </div>

            {/* 5 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">5. Cookies and Web Identifiers</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Our platform uses essential session cookies to remember browser preferences and authenticate logged sessions. Non-essential analytical cookies may track page visits to help optimize our bento grid layouts. You may reject non-essential cookies via our consent advisory.
              </p>
            </div>

            {/* 6 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">6. Your Rights</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Under prevailing Indian IT Acts, members retain full rights to request access to their registered dossiers, request rectification of erroneous data, or request complete removal from our registry (which revokes credential signatures). Address such requests to <strong>privacy@aic-aiml.org</strong>.
              </p>
            </div>

            {/* 7 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">7. Third-Party Links</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Our platform contains link references to external academic websites or corporate partner portals. AICAIML holds no control over their independent privacy policies, and members are urged to review external policies upon exit.
              </p>
            </div>

            {/* 8 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">8. Children’s Privacy</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                We do not knowingly collect personal identifiers from minor students under 13 without verified parental consent checks or school authority declarations.
              </p>
            </div>

            {/* 9 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">9. Changes to This Privacy Policy</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                AICAIML reserves the right to modify this policy at any time to reflect emerging technological guidelines. Updates are immediately effective upon publishing on the portal.
              </p>
            </div>

            {/* 10 */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">10. Contact Us</h2>
              <p className="text-sm leading-relaxed pl-1">
                For administrative privacy queries, address mail to:<br />
                <strong>Privacy Officer, AICAIML National Secretariat</strong><br />
                7th Floor, Innovation Tower, Block B, Noida Sector 62, Uttar Pradesh 201301<br />
                Email: <strong>privacy@aic-aiml.org</strong>
              </p>
            </div>
          </article>
        ) : (
          <article className="prose max-w-none text-slate-800 space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold font-heading text-navy text-gradient-animate">Terms of Use & Legal Disclosures</h1>
              <p className="text-xs text-slate-500">Effective Date: July 17, 2026</p>
            </div>

            <p className="text-sm leading-relaxed text-justify">
              Welcome to the AICAIML portal. By accessing our resources, applying for professional memberships, or enrolling in simulation sandboxes, you agree to comply with the following Terms of Use.
            </p>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">1. About AICAIML</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                The All India Council for Artificial Intelligence and Machine Learning (AICAIML) operates as a registered non-profit professional council organized under Section 8 of the Indian Companies Act, dedicated to advancing deep tech and robotics standard guidelines.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">2. Membership Criteria</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Enrollment applications are subjected to manual verification checks by the review board. Provisionally issued membership numbers represent enrollment requests and do not constitute absolute legal standing until credentials are cryptographically finalized.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">3. Member Responsibilities</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Members agree to provide authentic educational and corporate registration credentials. Any deceptive registration of false MSME certificates or college registration roll numbers will lead to immediate cancellation of credentials and reporting to appropriate university boards.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">4. Events and Programmes</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                AICAIML organizes workshops, webinars, and regional hackathons. Registration of interest does not guarantee a physical ticket to Bharat Mandapam summits due to space constraints; final seat designations are dispatched separately.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">5. Intellectual Property</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                The logo of AICAIML, standard curriculum guidelines, simulation sandbox logic, crop forecasting whitepapers, and page graphics represent the proprietary assets of the Council. Authorized partners retain rights to display accredited partner badges on physical gates.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">6. User Content & Ethics Code</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Members agree to abide by the official AICAIML Ethics Code. Academic submissions and research papers submitted to congress review panels must represent original intellectual properties and bypass automated plagiarism checkers.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">7. Privacy & Cookies Consent</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Your portal interactions are regulated by the official Privacy Policy. Continuing portal usage denotes explicit compliance.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">8. Payment & Financial Disclosures (Phase 1)</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Under current Bylaws, Phase 1 website enrollment requires zero upfront payments. AICAIML does not collect banking card parameters during Phase 1. Any donation activities must be made through accredited bank transfer options (NEFT/RTGS).
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">9. Disclaimers & Model Liability</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                AICAIML’s research outputs, agricultural predictions, and simulation sandbox models are provided "as-is" without warranty. The council bears no financial or operational liability for computational algorithm failures in real-world deployment.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">10. Code of Ethics</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                Members agree to develop computational AI, ML, and Robotics platforms solely for the improvement of human life and national progress, actively avoiding autonomous weapon research or deceptive diagnostic algorithms.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold font-heading text-navy">11. Governing Law & Jurisdiction</h2>
              <p className="text-sm leading-relaxed pl-1 text-justify">
                These terms are governed by the laws of the Republic of India. Any legal disputes arising from portal operations or certificate disputes shall be subject to the exclusive jurisdiction of the Courts in Noida/Delhi NCR.
              </p>
            </div>

            {/* Disclosures section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-navy font-bold">
                <Gavel className="w-5 h-5 text-gold" />
                <h3 className="font-heading text-base">Section 12: National Council Legal Disclosures</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                AICAIML (All India Council for Artificial Intelligence and Machine Learning) is an autonomous professional council. It is not affiliated directly with any state ministry or standard government board unless explicitly stated. The registry database is maintained in corporate server sandboxes under Section 8 guidelines for public benefit.
              </p>
            </div>
          </article>
        )}

      </div>
    </div>
  );
}
