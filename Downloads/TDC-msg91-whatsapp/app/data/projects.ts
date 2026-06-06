export type ProjectTier = "BEGINNER" | "INTERMEDIATE" | "FINAL_BOSS" | "GOD_MODE" | "SPONSORED";
export type ProjectStatus = "OPEN" | "RECRUITING" | "IN_PROGRESS" | "CLOSED";

export interface ProjectRole {
  id: string;
  title: string;
  availability: string;
  locked: boolean;
  description: string;
  questions: string[];
}

export interface Project {
  id: string;
  tier: ProjectTier;
  tierLevel: string;
  status: ProjectStatus;
  title: string;
  tagline: string;
  description: string;
  techStack: { label: string; value: string }[];
  timeline: { label: string; status: "COMPLETED" | "IN_PROGRESS" | "PENDING"; title: string; description: string }[];
  roles: ProjectRole[];
  teamSize: number;
  openSlots: number;
  tags: string[];
}

export const PROJECTS: Project[] = [
  {
    id: "TDC_2042",
    tier: "BEGINNER",
    tierLevel: "LVL_01",
    status: "OPEN",
    title: "TERMINAL_STYLE_PORTFOLIO",
    tagline: "Build a responsive, monochrome personal site inspired by classic Unix prompts.",
    description:
      "Your first real project in the developer community. Build a fully responsive personal portfolio using a brutalist, terminal-inspired design system. This is not about flashy animations — it is about clean, semantic HTML, precise CSS, and clear developer identity. The community will review your final submission and it becomes your public artifact.",
    techStack: [
      { label: "FRAMEWORK", value: "Vue.js" },
      { label: "STYLING", value: "Tailwind CSS" },
      { label: "DEPLOY", value: "Vercel" },
    ],
    timeline: [
      { label: "W01 // COMPLETED", status: "COMPLETED", title: "Design System Setup", description: "Establish color tokens, typography, and spacing rules." },
      { label: "W02 // IN_PROGRESS", status: "IN_PROGRESS", title: "Core Layout Build", description: "Hero, about, and project sections with responsive grid." },
      { label: "W03 // PENDING", status: "PENDING", title: "Deploy & Review", description: "Final submission, community feedback round." },
    ],
    roles: [
      {
        id: "contributor",
        title: "Contributor",
        availability: "3/5",
        locked: false,
        description: "Build the portfolio components and ship the final site.",
        questions: [
          "What is your current skill level with CSS/HTML?",
          "Have you deployed a site before? If yes, share a link.",
          "What personal projects or work do you want to showcase?",
        ],
      },
    ],
    teamSize: 5,
    openSlots: 3,
    tags: ["TAILWIND", "VUE.JS", "FIGMA"],
  },
  {
    id: "TDC_881",
    tier: "BEGINNER",
    tierLevel: "LVL_01",
    status: "OPEN",
    title: "CLI_TOOLBOX_ALPHA",
    tagline: "A suite of micro-tools for local file management and automation.",
    description:
      "Build a collection of tiny, focused command-line utilities in Go and Rust. Each tool solves one problem extremely well — file sorting, batch renaming, directory snapshots. The goal is to ship production-quality micro-CLIs with comprehensive README documentation and unit tests.",
    techStack: [
      { label: "CORE_ENGINE", value: "Go" },
      { label: "SECONDARY", value: "Rust" },
      { label: "CI", value: "GitHub Actions" },
    ],
    timeline: [
      { label: "M01 // COMPLETED", status: "COMPLETED", title: "Spec & Planning", description: "Define tool scope, CLI argument schemas, and test strategy." },
      { label: "M02 // IN_PROGRESS", status: "IN_PROGRESS", title: "Core Tools Build", description: "File sorter, batch rename, snapshot tools." },
      { label: "M03 // PENDING", status: "PENDING", title: "Documentation & Release", description: "Full README, usage examples, and v1.0.0 tag." },
    ],
    roles: [
      {
        id: "dev",
        title: "CLI Developer",
        availability: "2/3",
        locked: false,
        description: "Write Go or Rust micro-CLIs and tests.",
        questions: [
          "Which language do you prefer — Go or Rust?",
          "Have you written CLI tools before?",
          "Share any open-source contributions or repos.",
        ],
      },
    ],
    teamSize: 3,
    openSlots: 2,
    tags: ["GO", "RUST", "CLI"],
  },
  {
    id: "TDC_992",
    tier: "BEGINNER",
    tierLevel: "LVL_02",
    status: "OPEN",
    title: "BRUTALIST_UI_KIT",
    tagline: "Standardized component library for high-contrast dashboard systems.",
    description:
      "Design and build a reusable React component library with a strict brutalist aesthetic — zero border-radius, monochrome palette, JetBrains Mono typography. Components are documented in Storybook. Target consumers are internal TDC projects needing a consistent, fast design system without creative debates.",
    techStack: [
      { label: "FRAMEWORK", value: "React" },
      { label: "DESIGN", value: "Figma" },
      { label: "DOCS", value: "Storybook" },
    ],
    timeline: [
      { label: "S01 // COMPLETED", status: "COMPLETED", title: "Token System", description: "Color, spacing, typography tokens exported from Figma." },
      { label: "S02 // IN_PROGRESS", status: "IN_PROGRESS", title: "Component Build", description: "Button, Card, Input, Badge, Modal components." },
      { label: "S03 // PENDING", status: "PENDING", title: "Storybook Docs", description: "Stories for all components, usage documentation." },
    ],
    roles: [
      {
        id: "component-dev",
        title: "Component Developer",
        availability: "2/4",
        locked: false,
        description: "Build and document React components in the kit.",
        questions: [
          "What is your experience with design systems or component libraries?",
          "Have you used Storybook before?",
          "Link to any UI work you have shipped.",
        ],
      },
      {
        id: "designer",
        title: "UI Designer",
        availability: "1/1",
        locked: false,
        description: "Own the Figma source file and token exports.",
        questions: [
          "Share your Figma portfolio.",
          "Describe your approach to building a design token system.",
        ],
      },
    ],
    teamSize: 5,
    openSlots: 3,
    tags: ["REACT", "FIGMA", "STORYBOOK"],
  },
  {
    id: "TDC_X12",
    tier: "INTERMEDIATE",
    tierLevel: "LVL_04",
    status: "RECRUITING",
    title: "NEURAL_DASH_V2",
    tagline: "Interactive visualization system for high-dimensional data arrays.",
    description:
      "NEURAL_DASH is a real-time data visualization dashboard designed for high-dimensional ML training metrics. Version 2 adds custom WebGL renderers, a plugin system for chart types, and live streaming via WebSocket. It targets ML practitioners who need full control over their training run analytics without third-party lock-in.",
    techStack: [
      { label: "FRONTEND", value: "React" },
      { label: "RENDERING", value: "WebGL" },
      { label: "DATA_LAYER", value: "WebSocket" },
      { label: "STATE", value: "Zustand" },
    ],
    timeline: [
      { label: "P1 // COMPLETED", status: "COMPLETED", title: "Core Chart Engine", description: "Line, scatter, and heatmap renderers using WebGL." },
      { label: "P2 // IN_PROGRESS", status: "IN_PROGRESS", title: "Plugin Architecture", description: "Extensible chart type system with hot-swap support." },
      { label: "P3 // PENDING", status: "PENDING", title: "Live Streaming Layer", description: "WebSocket integration for real-time metric ingestion." },
      { label: "P4 // PENDING", status: "PENDING", title: "Public Beta", description: "Open-source release and documentation site." },
    ],
    roles: [
      {
        id: "lead-dev",
        title: "Lead Developer",
        availability: "0/1",
        locked: true,
        description: "Owns architecture and code quality.",
        questions: [],
      },
      {
        id: "core-dev",
        title: "Core Developer",
        availability: "2/4",
        locked: false,
        description: "Build and maintain core chart renderers and plugin system.",
        questions: [
          "Describe your experience with WebGL or Canvas rendering.",
          "Have you worked on data visualization projects? Share links.",
          "How comfortable are you with WebSocket-driven state management?",
          "What is your availability per week in hours?",
        ],
      },
      {
        id: "intern",
        title: "Intern",
        availability: "1/2",
        locked: false,
        description: "Support with testing, documentation, and smaller features.",
        questions: [
          "What do you want to learn from this project?",
          "Share any personal projects you have built.",
          "Are you comfortable working asynchronously?",
        ],
      },
    ],
    teamSize: 7,
    openSlots: 3,
    tags: ["REACT", "WEBGL", "WEBSOCKET", "ML"],
  },
  {
    id: "TDC_Q90",
    tier: "INTERMEDIATE",
    tierLevel: "LVL_05",
    status: "RECRUITING",
    title: "GRID_PROTOCOL_L1",
    tagline: "Open-source decentralized asset management interface for enterprise-grade nodes.",
    description:
      "Grid Protocol is building the frontend interface layer for a decentralized file and asset distribution network. The L1 interface handles node discovery, asset indexing, and permissioned transfers. We are a team of engineers who believe infrastructure tooling should be transparent, auditable, and open.",
    techStack: [
      { label: "FRONTEND", value: "React" },
      { label: "PROTOCOL", value: "libp2p" },
      { label: "STORAGE", value: "IPFS" },
      { label: "AUTH", value: "DID / Web3" },
    ],
    timeline: [
      { label: "V0.1 // COMPLETED", status: "COMPLETED", title: "Node Discovery UI", description: "Browse and connect to peer nodes on the local network." },
      { label: "V0.2 // IN_PROGRESS", status: "IN_PROGRESS", title: "Asset Index View", description: "List, filter, and inspect assets across connected nodes." },
      { label: "V0.3 // PENDING", status: "PENDING", title: "Permissioned Transfers", description: "Role-based transfer requests and approval flows." },
    ],
    roles: [
      {
        id: "frontend-eng",
        title: "Frontend Engineer",
        availability: "3/5",
        locked: false,
        description: "Build the React UI for node and asset management.",
        questions: [
          "Describe your experience with decentralized or P2P systems.",
          "Have you integrated Web3 or DID-based auth before?",
          "What draws you to open-source infrastructure projects?",
          "Share your most relevant GitHub repos.",
        ],
      },
      {
        id: "protocol-dev",
        title: "Protocol Developer",
        availability: "1/2",
        locked: false,
        description: "Work on libp2p integration and IPFS node interface.",
        questions: [
          "Describe your experience with libp2p or IPFS.",
          "Have you contributed to any P2P protocol projects?",
          "What is your experience with distributed systems architecture?",
        ],
      },
    ],
    teamSize: 7,
    openSlots: 4,
    tags: ["REACT", "IPFS", "WEB3", "P2P"],
  },
  {
    id: "TDC_X99",
    tier: "FINAL_BOSS",
    tierLevel: "LVL_08",
    status: "RECRUITING",
    title: "KUBERNETES_ORCHESTRATOR_X",
    tagline: "Custom Kubernetes controller for intelligent multi-cluster workload distribution.",
    description:
      "Building a production-grade Kubernetes controller that intelligently distributes workloads across multi-cloud clusters based on cost, latency, and carbon emissions data. This is systems engineering at its hardest — you will write Go controllers, design CRDs, and integrate with cloud billing APIs from three providers.",
    techStack: [
      { label: "CORE", value: "Go" },
      { label: "PLATFORM", value: "Kubernetes" },
      { label: "CLOUD", value: "AWS / GCP / Azure" },
      { label: "OBSERVABILITY", value: "Prometheus" },
    ],
    timeline: [
      { label: "R1 // COMPLETED", status: "COMPLETED", title: "CRD Design", description: "Custom Resource Definitions and API schema validation." },
      { label: "R2 // IN_PROGRESS", status: "IN_PROGRESS", title: "Controller Logic", description: "Reconciliation loop with multi-cluster awareness." },
      { label: "R3 // PENDING", status: "PENDING", title: "Cloud Cost Integration", description: "Pull live billing data and emissions metrics." },
      { label: "R4 // PENDING", status: "PENDING", title: "Production Hardening", description: "E2E testing, chaos engineering, and release." },
    ],
    roles: [
      {
        id: "lead-sre",
        title: "Lead SRE",
        availability: "0/1",
        locked: true,
        description: "Owns overall system reliability and release pipeline.",
        questions: [],
      },
      {
        id: "go-engineer",
        title: "Go Engineer",
        availability: "1/3",
        locked: false,
        description: "Implement controller logic and CRD reconciliation.",
        questions: [
          "What is your experience with the Kubernetes controller-runtime library?",
          "Have you written production Go code? Share your most complex project.",
          "Describe a distributed systems problem you solved.",
          "How do you approach testing Go systems code?",
          "What is your availability and timezone?",
        ],
      },
    ],
    teamSize: 4,
    openSlots: 1,
    tags: ["GO", "KUBERNETES", "CLOUD", "SRE"],
  },
  {
    id: "TDC_G01",
    tier: "GOD_MODE",
    tierLevel: "LVL_99",
    status: "RECRUITING",
    title: "QUANTUM_STASH_CORE_STABLE",
    tagline: "Post-quantum cryptographic storage layer with browser-native key management.",
    description:
      "QUANTUM_STASH is a research-grade cryptographic storage system implementing CRYSTALS-Kyber and Dilithium post-quantum algorithms in WebAssembly, with a browser-native key management interface. The goal is a production-ready zero-trust file storage system that is resistant to quantum decryption attacks and deployable entirely in the browser.",
    techStack: [
      { label: "CRYPTO", value: "CRYSTALS-Kyber" },
      { label: "RUNTIME", value: "WebAssembly" },
      { label: "INTERFACE", value: "React" },
      { label: "STORAGE", value: "IndexedDB" },
    ],
    timeline: [
      { label: "α1 // COMPLETED", status: "COMPLETED", title: "WASM Crypto Module", description: "Kyber-768 key encapsulation compiled to WASM." },
      { label: "α2 // IN_PROGRESS", status: "IN_PROGRESS", title: "Key Management UI", description: "Browser-native key generation, export, and import flows." },
      { label: "β1 // PENDING", status: "PENDING", title: "Encrypted Storage Layer", description: "IndexedDB integration with encrypted blob management." },
      { label: "β2 // PENDING", status: "PENDING", title: "Security Audit", description: "External cryptography audit and penetration testing." },
    ],
    roles: [
      {
        id: "crypto-engineer",
        title: "Cryptography Engineer",
        availability: "1/2",
        locked: false,
        description: "Work on post-quantum algorithm implementations and WASM bindings.",
        questions: [
          "Describe your background in applied cryptography.",
          "Have you worked with post-quantum algorithms (Kyber, Dilithium, etc.)?",
          "What is your experience with WebAssembly or Rust/C compiled to WASM?",
          "Link to any cryptography-related publications, repos, or contributions.",
          "How do you stay current with post-quantum cryptography developments?",
        ],
      },
      {
        id: "wasm-dev",
        title: "WASM Developer",
        availability: "0/1",
        locked: true,
        description: "Owns WebAssembly build pipeline and browser integration.",
        questions: [],
      },
    ],
    teamSize: 3,
    openSlots: 1,
    tags: ["WASM", "CRYPTOGRAPHY", "REACT", "SECURITY"],
  },
  {
    id: "TDC_AIML",
    tier: "INTERMEDIATE",
    tierLevel: "LVL_04",
    status: "RECRUITING",
    title: "AI_MACHINE_LEARNING",
    tagline: "Building Intelligence That Understands, Learns, and Decides",
    description: "This project focuses on designing, training, and deploying AI/ML models that solve real-world problems — from data ingestion and feature engineering to model evaluation and production serving. Interns work across the full ML pipeline in domain-specific sub-teams (ML Engineering, Data, and Backend Integration) under Tech Leads and a Project Lead. The goal is not just to build a model — but to ship something that works in context, scales, and can be explained to anyone.",
    techStack: [
      { label: "AI/ML", value: "PyTorch/TensorFlow" },
      { label: "DATA", value: "Pandas/Spark" },
      { label: "BACKEND", value: "FastAPI" },
    ],
    timeline: [
      { label: "S01 // PENDING", status: "PENDING", title: "Data Preparation", description: "Collect, clean, and engineer features from datasets." },
      { label: "S02 // PENDING", status: "PENDING", title: "Model Training", description: "Train and evaluate models for real-world scenarios." },
      { label: "S03 // PENDING", status: "PENDING", title: "Deployment", description: "Deploy models via REST APIs and monitor performance." },
    ],
    roles: [
      {
        id: "project-lead",
        title: "Project Lead",
        availability: "0/1",
        locked: false,
        description: "The primary technical bridge between the TDC core committee and the AI/ML team. Translates high-level objectives into sprint-ready tasks.",
        questions: [
          "Walk us through the most complex AI/ML project you have contributed to.",
          "How familiar are you with the end-to-end ML pipeline?",
          "Which of the following have you worked with hands-on?",
          "How do you explain concepts like model overfitting, precision-recall tradeoff, or dataset bias to someone who has never studied ML?",
          "The model accuracy is at 62% and the demo is tomorrow. What do you do?"
        ]
      },
      {
        id: "product-manager",
        title: "Product Manager",
        availability: "0/1",
        locked: false,
        description: "Owns the uniqueness and usability. Translates data-science outputs into product decisions.",
        questions: [
          "Describe an AI/ML tool or product you have used regularly. What is one thing you would improve?",
          "How do you prioritize tasks when everything feels equally urgent?",
          "A Tech Lead tells you a feature is 'technically impossible' to build by the deadline. How do you handle it?",
          "How would you measure whether the AI/ML team is actually productive?"
        ]
      },
      {
        id: "tech-lead",
        title: "Tech Lead",
        availability: "0/3",
        locked: false,
        description: "Owns one domain — ML Engineering, Data Engineering, or Backend Integration — and is responsible for architecture, code quality, and intern mentorship.",
        questions: [
          "Which Tech Lead domain are you applying for?",
          "Walk us through the most complex technical project you have built.",
          "If an intern keeps making the same technical mistake after you have explained it twice — what is your next step?",
          "Explain the difference between overfitting and underfitting (ML) OR REST and GraphQL (Backend) OR data pipelines (Data)."
        ]
      },
      {
        id: "intern",
        title: "Intern",
        availability: "0/6",
        locked: false,
        description: "Core builder embedded within one of the domain sub-teams. Learns directly from their Tech Lead while contributing to real deliverables.",
        questions: [
          "Which intern domain are you applying for?",
          "Tell us about a coding project, assignment, or personal experiment you are most proud of.",
          "If you are given a task involving a tool or language you have never used before, what are your first three steps?",
          "What is Git, and why do teams use version control?",
          "In your own words, explain what a machine learning model actually does."
        ]
      }
    ],
    teamSize: 11,
    openSlots: 11,
    tags: ["AI", "ML", "PYTHON", "DATA"]
  },
  {
    id: "TDC_APPDEV",
    tier: "BEGINNER",
    tierLevel: "LVL_02",
    status: "RECRUITING",
    title: "APPLICATION_DEVELOPMENT",
    tagline: "Engineering Products That People Actually Use",
    description: "This project focuses on building a full-stack application from requirements to deployment — covering frontend design, backend services, API development, database architecture, and DevOps. Interns work in specialised sub-teams (Frontend, Backend, DevOps, and QA) under the guidance of Tech Leads and a Project Lead. The goal is not just to ship code, but to build a product that is reliable, maintainable, and solves a real problem for its users.",
    techStack: [
      { label: "FRONTEND", value: "React" },
      { label: "BACKEND", value: "Node.js / Python" },
      { label: "DATABASE", value: "PostgreSQL / MongoDB" },
      { label: "DEVOPS", value: "Docker / CI/CD" },
    ],
    timeline: [
      { label: "S01 // PENDING", status: "PENDING", title: "Architecture & Design", description: "Design DB schema and frontend UI." },
      { label: "S02 // PENDING", status: "PENDING", title: "Core Features", description: "Build APIs and frontend integration." },
      { label: "S03 // PENDING", status: "PENDING", title: "Deployment", description: "Containerize and deploy application." },
    ],
    roles: [
      {
        id: "project-lead",
        title: "Project Lead",
        availability: "0/1",
        locked: false,
        description: "Technical anchor owning architecture, roadmap, and release.",
        questions: [
          "Walk us through the most complex full-stack or app development project you have built.",
          "How familiar are you with full-stack architecture? Select all layers you are confident in.",
          "What is the most important thing you look for when reviewing a pull request?",
          "Your Frontend Tech Lead and Backend Tech Lead have built incompatible components. How do you resolve this?"
        ]
      },
      {
        id: "product-manager",
        title: "Product Manager",
        availability: "0/1",
        locked: false,
        description: "Owns the experience and direction of the application. Ensures the team is building something useful.",
        questions: [
          "Have you ever managed a timeline or coordinated a group project?",
          "How do you decide what to build first when everything on the backlog feels equally important?",
          "User testing feedback shows that users consistently misunderstand a core feature. How do you respond?",
          "How do you define 'done' for a feature?"
        ]
      },
      {
        id: "tech-lead",
        title: "Tech Lead",
        availability: "0/4",
        locked: false,
        description: "Owns technical execution within Frontend, Backend, DevOps, or QA.",
        questions: [
          "Which Tech Lead domain are you applying for?",
          "Walk us through the most complex technical project you have built or meaningfully contributed to.",
          "How do you balance writing code yourself versus guiding and teaching your interns?",
          "When making a technology or tooling decision for your domain, what factors do you consider?"
        ]
      },
      {
        id: "intern",
        title: "Intern",
        availability: "0/8",
        locked: false,
        description: "Core builders embedded in Frontend, Backend, DevOps, or QA sub-teams.",
        questions: [
          "Which intern domain are you applying for?",
          "Tell us about a coding project, assignment, or personal experiment you are most proud of.",
          "If you are given a task that uses a technology you have never worked with before, what is your first move?",
          "Explain what an API is in your own words."
        ]
      }
    ],
    teamSize: 14,
    openSlots: 14,
    tags: ["REACT", "NODE.JS", "FULLSTACK", "DEVOPS"]
  },
  {
    id: "TDC_INTELLIFLOW",
    tier: "INTERMEDIATE",
    tierLevel: "LVL_04",
    status: "RECRUITING",
    title: "INTELLIFLOW_AI_PRODUCTIVITY",
    tagline: "Automating the Repetitive. Amplifying the Human.",
    description: "IntelliFlow is about building AI-powered tools that eliminate friction, automate repetitive workflows, and give people back their most valuable resource — time. Interns will design and engineer LLM-driven solutions — from prompt engineering and RAG pipelines to API integrations and end-to-end workflow automation — working in specialised sub-teams (Prompt & AI Engineering, Backend, and Integration) under Tech Leads and a Project Lead.",
    techStack: [
      { label: "AI", value: "LLM APIs / LangChain" },
      { label: "AUTOMATION", value: "n8n / Zapier" },
      { label: "BACKEND", value: "Node.js / Python" },
    ],
    timeline: [
      { label: "S01 // PENDING", status: "PENDING", title: "Workflow Discovery", description: "Identify repetitive tasks and design automation flows." },
      { label: "S02 // PENDING", status: "PENDING", title: "Integration & Prompts", description: "Build LLM prompts and connect third-party APIs." },
      { label: "S03 // PENDING", status: "PENDING", title: "Testing & Rollout", description: "Validate AI outputs and deploy to users." },
    ],
    roles: [
      {
        id: "project-lead",
        title: "Project Lead",
        availability: "0/1",
        locked: false,
        description: "Translates high-level goals into a technical roadmap. Understands LLM APIs, prompt engineering, and automation platforms.",
        questions: [
          "Walk us through the most complex AI tool, automation, or LLM-integrated project you have built.",
          "How familiar are you with AI tool building blocks (OpenAI API, RAG, workflow automation, etc.)?",
          "How do you explain the concept of hallucination to a non-technical stakeholder?",
          "The prompt your team designed produces correct outputs 78% of the time. The demo is in 48 hours. What do you do?"
        ]
      },
      {
        id: "product-manager",
        title: "Product Manager",
        availability: "0/1",
        locked: false,
        description: "Ensures the team is building something people will actually use. Defines what 'good' looks like for an AI-powered tool.",
        questions: [
          "Describe an AI tool or automation you have used regularly. What would you change and why?",
          "The AI tool your team built is technically impressive but users find it confusing. What is your diagnosis?",
          "What is the most important thing a Product Manager does on a project that is AI-powered?",
          "Where do you think most AI tools fail their users?"
        ]
      },
      {
        id: "tech-lead",
        title: "Tech Lead",
        availability: "0/3",
        locked: false,
        description: "Owns Prompt & AI Engineering, Backend Services, or Integration.",
        questions: [
          "Which Tech Lead domain are you applying for?",
          "Tell us about a time you had to pick up a completely new technology or framework quickly.",
          "What do you always check for during a code or prompt review?",
          "Explain few-shot prompting, RAG, or designing an API endpoint that queries an LLM."
        ]
      },
      {
        id: "intern",
        title: "Intern",
        availability: "0/6",
        locked: false,
        description: "Core contributors writing prompts, building backend endpoints, and integration scripts.",
        questions: [
          "Which intern domain are you applying for?",
          "Have you experimented with any AI tools, LLM APIs, or automation tools?",
          "What is a large language model (LLM) in simple terms?",
          "What is prompt engineering in your own words, and why does the exact wording matter?"
        ]
      }
    ],
    teamSize: 11,
    openSlots: 11,
    tags: ["LLM", "AUTOMATION", "RAG", "INTEGRATION"]
  }
];

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
