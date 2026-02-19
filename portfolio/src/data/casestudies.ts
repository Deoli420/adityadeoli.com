export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  productType: string;
  domain: string[];
  timeline: string;
  tldr: string;
  snapshot: {
    wallets?: string;
    credentials?: string;
    nfts?: string;
    revenue?: string;
    partners?: string[];
    users?: string;
    campaigns?: string;
    ecosystems?: string;
    uptime?: string;
    coverage?: string;
  };
  primaryMetric: {
    label: string;
    value: string;
  };
  sections: {
    problem: {
      title: string;
      content: string[];
      goal: string;
    };
    constraints: {
      title: string;
      items: string[];
    };
    role: {
      title: string;
      areas: {
        title: string;
        items: string[];
      }[];
    };
    metrics: {
      title: string;
      cards: {
        label: string;
        value: string;
        description?: string;
      }[];
    };
    tradeoffs: {
      title: string;
      decisions: {
        title: string;
        description: string;
      }[];
    };
    outcomes: {
      title: string;
      items: string[];
    };
    improvements: {
      title: string;
      items: string[];
    };
    why: {
      title: string;
      items: string[];
    };
  };
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "beauty-of-apis",
    title: "The Beauty of APIs: Why They Power Modern Software & Make QA Scalable",
    subtitle: "How APIs evolved, why they are beautiful, and how great API design unlocks speed, reliability, and testability at scale.",
    role: "Senior QA Engineer", 
    productType: "Platform Infrastructure",
    domain: ["QA Engineering", "Platform Infrastructure", "APIs", "Backend", "Testing"],
    timeline: "Jan 2026",
    tldr: "APIs are the invisible contracts that allow software systems to communicate reliably. From REST to GraphQL to gRPC, APIs enable teams to build faster, test earlier, and scale without chaos. For QA engineers, APIs are the most powerful testing surface — deterministic, automatable, and observable — making them the foundation of modern quality engineering.",
    snapshot: {
      coverage: "90%+",
      uptime: "99.9%+",
      ecosystems: "25+ years",
      partners: ["REST", "GraphQL", "gRPC", "WebSockets", "SOAP"]
    },
    primaryMetric: {
      label: "Test Speed Improvement",
      value: "10x faster"
    },
    sections: {
      problem: {
        title: "Overview",
        content: [
          "Think of an API as a waiter in a restaurant. You don't need to know how the kitchen works, what ingredients are used, or how the chef prepares your meal. You simply tell the waiter what you want from the menu, and they bring it to you. The waiter is the interface between you and the complex kitchen operations.",
          "APIs work the same way in software. They're the waiters of the digital world — clean, predictable interfaces that hide complexity while enabling powerful interactions between systems.",
          "For QA engineers, APIs represent the most reliable testing surface available. Unlike UI tests that break when a button moves, API tests validate the core business logic that actually matters."
        ],
        goal: "Understand APIs as the backbone of modern systems through a QA-first lens, and master them as the foundation of scalable quality engineering."
      },
      constraints: {
        title: "The Origin Story",
        items: [
          "Early machine-to-machine communication required custom protocols and tight coupling between systems",
          "SOAP & XML era brought standardization but with heavy overhead and complex schemas",
          "REST principles revolutionized web APIs with simple HTTP verbs and stateless communication",
          "Modern API evolution includes GraphQL for flexible queries, gRPC for high-performance, and WebSockets for real-time communication",
          "Each evolution solved specific problems while maintaining the core promise: reliable system-to-system communication"
        ]
      },
      role: {
        title: "Why APIs Matter",
        areas: [
          {
            title: "System Architecture Benefits",
            items: [
              "🔗 Decoupling: Teams can work independently on different services without breaking each other",
              "⚡ Parallel Development: Frontend and backend teams can develop simultaneously using API contracts",
              "📈 Scalability: Individual services can be scaled based on demand without affecting the entire system",
              "👁️ Observability: API calls provide clear audit trails and monitoring points for system health"
            ]
          },
          {
            title: "Quality Engineering Impact",
            items: [
              "🚀 Speed: API tests run 10x faster than UI tests and provide immediate feedback",
              "🎯 Determinism: APIs return consistent responses, making tests reliable and predictable",
              "🔄 Automation: Perfect for CI/CD pipelines with fast execution and clear pass/fail criteria",
              "📊 Coverage: Test business logic directly without UI complexity getting in the way"
            ]
          }
        ]
      },
      metrics: {
        title: "APIs & QA: The Perfect Partnership",
        cards: [
          {
            label: "Test Execution Speed",
            value: "10x faster",
            description: "vs UI tests"
          },
          {
            label: "Modern Apps Using APIs",
            value: "90%+",
            description: "Rely on API communication"
          },
          {
            label: "API Evolution Timeline",
            value: "25+ years",
            description: "From SOAP to modern REST"
          },
          {
            label: "System Reliability Impact",
            value: "Critical",
            description: "Foundation of scalable QA"
          },
          {
            label: "CI/CD Integration",
            value: "Seamless",
            description: "Perfect automation fit"
          },
          {
            label: "Business Logic Coverage",
            value: "Direct",
            description: "No UI interference"
          }
        ]
      },
      tradeoffs: {
        title: "API Styles Compared",
        decisions: [
          {
            title: "REST APIs",
            description: "Strength: Simple, stateless, widely adopted. Weakness: Over-fetching data, multiple requests. Best for: CRUD operations, public APIs. QA Consideration: Easy to test with standard HTTP tools."
          },
          {
            title: "GraphQL",
            description: "Strength: Flexible queries, single endpoint. Weakness: Complex caching, learning curve. Best for: Frontend-driven development. QA Consideration: Query validation and schema testing critical."
          },
          {
            title: "gRPC",
            description: "Strength: High performance, type safety. Weakness: Limited browser support, complexity. Best for: Microservice communication. QA Consideration: Protocol buffer validation and performance testing."
          },
          {
            title: "WebSockets",
            description: "Strength: Real-time bidirectional communication. Weakness: Connection management complexity. Best for: Live updates, gaming. QA Consideration: Connection state and message ordering tests."
          },
          {
            title: "SOAP",
            description: "Strength: Enterprise standards, security. Weakness: Heavy overhead, complexity. Best for: Legacy enterprise systems. QA Consideration: XML schema validation and WSDL compliance."
          }
        ]
      },
      outcomes: {
        title: "Tooling & Automation",
        items: [
          "🔧 Postman + Newman: Interactive testing with automated CI/CD integration for comprehensive API validation",
          "☕ REST Assured: Java-based testing framework perfect for enterprise environments and complex assertions",
          "🥋 Karate: BDD-style API testing with built-in JSON/XML handling and parallel execution",
          "🤝 Pact: Contract testing framework ensuring API compatibility between consumer and provider services",
          "⚡ k6 / JMeter: Performance testing tools for load, stress, and scalability validation of API endpoints",
          "🐳 Docker + Testcontainers: Isolated testing environments with real database and service dependencies"
        ]
      },
      improvements: {
        title: "Real-World Patterns",
        items: [
          "Schema Validation: Automatically validate API responses against OpenAPI/JSON Schema definitions in every test run",
          "Contract Tests in PRs: Run Pact contract tests on every pull request to catch breaking changes before merge",
          "Mock Servers: Use tools like WireMock to simulate external dependencies and test edge cases reliably",
          "Canary API Tests: Deploy API changes to small traffic percentage with automated rollback on test failures",
          "Rate-Limit Testing: Validate API throttling, circuit breakers, and graceful degradation under load",
          "Security Testing: Automated OWASP API security checks including authentication, authorization, and input validation"
        ]
      },
      why: {
        title: "Why This Matters",
        items: [
          "APIs are leverage — master them, and you can test entire systems faster than others test single features",
          "QA engineers who understand APIs scale their impact 10x by testing at the right abstraction level",
          "Good APIs enable faster teams, safer releases, and better products by providing reliable contracts between services",
          "In a world moving toward microservices and distributed systems, API quality directly determines system reliability",
          "The future of QA is API-first: test the contracts, validate the behavior, ensure the reliability that users depend on"
        ]
      }
    }
  },
  {
    slug: "authena-proof-of-humanity",
    title: "Proof of Humanity (PoH) Infrastructure for Sybil-Resistant Web3 Airdrops",
    subtitle: "Designing privacy-preserving identity verification at Web3 scale.",
    role: "Senior QA Engineer",
    productType: "Platform Infrastructure",
    domain: ["Web3", "Identity", "Security", "QA Engineering"],
    timeline: "Dec 2024 – Feb 2025",
    tldr: "Authena is a Proof of Humanity (PoH) verification platform designed to protect Web3 token airdrops from Sybil attacks. By combining credential-based verification, ZK-assisted privacy guarantees, and TEE-backed execution, Authena reduced Sybil eligibility by 30–70%, helping protocols preserve treasury value while maintaining user trust and scalability.",
    snapshot: {
      wallets: "~2.4M",
      credentials: "~12M", 
      nfts: "~400K",
      revenue: "$1M+ revenue",
      partners: ["Caldera", "Espresso", "Somnia", "Irys", "Union", "Intuition", "Rayls"]
    },
    primaryMetric: {
      label: "Sybil Reduction",
      value: "30-70%"
    },
    sections: {
      problem: {
        title: "Problem",
        content: [
          "Sybil wallets were inflating airdrop eligibility by 40-80% across major Web3 protocols",
          "Treasury leakage of millions in tokens going to fake accounts instead of real users",
          "Support overhead from legitimate users unable to claim due to system abuse",
          "Existing KYC solutions created privacy concerns and regulatory complexity"
        ],
        goal: "Build privacy-preserving, scalable Sybil resistance that maintains user trust while protecting protocol treasuries."
      },
      constraints: {
        title: "Constraints",
        items: [
          "No raw identity exposure - privacy-first architecture required",
          "Handle traffic spikes during major airdrop announcements (500K+ concurrent users)",
          "Support custom partner logic and verification thresholds per protocol",
          "Enable cross-protocol credential reuse without compromising security",
          "Provide mathematical trust guarantees for high-stakes distributions"
        ]
      },
      role: {
        title: "My Role & Ownership",
        areas: [
          {
            title: "QA & Testing Strategy",
            items: [
              "End-to-end testing of multi-credential verification flows",
              "Load testing verification infrastructure under 500K+ peak users",
              "Security testing of zk-KYC and biometric verification systems",
              "API testing for 20+ partner integrations and custom logic"
            ]
          },
          {
            title: "Platform Quality Assurance",
            items: [
              "Stress-tested credential issuance achieving < 5min SLA under load",
              "Validated anti-fraud systems maintaining < 1% false positive rates",
              "Tested privacy-preserving flows replacing traditional KYC systems",
              "Ensured real-time verification performance during high-stakes launches"
            ]
          },
          {
            title: "Partner Integration Testing",
            items: [
              "Protocol onboarding and API integration validation",
              "Edge case testing for custom trust threshold configurations",
              "Technical POC testing and partner-specific verification flows"
            ]
          }
        ]
      },
      metrics: {
        title: "Key Metrics & Impact",
        cards: [
          {
            label: "Sybil Reduction",
            value: "30-70%",
            description: "Across partner protocols"
          },
          {
            label: "Users Verified",
            value: "2.4M+",
            description: "Unique wallet verifications"
          },
          {
            label: "Credentials Issued",
            value: "12M+",
            description: "Multi-credential system"
          },
          {
            label: "Revenue Generated",
            value: "$1M+",
            description: "Production infrastructure"
          },
          {
            label: "System Accuracy",
            value: "99%+",
            description: "False positive rate < 1%"
          },
          {
            label: "Verification Speed",
            value: "< 5min",
            description: "Average completion time"
          }
        ]
      },
      tradeoffs: {
        title: "Tradeoffs & Decisions",
        decisions: [
          {
            title: "Security vs UX",
            description: "Chose multi-step verification over single-click to ensure robust sybil detection, accepting 30% mobile completion drop-off for security guarantees."
          },
          {
            title: "Speed vs Reusability", 
            description: "Built modular credential system allowing cross-protocol reuse, trading initial development complexity for long-term partner scalability."
          },
          {
            title: "Transparency vs Privacy",
            description: "Implemented ZK-proofs to verify humanity without exposing personal data, balancing protocol trust needs with user privacy requirements."
          }
        ]
      },
      outcomes: {
        title: "Outcomes",
        items: [
          "Became preferred PoH layer for major Web3 protocols and airdrops",
          "Created reusable verification primitive adopted across 20+ projects",
          "Generated $1M+ revenue as production-grade identity infrastructure",
          "Enabled multi-ecosystem adoption with customizable trust thresholds",
          "Protected millions in airdrop value through rigorous anti-fraud systems"
        ]
      },
      improvements: {
        title: "What I'd Improve Next",
        items: [
          "Mobile UX optimization to reduce 30% completion drop-off",
          "Partner dashboards for real-time verification analytics",
          "Cross-protocol analytics and fraud pattern detection",
          "Streamlined onboarding to reduce verification friction"
        ]
      },
      why: {
        title: "Why This Case Matters",
        items: [
          "Security-critical product testing with millions in value at stake",
          "API-first platform thinking with 20+ integration points",
          "Balance of UX testing and infrastructure reliability",
          "Partner enablement and custom verification logic validation",
          "Production scale impact protecting Web3 ecosystem integrity"
        ]
      }
    }
  },
  {
    slug: "intract-web3-growth-engine",
    title: "Web3 Growth Engine: Quest-Based User Acquisition at Scale",
    subtitle: "QA for industry-leading gamified onboarding serving 11M+ users.",
    role: "Founding QA Engineer", 
    productType: "Growth Platform",
    domain: ["Web3", "QA Engineering", "Growth", "Blockchain"],
    timeline: "2022 – 2024 (2+ Years)",
    tldr: "Led end-to-end QA for Intract Quests, FairDAO's industry-leading quest system serving 11M+ users. Delivered rigorous testing for gamified Web3 campaigns generating $3M+ revenue and distributing $10M+ in rewards across major ecosystems like Linea, zkSync, Mode, and TON.",
    snapshot: {
      users: "11M+",
      campaigns: "6,535+",
      revenue: "$3M+",
      ecosystems: "20+",
      uptime: "99.9%+",
      partners: ["Linea", "zkSync", "Mode", "TON", "Trust Wallet", "OG Labs"]
    },
    primaryMetric: {
      label: "Platform Uptime",
      value: "99.9%+"
    },
    sections: {
      problem: {
        title: "Problem",
        content: [
          "Web3 ecosystems struggled with user onboarding and education at scale",
          "Traditional growth campaigns lacked gamification and on-chain verification",
          "High-stakes reward distribution required bulletproof fraud detection",
          "Complex multi-quest user journeys needed seamless UX under massive load"
        ],
        goal: "Build and test a scalable quest platform that safely onboards millions to Web3 while distributing significant rewards."
      },
      constraints: {
        title: "Constraints", 
        items: [
          "Handle 500K+ peak concurrent users during major ecosystem launches",
          "Ensure zero critical bugs in $1M+ direct reward distribution infrastructure",
          "Support complex on-chain task verification (wallet connections, NFT mints, transactions)",
          "Maintain sub-1-week time-to-launch for ecosystem partner campaigns",
          "Achieve 98%+ partner satisfaction through rigorous pre-launch testing"
        ]
      },
      role: {
        title: "My Role & Ownership",
        areas: [
          {
            title: "Platform QA Leadership",
            items: [
              "End-to-end testing of 6,535+ quest campaigns across major ecosystems",
              "Stress-tested $10M+ reward distribution infrastructure under peak load",
              "Validated fraud detection systems protecting distributed rewards",
              "Load tested on-chain task execution at scale (wallet connections, NFT mints)"
            ]
          },
          {
            title: "Partner & Campaign Testing",
            items: [
              "Pre-launch testing achieving 98%+ CSAT from ecosystem partners",
              "Maintained 150K+ DAU stability across complex multi-quest journeys", 
              "Delivered < 1 day to 1 week time-to-launch through streamlined QA",
              "Safeguarded flagship campaigns: Linea DeFi Voyage, Trust Wallet integrations"
            ]
          },
          {
            title: "Infrastructure & Security",
            items: [
              "Automated testing pipelines for rapid campaign deployment",
              "Security testing for high-value reward distribution mechanisms",
              "Performance testing under Web3-specific load patterns and traffic spikes"
            ]
          }
        ]
      },
      metrics: {
        title: "Key Metrics & Impact",
        cards: [
          {
            label: "Platform Users",
            value: "11M+",
            description: "Registered user accounts"
          },
          {
            label: "Quest Campaigns",
            value: "6,535+",
            description: "Successfully launched"
          },
          {
            label: "Revenue Generated",
            value: "$3M+",
            description: "Over 2 years"
          },
          {
            label: "Rewards Distributed",
            value: "$10M+",
            description: "To verified users"
          },
          {
            label: "Partner Satisfaction",
            value: "98%+",
            description: "CSAT score"
          },
          {
            label: "Platform Uptime",
            value: "99.9%+",
            description: "During peak campaigns"
          }
        ]
      },
      tradeoffs: {
        title: "Tradeoffs & Decisions",
        decisions: [
          {
            title: "Speed vs Thoroughness",
            description: "Balanced rapid campaign launches (< 1 week) with comprehensive testing by building reusable test frameworks and automated validation pipelines."
          },
          {
            title: "Scale vs Stability",
            description: "Prioritized platform stability over feature velocity during high-stakes campaigns, ensuring zero critical bugs in reward distribution."
          },
          {
            title: "Automation vs Manual Testing",
            description: "Invested heavily in automated testing infrastructure while maintaining manual testing for complex user journey edge cases and partner-specific logic."
          }
        ]
      },
      outcomes: {
        title: "Outcomes",
        items: [
          "Established industry-leading quest platform serving 11M+ users",
          "Achieved 98%+ partner satisfaction through rigorous QA processes",
          "Maintained platform stability during 500K+ peak user campaigns",
          "Enabled $3M+ revenue generation through reliable campaign delivery",
          "Protected $10M+ in distributed rewards through comprehensive fraud testing",
          "Created reusable QA frameworks adopted across FairDAO product suite"
        ]
      },
      improvements: {
        title: "What I'd Improve Next",
        items: [
          "Enhanced automated testing coverage for complex on-chain interactions",
          "Real-time campaign performance monitoring and alerting systems",
          "Improved mobile testing infrastructure for better cross-device coverage",
          "Advanced fraud detection testing using ML-based pattern recognition"
        ]
      },
      why: {
        title: "Why This Case Matters",
        items: [
          "Founding QA role building industry-leading Web3 growth infrastructure",
          "High-stakes testing with millions in rewards and user trust at risk",
          "Scaled testing processes from startup to 11M+ user platform",
          "Cross-ecosystem expertise testing integrations with major L1s/L2s",
          "Demonstrated ability to maintain quality under extreme growth pressure"
        ]
      }
    }
  }
];

export const getCaseStudyBySlug = (slug: string): CaseStudy | undefined => {
  return caseStudies.find(study => study.slug === slug);
};

export const getAllDomains = (): string[] => {
  const domains = new Set<string>();
  caseStudies.forEach(study => {
    study.domain.forEach(domain => domains.add(domain));
  });
  return Array.from(domains).sort();
};