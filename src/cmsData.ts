import { resolveAssetUrl } from './lib/assetPaths';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'Robotics' | 'AI Integration' | 'Machine Learning' | 'Academia';
  image: string;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  impact: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  description: string;
  date: string; // e.g., "August 24, 2026"
  time: string;
  venue: string;
  category: 'Conference' | 'Workshop' | 'Hackathon' | 'FDP'; // Faculty Development Program
}

export interface NewsUpdate {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: 'Announcement' | 'Press Release' | 'Industry News';
  readTime: string;
}

export interface Testimonial {
  id: string;
  name: string;
  designation: string;
  organization: string;
  quote: string;
  avatarUrl: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'AI Fundamentals' | 'Machine Learning' | 'Robotics' | 'Generative AI';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  modules: number;
  access: 'free' | 'membership';
  topics: string[];
  // Only present on free-access courses — real lesson content shown directly on the page.
  freeContent?: {
    intro: string;
    lessons: { title: string; summary: string }[];
  };
  // Only present on membership-access courses — unlocked for logged-in members with premium access.
  premiumContent?: {
    intro: string;
    lessons: { title: string; summary: string }[];
    videoUrl: string;
    videoTitle: string;
    resourceUrl: string;
    resourceLabel: string;
    quiz: { question: string; options: string[]; correctIndex: number }[];
  };
}

export interface MembershipPlan {
  id: string;
  name: string;
  badge: string;
  price: number;
  billingPeriod: 'year';
  recommended?: boolean;
  features: { label: string; included: boolean }[];
}

export const membershipPlans: MembershipPlan[] = [
  {
    id: 'plan-student',
    name: 'Student Membership',
    badge: 'Most Popular',
    price: 500,
    billingPeriod: 'year',
    features: [
      { label: 'All free & recorded learning sessions', included: true },
      { label: 'Student events & webinars', included: true },
      { label: 'Certificate eligibility', included: true },
      { label: 'District & state chapter membership', included: true },
      { label: 'Email support', included: true },
      { label: 'Priority event registration', included: false },
      { label: 'AI Career Readiness Program', included: false }
    ]
  },
  {
    id: 'plan-educator',
    name: 'Educator Membership',
    badge: 'Educator',
    price: 1000,
    billingPeriod: 'year',
    features: [
      { label: 'All Student benefits', included: true },
      { label: 'Educator learning tracks', included: true },
      { label: 'Professional development certificates', included: true },
      { label: 'Resource library access', included: true },
      { label: 'Priority email support', included: true },
      { label: 'Institutional licensing', included: false }
    ]
  },
  {
    id: 'plan-individual',
    name: 'Individual Membership',
    badge: 'Recommended',
    price: 5000,
    billingPeriod: 'year',
    recommended: true,
    features: [
      { label: 'Full access to all membership-only courses', included: true },
      { label: 'Priority event registration', included: true },
      { label: 'AI Career Readiness Program', included: true },
      { label: 'All certificate levels', included: true },
      { label: 'Chapter participation', included: true },
      { label: 'Dedicated support', included: true },
      { label: 'Early course access', included: true }
    ]
  },
  {
    id: 'plan-institutional',
    name: 'Institutional Membership',
    badge: 'Organisation',
    price: 15000,
    billingPeriod: 'year',
    features: [
      { label: 'Up to 50 member logins', included: true },
      { label: 'Bulk certificate enrollment', included: true },
      { label: 'Coordinator access', included: true },
      { label: 'Custom outreach support', included: true },
      { label: 'Priority event branding', included: true },
      { label: 'Annual impact report', included: true },
      { label: 'Dedicated account manager', included: true }
    ]
  }
];

export interface Partner {
  id: string;
  name: string;
  type: 'Academic' | 'Corporate' | 'Government' | 'Startup';
  logoPlaceholder: string; // Tailored styled initials or simple vector logo
}

// Editable CMS-like data lists
export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'National AI Skills & Certification Initiative (NASCI)',
    description: 'Empowering over 50,000 engineering students across tier-2 and tier-3 colleges in India with specialized certifications in Deep Learning and NLP, co-designed with industry leaders.',
    category: 'AI Integration',
    image: resolveAssetUrl('/images/project-nasci-initiative.jpg'),
    status: 'Ongoing',
    impact: '50,000+ Students Certified'
  },
  {
    id: 'proj-2',
    title: 'AICAIML Autonomous Robotics Sandbox',
    description: 'An open-access simulation and testing lab network for students and startups to design, prototype, and build autonomous rovers and drone systems with cloud-integrated digital twins.',
    category: 'Robotics',
    image: resolveAssetUrl('/images/project-robotics-sandbox.jpg'),
    status: 'Ongoing',
    impact: '120+ College Club Sandbox Labs'
  },
  {
    id: 'proj-3',
    title: 'AI Ethics & Algorithmic Fairness Whitepaper',
    description: 'A multi-stakeholder research collaboration presenting guidelines on ethical deployment of AI/ML systems in healthcare, finance, and public services within the Indian socio-demographic context.',
    category: 'Machine Learning',
    image: resolveAssetUrl('/images/project-ai-ethics-healthcare.jpg'),
    status: 'Completed',
    impact: 'Adopted as National Advisory'
  },
  {
    id: 'proj-4',
    title: 'Smart Agriculture IoT & Edge ML Framework',
    description: 'Affordable IoT sensors and localized edge ML models developed in collaboration with leading agricultural universities to forecast soil moisture, crop disease, and optimize watering schedules.',
    category: 'Machine Learning',
    image: resolveAssetUrl('/images/project-smart-agriculture.jpg'),
    status: 'Upcoming',
    impact: 'Targeting 5,000 Farmers in Phase 1'
  }
];

export const initialEvents: UpcomingEvent[] = [
  {
    id: 'evt-1',
    title: 'National AI/ML & Robotics Congress 2026',
    description: 'The premier national assembly bringing together researchers, industrialists, startups, and policy-makers to discuss sustainable AI strategies, edge AI innovations, and autonomous robotics.',
    date: 'September 15-17, 2026',
    time: '09:00 AM - 05:30 PM',
    venue: 'Bharat Mandapam, New Delhi (Hybrid)',
    category: 'Conference'
  },
  {
    id: 'evt-2',
    title: 'AICAIML Smart India Robotics Hackathon',
    description: 'A 36-hour physical hackathon focusing on building hardware and software robotics solutions for disaster management, search & rescue, and automated waste segregation.',
    date: 'October 10-12, 2026',
    time: '08:00 AM onwards',
    venue: 'IIT Madras Research Park, Chennai',
    category: 'Hackathon'
  },
  {
    id: 'evt-3',
    title: 'National Faculty Development Program (FDP) on Generative AI',
    description: 'An intensive, AICTE-aligned 5-day professional development program teaching faculty members modern Generative AI pipelines, LLM fine-tuning, and prompt-engineering methodologies.',
    date: 'November 02-06, 2026',
    time: '10:00 AM - 04:00 PM',
    venue: 'Virtual (Zoom Platform)',
    category: 'FDP'
  },
  {
    id: 'evt-4',
    title: 'Hands-on Edge-ML on Microcontrollers Workshop',
    description: 'An advanced, practical workshop focusing on building and running tiny machine learning models (TinyML) on resource-constrained embedded systems and microcontrollers.',
    date: 'December 05, 2026',
    time: '10:00 AM - 05:00 PM',
    venue: 'IISc Innovation Center, Bengaluru',
    category: 'Workshop'
  }
];

export const initialNews: NewsUpdate[] = [
  {
    id: 'news-1',
    title: 'AICAIML Partners with 50+ Top Indian Universities for Centers of Excellence',
    summary: 'Establishing advanced research facilities in Machine Learning and Robotics to bridge the gap between academic theory and real-world industrial applicability.',
    date: 'July 14, 2026',
    category: 'Announcement',
    readTime: '3 min read'
  },
  {
    id: 'news-2',
    title: 'Ethics Board Proposes Unified National AI Guideline for Medical Diagnostic Tools',
    summary: 'AICAIML’s ethics advisory panel releases a comprehensive framework safeguarding patient privacy and model bias auditing standard operating procedures.',
    date: 'June 28, 2026',
    category: 'Press Release',
    readTime: '5 min read'
  },
  {
    id: 'news-3',
    title: 'Applications Open for the National AI Startup Acceleration Cohort 2027',
    summary: 'Providing up to 10 selected deep-tech startups with technical mentorship, sandboxed cloud credits, and direct investor matchmaking pipelines.',
    date: 'June 15, 2026',
    category: 'Announcement',
    readTime: '4 min read'
  }
];

export const initialCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Introduction to Artificial Intelligence',
    description: 'A beginner-friendly walkthrough of core AI concepts, history, and how intelligent systems are shaping industry today.',
    category: 'AI Fundamentals',
    level: 'Beginner',
    duration: '2 hrs',
    modules: 4,
    access: 'free',
    topics: ['What is AI?', 'Narrow vs General AI', 'Real-world applications', 'AI in India'],
    freeContent: {
      intro: 'This free introductory course gives you a working understanding of what Artificial Intelligence actually is, how it differs from traditional software, and where it is already being used across Indian industry and governance.',
      lessons: [
        { title: 'Lesson 1: Defining Intelligence in Machines', summary: 'How AI systems perceive, reason, and act — and why "intelligence" here means pattern recognition at scale, not consciousness.' },
        { title: 'Lesson 2: Narrow AI vs General AI', summary: 'Nearly every AI system in production today is narrow AI, built for one task. We unpack why general AI remains a research goal, not a product.' },
        { title: 'Lesson 3: Where AI Already Works Today', summary: 'Recommendation engines, fraud detection, medical imaging, and agricultural forecasting — grounded examples of deployed AI systems.' },
        { title: 'Lesson 4: The Indian AI Landscape', summary: "An overview of India's AI policy direction, startup ecosystem, and the skills gap this council exists to close." }
      ]
    }
  },
  {
    id: 'course-2',
    title: 'Machine Learning Foundations',
    description: 'Understand how machines actually learn from data — the math intuition, not just the buzzwords.',
    category: 'Machine Learning',
    level: 'Beginner',
    duration: '3 hrs',
    modules: 5,
    access: 'free',
    topics: ['Supervised vs Unsupervised', 'Training & testing data', 'Overfitting', 'Common algorithms'],
    freeContent: {
      intro: 'This course builds intuition for how machine learning models are trained, evaluated, and where they commonly go wrong — no advanced math required.',
      lessons: [
        { title: 'Lesson 1: Learning From Examples', summary: 'The core idea behind supervised learning: showing a model labeled examples until it generalizes to new ones.' },
        { title: 'Lesson 2: Supervised vs Unsupervised Learning', summary: 'When you have labels vs when you are looking for hidden structure in unlabeled data.' },
        { title: 'Lesson 3: Training, Validation & Test Splits', summary: 'Why models are evaluated on data they have never seen, and what that protects against.' },
        { title: 'Lesson 4: Overfitting, Explained Simply', summary: 'A model that memorizes instead of learns — and the practical signs that tell you it has happened.' },
        { title: 'Lesson 5: A Tour of Common Algorithms', summary: 'Plain-language intuition for linear regression, decision trees, and neural networks.' }
      ]
    }
  },
  {
    id: 'course-4',
    title: 'Generative AI & Large Language Models',
    description: 'A full-depth course on how LLMs work, prompt engineering, and building applications on top of foundation models.',
    category: 'Generative AI',
    level: 'Intermediate',
    duration: '10 hrs',
    modules: 12,
    access: 'membership',
    topics: ['Transformer architecture', 'Prompt engineering', 'Fine-tuning', 'RAG pipelines', 'Deployment & safety'],
    premiumContent: {
      intro: 'A full-depth, member-only course on how large language models actually work under the hood, and how to build reliable applications on top of them.',
      lessons: [
        { title: 'Lesson 1: The Transformer Architecture', summary: 'Attention mechanisms, positional encoding, and why this architecture replaced recurrent networks for language tasks.' },
        { title: 'Lesson 2: Prompt Engineering Patterns', summary: 'Few-shot prompting, chain-of-thought, and structured output techniques that materially change model reliability.' },
        { title: 'Lesson 3: Fine-Tuning vs Retrieval', summary: 'When fine-tuning is worth the cost versus when retrieval-augmented generation solves the same problem cheaper.' },
        { title: 'Lesson 4: Building a RAG Pipeline', summary: 'Chunking, embeddings, vector search, and grounding model output in your own documents.' },
        { title: 'Lesson 5: Deployment & Safety', summary: 'Rate limiting, prompt injection defenses, and monitoring model output in production.' }
      ],
      videoUrl: resolveAssetUrl('/videos/ai-data-stream.mp4'),
      videoTitle: 'Lecture: Inside a Transformer Forward Pass',
      resourceUrl: resolveAssetUrl('/resources/generative-ai-llms-syllabus.txt'),
      resourceLabel: 'Full Syllabus & Reading List (TXT)',
      quiz: [
        { question: 'What mechanism allows transformers to weigh the relevance of different words in a sequence?', options: ['Attention', 'Convolution', 'Pooling', 'Backpropagation'], correctIndex: 0 },
        { question: 'RAG primarily helps a language model by:', options: ['Making it faster', 'Grounding answers in retrieved documents', 'Reducing its parameter count', 'Removing the need for prompts'], correctIndex: 1 },
        { question: 'A key production risk specific to LLM applications is:', options: ['Prompt injection', 'CSS specificity conflicts', 'DNS propagation delay', 'Cookie expiry'], correctIndex: 0 }
      ]
    }
  },
  {
    id: 'course-5',
    title: 'Applied Robotics & Autonomous Systems',
    description: 'Hands-on curriculum covering sensor fusion, control systems, and building autonomous rovers in the AICAIML sandbox labs.',
    category: 'Robotics',
    level: 'Advanced',
    duration: '16 hrs',
    modules: 14,
    access: 'membership',
    topics: ['Sensor fusion', 'Path planning', 'Control theory', 'ROS fundamentals', 'Capstone rover build'],
    premiumContent: {
      intro: 'A hands-on, member-only curriculum covering the core disciplines behind building an autonomous rover, from raw sensor data to a working capstone build in the AICAIML sandbox labs.',
      lessons: [
        { title: 'Lesson 1: Sensor Fusion Fundamentals', summary: 'Combining noisy data from IMUs, LiDAR, and cameras into a single reliable estimate of robot state.' },
        { title: 'Lesson 2: Path Planning Algorithms', summary: 'A* and RRT approaches to navigating a rover through mapped and partially-unmapped environments.' },
        { title: 'Lesson 3: Control Theory for Robotics', summary: 'PID control loops and why tuning them well is the difference between a stable rover and an oscillating one.' },
        { title: 'Lesson 4: ROS Fundamentals', summary: 'Nodes, topics, and services — the messaging backbone most robotics stacks are built on.' },
        { title: 'Lesson 5: Capstone Rover Build', summary: 'Assembling the full pipeline into a working autonomous rover demo in the sandbox lab.' }
      ],
      videoUrl: resolveAssetUrl('/videos/ai-circuit-board.mp4'),
      videoTitle: 'Lecture: Sensor Fusion in Practice',
      resourceUrl: resolveAssetUrl('/resources/applied-robotics-syllabus.txt'),
      resourceLabel: 'Full Syllabus & Lab Guide (TXT)',
      quiz: [
        { question: 'Sensor fusion is primarily used to:', options: ['Reduce hardware cost', 'Combine noisy sensor data into a reliable estimate', 'Increase battery life', 'Replace the need for control loops'], correctIndex: 1 },
        { question: 'In ROS, communication between independent processes happens via:', options: ['Shared global variables', 'Nodes, topics, and services', 'Direct memory access', 'HTTP cookies'], correctIndex: 1 },
        { question: 'A poorly tuned PID controller typically causes a rover to:', options: ['Oscillate or overshoot its target', 'Lose all sensor data', 'Run out of memory', 'Disconnect from Wi-Fi'], correctIndex: 0 }
      ]
    }
  }
];

export const initialTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Dr. Arpan Mukherjee',
    designation: 'Professor & Dean of Engineering',
    organization: 'Techno National Institute of Technology',
    quote: 'Collaborating with AICAIML to establish our robotics sandbox has transformed our curriculum. Our students are now building real autonomous systems and winning international hackathons.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: 'test-2',
    name: 'Sneha Venkatesh',
    designation: 'Co-Founder & CEO',
    organization: 'Kinetics Robotics & Automations',
    quote: 'As an MSME member, the network forum has connected us directly with prime academic talent and research advisers. The policy dialogues help us align with emerging regulations seamlessly.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: 'test-3',
    name: 'Aman Deep Singh',
    designation: 'Lead ML Researcher',
    organization: 'Nvidia Research Labs India',
    quote: 'The academic conferences organized by AICAIML represent a rare nexus of rigorous peer-review and active corporate interest. An essential catalyst for Indias deep-tech rise.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
];

export const initialPartners: Partner[] = [
  { id: 'part-1', name: 'IIT Madras Research Park', type: 'Academic', logoPlaceholder: 'IITM' },
  { id: 'part-2', name: 'IISc Innovation Center', type: 'Academic', logoPlaceholder: 'IISc' },
  { id: 'part-3', name: 'Nvidia AI India', type: 'Corporate', logoPlaceholder: 'NVIDIA' },
  { id: 'part-4', name: 'Intel Technology India', type: 'Corporate', logoPlaceholder: 'INTEL' },
  { id: 'part-5', name: 'Microsoft for Startups', type: 'Corporate', logoPlaceholder: 'MS' },
  { id: 'part-6', name: 'CSIR - National Labs', type: 'Government', logoPlaceholder: 'CSIR' }
];

export interface LeadershipMessage {
  id: string;
  name: string;
  designation: string;
  quote: string;
  photoUrl: string;
}

export const leadershipMessages: LeadershipMessage[] = [
  {
    id: 'lead-1',
    name: 'Shri Ashwini Vaishnaw',
    designation: "Hon'ble Minister of Electronics & IT, Government of India",
    quote: "India's AI strategy is based on the Hon'ble Prime Minister's vision to democratize the use of technology. It aims to address India centric challenges, create economic and employment opportunities for all...",
    photoUrl: resolveAssetUrl('/images/ashwini_vaishnaw_photo.jpg')
  },
  {
    id: 'lead-2',
    name: 'Shri S. Krishnan',
    designation: "Secretary, Ministry of Electronics and IT, Government of India",
    quote: "If India is to become a developed nation, we must ride the wave of technology, and AI is perhaps the most crucial technology driving that transformation. To achieve this, we need inclusive mechanisms that ensure people can access and benefit from AI in meaningful ways.",
    photoUrl: resolveAssetUrl('/images/s_krishnan_photo.jpg')
  }
];

