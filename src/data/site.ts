/* All the site's content in one place. The components below map over these
   arrays, so adding a project or an experience entry is a data edit, not a
   block of markup to copy. `desc` fields carry inline <strong> emphasis and
   are rendered with set:html. */

export type Link = { href: string; label: string; primary?: boolean };

export type Project = {
  index: string;
  title: string;
  titleSub?: string;
  state: { label: string; kind: 'live' | 'here' | 'award' | 'plain' };
  live: boolean;
  tags: string; // data-tags, read by the filter
  img: { src: string; alt: string };
  desc: string;
  stack: string;
  links: Link[];
};

export type Experience = {
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

export const projects: Project[] = [
  {
    index: '01',
    title: 'LapseCam',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,JavaScript,Electron,FFmpeg',
    img: { src: '/Projects/LapseCam.png', alt: 'The LapseCam recording window with capture-source and speed controls' },
    desc:
      'A free Windows desktop app that turns study sessions into time-lapse videos with no editing ' +
      'required. Record your <strong>screen, webcam, or both</strong>, choose a speed preset up to 600x, ' +
      'and LapseCam captures frames on a canvas before <strong>FFmpeg</strong> assembles the final clip. ' +
      'Built with <strong>Electron and JavaScript</strong>, everything runs locally with no account or upload.',
    stack: 'Electron · JavaScript · FFmpeg',
    links: [
      { href: 'https://lapsecam.alirad.dev', label: 'Open live', primary: true },
      { href: 'https://github.com/alirad1/LapseCam', label: 'Source' },
    ],
  },
  {
    index: '02',
    title: 'Dynamic Wallpapers',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,Next.js,TypeScript,Tailwind CSS,React',
    img: { src: '/Projects/DynamicWallpapers.png', alt: 'Generated lock-screen wallpapers showing a year calendar and a life-in-weeks grid' },
    desc:
      'A web app that generates <strong>daily-updating phone lock screen wallpapers</strong> straight from ' +
      'a URL, including a year calendar, life-in-weeks grid, goal countdown, and progress tracker. Built with ' +
      '<strong>Next.js, TypeScript, and Tailwind CSS</strong>, it renders SVG layouts to PNG on the server with ' +
      '<strong>sharp</strong>. Point iPhone Shortcuts or Android MacroDroid at the link once and the wallpaper ' +
      'refreshes itself every day, with no account or database.',
    stack: 'Next.js · TypeScript · Tailwind · sharp',
    links: [
      { href: 'https://dynamicwallpapers.alirad.dev', label: 'Open live', primary: true },
      { href: 'https://github.com/alirad1/dynamic-wallpapers', label: 'Source' },
    ],
  },
  {
    index: '03',
    title: 'Milo Motivational Buddy',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,JavaScript,MySQL',
    img: { src: '/Projects/Milo.png', alt: 'The Milo dashboard showing daily goals and a streak counter' },
    desc:
      'A goal and habit-tracking app built to help people stay consistent with daily goals. It uses ' +
      '<strong>JavaScript and MySQL</strong> to store <strong>progress and streaks</strong>, and includes a small ' +
      '<strong>chatbot</strong> for journaling, reminders, and daily prompts that make the experience feel ' +
      'motivating rather than mechanical.',
    stack: 'JavaScript · MySQL',
    links: [
      { href: 'https://milo.alirad.dev', label: 'Open live', primary: true },
      { href: 'https://github.com/alirad1/Milo', label: 'Source' },
    ],
  },
  {
    index: '04',
    title: 'AliChart',
    state: { label: 'Live', kind: 'live' },
    live: true,
    tags: 'Live,AWS,PostgreSQL,JavaScript',
    img: { src: '/Projects/AliChart.jpg', alt: 'The AliChart patient-records screen with role-based navigation' },
    desc:
      'A live web application designed around a <strong>PostgreSQL relational database</strong>, previously ' +
      'deployed on <strong>AWS</strong>. Implements <strong>JavaScript-driven workflows</strong> to model data ' +
      'relationships, authentication logic, and <strong>CRUD-style operations</strong> within a ' +
      'healthcare-style system.',
    stack: 'AWS · PostgreSQL · JavaScript',
    links: [{ href: 'https://chart.alirad.dev', label: 'Open live', primary: true }],
  },
  {
    index: '05',
    title: 'This website',
    state: { label: 'You are here', kind: 'here' },
    live: true,
    tags: 'Live,Astro,TypeScript,Tailwind CSS',
    img: { src: '/Projects/Website.png', alt: 'The alirad.dev home page' },
    desc:
      "Where I keep my projects, experience, and whatever I'm building right now. Written in " +
      '<strong>Astro with Tailwind and TypeScript</strong> — components for the repeated parts, one ' +
      'measured page, and a scroll that stays out of the way.',
    stack: 'Astro · Tailwind · TypeScript',
    links: [{ href: 'https://github.com/alirad1/alirad.dev', label: 'Source', primary: true }],
  },
  {
    index: '06',
    title: 'AggieQuest',
    titleSub: 'HowdyHack',
    state: { label: 'Hackathon', kind: 'plain' },
    live: false,
    tags: 'Python,Flask,REST API',
    img: { src: '/Projects/AggieQuest.png', alt: 'The AggieQuest daily-challenge screen' },
    desc:
      'A full-stack web app that generates daily challenges to encourage student engagement. I built a ' +
      '<strong>Flask backend</strong> with <strong>REST endpoints</strong> handling challenge creation, ' +
      'submissions, and user progress, focused on a clean <strong>end-to-end flow</strong> from frontend ' +
      'interaction to backend logic.',
    stack: 'Python · Flask · REST API',
    links: [{ href: 'https://github.com/alirad1/AggieQuest-HowdyHack25', label: 'Source', primary: true }],
  },
  {
    index: '07',
    title: 'MarketScope',
    titleSub: 'FREEWORKS',
    state: { label: '2nd place · FREEWORKS', kind: 'award' },
    live: false,
    tags: 'Award Winner,Python,Streamlit',
    img: { src: '/Projects/MarketScope.png', alt: 'The MarketScope dashboard comparing several stocks over time' },
    desc:
      'An interactive stock analysis dashboard built with <strong>Python and Streamlit</strong> for comparing ' +
      'multiple stocks across time periods. It <strong>visualizes returns and price trends</strong> in a way you ' +
      'can actually explore, and <strong>placed 2nd in the FREEWORKS competition at Texas A&amp;M</strong>.',
    stack: 'Python · Streamlit',
    links: [{ href: 'https://github.com/alirad1/MarketScope-FREEworks', label: 'Source', primary: true }],
  },
  {
    index: '08',
    title: 'RadGame',
    state: { label: 'Graphics', kind: 'plain' },
    live: false,
    tags: 'Java,LWJGL,ImGui',
    img: { src: '/Projects/RadGame.png', alt: 'A 3D scene from RadGame with a debug overlay' },
    desc:
      'A 3D game written in <strong>Java</strong> to learn graphics programming and game engine fundamentals. ' +
      'Using <strong>LWJGL and ImGui</strong>, I implemented <strong>real-time rendering</strong>, player movement, ' +
      '<strong>collision detection</strong>, and <strong>basic enemy AI</strong> while experimenting with low-level ' +
      'game systems.',
    stack: 'Java · LWJGL · ImGui',
    links: [{ href: 'https://github.com/alirad1/RadGame', label: 'Source', primary: true }],
  },
];

export const research: Experience[] = [
  {
    org: 'Neuman Lab',
    role: 'Bioinformatics-Based Virus Discovery',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc:
      'Bioinformatics-based virus discovery at Texas A&amp;M, contributing to citizen science efforts that ' +
      'uncover previously unknown viruses.',
    tags: ['Bioinformatics', 'Research', 'Virus discovery'],
    link: {
      href: 'https://artsci.tamu.edu/biology/updates/citizen-scientists-uncover-unknown-viruses.html',
      label: 'Read about the lab',
    },
  },
  {
    org: 'Private instruction',
    role: 'Music teacher',
    when: 'Oct 2023 – Apr 2025',
    where: 'Remote / local',
    desc: 'Taught private music lessons, helping students build technique and musicality.',
    tags: ['Piano', 'Teaching', 'Music'],
  },
  {
    org: 'AWS Academy',
    role: 'Cloud Foundations — Graduate',
    when: 'Completed Apr 2025',
    where: 'Online',
    desc: 'Completed AWS Academy Cloud Foundations and earned the Cloud Foundations graduate badge on Credly.',
    tags: ['AWS', 'Cloud'],
    link: { href: 'https://www.credly.com/badges/897bab94-9c65-44ef-ac9b-bbc286a62d82', label: 'View the badge' },
  },
  {
    org: 'A-Beautiful Pools & Sweetwater Pools',
    role: 'Lifeguard',
    when: 'May 2022 – Sep 2022',
    where: 'Local',
    desc:
      'Guarded at A-Beautiful Pools (June–September) and Sweetwater Pools (May–July), keeping swimmers safe ' +
      'and responding to emergencies.',
    tags: ['CPR', 'First aid', 'Safety'],
  },
];

export const clubs: Experience[] = [
  {
    org: 'Engineers without Borders',
    role: 'Member',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc:
      'Texas A&amp;M chapter — designing and implementing sustainable engineering projects with communities worldwide.',
    tags: ['Engineering', 'Sustainability'],
    link: { href: 'https://www.ewb-tamu.org/', label: 'ewb-tamu.org' },
  },
  {
    org: 'AggiesCreate',
    role: 'Member',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc: 'A student organization built around creativity, innovation, and shipping projects together.',
    tags: ['Creativity', 'Collaboration'],
    link: { href: 'https://www.aggiescreate.com/', label: 'aggiescreate.com' },
  },
  {
    org: 'Freshman Reaching Excellence in Engineering',
    role: 'Member — Internal committee',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc:
      'Freshman leadership organization in Texas A&amp;M Engineering — building community and developing leadership skills.',
    tags: ['Leadership', 'Mentorship'],
    link: { href: 'https://www.instagram.com/tamufree/', label: '@tamufree' },
  },
  {
    org: 'IEEE',
    role: 'Member',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc: 'Texas A&amp;M student branch — technical workshops, projects, and professional development.',
    tags: ['Electrical', 'Computing'],
    link: { href: 'https://ieeetamu.org/', label: 'ieeetamu.org' },
  },
  {
    org: 'QuantA&amp;M',
    role: 'Member',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc: 'Quantitative finance and trading club — strategies, markets, and data-driven finance.',
    tags: ['Quant finance', 'Data'],
    link: { href: 'https://quantamu.github.io/', label: 'quantamu.github.io' },
  },
  {
    org: 'Persian Student Association',
    role: 'Member',
    when: 'Ongoing',
    where: 'College Station, TX',
    desc: 'Celebrating Persian culture and building community on campus.',
    tags: ['Culture', 'Community'],
    link: { href: 'https://www.instagram.com/psatamu/', label: '@psatamu' },
  },
  {
    org: 'CS National Honor Society',
    role: 'Officer',
    when: 'Ongoing',
    where: 'Clements HS / Fort Bend ISD',
    desc:
      'Promoting scholarship, leadership, and service in computer science — tutoring students, running contests, ' +
      'and volunteering at local middle schools.',
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
