/* All the site's content in one place. The components below map over these
   arrays, so adding a project or an experience entry is a data edit, not a
   block of markup to copy. `desc` fields carry inline <strong> emphasis and
   are rendered with set:html. */

/* AliBot's write-up lives in its README; /alibot redirects there too. */
export const ALIBOT_README = 'https://github.com/alirad1/alirad.dev/blob/master/alibot/README.md';

/* The home page's sections, in page order. The topbar, the rail, and the
   scroll tracker all read this. */
export const sections = [
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'experience', label: 'Experience' },
  { id: 'involvement', label: 'Involvement' },
  { id: 'moments', label: 'Moments' },
  { id: 'contact', label: 'Contact' },
] as const;

export type Link = { href: string; label: string; primary?: boolean };

export type Project = {
  index: string;
  slug: string;
  repo?: string;
  title: string;
  titleSub?: string;
  state: { label: string; kind: 'live' | 'here' | 'award' | 'plain' };
  live: boolean;
  tags: string; // data-tags, read by the filter
  img?: { src: string; alt: string };
  desc: string;
  stack: string;
  links: Link[];
};

export type Experience = {
  slug: string;
  org: string;
  role: string;
  when: string;
  where: string;
  desc: string;
  tags: string[];
  link?: Link;
};

export type Moment = {
  num: string;
  label: string;
  ar: number;
  src: string;
  alt: string;
  cap: string;
};

/* Stable ids shared by the page (`data-chunk` attributes) and the AliBot
   corpus builder, so a citation can point at the element it came from. */
export function chunkId(kind: 'proj' | 'exp' | 'moment', slug: string): string {
  return `${kind}-${slug}`;
}

export const projects: Project[] = [
  {
    index: '01',
    slug: 'alibot',
    repo: 'alirad1/alirad.dev',
    title: 'AliBot',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,TypeScript,Cloudflare,RAG,Astro',
    img: { src: '/Projects/AliBot.png', alt: 'The AliBot chat panel with suggested questions' },
    desc:
      'A <strong>RAG chatbot</strong> for this site, running as a TypeScript Cloudflare Worker. It combines ' +
      'vector search with BM25, reranks the results with a cross-encoder, and has Llama 3.3 70B answer only ' +
      'from the retrieved sources, with citations. A 33-question eval set measures retrieval recall, citation ' +
      'accuracy, and prompt-injection resistance: <strong>100% recall@4 at 1.9 s median latency</strong>.',
    stack: 'TypeScript · Cloudflare Workers · Vectorize · Workers AI',
    links: [
      { href: ALIBOT_README, label: 'How it works', primary: true },
      { href: 'https://github.com/alirad1/alirad.dev/tree/master/alibot', label: 'Source' },
    ],
  },
  {
    index: '02',
    slug: 'tms-nav',
    repo: 'TMS-Nav/TMS-Nav',
    title: 'TMS-Nav',
    titleSub: 'Khavari Lab',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,Python,JavaScript,Three.js',
    img: { src: '/Projects/TMSNav.png', alt: 'The TMS-Nav viewer showing a head model with 10–20 electrode sites, coil, and placement metrics' },
    desc:
      'Research software for comparing <strong>EEG 10–20 cap targeting</strong> with MRI-guided TMS ' +
      'neuronavigation. A Python pipeline builds scalp meshes from T1 MRI, places 10–20 electrode sites by arc ' +
      'length, and runs <strong>Monte Carlo sampling</strong> of coil placement error. Recorded Brainsight poses ' +
      'feed the placement statistics, a SimNIBS workflow models the induced electric field, and a Three.js viewer ' +
      'shows the results in 3D.',
    stack: 'Python · NiBabel · SimNIBS · Three.js',
    links: [
      { href: 'https://tms-nav.github.io/TMS-Nav/', label: 'Open viewer', primary: true },
      { href: 'https://github.com/TMS-Nav/TMS-Nav', label: 'Source' },
    ],
  },
  {
    index: '03',
    slug: 'lapsecam',
    repo: 'alirad1/LapseCam',
    title: 'LapseCam',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,JavaScript,Electron,FFmpeg',
    img: { src: '/Projects/LapseCam.png', alt: 'The LapseCam recording window with capture-source and speed controls' },
    desc:
      'A Windows desktop app that records the screen, webcam, or both and exports a <strong>time-lapse at up ' +
      'to 600x</strong>. Frames are captured locally and assembled with FFmpeg; nothing is uploaded.',
    stack: 'Electron · JavaScript · FFmpeg',
    links: [
      { href: 'https://lapsecam.alirad.dev', label: 'Open live', primary: true },
      { href: 'https://github.com/alirad1/LapseCam', label: 'Source' },
    ],
  },
  {
    index: '04',
    slug: 'dynamic-wallpapers',
    repo: 'alirad1/dynamic-wallpapers',
    title: 'Dynamic Wallpapers',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,Next.js,TypeScript,Tailwind CSS,React',
    img: { src: '/Projects/DynamicWallpapers.png', alt: 'Generated lock-screen wallpapers showing a year calendar and a life-in-weeks grid' },
    desc:
      'Generates phone lock-screen wallpapers from a URL: a year calendar, life-in-weeks grid, or goal ' +
      'countdown. The server renders SVG layouts to PNG with sharp, and an iPhone Shortcut or MacroDroid task ' +
      '<strong>refreshes the wallpaper daily</strong>.',
    stack: 'Next.js · TypeScript · Tailwind · sharp',
    links: [
      { href: 'https://dynamicwallpapers.alirad.dev', label: 'Open live', primary: true },
      { href: 'https://github.com/alirad1/dynamic-wallpapers', label: 'Source' },
    ],
  },
  {
    index: '05',
    slug: 'milo',
    repo: 'alirad1/Milo',
    title: 'Milo Motivational Buddy',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,JavaScript,MySQL',
    img: { src: '/Projects/Milo.png', alt: 'The Milo dashboard showing daily goals and a streak counter' },
    desc:
      'A goal and habit tracker that stores <strong>progress and streaks in MySQL</strong>, with a chatbot for ' +
      'journaling, reminders, and daily prompts.',
    stack: 'JavaScript · MySQL',
    links: [
      { href: 'https://milo.alirad.dev', label: 'Open live', primary: true },
      { href: 'https://github.com/alirad1/Milo', label: 'Source' },
    ],
  },
  {
    index: '06',
    slug: 'alichart',
    title: 'AliChart',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,AWS,PostgreSQL,JavaScript',
    img: { src: '/Projects/AliChart.jpg', alt: 'The AliChart patient-records screen with role-based navigation' },
    desc:
      'A healthcare records web app on a <strong>PostgreSQL schema</strong> of 5+ relational tables (patients, ' +
      'records, users), originally deployed on AWS. <strong>Role-based access control</strong> separates three ' +
      'user types, and a REST API handles CRUD on clinical data.',
    stack: 'JavaScript · PostgreSQL · AWS',
    links: [{ href: 'https://chart.alirad.dev', label: 'Open live', primary: true }],
  },
  {
    index: '07',
    slug: 'this-website',
    repo: 'alirad1/alirad.dev',
    title: 'This website',
    state: { label: 'You are here', kind: 'here' },
    live: true,
    tags: 'Live,Astro,TypeScript,Tailwind CSS',
    img: { src: '/Projects/Website.png', alt: 'The alirad.dev home page' },
    desc:
      'My portfolio, built with <strong>Astro, Tailwind, and TypeScript</strong>. All content lives in one data ' +
      "file that both the page and AliBot's corpus are generated from.",
    stack: 'Astro · Tailwind · TypeScript',
    links: [{ href: 'https://github.com/alirad1/alirad.dev', label: 'Source', primary: true }],
  },
  {
    index: '08',
    slug: 'aggiequest',
    repo: 'alirad1/AggieQuest-HowdyHack25',
    title: 'AggieQuest',
    titleSub: 'HowdyHack',
    state: { label: 'Hackathon', kind: 'plain' },
    live: false,
    tags: 'Python,Flask,REST API',
    img: { src: '/Projects/AggieQuest.png', alt: 'The AggieQuest daily-challenge screen' },
    desc:
      'A HowdyHack web app that issues daily challenges to students. I built the <strong>Flask backend</strong> ' +
      'and REST endpoints for challenges, submissions, and user progress.',
    stack: 'Python · Flask · REST API',
    links: [{ href: 'https://github.com/alirad1/AggieQuest-HowdyHack25', label: 'Source', primary: true }],
  },
  {
    index: '09',
    slug: 'marketscope',
    repo: 'alirad1/MarketScope-FREEworks',
    title: 'MarketScope',
    titleSub: 'FREEWORKS',
    state: { label: '2nd place · FREEWORKS', kind: 'award' },
    live: false,
    tags: 'Award Winner,Python,Streamlit',
    img: { src: '/Projects/MarketScope.png', alt: 'The MarketScope dashboard comparing several stocks over time' },
    desc:
      'A Streamlit dashboard for comparing <strong>25+ stocks</strong> with live data from yfinance. pandas ' +
      'computes daily change, total return, and volatility. <strong>2nd place at FREEWORKS</strong>, Texas A&amp;M.',
    stack: 'Python · Streamlit · pandas',
    links: [{ href: 'https://github.com/alirad1/MarketScope-FREEworks', label: 'Source', primary: true }],
  },
  {
    index: '10',
    slug: 'radgame',
    repo: 'alirad1/RadGame',
    title: 'RadGame',
    state: { label: 'Graphics', kind: 'plain' },
    live: false,
    tags: 'Java,LWJGL,ImGui',
    img: { src: '/Projects/RadGame.png', alt: 'A 3D scene from RadGame with a debug overlay' },
    desc:
      'A 3D game in <strong>Java</strong>, written to learn graphics programming. LWJGL handles rendering and ' +
      'ImGui the debug tools; it has player movement, collision detection, and basic enemy AI.',
    stack: 'Java · LWJGL · ImGui',
    links: [{ href: 'https://github.com/alirad1/RadGame', label: 'Source', primary: true }],
  },
];

export const research: Experience[] = [
  {
    slug: 'khavari-lab',
    org: 'Khavari Lab',
    role: 'Researcher, TMS neuronavigation',
    when: 'May 2026 – Present',
    where: 'Houston Methodist, Houston, TX',
    desc:
      'Independent project under a Rice University PhD student comparing EEG 10–20 cap positioning with ' +
      'MRI-guided neuronavigation for figure-8 TMS coil placement in rTMS treatment of neurogenic overactive ' +
      'bladder. I quantify placement accuracy with Monte Carlo sampling and paired equivalence testing, and built ' +
      'a SimNIBS model of the electric field each method delivers to the cortical target from subject MRI. The ' +
      'question is whether the lower-cost cap method is clinically equivalent and could widen access to rTMS.',
    tags: ['TMS', 'Neuroimaging', 'SimNIBS', 'Statistics'],
    link: { href: 'https://tms-nav.github.io/TMS-Nav/', label: 'Open the TMS-Nav viewer' },
  },
  {
    slug: 'neuman-lab',
    org: 'Neuman Lab',
    role: 'Bioinformatics Research Assistant & Peer Mentor',
    when: 'Jan 2026 – Present',
    where: 'College Station, TX',
    desc:
      'Annotated 25+ viral genomes using tBLASTn, ORFfinder, and HHpred, and mentor 30 undergraduate researchers ' +
      'on annotation methods, reviewing their genome maps before submission. Building a web platform and Python ' +
      'tooling on a PostgreSQL data model to centralize the annotation workflow for 180 undergraduate researchers. ' +
      'Presented posters at the EIS Symposium and the SACNAS TAMU Diversity in Science Symposium (April 2026).',
    tags: ['Bioinformatics', 'Virus discovery', 'Python', 'PostgreSQL'],
    link: {
      href: 'https://artsci.tamu.edu/biology/updates/citizen-scientists-uncover-unknown-viruses.html',
      label: 'Read about the lab',
    },
  },
];

export const experience: Experience[] = [
  {
    slug: 'pc-builder',
    org: 'Independent',
    role: 'Custom PC Builder',
    when: 'Feb 2023 – Jul 2025',
    where: 'Houston, TX',
    desc:
      'Commissioned to build custom computers at a range of price points. Chose parts to fit each client\'s ' +
      'budget and use, then assembled, tested, and set up each machine.',
    tags: ['Hardware', 'PC building', 'Clients'],
  },
  {
    slug: 'music-teacher',
    org: 'Independent',
    role: 'Music Instructor',
    when: 'Oct 2023 – Apr 2025',
    where: 'Houston, TX',
    desc: 'Taught weekly piano and guitar lessons to students of varying levels.',
    tags: ['Piano', 'Guitar', 'Teaching'],
  },
  {
    slug: 'aws-academy',
    org: 'AWS Academy',
    role: 'Cloud Foundations',
    when: 'Completed Apr 2025',
    where: 'Online',
    desc: 'Completed AWS Academy Cloud Foundations.',
    tags: ['AWS', 'Cloud'],
    link: { href: 'https://www.credly.com/badges/897bab94-9c65-44ef-ac9b-bbc286a62d82', label: 'View the badge' },
  },
  {
    slug: 'lifeguard',
    org: 'A-Beautiful Pools & Sweetwater Pools',
    role: 'Lifeguard',
    when: 'May 2022 – Sep 2022',
    where: 'Houston, TX',
    desc: 'Lifeguarded at two community pools.',
    tags: ['CPR', 'First aid', 'Safety'],
  },
];

export const involvement: Experience[] = [
  {
    slug: 'aggiescreate',
    org: 'Aggies Create',
    role: 'Media Manager',
    when: 'Jan 2026 – Present',
    where: 'College Station, TX',
    desc:
      'Lead the electrical and computer vision subsystems of IRIS, an autonomous surgical light built by a ' +
      '7-member team: a custom PCB and Raspberry Pi controller driving servos on 3+ axes, and OpenCV hand ' +
      'tracking with sub-100 ms response. IRIS won 1st place at Good Bull Pitch, the Meloy Innovators Award, and ' +
      '2nd place at the Aggies Create Innovation Expo.',
    tags: ['Embedded', 'Computer vision', 'PCB design'],
    link: { href: 'https://www.linkedin.com/company/aggies-create/', label: 'Aggies Create on LinkedIn' },
  },
  {
    slug: 'student-senate',
    org: 'Texas A&amp;M Student Senate',
    role: 'Student Senator, Engineering Caucus Leader',
    when: 'Mar 2026 – Present',
    where: 'College Station, TX',
    desc:
      'Elected with 600+ votes, the most in the caucus, to represent 25,000+ engineering students. I lead the ' +
      'Engineering Caucus, directing 9 senators on legislative priorities, and have authored and passed multiple ' +
      'senate bills working with deans, faculty, and administrators on curriculum and academic resources.',
    tags: ['Leadership', 'Policy', 'Legislation'],
    link: { href: 'https://senate.tamu.edu/', label: 'senate.tamu.edu' },
  },
  {
    slug: 'ewb',
    org: 'Engineers Without Borders',
    role: 'Member',
    when: 'Aug 2025 – Feb 2026',
    where: 'College Station, TX',
    desc:
      'Designed a deployable, FEMA-compliant solar power system for off-grid agricultural use, selecting ' +
      'batteries and inverters and validating performance for field deployment.',
    tags: ['Solar power', 'Power systems'],
    link: { href: 'https://www.ewb-tamu.org/', label: 'ewb-tamu.org' },
  },
  {
    slug: 'free',
    org: 'Freshman Reaching Excellence in Engineering (FREE)',
    role: 'Member, Internal Committee',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc: 'Freshman leadership organization in Texas A&amp;M Engineering.',
    tags: ['Leadership', 'Mentorship'],
    link: { href: 'https://www.instagram.com/tamufree/', label: '@tamufree' },
  },
  {
    slug: 'ieee',
    org: 'IEEE',
    role: 'Member',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc: 'Texas A&amp;M student branch: technical workshops, projects, and professional development.',
    tags: ['Electrical', 'Computing'],
    link: { href: 'https://ieeetamu.org/', label: 'ieeetamu.org' },
  },
  {
    slug: 'quantam',
    org: 'QuantA&amp;M',
    role: 'Member',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc: 'Quantitative finance and trading club at Texas A&amp;M.',
    tags: ['Quant finance', 'Data'],
    link: { href: 'https://quantamu.github.io/', label: 'quantamu.github.io' },
  },
  {
    slug: 'csnhs',
    org: 'CS National Honor Society',
    role: 'Officer',
    when: 'High school',
    where: 'Clements HS, Fort Bend ISD',
    desc: 'Tutored students, ran programming contests, and volunteered at local middle schools.',
    tags: ['Leadership', 'Tutoring', 'Service'],
    link: { href: 'https://clementscsnhs.org/index.html', label: 'clementscsnhs.org' },
  },
];

export const moments: Moment[] = [
  { num: '01', label: 'Good Bull Pitch', ar: 1.67, src: '/Moments/Goodbull.jpeg', alt: 'Ali Rad and his team after winning the Good Bull Pitch Competition', cap: 'My team after we pitched IRIS, an autonomous surgical light, at the Good Bull Pitch Competition — first place, plus $500 to keep developing the prototype.' },
  { num: '02', label: 'FREE formal', ar: 1.33, src: '/Moments/FREE.jpeg', alt: 'Ali Rad with his FREE Internal committee at the winter formal', cap: "My freshman leadership organization's winter formal, with my committee, Internal." },
  { num: '03', label: 'Fish Camp', ar: 2.06, src: '/Moments/FishCamp.JPG', alt: 'Ali Rad on the final day of Fish Camp at Texas A&M', cap: 'The final day of Fish Camp, when I officially became an Aggie.' },
  { num: '04', label: 'Playoff win', ar: 1.66, src: '/Moments/TeamSoccerPhoto.jpg', alt: 'Ali Rad with his soccer teammates after a playoff win', cap: 'With my soccer teammates after winning our first playoff game in three years.' },
  { num: '05', label: 'Conducting', ar: 1.5, src: '/Moments/Conducting.JPG', alt: 'Ali Rad conducting a high school orchestra', cap: "Conducting one of my high school's orchestras as an officer. I'm fairly sure this was Aladdin." },
  { num: '06', label: 'Orchestra award', ar: 1.72, src: '/Moments/OrchestraAward.jpg', alt: 'Ali Rad receiving a district orchestra leadership award', cap: 'Nominated across the district as the embodiment of what it means to lead as an orchestra student.' },
  { num: '07', label: 'Chamber recital', ar: 1.33, src: '/Moments/GroupChamber.jpg', alt: 'Ali Rad with his chamber group after performing the Dvořák Piano Quintet', cap: 'My chamber group right after we survived a very daunting Dvořák Piano Quintet.' },
  { num: '08', label: 'Senior awards', ar: 1.81, src: '/Moments/SeniorAwards.jpeg', alt: 'Ali Rad at his high school senior awards', cap: 'Senior year: nominated for most school spirit, and somehow also prom king.' },
  { num: '09', label: 'First piano', ar: 1.53, src: '/Moments/FirstTimePlayingPiano.jpeg', alt: 'A young Ali Rad playing the piano for the first time', cap: 'The oldest photo I have of myself at a piano. Everything else on this strip starts here.' },
];
