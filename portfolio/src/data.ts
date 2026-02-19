import { Project, Experience, Skill, Certification, Stats } from './types';

export const stats: Stats = {
  bugsUncovered: 2500,
  uptime: 99.99,
  automatedTests: 5000,
  majorReleases: 50
};

export const projects: Project[] = [
  {
    title: 'Indus Valley Partners – Financial Systems QA',
    duration: 'Jul 2021 – Dec 2023',
    description: 'QA Engineer for enterprise-grade financial platforms used by hedge funds and asset managers. Owned quality across data pipelines, rule engines, mobile apps, and analytics systems in high-stakes finance environments.',
    tools: ['Selenium', 'Java', 'Appium', 'Playwright', 'Cypress', 'JMeter', 'Postman', 'Automation Anywhere', 'React', '.NET Core', 'Azure DevOps'],
    challenges: [
      'Ensured correctness and stability of mission-critical financial platforms including Polaris (Data Warehouse), Cash Master, and EDM (ETL systems)',
      'Reduced overall testing effort by ~80% by designing scalable automation frameworks using Selenium (Java), Appium, and Playwright',
      'Automated 900+ test cases for iOS and Android applications within one month, significantly accelerating release cycles',
      'Identified and prevented production-critical defects in complex multi-screen financial workflows',
      'Executed RPA-based test automation using Automation Anywhere to integrate and validate cross-system workflows'
    ],
    contributions: [
      'Built and executed JMeter performance test suites for rule engines with 1000+ business rules and ETL pipelines used by hedge funds',
      'Conducted API testing for ETL platforms adopted by 25 of the top 50 hedge funds',
      'Performed multiple rounds of Security Testing, including SQL Injection, Cross-Site Scripting (XSS), and Buffer Overflow scenarios',
      'Designed an internal Analytics Dashboard using React + .NET Core for real-time ETL monitoring and reporting'
    ]
  },
  {
    title: 'Intract Quests - Web3 Growth Engine',
    duration: '2022 - 2024 (2+ Years)',
    description: 'Founding QA Engineer for FairDAO\'s industry-leading quest system serving 11M+ users. Led end-to-end QA for gamified Web3 campaigns generating $3M+ revenue and distributing $10M+ in rewards.',
    tools: ['Selenium', 'Postman', 'JMeter', 'Redis', 'Azure DevOps', 'wagmi', 'Ether.js', 'TestRail', 'Burp Suite'],
    challenges: [
      'QAed 6,535+ quest campaigns across major ecosystems (Linea, zkSync, Mode, TON)',
      'Stress-tested $1M+ direct reward distribution infrastructure under 500K+ peak users',
      'Validated fraud detection systems protecting $10M+ in distributed rewards',
      'Load tested on-chain task execution (wallet connections, NFT mints, transactions) at scale'
    ],
    contributions: [
      'Achieved 98%+ CSAT from ecosystem partners through rigorous pre-launch testing',
      'Maintained 150K+ DAU stability across complex multi-quest user journeys',
      'Delivered < 1 day to 1 week time-to-launch through streamlined QA processes',
      'Safeguarded flagship campaigns: Linea DeFi Voyage, Trust Wallet, OG Labs integrations'
    ]
  },
  {
    title: 'Authena - Anti-Sybil Infrastructure',
    duration: 'Dec 2024 - Feb 2025',
    description: 'QA Engineer for FairDAO\'s modular Proof of Humanity infrastructure. Verified 2.3M+ users across 20+ projects, preventing sybil attacks in high-stakes airdrops worth millions.',
    tools: ['Appium', 'Postman', 'TestComplete', 'GitHub API', 'Steam API', 'WalletConnect', 'zk-KYC', 'Biometric APIs'],
    challenges: [
      'Stress-tested multi-credential verification issuing 6.5M+ credentials under < 5min SLA',
      'Validated privacy-preserving zk-KYC flows replacing traditional identity systems',
      'Load tested custom trust threshold logic across 20+ project integrations',
      'Simulated sybil attack vectors achieving < 1% false positive detection rates'
    ],
    contributions: [
      'Delivered production-grade identity infrastructure generating $1M+ revenue',
      'Enabled safe large-scale airdrop distribution without traditional KYC friction',
      'Maintained real-time verification performance during high-stakes campaign launches',
      'Protected millions in airdrop value through rigorous anti-fraud testing'
    ]
  },
  {
    title: 'Bantr - Social Intelligence Platform',
    duration: 'Feb 2025 - Present',
    description: 'QA Engineer for FairDAO\'s permissionless social intelligence product. Scaled Twitter-to-EVM mapping for 60K+ users, indexing 2.6M+ accounts and generating $160K+ revenue.',
    tools: ['React', 'Jest', 'Twitter API', 'LambdaTest', 'Postman', 'EVM APIs', 'Social Indexing'],
    challenges: [
      'QAed 1.5M+ daily social account indexing pipelines for real-time discovery',
      'Stress-tested Twitter-to-EVM wallet mapping attribution across 20K+ campaign participants',
      'Validated mindshare ranking algorithms surfacing ~2.5K relevant voices per campaign',
      'Load tested social-to-on-chain attribution systems under 10K+ DAU traffic'
    ],
    contributions: [
      'Enabled precision targeting campaigns for Ethena, ApeCoin, Morph, Bitget Wallet',
      'Shifted growth measurement from impressions to verifiable on-chain impact',
      'Maintained platform stability serving 60K+ registered users across Web3 ecosystems',
      'Delivered campaign-based monetization generating $160K+ revenue through rigorous testing'
    ]
  }
];

export const skills: Skill[] = [
  {
    name: 'Test Automation',
    category: 'Automation',
    description: 'Scaling frameworks that evolve with live apps, real users, and real chaos.',
    tools: ['Selenium', 'Playwright', 'Cypress', 'TestCafe', 'SpecFlow', 'Appium', 'Azure DevOps'],
    level: 98,
    isPrimary: true
  },
  {
    name: 'Performance Testing',
    category: 'Automation',
    description: 'Simulating real-world Web3 loads across reward systems, quests, and airdrop flows.',
    tools: ['JMeter', 'Locust', 'Artillery', 'Postman Monitor', 'Gatling'],
    level: 95,
    isPrimary: true
  },
  {
    name: 'Manual Testing',
    category: 'Manual Testing',
    description: 'Where automation ends and intuition begins — especially in edge cases and incentives.',
    tools: ['TestRail', 'Xray', 'QA Touch', 'Zephyr', 'Notion Test Plans'],
    level: 96,
    isPrimary: true
  },
  {
    name: 'Security Testing',
    category: 'Security',
    description: 'Finding leaks before the leakers. From PII to PoH abuse, I test what\'s hidden.',
    tools: ['Burp Suite', 'OWASP ZAP', 'Credential Replay', 'SQLi', 'XSS', 'Token Spoofing'],
    level: 92,
    isPrimary: true
  },
  {
    name: 'Blockchain QA',
    category: 'Blockchain',
    description: 'Testing smart contract interfaces, wallet flows, and gated on-chain mechanics.',
    tools: ['wagmi', 'WalletConnect', 'Ether.js', 'zkSync', 'Hardhat Mocks'],
    level: 96,
    isPrimary: true
  },
  {
    name: 'Behavioral QA',
    category: 'Behavioral',
    description: 'QA for human behavior loops — XP, nudges, engagement drops & milestone gating.',
    tools: ['A/B Testing Frameworks', 'Analytics Events', 'Exit-Intent', 'Dynamic XP'],
    level: 94,
    isPrimary: true
  },
  {
    name: 'API Testing',
    category: 'API',
    description: 'Meticulous API tests that monitor not just status codes — but user trust.',
    tools: ['Postman', 'REST', 'GraphQL', 'Swagger', 'TestComplete', 'Insomnia'],
    level: 97,
    isPrimary: true
  },
  {
    name: 'Mobile Testing',
    category: 'Mobile',
    description: 'Cross-platform confidence — from biometric fallbacks to mobile-only edge bugs.',
    tools: ['Appium', 'BrowserStack', 'Firebase Lab', 'LambdaTest', 'Xcode Tools'],
    level: 93,
    isPrimary: true
  },
  {
    name: 'CI/CD & DevOps',
    category: 'DevOps',
    description: 'Wiring automation into every commit — because \'Done\' is when it\'s deployed safely.',
    tools: ['GitHub Actions', 'CircleCI', 'Docker', 'Azure DevOps', 'Slack Hooks'],
    level: 94,
    isPrimary: true
  },
  {
    name: 'Test Management',
    category: 'Management',
    description: 'Strategic test design meets battle-tested bug rituals and release tracking.',
    tools: ['TestRail', 'Confluence', 'QA Dashboards', 'Release Notifier Bots'],
    level: 95,
    isPrimary: true
  }
];

export const experiences: Experience[] = [
  {
    company: 'Intract.io',
    role: 'Senior QA Engineer',
    period: '2024 - Present',
    description: 'Leading QA initiatives for Web3 platform',
    achievements: [
      'Built AI-powered automation framework',
      'Implemented predictive monitoring systems',
      'Reduced bug escape rate by 95%',
      'Mentored junior QA engineers'
    ]
  },
  {
    company: 'Indus Valley Partners',
    role: 'QA Engineer',
    period: '2021 - 2023',
    description: 'QA for fintech systems (Polaris, EDM, Cash Master)',
    achievements: [
      'Led testing for multiple financial products',
      'Implemented automated testing pipelines',
      'Improved test coverage by 90%',
      'Zero critical bugs in production'
    ]
  }
];

export const certifications: Certification[] = [
  {
    name: 'ISTQB-CTFL',
    issuer: 'ISTQB',
    date: '2022',
    link: 'https://drive.google.com/file/d/11Lt_xUAus__dtAKMkkmr-vuP2rp7394s/view'
  },
  {
    name: 'ISTQB Advanced Security Tester',
    issuer: 'ISTQB',
    date: '2023',
    link: 'https://www.linkedin.com/in/adityadeoli/overlay/1723555321777/single-media-viewer/?profileId=ACoAACEC8HkB3EQgTjl9xP54HrLvVtBKd6j53rg'
  }
];

export const education = {
  degree: 'B.Tech IT',
  university: 'Dr. A.P.J. Abdul Kalam Technical University',
  period: '2017 - 2021'
};

export const testimonials = [
  {
    quote: "Aditya is the kind of QA you build teams around. His structured chaos brings clarity to the most complex delivery sprints — and I've seen him de-risk entire releases just by thinking three steps ahead.",
    author: "Nitesh Bajaj",
    role: "QA Lead at IVP"
  },
  {
    quote: "Working with Aditya at IVP, I was constantly impressed by how quickly he mastered enterprise-scale QA. His automation saved hours of regression time — and his security test coverage was on par with senior architects.",
    author: "Neeraj Singh",
    role: "Director, Indus Valley Partners"
  },
  {
    quote: "Aditya isn't just our founding QA — he's our quality compass. From airdrop logic to API security, he's the one who keeps us honest. He breaks things like a hacker but fixes them like a builder.",
    author: "Abhishek Anita",
    role: "CTO, Intract"
  },
  {
    quote: "If you want bulletproof Web3 products, Aditya is your guy. He's guarded our biggest drops, built trust with our partners, and proved that QA can be a growth engine.",
    author: "Sambhav Jain",
    role: "CEO, Intract"
  },
  {
    quote: "Behind every successful user campaign at Intract, there's Aditya stress-testing the system weeks in advance. He understands product, users, and timing — a rare combo in QA.",
    author: "Apurv Kaushal",
    role: "CMO, Intract"
  },
  {
    quote: "Aditya has product intuition most QA folks only dream of. He not only finds bugs — he surfaces design flaws, logic gaps, and misuse vectors no spec can catch. Pure signal.",
    author: "Kushagra",
    role: "Head of Product, Intract / Ex-VP, Goldman Sachs"
  },
  {
    quote: "Aditya helped us ship Bantr with confidence. He tested our Twitter analytics pipeline like it was a finance-grade product. The guy has an eye for edge cases that don't even exist yet.",
    author: "Abhinav Sharma",
    role: "CTO, Bantr.fun"
  },
  {
    quote: "The only QA I trust with on-chain logic. Aditya has broken and battle-tested more contract flows than most devs have built. Relentless, sharp, and deeply technical.",
    author: "Saswata Dutta",
    role: "Sr. Blockchain Developer, Intract"
  },
  {
    quote: "Aditya makes QA feel like a product discipline. His test plans have structure, empathy, and edge-case coverage that makes engineers sleep better at night.",
    author: "Yashwik Ahuja",
    role: "PM, Zepto"
  },
  {
    quote: "I've worked with dozens of QA engineers — Aditya is the only one I've seen hold his own across automation, security, and performance, all while collaborating like a peer, not a checklist-runner.",
    author: "Vivek Kala",
    role: "Sr. SDE, IVP"
  },
  {
    quote: "Aditya is the first person I ping before releasing anything. Doesn't matter if it's frontend, contract logic, or API — he's already tested it, broken it, and written a plan to prevent future failure.",
    author: "Kartik Ahuja",
    role: "Tech Lead, Intract"
  },
  {
    quote: "Frontend bugs don't survive long when Aditya's on the repo. He thinks like a user, breaks like a hacker, and files like a PM. It's a dream for any dev.",
    author: "Sidharth Agarwal",
    role: "Sr. FE Developer, Intract"
  }
];