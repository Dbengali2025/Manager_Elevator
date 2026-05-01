// Masterclass module and session definitions
// Separated from server actions since "use server" files can only export async functions

// ---------------------------------------------------------------------------
// Session names — 14-week WAR Battle sessions from TGE Offerings
// ---------------------------------------------------------------------------

export const WAR_BATTLE_SESSIONS = [
  { week: 1, name: "Step 1 \u2013 Clarify the Opportunity", battle: 1 },
  { week: 2, name: "Step 2 \u2013 Define the Success Metrics", battle: 1 },
  { week: 3, name: "Step 3 \u2013 Confirm the Current State", battle: 1 },
  { week: 4, name: "Step 3 continued \u2013 Confirm the Current State", battle: 1 },
  { week: 5, name: "Step 4 \u2013 Determine Pain and Root Causes", battle: 1 },
  { week: 6, name: "Step 4 continued \u2013 Determine Pain and Root Causes", battle: 1 },
  { week: 7, name: "Step 5 \u2013 Define the Ideal Future State", battle: 2 },
  { week: 8, name: "Step 6 \u2013 Brainstorm Potential Solutions", battle: 2 },
  { week: 9, name: "Step 6 continued \u2013 Brainstorm Potential Solutions", battle: 2 },
  { week: 10, name: "Step 7 \u2013 Test Potential Solutions & Step 8 \u2013 Measure the Improvement", battle: 2 },
  { week: 11, name: "Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", battle: 2 },
  { week: 12, name: "Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", battle: 2 },
  { week: 13, name: "Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", battle: 3 },
  { week: 14, name: "Step 9 \u2013 Implement the Winning Solutions & Step 10 \u2013 Share and Sustain", battle: 3 },
];

// ---------------------------------------------------------------------------
// Module + Lesson definitions from TGE Offerings
// ---------------------------------------------------------------------------

export interface Lesson {
  number: number;
  title: string;
  vimeoId: string;
}

export interface Module {
  number: number;
  title: string;
  welcomeVimeoId: string;
  lessons: Lesson[];
  stage: string;
  miestroUrl: string;
}

export const MODULES: Module[] = [
  {
    number: 1,
    title: "The Value of Illuminating Workplace Problems",
    welcomeVimeoId: "1182119018",
    lessons: [
      { number: 1, title: "The Problem: Middle-Managers Are Undervalued", vimeoId: "1182119029" },
      { number: 2, title: "Creating Value: Introduction to the Continuous Improvement Done Right Formula", vimeoId: "1182119052" },
      { number: 3, title: "Waste Warrior Exercise #1 \u2013 Recognizing problems by identifying workplace waste", vimeoId: "1182118528" },
      { number: 4, title: "Waste Warrior Exercise #2 \u2013 Prioritizing which problems to fix", vimeoId: "1182118561" },
      { number: 5, title: "Waste Warrior Exercise #3 \u2013 Completing a SIPOC diagram for the problem", vimeoId: "1182118573" },
      { number: 6, title: "Waste Warrior Exercise #4 \u2013 Developing the Problem Statement paragraph", vimeoId: "1182118599" },
      { number: 7, title: "How to Maximize the Next 30 Days in Your Current Manager Assignment", vimeoId: "1182118615" },
    ],
    stage: "module_1",
    miestroUrl: "https://tge.miestro.com/programs/leading-bulletproof-continuous-improvement3?lesson=2",
  },
  {
    number: 2,
    title: "Investigating Root Causes for Success",
    welcomeVimeoId: "1182118645",
    lessons: [
      { number: 1, title: "Introducing the Waste WAR Battle 10 Steps for CI Success", vimeoId: "1182118661" },
      { number: 2, title: "Waste WAR Battle Session #1: Step 1 \u2013 Clarify the Opportunity", vimeoId: "1182118700" },
      { number: 3, title: "Waste WAR Battle Session #2: Step 2 \u2013 Define the Success Metrics", vimeoId: "1182118720" },
      { number: 4, title: "Waste WAR Battle Session #3: Step 3 \u2013 Confirm the Current State", vimeoId: "1182118745" },
      { number: 5, title: "Waste WAR Battle Session #4: Step 3 continued \u2013 Confirm the Current State", vimeoId: "1182118762" },
      { number: 6, title: "Waste WAR Battle Session #5: Step 4 \u2013 Determine Pain and Root Causes", vimeoId: "1182118774" },
      { number: 7, title: "Waste WAR Battle Session #6: Step 4 continued \u2013 Determine Pain and Root Causes", vimeoId: "1182118791" },
    ],
    stage: "module_2",
    miestroUrl: "https://tge.miestro.com/programs/leading-bulletproof-continuous-improvement3?lesson=9",
  },
  {
    number: 3,
    title: "Intelligently Testing Potential Solutions",
    welcomeVimeoId: "1182118807",
    lessons: [
      { number: 1, title: "Waste WAR Battle Session #7: Step 5 \u2013 Define the Ideal Future State", vimeoId: "1182118824" },
      { number: 2, title: "Waste WAR Battle Session #8: Step 6 \u2013 Brainstorm Potential Solutions", vimeoId: "1182118843" },
      { number: 3, title: "Waste WAR Battle Session #9: Step 6 continued \u2013 Brainstorm Potential Solutions", vimeoId: "1182118855" },
      { number: 4, title: "Waste WAR Battle Session #10: Step 7 \u2013 Test Potential Solutions & Step 8 \u2013 Measure the Improvement", vimeoId: "1182118863" },
      { number: 5, title: "Waste WAR Battle Session #11: Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", vimeoId: "1182118871" },
      { number: 6, title: "Waste WAR Battle Session #12: Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", vimeoId: "1182118881" },
      { number: 7, title: "Waste WAR Battle Session #13: Step 7 continued \u2013 Test Potential Solutions & Step 8 continued \u2013 Measure the Improvement", vimeoId: "1182118900" },
    ],
    stage: "module_3",
    miestroUrl: "https://tge.miestro.com/programs/leading-bulletproof-continuous-improvement3?lesson=16",
  },
  {
    number: 4,
    title: "Implementing Winning Solutions for Success",
    welcomeVimeoId: "1182118918",
    lessons: [
      { number: 1, title: "Waste WAR Battle Session #14: Step 9 \u2013 Implement the Winning Solutions & Step 10 \u2013 Share and Sustain the Results", vimeoId: "1182118933" },
      { number: 2, title: "How to Maximize the First 100 Days of a New Manager Assignment", vimeoId: "1182118960" },
      { number: 3, title: "Solidifying Your Continuous Improvement Team Culture", vimeoId: "1182118982" },
      { number: 4, title: "Creating Extra Income as a Bulletproof Continuous Improvement Consultant", vimeoId: "1182119002" },
    ],
    stage: "module_4",
    miestroUrl: "https://tge.miestro.com/programs/leading-bulletproof-continuous-improvement3?lesson=",
  },
];
