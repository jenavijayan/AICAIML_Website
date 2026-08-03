-- AICAIML Supabase Seed Data
-- Run this AFTER running supabase-schema.sql
-- This inserts the baseline content from cmsData.ts

-- Seed news
INSERT INTO public.news (id, title, summary, date, category, read_time, created_at) VALUES
('news-1', 'AICAIML Partners with 50+ Top Indian Universities for Centers of Excellence', 'Establishing advanced research facilities in Machine Learning and Robotics to bridge the gap between academic theory and real-world industrial applicability.', 'July 14, 2026', 'Announcement', '3 min read', NOW()),
('news-2', 'Ethics Board Proposes Unified National AI Guideline for Medical Diagnostic Tools', 'AICAIML''s ethics advisory panel releases a comprehensive framework safeguarding patient privacy and model bias auditing standard operating procedures.', 'June 28, 2026', 'Press Release', '5 min read', NOW()),
('news-3', 'Applications Open for the National AI Startup Acceleration Cohort 2027', 'Providing up to 10 selected deep-tech startups with technical mentorship, sandboxed cloud credits, and direct investor matchmaking pipelines.', 'June 15, 2026', 'Announcement', '4 min read', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed courses
INSERT INTO public.courses (id, title, description, category, level, duration, modules, access, image, topics, free_content, premium_content, created_at) VALUES
('course-1', 'Introduction to Artificial Intelligence', 'A beginner-friendly walkthrough of core AI concepts, history, and how intelligent systems are shaping industry today.', 'AI Fundamentals', 'Beginner', '2 hrs', 4, 'free', NULL, '["What is AI?", "Narrow vs General AI", "Real-world applications", "AI in India"]', NULL, NULL, NOW()),
('course-2', 'Machine Learning Foundations', 'Understand how machines actually learn from data — the math intuition, not just the buzzwords.', 'Machine Learning', 'Beginner', '3 hrs', 5, 'free', NULL, '["Supervised vs Unsupervised", "Training & testing data", "Overfitting", "Common algorithms"]', NULL, NULL, NOW()),
('course-3', 'Responsible AI & Ethics Primer', 'A short, free primer on bias, fairness, and accountability in deployed AI systems.', 'Career & Ethics', 'Beginner', '1.5 hrs', 3, 'free', NULL, '["Bias in data", "Fairness metrics", "Accountability frameworks"]', NULL, NULL, NOW()),
('course-4', 'Generative AI & Large Language Models', 'A full-depth course on how LLMs work, prompt engineering, and building applications on top of foundation models.', 'Generative AI', 'Intermediate', '10 hrs', 12, 'membership', NULL, '["Transformer architecture", "Prompt engineering", "Fine-tuning", "RAG pipelines", "Deployment & safety"]', NULL, NULL, NOW()),
('course-5', 'Applied Robotics & Autonomous Systems', 'Hands-on curriculum covering sensor fusion, control systems, and building autonomous rovers in the AICAIML sandbox labs.', 'Robotics', 'Advanced', '16 hrs', 14, 'membership', NULL, '["Sensor fusion", "Path planning", "Control theory", "ROS fundamentals", "Capstone rover build"]', NULL, NULL, NOW()),
('course-6', 'AI Career Readiness & Certification Track', 'Interview preparation, portfolio review, and the assessment pathway toward an AICAIML-verified professional certificate.', 'Career & Ethics', 'Intermediate', '6 hrs', 8, 'membership', NULL, '["Portfolio building", "Technical interviews", "Certification exam prep", "Verified credentialing"]', NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed projects
INSERT INTO public.projects (id, title, description, category, image, status, impact, created_at) VALUES
('proj-1', 'National AI Skills & Certification Initiative (NASCI)', 'Empowering over 50,000 engineering students across tier-2 and tier-3 colleges in India with specialized certifications in Deep Learning and NLP, co-designed with industry leaders.', 'AI Integration', '/images/project-nasci-initiative.jpg', 'Ongoing', '50,000+ Students Certified', NOW()),
('proj-2', 'AICAIML Autonomous Robotics Sandbox', 'An open-access simulation and testing lab network for students and startups to design, prototype, and build autonomous rovers and drone systems with cloud-integrated digital twins.', 'Robotics', '/images/project-robotics-sandbox.jpg', 'Ongoing', '120+ College Club Sandbox Labs', NOW()),
('proj-3', 'AI Ethics & Algorithmic Fairness Whitepaper', 'A multi-stakeholder research collaboration presenting guidelines on ethical deployment of AI/ML systems in healthcare, finance, and public services within the Indian socio-demographic context.', 'Machine Learning', '/images/project-ai-ethics-healthcare.jpg', 'Completed', 'Adopted as National Advisory', NOW()),
('proj-4', 'Smart Agriculture IoT & Edge ML Framework', 'Affordable IoT sensors and localized edge ML models developed in collaboration with leading agricultural universities to forecast soil moisture, crop disease, and optimize watering schedules.', 'Machine Learning', '/images/project-smart-agriculture.jpg', 'Upcoming', 'Targeting 5,000 Farmers in Phase 1', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed events
INSERT INTO public.events (id, title, description, date, time, venue, category, created_at) VALUES
('evt-1', 'National AI/ML & Robotics Congress 2026', 'The premier national assembly bringing together researchers, industrialists, startups, and policy-makers to discuss sustainable AI strategies, edge AI innovations, and autonomous robotics.', 'September 15-17, 2026', '09:00 AM - 05:30 PM', 'Bharat Mandapam, New Delhi (Hybrid)', 'Conference', NOW()),
('evt-2', 'AICAIML Smart India Robotics Hackathon', 'A 36-hour physical hackathon focusing on building hardware and software robotics solutions for disaster management, search & rescue, and automated waste segregation.', 'October 10-12, 2026', '08:00 AM onwards', 'IIT Madras Research Park, Chennai', 'Hackathon', NOW()),
('evt-3', 'National Faculty Development Program (FDP) on Generative AI', 'An intensive, AICTE-aligned 5-day professional development program teaching faculty members modern Generative AI pipelines, LLM fine-tuning, and prompt-engineering methodologies.', 'November 02-06, 2026', '10:00 AM - 04:00 PM', 'Virtual (Zoom Platform)', 'FDP', NOW()),
('evt-4', 'Hands-on Edge-ML on Microcontrollers Workshop', 'An advanced, practical workshop focusing on building and running tiny machine learning models (TinyML) on resource-constrained embedded systems and microcontrollers.', 'December 05, 2026', '10:00 AM - 05:00 PM', 'IISc Innovation Center, Bengaluru', 'Workshop', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed partners
INSERT INTO public.partners (id, name, type, logo_placeholder, created_at) VALUES
('part-1', 'IIT Madras Research Park', 'Academic', 'IITM', NOW()),
('part-2', 'IISc Innovation Center', 'Academic', 'IISc', NOW()),
('part-3', 'Nvidia AI India', 'Corporate', 'NVIDIA', NOW()),
('part-4', 'Intel Technology India', 'Corporate', 'INTEL', NOW()),
('part-5', 'Microsoft for Startups', 'Corporate', 'MS', NOW()),
('part-6', 'CSIR - National Labs', 'Government', 'CSIR', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed testimonials
INSERT INTO public.testimonials (id, name, designation, organization, quote, avatar_url, created_at) VALUES
('test-1', 'Dr. Arpan Mukherjee', 'Professor & Dean of Engineering', 'Techno National Institute of Technology', 'Collaborating with AICAIML to establish our robotics sandbox has transformed our curriculum. Our students are now building real autonomous systems and winning international hackathons.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', NOW()),
('test-2', 'Sneha Venkatesh', 'Co-Founder & CEO', 'Kinetics Robotics & Automations', 'As an MSME member, the network forum has connected us directly with prime academic talent and research advisers. The policy dialogues help us align with emerging regulations seamlessly.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', NOW()),
('test-3', 'Aman Deep Singh', 'Lead ML Researcher', 'Nvidia Research Labs India', 'The academic conferences organized by AICAIML represent a rare nexus of rigorous peer-review and active corporate interest. An essential catalyst for Indias deep-tech rise.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed admin user (password: vendhan123)
-- This uses Node.js crypto in the app, but for Supabase we''ll handle it via the app seedDevUser function
-- No need to insert manually here since seedDevUser runs on startup
