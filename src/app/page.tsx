"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

/* ───── Scroll Reveal Hook ───── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ───── Icons ───── */
function ArrowRightIcon({ className = "ml-2 h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ───── Data ───── */
const JOURNEY_STEPS = [
  {
    number: "01",
    title: "Learn the Method",
    description: "Master CI fundamentals through our 4-module masterclass with 25 expert-led lessons.",
    accent: "bg-skyBlue",
  },
  {
    number: "02",
    title: "Apply at Work",
    description: "Follow the 14-week Waste WAR Battle framework to run real improvement projects.",
    accent: "bg-teal",
  },
  {
    number: "03",
    title: "Track Your Wins",
    description: "Document measurable impact with ROI calculations and success nuggets for reviews.",
    accent: "bg-success",
  },
  {
    number: "04",
    title: "Elevate Your Career",
    description: "Earn badges, unlock consulting credentials, and build an undeniable track record.",
    accent: "bg-navy",
  },
];

const PLATFORM_FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
    title: "4-Module Masterclass",
    sub: "25 expert-led lessons",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "14-Week Battle Plan",
    sub: "Guided CI sessions",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: "AI CI Professor",
    sub: "Instant expert guidance",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Impact Tracking",
    sub: "ROI calculations built in",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: "Success Nuggets",
    sub: "Review-ready win stories",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-2.77.672c-.99 0-1.924-.236-2.77-.672" />
      </svg>
    ),
    title: "Milestone Badges",
    sub: "Career credential unlocks",
  },
];

const MONTHLY_FEATURES = [
  "All 4 masterclass modules",
  "CI Professor AI chatbot",
  "All trackers & dashboards",
  "Success nuggets generator",
];

const ANNUAL_FEATURES = [
  "Everything in Monthly",
  "2 months free savings",
  "Priority support",
  "Milestone badge unlocks",
];

const TESTIMONIALS = [
  {
    name: "Kevin Pearson",
    title: "Assistant Vice President, Consultant Database Specialist",
    image: "/testimonials/kevin-pearson.png",
    quote:
      "Dana Thompson was one of the first people to mentor me during my early college years, and his practical approach to business has truly shaped how I think to this day. The Continuous Improvement Done Right methodology reflects the same clarity, wisdom, and real-world insight he shared with me back then. These principles aren't just theory—they're the way Dana lives and leads.",
  },
  {
    name: "Archie Smart",
    title: "Director, Government/Universities Research Coalition",
    image: "/testimonials/archie-smart.png",
    quote:
      "With Dana's permission, I overlaid my MBA continuous improvement class material with Dana's continuous improvement approach. I wrote a white paper that transformed our project's critical staff training from an in-person instructor-led process to an online training module system. The result was a $650K Client award for its development.",
  },
  {
    name: "Dr. Samantha Hedgspeth",
    title: "University Professor | CEO, The Hedgspeth Group",
    image: "/testimonials/samantha-hedgspeth.png",
    quote:
      "I worked with Dana Thompson in a previous role and experienced his pragmatic yet refreshing approach to lean processes with Continuous Improvement. His ingenious insight equips managers to proactively facilitate the transfer of invaluable tacit knowledge during the methodology's Waste WAR Battle events that allow participants to engage, contribute, and learn cross-functionally.",
  },
  {
    name: "Jonathan Mayo",
    title: "National Account Director",
    image: "/testimonials/jonathan-mayo.png",
    quote:
      "It's time to take charge and bulletproof your career in middle management by becoming a Continuous Improvement Leader! Mr. Thompson has provided valuable tools to empower dedicated middle managers who may feel undervalued despite their hard work in daily operations. This guidance will help you transition from your current position to becoming a sought-after Continuous Improvement Leader!",
  },
  {
    name: "Ben Pocs",
    title: "Director, Financial Services Industry",
    image: "/testimonials/ben-pocs.png",
    quote:
      "Dana's approach not only teaches managers how to reduce waste, but also how to empower their employees to do the same. I had the privilege to work alongside Dana and successfully apply these concepts within a 100+ person department in a matter of months. Employees were excited to follow Dana's lead and implement changes, but best of all, he created a system so they could suggest and apply their ideas on a go-forward basis. This is how you create a workplace where continuous improvement thrives.",
  },
  {
    name: "Pamella Roebuck",
    title: "Senior Change Management Consultant",
    image: "/testimonials/pamella-roebuck.png",
    quote:
      "Dana Thompson doesn't just teach theory—he's lived the challenges and solved them. His proven strategies for engagement and continuous improvement are exactly what today's organizations need. They're also a reality check and an empowerment tool for managers, particularly those navigating the unique barriers faced by Black professionals in corporate America.",
  },
];

/* ───── Reveal Section Wrapper ───── */
function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal-section ${className}`}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div className="min-h-screen bg-offWhite">
      {/* ───── Header ───── */}
      <header className="sticky top-0 z-50 bg-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-end px-md py-sm sm:px-lg">
          <div className="flex items-center gap-sm sm:gap-md">
            <Link
              href="/login"
              className="text-body font-semibold text-white/90 hover:text-white transition-colors min-h-[44px] inline-flex items-center"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="group relative rounded-lg bg-white px-md py-sm min-h-[44px] inline-flex items-center text-body font-bold text-navy overflow-hidden transition-all hover:shadow-lg hover:shadow-white/20"
            >
              <span className="relative z-10">Get Started</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="hero-gradient-mesh relative overflow-hidden noise-overlay -mt-[56px] pt-[56px] sm:-mt-[60px] sm:pt-[60px]">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-skyBlue/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-teal/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-md pb-[96px] pt-3xl sm:px-lg sm:pb-[120px] sm:pt-[80px] lg:pb-[160px] lg:pt-[100px]">
          <div className="grid grid-cols-1 items-start gap-lg lg:grid-cols-[220px_1fr_220px] lg:gap-md xl:grid-cols-[240px_1fr_240px]">
            {/* Manager Elevator logo */}
            <div className="order-2 flex justify-center lg:order-none lg:justify-end">
              <div className="rounded-lg bg-white p-md shadow-lg">
                <Image
                  src="/manager-elevator_logo_cropped.png"
                  alt="Manager Elevator — Rise with Continuous Improvement"
                  width={1024}
                  height={400}
                  className="h-auto w-[240px] sm:w-[260px] lg:w-[280px] xl:w-[300px]"
                  priority
                />
              </div>
            </div>

            {/* Headline block */}
            <div className="order-1 text-center lg:order-none">
              <div className="animate-fade-in-up mb-lg inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-lg py-xs backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-mintGreen animate-pulse" />
                <span className="text-caption font-semibold uppercase tracking-[0.15em] text-white/90">
                  For Managers Ready to Lead
                </span>
              </div>

              <h1 className="animate-fade-in-up font-heading text-[30px] leading-[1.15] text-white sm:text-[42px] sm:leading-[1.15] lg:text-[44px] lg:leading-[1.1]">
                Finally Execute Continuous Improvement the Right Way
                <span className="mt-2 block text-gradient font-heading">
                  Without the Expensive Consultant.
                </span>
              </h1>

              <p className="animate-fade-in-up mx-auto mt-lg max-w-[560px] text-[15px] leading-relaxed text-white/75">
                Practical, step-by-step guidance to master CI methodology, document measurable wins, and build an undeniable track record — all on your own terms.
              </p>
            </div>

            {/* Masterclass logo */}
            <div className="order-3 flex justify-center lg:order-none lg:justify-start">
              <Image
                src="/leading-bulletproof-ci-masterclass-logo.png"
                alt="Leading Bulletproof Continuous Improvement Masterclass"
                width={1024}
                height={682}
                className="h-auto w-[240px] sm:w-[260px] lg:w-[280px] xl:w-[300px]"
                priority
              />
            </div>
          </div>

          {/* CTAs & trust — below the logo/headline row */}
          <div className="mx-auto mt-xl max-w-2xl text-center">
            <div className="animate-fade-in-up delay-500 flex flex-col items-center gap-md sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center rounded-lg bg-skyBlue px-xl py-[16px] text-[16px] font-bold text-white shadow-xl shadow-skyBlue/25 hover:shadow-2xl hover:shadow-skyBlue/30 hover:bg-skyBlue/90 transition-all duration-300"
              >
                Start Your Journey Free
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="group inline-flex items-center text-[15px] font-medium text-white/80 hover:text-white transition-colors"
              >
                See How It Works
                <svg className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="animate-fade-in-up delay-700 mt-2xl flex flex-wrap items-center justify-center gap-lg text-white/50 text-caption">
              <div className="flex items-center gap-xs">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Secure & Private</span>
              </div>
              <div className="h-3 w-px bg-white/20" />
              <div className="flex items-center gap-xs">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>Expert-Designed Curriculum</span>
              </div>
              <div className="h-3 w-px bg-white/20" />
              <div className="flex items-center gap-xs">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/></svg>
                <span>AI-Powered Guidance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Social Proof Bar ───── */}
      <section className="relative bg-white border-b border-paleGray/60">
        <div className="mx-auto max-w-7xl px-md py-xl sm:px-lg sm:py-2xl">
          <div className="grid grid-cols-2 gap-lg sm:grid-cols-4">
            {[
              { value: "25", label: "Expert Lessons" },
              { value: "14", label: "Week Battle Plan" },
              { value: "$15K+", label: "Consultant Value" },
              { value: "100%", label: "Self-Paced" },
            ].map((stat, i) => (
              <div key={stat.label} className={`text-center animate-fade-in-up delay-${(i + 1) * 100}`}>
                <div className="font-heading text-[28px] text-navy sm:text-[36px]">{stat.value}</div>
                <div className="mt-xs text-caption font-medium uppercase tracking-wide text-charcoal/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className="py-3xl sm:py-[96px] geo-pattern">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <RevealSection>
            <div className="text-center mb-2xl sm:mb-3xl">
              <span className="inline-block text-caption font-bold uppercase tracking-[0.2em] text-teal mb-md">Your Path Forward</span>
              <h2 className="font-heading text-h1 text-navy sm:text-[36px]">
                Four Steps to CI Mastery
              </h2>
            </div>
          </RevealSection>

          <div className="grid gap-lg sm:gap-xl lg:grid-cols-4">
            {JOURNEY_STEPS.map((step, i) => (
              <RevealSection key={step.number} className={`delay-${(i + 1) * 100}`}>
                <div className="card-lift group relative rounded-lg bg-white p-lg border border-paleGray/60 h-full">
                  {/* Step connector line (hidden on mobile) */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-10 -right-[calc(50%-12px)] w-[calc(100%-24px)] h-px bg-gradient-to-r from-paleGray to-transparent z-0" />
                  )}
                  <div className="relative z-10">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${step.accent} text-white font-heading text-h3 transition-transform group-hover:scale-110`}>
                      {step.number}
                    </div>
                    <h3 className="mt-lg font-heading text-h2 text-navy">{step.title}</h3>
                    <p className="mt-sm text-body leading-relaxed text-charcoal/85">{step.description}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Platform Preview ───── */}
      <section className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-skyBlue/20 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-md py-3xl sm:px-lg sm:py-[96px]">
          <div className="grid items-center gap-2xl lg:grid-cols-2">
            <RevealSection>
              <span className="inline-block text-caption font-bold uppercase tracking-[0.2em] text-skyBlue/80 mb-md">The Platform</span>
              <h2 className="font-heading text-h1 text-white sm:text-[36px] leading-tight">
                Everything You Need to Lead CI — In One Place
              </h2>
              <p className="mt-lg text-[15px] leading-relaxed text-white/60">
                A complete toolkit to learn, implement, and track continuous improvement
                in your organization. From masterclass lessons to AI-powered guidance.
              </p>

              <div className="mt-2xl grid grid-cols-2 gap-md">
                {PLATFORM_FEATURES.map((feature) => (
                  <div key={feature.title} className="group flex items-start gap-sm">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-skyBlue transition-colors group-hover:bg-skyBlue/20">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="text-body font-semibold text-white">{feature.title}</p>
                      <p className="text-caption text-white/50">{feature.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>

            <RevealSection className="delay-200">
              <div className="relative" style={{ perspective: "1200px" }}>
                {/* Subtle shadow beneath the "device" */}
                <div className="absolute -bottom-6 left-[10%] right-[10%] h-12 rounded-[50%] bg-black/25 blur-2xl" />

                {/* Browser window frame */}
                <div
                  className="relative rounded-xl bg-[#1a1f2e] shadow-2xl shadow-black/50 overflow-hidden border border-white/[0.08]"
                  style={{ transform: "rotateY(-2deg) rotateX(1deg)" }}
                >
                  {/* Title bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#141822] border-b border-white/[0.06]">
                    {/* Traffic lights */}
                    <div className="flex items-center gap-[6px]">
                      <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
                      <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
                      <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
                    </div>
                    {/* Address bar */}
                    <div className="flex-1 mx-3">
                      <div className="flex items-center gap-2 rounded-md bg-white/[0.06] px-3 py-1">
                        <svg className="h-3 w-3 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-[11px] text-white/35 font-medium truncate">managerelevator.com/dashboard</span>
                      </div>
                    </div>
                  </div>

                  {/* Screenshot content */}
                  <div className="relative">
                    <Image
                      src="/main-dashboard-mockup.png"
                      alt="Manager Elevator Dashboard"
                      width={1400}
                      height={860}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ───── Value Props ───── */}
      <section className="py-3xl sm:py-[96px]">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <RevealSection>
            <div className="grid items-center gap-2xl lg:grid-cols-2">
              {/* Left: The Promise */}
              <div>
                <span className="inline-block text-caption font-bold uppercase tracking-[0.2em] text-teal mb-md">Why Manager Elevator</span>
                <h2 className="font-heading text-h1 text-navy sm:text-[36px] leading-tight">
                  The CI Methodology That Consultants Charge $15,000+ For — Now Accessible to You
                </h2>
                <p className="mt-lg text-[15px] leading-relaxed text-charcoal/65">
                  Most continuous improvement programs require expensive consultants or
                  complex certifications. Manager Elevator puts a proven, structured
                  methodology directly in your hands — with AI-powered guidance every step of the way.
                </p>

                <div className="mt-xl space-y-lg">
                  {[
                    {
                      title: "Practical, Not Theoretical",
                      desc: "Step-by-step guidance to implement real CI projects in your workplace.",
                    },
                    {
                      title: "Built for Your Reality",
                      desc: "Designed specifically for the challenges Black middle managers face.",
                    },
                    {
                      title: "Measurable Career Impact",
                      desc: "Document wins with hard numbers for performance reviews and promotions.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-md">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-skyBlue to-teal text-white">
                          <CheckIcon />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-body text-navy">{item.title}</p>
                        <p className="mt-xs text-body text-charcoal/60">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Achievement Cards */}
              <div className="space-y-md">
                {[
                  {
                    gradient: "from-skyBlue/15 to-teal/15",
                    border: "border-skyBlue/25",
                    iconBg: "bg-skyBlue",
                    title: "Most Valuable Workplace Waste Eliminator",
                    subtitle: "Unlock affiliate revenue opportunities",
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    ),
                  },
                  {
                    gradient: "from-teal/15 to-mintGreen/15",
                    border: "border-teal/25",
                    iconBg: "bg-teal",
                    title: "Certified CI Done Right Consultant",
                    subtitle: "Unlock consulting opportunities",
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    ),
                  },
                  {
                    gradient: "from-navy/10 to-skyBlue/10",
                    border: "border-navy/15",
                    iconBg: "bg-navy",
                    title: "AI-Powered CI Professor",
                    subtitle: "Get instant guidance based on proven methodology",
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    ),
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className={`card-lift rounded-lg bg-gradient-to-r ${card.gradient} p-lg border ${card.border}`}
                  >
                    <div className="flex items-center gap-md">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${card.iconBg} text-white shadow-lg`}>
                        {card.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-[15px] text-navy">{card.title}</p>
                        <p className="text-caption text-charcoal/55">{card.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="bg-white py-3xl sm:py-[96px] border-y border-paleGray/60">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <RevealSection>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block text-caption font-bold uppercase tracking-[0.2em] text-teal mb-md">
                From the Book
              </span>
              <h2 className="font-heading text-h1 text-navy sm:text-[36px]">
                Leaders Who&apos;ve Worked With Dana
              </h2>
              <p className="mt-md text-body text-charcoal/60 sm:text-[15px]">
                Real endorsements from professionals featured in{" "}
                <a href="https://www.tgrowthe.com/product-page/bulletproof-your-manager-career-ebook" target="_blank" rel="noopener noreferrer" className="not-italic font-medium text-navy underline hover:text-teal transition-colors">Bulletproof Your Manager Career</a>.
              </p>
            </div>
          </RevealSection>

          <div className="mt-2xl grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, i) => (
              <RevealSection key={testimonial.name} className={`delay-${(i % 3) * 100}`}>
                <figure className="card-lift flex h-full flex-col rounded-lg border border-paleGray/60 bg-offWhite p-lg">
                  <blockquote className="flex-1 text-body leading-relaxed text-charcoal/85">
                    <span className="font-heading text-[28px] leading-none text-skyBlue/40" aria-hidden="true">
                      &ldquo;
                    </span>
                    {testimonial.quote}
                  </blockquote>
                  <figcaption className="mt-lg flex items-center gap-md border-t border-paleGray/80 pt-lg">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md ring-1 ring-paleGray/60 bg-white">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        sizes="64px"
                        className="object-cover object-center"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-body text-navy">{testimonial.name}</p>
                      <p className="text-caption leading-snug text-charcoal/60">{testimonial.title}</p>
                    </div>
                  </figcaption>
                </figure>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Divider ───── */}
      <div className="divider-gradient mx-auto max-w-md" />

      {/* ───── Pricing ───── */}
      <section id="pricing" className="py-3xl sm:py-[96px]">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <RevealSection>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block text-caption font-bold uppercase tracking-[0.2em] text-teal mb-md">Pricing</span>
              <h2 className="font-heading text-h1 text-navy sm:text-[36px]">
                Invest in Your Career Growth
              </h2>
              <p className="mt-md text-body text-charcoal/60 sm:text-[15px]">
                Get access to the same CI methodology that consultants charge $15,000+ for.
                <br className="hidden sm:block" />
                Choose the plan that fits your journey.
              </p>
            </div>
          </RevealSection>

          <div className="mt-2xl grid gap-lg sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
            {/* Monthly */}
            <RevealSection>
              <div className="card-lift rounded-lg bg-white p-xl border border-paleGray/80 h-full flex flex-col">
                <p className="text-caption font-bold uppercase tracking-[0.15em] text-charcoal/40">
                  Monthly
                </p>
                <div className="mt-md flex items-baseline gap-xs">
                  <span className="font-heading text-[44px] text-navy">$97</span>
                  <span className="text-body text-charcoal/40">/month</span>
                </div>
                <p className="mt-sm text-body text-charcoal/60">
                  Full platform access. Cancel anytime.
                </p>
                <ul className="mt-lg flex-1 space-y-sm">
                  {MONTHLY_FEATURES.map((item) => (
                    <li key={item} className="flex items-center gap-sm">
                      <CheckIcon />
                      <span className="text-body text-charcoal">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-xl block rounded-lg border-2 border-navy py-[14px] text-center text-body font-bold text-navy hover:bg-navy hover:text-white transition-all duration-300"
                >
                  Get Started
                </Link>
              </div>
            </RevealSection>

            {/* Annual */}
            <RevealSection className="delay-200">
              <div className="pricing-highlight rounded-lg h-full flex flex-col">
                <div className="rounded-lg bg-white p-xl h-full flex flex-col relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-skyBlue to-teal px-lg py-xs text-caption font-bold uppercase tracking-wide text-white shadow-lg shadow-skyBlue/25">
                      Best Value
                    </span>
                  </div>
                  <p className="text-caption font-bold uppercase tracking-[0.15em] text-charcoal/40">
                    Annual
                  </p>
                  <div className="mt-md flex items-baseline gap-xs">
                    <span className="font-heading text-[44px] text-navy">$997</span>
                    <span className="text-body text-charcoal/40">/year</span>
                  </div>
                  <p className="mt-sm text-body text-charcoal/60">
                    Save over <span className="font-semibold text-success">$167</span> compared to monthly.
                  </p>
                  <ul className="mt-lg flex-1 space-y-sm">
                    {ANNUAL_FEATURES.map((item) => (
                      <li key={item} className="flex items-center gap-sm">
                        <CheckIcon />
                        <span className="text-body text-charcoal">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-xl block rounded-lg bg-gradient-to-r from-skyBlue to-teal py-[14px] text-center text-body font-bold text-white shadow-lg shadow-skyBlue/20 hover:shadow-xl hover:shadow-skyBlue/30 transition-all duration-300"
                  >
                    Start Your Journey
                  </Link>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="hero-gradient-mesh relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-skyBlue/10 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-mintGreen/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-md py-3xl text-center sm:px-lg sm:py-[96px]">
          <RevealSection>
            <h2 className="font-heading text-h1 text-white sm:text-[40px] leading-tight">
              Ready to Elevate Your Career?
            </h2>
            <p className="mt-lg text-[15px] text-white/65 leading-relaxed max-w-xl mx-auto">
              Join a growing community of middle managers mastering continuous
              improvement and building measurable career impact.
            </p>
            <div className="mt-xl flex flex-col items-center gap-md sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center rounded-lg bg-white px-xl py-[16px] text-[16px] font-bold text-navy shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Start Your Journey Free
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="mt-lg text-caption text-white/40">
              No credit card required to explore the platform.
            </p>
          </RevealSection>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-paleGray bg-white py-xl sm:py-2xl">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <div className="flex flex-col items-center gap-lg sm:flex-row sm:justify-between">
            <Image
              src="/manager-elevator_logo_cropped.png"
              alt="Manager Elevator"
              width={400}
              height={156}
              className="h-[56px] w-auto"
            />
            <div className="flex flex-col items-center gap-sm sm:items-end">
              <p className="text-caption text-charcoal/40">
                &copy; {new Date().getFullYear()} Transformational Growth Enterprises LLC. All rights reserved.
              </p>
              <p className="text-caption text-charcoal/30">
                Rise with Continuous Improvement
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
