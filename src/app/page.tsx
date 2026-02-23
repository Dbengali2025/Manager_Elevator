import Image from "next/image";
import Link from "next/link";

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0 text-success"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="ml-2 h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}

const VALUE_PROPS = [
  {
    title: "Practical Implementation",
    description:
      "Step-by-step guidance to implement real continuous improvement projects in your workplace — not just theory.",
    icon: (
      <svg
        className="h-8 w-8 text-skyBlue"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17l-5.18-5.18m0 0L11.42 4.81m-5.18 5.18H20.25"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.75h4.5M9.75 20.25h4.5M3.75 12h.008v.008H3.75V12zm16.5 0h.008v.008h-.008V12z"
        />
      </svg>
    ),
    iconFallback: (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-skyBlue/10">
        <svg
          className="h-7 w-7 text-skyBlue"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      </div>
    ),
  },
  {
    title: "14-Week Methodology",
    description:
      "Follow a proven Waste WAR Battle framework with structured sessions that build on each other for lasting results.",
    iconFallback: (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal/10">
        <svg
          className="h-7 w-7 text-teal"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
      </div>
    ),
  },
  {
    title: "Career Advancement",
    description:
      "Document your wins, build measurable impact stories, and create success nuggets for performance reviews.",
    iconFallback: (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-mintGreen/20">
        <svg
          className="h-7 w-7 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
      </div>
    ),
  },
  {
    title: "Affordable Access",
    description:
      "Get the same CI methodology that consultants charge $15,000+ for — at a fraction of the cost with AI-powered guidance.",
    iconFallback: (
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-navy/10">
        <svg
          className="h-7 w-7 text-navy"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    ),
  },
];

const FEATURES = [
  "4-module masterclass with 25 lessons",
  "14-week Waste WAR Battle guided sessions",
  "AI-powered CI Professor chatbot",
  "Impact tracking with ROI calculations",
  "Success nuggets for performance reviews",
  "Milestone badges and career unlocks",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-offWhite">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-paleGray bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-md py-sm sm:px-lg">
          <Link href="/" className="flex items-center gap-sm">
            <Image
              src="/manager-elevator_logo.png"
              alt="Manager Elevator"
              width={180}
              height={48}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>
          <div className="flex items-center gap-sm sm:gap-md">
            <Link
              href="/login"
              className="text-body font-medium text-navy hover:text-teal transition-colors min-h-[44px] inline-flex items-center"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-navy px-md py-sm min-h-[44px] inline-flex items-center text-body font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-teal">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-skyBlue blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-mintGreen blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-md py-3xl sm:px-lg sm:py-[80px] lg:py-[96px]">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-[28px] leading-tight text-white sm:text-display sm:leading-tight lg:text-[44px] lg:leading-tight">
              Finally Execute Continuous Improvement the Right Way — Without the
              Expensive Consultant.
            </h1>
            <p className="mx-auto mt-lg max-w-2xl text-[16px] leading-relaxed text-white/80 sm:text-[18px]">
              Practical, step-by-step guidance built specifically for Black
              middle managers who want to master CI methodology, document
              measurable wins, and advance their careers.
            </p>
            <div className="mt-xl flex flex-col items-center gap-md sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-md bg-skyBlue px-xl py-[14px] text-[16px] font-bold text-white shadow-lg hover:bg-skyBlue/90 transition-colors"
              >
                Start Your Journey
                <ArrowRightIcon />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center text-[16px] font-medium text-white/90 hover:text-white transition-colors"
              >
                View Pricing
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-3xl sm:py-[80px]">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-h1 text-navy sm:text-display">
              Everything You Need to Lead CI
            </h2>
            <p className="mt-md text-body text-charcoal/70 sm:text-[16px]">
              A complete platform to learn, implement, and track continuous
              improvement in your organization.
            </p>
          </div>
          <div className="mt-2xl grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((prop) => (
              <div
                key={prop.title}
                className="rounded-lg bg-white p-lg shadow-sm border border-paleGray hover:shadow-md transition-shadow"
              >
                {prop.iconFallback}
                <h3 className="mt-md font-heading text-h3 text-navy">
                  {prop.title}
                </h3>
                <p className="mt-sm text-body leading-relaxed text-charcoal/70">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="bg-white py-3xl sm:py-[80px]">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <div className="grid items-center gap-2xl lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-h1 text-navy sm:text-display">
                Your CI Mastery Toolkit
              </h2>
              <p className="mt-md text-body text-charcoal/70 sm:text-[16px]">
                Manager Elevator gives you all the tools you need to go from CI
                beginner to certified consultant.
              </p>
              <ul className="mt-xl space-y-md">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-sm">
                    <CheckIcon />
                    <span className="text-body text-charcoal sm:text-[16px]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-lg bg-gradient-to-br from-navy/5 to-teal/5 p-xl">
              <div className="space-y-md">
                {/* Milestone Preview Cards */}
                <div className="rounded-md bg-gradient-to-r from-skyBlue/20 to-teal/20 p-md border border-skyBlue/20">
                  <div className="flex items-center gap-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-skyBlue text-white">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-body text-navy">
                        Most Valuable Workplace Waste Eliminator
                      </p>
                      <p className="text-caption text-charcoal/60">
                        Unlock affiliate revenue opportunities
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-md bg-gradient-to-r from-teal/20 to-mintGreen/20 p-md border border-teal/20">
                  <div className="flex items-center gap-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-white">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-body text-navy">
                        Certified CI Done Right Consultant
                      </p>
                      <p className="text-caption text-charcoal/60">
                        Unlock consulting opportunities
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-md bg-white p-md border border-paleGray">
                  <div className="flex items-center gap-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mintGreen/30 text-success">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-body text-navy">
                        AI-Powered CI Professor
                      </p>
                      <p className="text-caption text-charcoal/60">
                        Get instant guidance based on proven methodology
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-3xl sm:py-[80px]">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-h1 text-navy sm:text-display">
              Invest in Your Career Growth
            </h2>
            <p className="mt-md text-body text-charcoal/70 sm:text-[16px]">
              Get access to the same CI methodology that consultants charge
              $15,000+ for.
            </p>
          </div>
          <div className="mt-2xl grid gap-lg sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
            {/* Monthly Plan */}
            <div className="rounded-lg bg-white p-xl shadow-sm border border-paleGray">
              <p className="text-body font-semibold uppercase tracking-wide text-charcoal/50">
                Monthly
              </p>
              <div className="mt-md flex items-baseline gap-xs">
                <span className="font-heading text-[40px] text-navy">$97</span>
                <span className="text-body text-charcoal/50">/month</span>
              </div>
              <p className="mt-sm text-body text-charcoal/70">
                Full platform access, cancel anytime.
              </p>
              <ul className="mt-lg space-y-sm">
                {[
                  "All 4 masterclass modules",
                  "CI Professor AI chatbot",
                  "All trackers & dashboards",
                  "Success nuggets generator",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-sm">
                    <CheckIcon />
                    <span className="text-body text-charcoal">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-xl block rounded-md border-2 border-navy py-[12px] text-center text-body font-semibold text-navy hover:bg-navy hover:text-white transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Annual Plan */}
            <div className="relative rounded-lg bg-white p-xl shadow-md border-2 border-skyBlue">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-skyBlue px-md py-xs text-caption font-bold uppercase tracking-wide text-white">
                  Best Value
                </span>
              </div>
              <p className="text-body font-semibold uppercase tracking-wide text-charcoal/50">
                Annual
              </p>
              <div className="mt-md flex items-baseline gap-xs">
                <span className="font-heading text-[40px] text-navy">
                  $1,000
                </span>
                <span className="text-body text-charcoal/50">/year</span>
              </div>
              <p className="mt-sm text-body text-charcoal/70">
                Save over $160 compared to monthly.
              </p>
              <ul className="mt-lg space-y-sm">
                {[
                  "Everything in Monthly",
                  "2 months free savings",
                  "Priority support",
                  "Milestone badge unlocks",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-sm">
                    <CheckIcon />
                    <span className="text-body text-charcoal">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-xl block rounded-md bg-skyBlue py-[12px] text-center text-body font-semibold text-white hover:bg-skyBlue/90 transition-colors"
              >
                Start Your Journey
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-navy py-3xl sm:py-[80px]">
        <div className="mx-auto max-w-3xl px-md text-center sm:px-lg">
          <h2 className="font-heading text-h1 text-white sm:text-display">
            Ready to Elevate Your Career?
          </h2>
          <p className="mt-md text-body text-white/70 sm:text-[16px]">
            Join a community of Black middle managers mastering continuous
            improvement and building measurable career impact.
          </p>
          <Link
            href="/signup"
            className="mt-xl inline-flex items-center rounded-md bg-skyBlue px-xl py-[14px] text-[16px] font-bold text-white shadow-lg hover:bg-skyBlue/90 transition-colors"
          >
            Start Your Journey
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-paleGray bg-white py-xl">
        <div className="mx-auto max-w-7xl px-md sm:px-lg">
          <div className="flex flex-col items-center gap-md sm:flex-row sm:justify-between">
            <Image
              src="/manager-elevator_logo.png"
              alt="Manager Elevator"
              width={140}
              height={37}
              className="h-8 w-auto"
            />
            <p className="text-caption text-charcoal/50">
              &copy; {new Date().getFullYear()} Transformational Growth
              Enterprises LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
