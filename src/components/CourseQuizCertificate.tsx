import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Award, Printer, Download, RotateCcw } from 'lucide-react';
import { Button } from './ui';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface CourseQuizCertificateProps {
  courseId: string;
  courseTitle: string;
  quiz: QuizQuestion[];
  userId: string;
  userName: string;
}

const PASS_THRESHOLD = 0.7;

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, centerX: number, startY: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, centerX, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, centerX, y);
  return y;
}

export default function CourseQuizCertificate({ courseId, courseTitle, quiz, userId, userName }: CourseQuizCertificateProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce((total, answer, idx) => total + (answer === quiz[idx].correctIndex ? 1 : 0), 0);
  const passed = submitted && score / quiz.length >= PASS_THRESHOLD;
  const allAnswered = answers.every((a) => a !== null);

  const verificationCode = `AICAIML-CERT-${courseId.toUpperCase()}-${userId.slice(-6).toUpperCase()}`;

  // Persist the certificate so it's independently verifiable via /api/verify —
  // idempotent server-side, so revisiting a passed quiz won't duplicate it.
  useEffect(() => {
    if (!passed) return;
    fetch('/api/certificates/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: verificationCode, courseId, courseTitle })
    }).catch((err) => console.warn('Failed to record certificate:', err));
  }, [passed, verificationCode, courseId, courseTitle]);

  const retake = () => {
    setAnswers(quiz.map(() => null));
    setSubmitted(false);
  };

  const downloadCertificate = () => {
    const width = 1200;
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas can't read CSS custom properties, so these hex values are a
    // deliberate literal mirror of --color-navy/--color-corp-blue/--color-gold/
    // --color-slate-grey in index.css — keep them in sync if the theme changes.
    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Gold border (double rule)
    ctx.strokeStyle = '#0D6E86';
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, width - 48, height - 48);
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, width - 88, height - 88);

    ctx.textAlign = 'center';
    const centerX = width / 2;

    ctx.fillStyle = '#14335F';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('CERTIFICATE OF COMPLETION', centerX, 150);

    ctx.fillStyle = '#0A1B33';
    ctx.font = 'bold 44px Georgia, serif';
    const titleEndY = wrapCanvasText(ctx, courseTitle, centerX, 230, width - 300, 54);

    ctx.fillStyle = '#64748B';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('This certifies that', centerX, titleEndY + 70);

    ctx.fillStyle = '#0A1B33';
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillText(userName, centerX, titleEndY + 125);

    ctx.fillStyle = '#64748B';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('has successfully completed this AICAIML member course.', centerX, titleEndY + 170);

    const issuedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillStyle = '#64748B';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText(`Issued: ${issuedDate}        ${verificationCode}`, centerX, height - 70);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AICAIML-Certificate-${courseId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  if (passed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
          <CheckCircle className="w-5 h-5" aria-hidden="true" />
          Quiz passed ({score}/{quiz.length}) — course complete!
        </div>

        {/* Certificate */}
        <div id={`certificate-${courseId}`} className="certificate-print-area print:shadow-none bg-white border-4 border-gold rounded-xl p-8 text-center space-y-3 shadow-md">
          <Award className="w-10 h-10 text-gold mx-auto" aria-hidden="true" />
          <p className="text-xs uppercase tracking-widest text-corp-blue font-bold">Certificate of Completion</p>
          <h3 className="text-2xl font-bold font-heading text-navy">{courseTitle}</h3>
          <p className="text-sm text-slate-600">This certifies that</p>
          <p className="text-xl font-bold font-heading text-navy">{userName}</p>
          <p className="text-sm text-slate-600">has successfully completed this AICAIML member course.</p>
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
            <span>Issued: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="font-mono">{verificationCode}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="accent" size="sm" icon={Download} onClick={downloadCertificate}>
            Download Certificate (PNG)
          </Button>
          <Button size="sm" icon={Printer} onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-navy font-bold text-sm">Course Assessment</h4>
      <p className="text-xs text-slate-500">Score {Math.round(PASS_THRESHOLD * 100)}% or higher to unlock your certificate.</p>

      {quiz.map((q, qIdx) => (
        <div key={qIdx} className="bg-white rounded-lg p-4 border border-corp-blue/10 space-y-2">
          <p className="text-sm font-semibold text-navy">{qIdx + 1}. {q.question}</p>
          <div className="space-y-1.5">
            {q.options.map((option, oIdx) => {
              const isSelected = answers[qIdx] === oIdx;
              const isCorrect = oIdx === q.correctIndex;
              let stateClass = 'border-slate-200 hover:border-corp-blue/40';
              if (submitted) {
                if (isCorrect) stateClass = 'border-emerald-400 bg-emerald-50';
                else if (isSelected) stateClass = 'border-rose-400 bg-rose-50';
              } else if (isSelected) {
                stateClass = 'border-corp-blue bg-pale-blue/50';
              }
              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={submitted}
                  onClick={() => {
                    const next = [...answers];
                    next[qIdx] = oIdx;
                    setAnswers(next);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md border text-xs flex items-center justify-between transition-colors ${stateClass}`}
                >
                  <span>{option}</span>
                  {submitted && isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />}
                  {submitted && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {submitted ? (
        <div className="space-y-3">
          <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs">
            You scored {score}/{quiz.length}. Review the highlighted answers above and try again.
          </div>
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={retake}>
            Retake Quiz
          </Button>
        </div>
      ) : (
        <Button variant="accent" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
          Submit Quiz
        </Button>
      )}
    </div>
  );
}
