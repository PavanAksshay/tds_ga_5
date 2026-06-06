import { useState, useCallback, useRef, useEffect } from "react";
import { Check, XCircle } from "lucide-react";
import { useUsernameCheck } from "../hooks/use-username-check";
import { Link, useLoaderData, useActionData, redirect } from "react-router";
import type { Route } from "./+types/onboarding";
import {
  type OnboardingData,
  EMPTY_ONBOARDING,
} from "../hooks/use-onboarding-store";
import styles from "./onboarding.module.css";
import { PhoneVerify } from "../components/phone-verify/phone-verify";
import { SITE_URL } from "~/lib/seo";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Welcome Aboard | The Developer Community" },
    { name: "description", content: "Complete your developer profile and access your terminal dashboard on The Developer Community." },
    { name: "robots", content: "noindex, nofollow" },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}/onboarding` },
  ];
}

// ─── Step definitions ─────────────────────────────────────
type StepId =
  | "welcome"
  | "phone"
  | "role"
  | "identity"
  | "avatar"
  | "org"
  | "links"
  | "experience"
  | "tech"
  | "extras"
  | "done";

const ROLE_OPTIONS = [
  { value: "student", label: "STUDENT", sub: "Enrolled in college / university" },
  { value: "developer", label: "WORKING_DEV", sub: "Employed as a software developer" },
  { value: "founder", label: "FOUNDER", sub: "Running or building a startup" },
  { value: "trainee", label: "TRAINEE", sub: "Currently learning / in bootcamp" },
  { value: "teacher", label: "EDUCATOR", sub: "Teaching or mentoring developers" },
] as const;

const TECH_OPTIONS = [
  // Languages
  "JavaScript","TypeScript","Python","Java","C","C++","C#","Go","Rust","Ruby","PHP","Swift","Kotlin","Dart","Scala","R","MATLAB","Perl","Lua","Haskell","Elixir","Erlang","Clojure","F#","OCaml","Zig","Nim","Crystal","Julia","Groovy","Fortran","COBOL","Assembly","Bash","PowerShell","Tcl","Prolog","Scheme","Racket","Ada","D","Solidity","Vyper","Move","Cairo","GLSL","HLSL","WGSL","SQL","PL/SQL","T-SQL","HCL","Nix","Verilog","VHDL","ActionScript","ColdFusion","Hack","Apex","Objective-C",
  // Frontend
  "React","Next.js","Vue.js","Nuxt.js","Angular","Svelte","SvelteKit","Solid.js","Qwik","Astro","Remix","Gatsby","Ember.js","Backbone.js","Alpine.js","Htmx","Lit","Preact","Stencil","Marko","Mithril","Riot.js","Stimulus","Turbo","Inertia.js",
  // Mobile
  "React Native","Expo","Flutter","Ionic","Capacitor","NativeScript","Xamarin","MAUI","Kotlin Multiplatform","Compose Multiplatform",
  // CSS
  "Tailwind CSS","CSS Modules","Styled Components","Emotion","Stitches","Vanilla Extract","Linaria","Sass","LESS","PostCSS","UnoCSS","Windi CSS","PandaCSS","StyleX","Twind","Pico CSS","Open Props",
  // UI Libraries
  "Bootstrap","Foundation","Bulma","Materialize","Ant Design","Material UI","Chakra UI","Radix UI","shadcn/ui","Headless UI","Mantine","NextUI","DaisyUI","Flowbite","PrimeReact","Semantic UI","UIkit","Skeleton","Park UI",
  // State
  "Redux","Zustand","Recoil","Jotai","MobX","XState","Valtio","Pinia","Vuex","NgRx","RxJS","Immer",
  // Data Fetching
  "SWR","React Query","Axios","Apollo GraphQL","Relay","urql","tRPC",
  // Animation
  "Framer Motion","GSAP","Three.js","D3.js","Chart.js","Recharts","Visx","Pixi.js","Babylon.js","Phaser","p5.js","Lottie","Rive","Konva","Fabric.js","Paper.js",
  // Backend Node
  "Express.js","Fastify","NestJS","Hono","Koa","Hapi","Feathers","AdonisJS",
  // Backend Python
  "Django","Flask","FastAPI","Starlette","Litestar","Tornado","Sanic","Quart",
  // Backend Ruby
  "Ruby on Rails","Sinatra","Hanami","Roda",
  // Backend JVM
  "Spring Boot","Spring MVC","Quarkus","Micronaut","Vert.x","Play Framework","Grails","Dropwizard","Helidon","Javalin",
  // Backend PHP
  "Laravel","Symfony","Slim","Lumen","CodeIgniter","CakePHP","Yii","Phalcon",
  // Backend .NET
  "ASP.NET Core","Blazor","Minimal API",
  // Backend Go
  "Gin","Echo","Fiber","Chi","Gorilla",
  // Backend Rust
  "Actix","Axum","Rocket","Warp",
  // Backend Elixir
  "Phoenix","Plug","Cowboy",
  // Databases
  "PostgreSQL","MySQL","MariaDB","SQLite","Microsoft SQL Server","Oracle DB","IBM DB2","CockroachDB","YugabyteDB","TiDB","SingleStore","PlanetScale","Neon",
  "MongoDB","FaunaDB","CouchDB","DynamoDB","Firestore","Cosmos DB","Cassandra","ScyllaDB","HBase","Bigtable",
  "Redis","Valkey","KeyDB","Dragonfly","Memcached","Apache Ignite","Hazelcast",
  // Search
  "Elasticsearch","OpenSearch","Solr","Typesense","Meilisearch","Algolia",
  // Vector DB
  "Pinecone","Weaviate","Qdrant","Milvus","Chroma",
  // Graph DB
  "Neo4j","ArangoDB","TigerGraph","Amazon Neptune",
  // Time Series
  "InfluxDB","TimescaleDB","QuestDB","Prometheus",
  // Analytical
  "ClickHouse","Apache Druid","Apache Pinot","DuckDB","Databricks","Snowflake","BigQuery","Redshift","Firebolt",
  // ORMs
  "Prisma","Drizzle","TypeORM","Sequelize","Knex","Objection.js","MikroORM","SQLAlchemy","Tortoise ORM","Peewee","Django ORM","ActiveRecord","Ecto","GORM","Hibernate","JPA","MyBatis","JOOQ","Entity Framework","Dapper","Diesel","SeaORM","sqlx",
  // APIs
  "REST","GraphQL","gRPC","tRPC","WebSockets","WebRTC","MQTT","AMQP","SSE","Webhooks","OpenAPI","Swagger","Protobuf","Thrift","Avro","FlatBuffers","JSON Schema","SOAP",
  // Auth
  "NextAuth.js","Clerk","Auth0","Okta","Firebase Auth","Supabase Auth","Lucia","Better Auth","Passport.js","JWT","OAuth 2.0","OpenID Connect","SAML","WebAuthn","Passkeys","bcrypt","Argon2","Keycloak","Zitadel","Logto","Ory","FusionAuth","WorkOS","Stytch",
  // Cloud
  "AWS","Google Cloud","Azure","DigitalOcean","Linode","Vultr","Hetzner","Cloudflare",
  // Hosting
  "Vercel","Netlify","Railway","Render","Fly.io","Heroku","Supabase",
  // Containers
  "Docker","Docker Compose","Kubernetes","K3s","Helm","Kustomize","ArgoCD","Flux","Rancher","OpenShift","Nomad","Podman","containerd",
  // IaC
  "Terraform","OpenTofu","Pulumi","Ansible","Chef","Puppet","SaltStack","Vagrant","Packer",
  // CI/CD
  "GitHub Actions","GitLab CI","Jenkins","CircleCI","Travis CI","Drone","Tekton","Buildkite","TeamCity","Dagger","Earthly",
  // Monorepo
  "Nx","Turborepo","Lerna","Bazel","Pants",
  // Monitoring
  "Grafana","Datadog","New Relic","Dynatrace","Elastic Stack","Kibana","Loki","Tempo","Jaeger","Zipkin","OpenTelemetry","Sentry","Bugsnag","Rollbar","PagerDuty","Uptime Kuma","Signoz","Highlight.io",
  // Testing
  "Jest","Vitest","Mocha","Jasmine","AVA","PyTest","JUnit","RSpec","ExUnit","Minitest",
  "Playwright","Cypress","Puppeteer","Selenium","WebdriverIO","Nightwatch","TestCafe",
  "Storybook","Chromatic","Percy","Applitools","k6","Artillery","Gatling","Locust","JMeter",
  // Queues
  "Apache Kafka","RabbitMQ","NATS","Redis Pub/Sub","BullMQ","Celery","Sidekiq","AWS SQS","Google Pub/Sub","Azure Service Bus","Redpanda","Pulsar","Temporal","Inngest","QStash",
  // AI/ML
  "TensorFlow","PyTorch","JAX","Keras","Scikit-learn","XGBoost","LightGBM","Hugging Face","Transformers","Diffusers",
  // LLM
  "LangChain","LlamaIndex","LangGraph","CrewAI","AutoGen","Semantic Kernel","Haystack","DSPy","Instructor","Guidance","Outlines","OpenAI SDK","Anthropic SDK","Groq","Cohere","Mistral","Together AI","Replicate",
  // ML Infra
  "ONNX","TFLite","CoreML","MLX","llama.cpp","Ollama","vLLM","Triton","BentoML","Ray","MLflow","Weights & Biases","DVC","ZenML","Prefect","Airflow","Kubeflow","Vertex AI","SageMaker","Azure ML",
  // Data Science
  "Pandas","NumPy","SciPy","Matplotlib","Seaborn","Plotly","Polars","Vaex","CuDF","OpenCV","Pillow","spaCy","NLTK","Gensim",
  // Fine-tuning
  "PEFT","TRL","Axolotl","Unsloth","LitGPT","DeepSpeed","Accelerate","Megatron","Fairseq",
  // Web3
  "Ethereum","Solana","Polygon","Avalanche","BSC","Arbitrum","Optimism","Base","zkSync","StarkNet","Aptos","Sui","Near","Cosmos","Polkadot","Cardano","Algorand","Tezos","Flow","Hedera",
  "Foundry","Hardhat","Truffle","Anchor","Ethers.js","Viem","Wagmi","Web3.js","thirdweb","OpenZeppelin","Chainlink","The Graph","RainbowKit","WalletConnect","Moralis","Alchemy","Infura","Tenderly",
  // Game Dev
  "Unity","Unreal Engine","Godot","Bevy","Pygame","LÖVE","LibGDX","MonoGame","Raylib","GameMaker","RPG Maker","Construct","Defold","Cocos Creator","PlayCanvas",
  "OpenGL","Vulkan","DirectX","Metal","WebGL","WebGPU","HLSL",
  "Wwise","FMOD","PhysX","Bullet","Box2D","Havok",
  "Photon","Mirror","Unity Netcode","Steam Networking","PlayFab","GameLift",
  // Desktop
  "Electron","Tauri","Wails","Neutralinojs","Qt","GTK","WPF","Avalonia","Uno Platform","JavaFX","Tkinter","PyQt","Kivy","Dear ImGui","Slint","Fyne","Flutter Desktop","JUCE",
  // Networking
  "Nginx","Apache","Caddy","Traefik","HAProxy","Envoy","Istio","Linkerd","Consul","Vault","Wireguard","Tailscale","Zerotier","Cloudflare Tunnel","ngrok","Cilium","Calico","CoreDNS","eBPF",
  // Storage
  "AWS S3","Google Cloud Storage","Azure Blob","Cloudflare R2","Backblaze B2","MinIO","Ceph","AWS CloudFront","Cloudflare CDN","Fastly","Akamai","Bunny CDN","Cloudinary","ImageKit","Uploadthing","Mux","Livepeer",
  // Build Tools
  "Vite","Webpack","Rollup","Parcel","esbuild","Bun","Turbopack","Rspack","Babel","SWC","Biome","ESLint","Prettier","TSC",
  // Package Managers
  "npm","yarn","pnpm","Cargo","pip","Poetry","uv","Composer","Maven","Gradle","Go modules",
  // Version Control
  "Git","GitHub","GitLab","Bitbucket","Gitea","Jira","Linear","Notion","Confluence","Trello","Asana","ClickUp",
  // CMS
  "Contentful","Sanity","Strapi","Directus","Payload CMS","Hygraph","Prismic","Storyblok","DatoCMS","WordPress","Drupal","Ghost","Webflow","Framer",
  // E-commerce
  "Shopify","BigCommerce","Medusa","Saleor","Vendure","Commerce.js","WooCommerce",
  // Email
  "Resend","SendGrid","Mailgun","Postmark","AWS SES","Mailchimp","Loops","Novu","Knock","OneSignal","Twilio","Vonage","Pusher","Ably","Liveblocks","Socket.io",
  // Payments
  "Stripe","Razorpay","PayPal","Braintree","Square","Adyen","Cashfree","PayU","Paytm","PhonePe","Chargebee","Paddle","Lemon Squeezy","Plaid",
  // Analytics
  "Google Analytics","Plausible","Fathom","Umami","PostHog","Mixpanel","Amplitude","Heap","FullStory","Hotjar","LogRocket","Segment","Rudderstack","Metabase","Superset","Looker","Tableau","Power BI","Retool","Appsmith","Budibase",
];

const STEP_ORDER: StepId[] = [
  "welcome", "phone", "role", "identity", "avatar", "org", "links", "experience", "tech", "extras", "done",
];

const ONBOARDING_DRAFT_KEY_PREFIX = "tdc:onboarding-draft:";

// ─── Helpers ──────────────────────────────────────────────
function Cursor() {
  return <span className={styles.cursor}>_</span>;
}

function StepLabel({ current, total }: { current: number; total: number }) {
  return (
    <div className={styles.stepLabel}>
      STEP_{String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const segments = 20;
  const filled = Math.round((pct / 100) * segments);
  return (
    <div className={styles.progressBar}>
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className={i < filled ? styles.progressFilled : styles.progressEmpty} />
      ))}
      <span className={styles.progressPct}>{pct}%</span>
    </div>
  );
}

// ─── Individual step screens ──────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; SYSTEM_INIT<Cursor /></div>
      <h1 className={styles.title}>WELCOME TO THE<br />DEVELOPER COMMUNITY</h1>
      <p className={styles.subtitle}>
        Before accessing your terminal, we need to build your developer profile.
        This takes about 2 minutes. Answer truthfully — your profile is your identity.
      </p>
      <button className={styles.primaryBtn} onClick={onNext}>
        BEGIN_SETUP &rarr;
      </button>
    </div>
  );
}

function PhoneStep({
  initialVerified,
  initialPhone,
  onVerified,
  onNext,
}: {
  initialVerified: boolean;
  initialPhone: string | null;
  onVerified: (verified: boolean) => void;
  onNext: () => void;
}) {
  const handleVerifiedChange = useCallback(
    (v: boolean) => {
      onVerified(v);
      if (v) {
        // Auto-advance immediately upon successful verification
        setTimeout(() => {
          onNext();
        }, 800); // 800ms delay for visual success feedback
      }
    },
    [onVerified, onNext]
  );

  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; VERIFY_IDENTITY<Cursor /></div>
      <h2 className={styles.question}>Verify your WhatsApp number.</h2>
      <PhoneVerify
        initialVerified={initialVerified}
        initialPhone={initialPhone}
        onVerifiedChange={handleVerifiedChange}
      />
    </div>
  );
}

function RoleStep({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; IDENTIFY_ROLE<Cursor /></div>
      <h2 className={styles.question}>What best describes you?</h2>
      <div className={styles.roleGrid}>
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`${styles.roleCard} ${data.role === opt.value ? styles.roleCardActive : ""}`}
            onClick={() => onChange({ role: opt.value })}
          >
            <span className={styles.roleLabel}>{opt.label}</span>
            <span className={styles.roleSub}>{opt.sub}</span>
          </button>
        ))}
      </div>
      <button
        className={styles.primaryBtn}
        onClick={onNext}
        disabled={!data.role}
      >
        CONFIRM &rarr;
      </button>
    </div>
  );
}


function IdentityStep({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const { available: isAvailable, isChecking, error: checkError } = useUsernameCheck(data.username);

  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; SET_IDENTITY<Cursor /></div>
      <h2 className={styles.question}>Who are you?</h2>
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label}>USERNAME</label>
          <div className={styles.usernameInputWrap}>
            <span className={styles.usernamePrefix}>@</span>
            <input
              className={styles.input}
              placeholder="e.g. vk.amogh"
              value={data.username}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
                onChange({ username: val });
              }}
            />
          </div>
          {data.username.length >= 3 && (
            <div className={styles.availabilityStatus}>
              {isChecking ? (
                <span className={styles.checking}>Checking availability...</span>
              ) : isAvailable === true ? (
                <span className={`${styles.available} ${styles.fadeIn}`}>
                  <Check size={14} className={styles.availIcon} /> Available
                </span>
              ) : isAvailable === false ? (
                <span className={`${styles.unavailable} ${styles.fadeIn}`}>
                  <XCircle size={14} className={styles.availIcon} /> Already taken
                </span>
              ) : null}
            </div>
          )}
          <span className={styles.hint}>Only letters, numbers, . and _ allowed. No spaces.</span>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>REAL_NAME</label>
          <input
            className={styles.input}
            placeholder="e.g. Amogh V K"
            value={data.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>LOCATION (optional)</label>
          <input
            className={styles.input}
            placeholder="e.g. San Francisco, CA"
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>SHORT_BIO</label>
          <textarea
            className={styles.textarea}
            placeholder="Describe yourself in 2-3 sentences..."
            rows={4}
            value={data.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
          />
        </div>
      </div>
      <button
        className={styles.primaryBtn}
        onClick={onNext}
        disabled={!data.username.trim() || !data.displayName.trim() || isChecking || isAvailable === false}
      >
        NEXT &rarr;
      </button>
    </div>
  );
}

function AvatarStep({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const avatars = Array.from({ length: 20 }, (_, i) => `/avatars/avatar-${i + 1}.png`);

  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; SELECT_AVATAR<Cursor /></div>
      <h2 className={styles.question}>Choose your visual identity.</h2>
      <div className={styles.avatarGrid}>
        {avatars.map((url) => (
          <button
            key={url}
            className={`${styles.avatarOption} ${data.avatarUrl === url ? styles.avatarOptionActive : ""}`}
            onClick={() => onChange({ avatarUrl: url })}
            type="button"
          >
            <img src={url} alt="Avatar option" className={styles.avatarImage} />
          </button>
        ))}
      </div>
      <button
        className={styles.primaryBtn}
        onClick={onNext}
        disabled={!data.avatarUrl}
      >
        CONFIRM_AVATAR &rarr;
      </button>
    </div>
  );
}

function OrgStep({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const showCollege = data.role === "student" || data.role === "trainee" || data.role === "teacher";
  const showCompany = data.role === "developer" || data.role === "teacher";
  const showStartup = data.role === "founder";

  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; SET_AFFILIATION<Cursor /></div>
      <h2 className={styles.question}>Where do you operate?</h2>
      <div className={styles.fieldGroup}>
        {showCollege && (
          <div className={styles.field}>
            <label className={styles.label}>COLLEGE / UNIVERSITY</label>
            <input
              className={styles.input}
              placeholder="e.g. MIT, Stanford, IIT Bombay"
              value={data.collegeName}
              onChange={(e) => onChange({ collegeName: e.target.value })}
            />
          </div>
        )}
        {showCompany && (
          <div className={styles.field}>
            <label className={styles.label}>COMPANY_NAME</label>
            <input
              className={styles.input}
              placeholder="e.g. Neon Genesis Corp"
              value={data.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
            />
          </div>
        )}
        {showStartup && (
          <div className={styles.field}>
            <label className={styles.label}>STARTUP_NAME</label>
            <input
              className={styles.input}
              placeholder="e.g. Voxel Labs"
              value={data.startupName}
              onChange={(e) => onChange({ startupName: e.target.value })}
            />
          </div>
        )}
        {!showCollege && !showCompany && !showStartup && (
          <p className={styles.dimText}>No affiliation fields for this role. Click NEXT to continue.</p>
        )}
      </div>
      <button className={styles.primaryBtn} onClick={onNext}>
        NEXT &rarr;
      </button>
    </div>
  );
}

function LinksStep({
  data,
  onChange,
  onNext,
  hasGithub,
  githubHandle,
  onConnectGithub,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
  hasGithub: boolean;
  githubHandle: string | null;
  onConnectGithub: () => void;
}) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; LINK_HANDLES<Cursor /></div>
      <h2 className={styles.question}>Connect your presence.</h2>
      <div className={styles.fieldGroup}>
        <div className={styles.field}>
          <label className={styles.label}>GITHUB_ACCOUNT_REQUIRED</label>
          <div className={styles.connectPanel}>
            <div>
              <div className={styles.connectTitle}>
                {hasGithub ? "GITHUB_CONNECTED" : "CONNECT_GITHUB"}
              </div>
              <p className={styles.connectText}>
                {hasGithub
                  ? `Connected as ${githubHandle ?? "your GitHub account"}.`
                  : "Required to complete onboarding."}
              </p>
            </div>
            {hasGithub ? (
              <span className={styles.connectedBadge}>
                <Check size={12} aria-hidden="true" />
                CONNECTED
              </span>
            ) : (
              <a
                href="/auth/github?redirect=/onboarding&force=1"
                className={styles.connectBtn}
                onClick={onConnectGithub}
                rel="external"
              >
                CONNECT GITHUB
              </a>
            )}
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>LINKEDIN_PROFILE_URL</label>
          <input
            className={styles.input}
            placeholder="https://www.linkedin.com/in/yourname"
            value={data.linkedinHandle}
            onChange={(e) => onChange({ linkedinHandle: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>RESUME_PDF_LINK (optional)</label>
          <input
            className={styles.input}
            placeholder="https://drive.google.com/..."
            value={data.resumeLink}
            onChange={(e) => onChange({ resumeLink: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>PERSONAL_WEBSITE (optional)</label>
          <input
            className={styles.input}
            placeholder="https://yoursite.dev"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
          />
        </div>
      </div>
      <button className={styles.primaryBtn} onClick={onNext} disabled={!hasGithub}>
        NEXT &rarr;
      </button>
    </div>
  );
}

function ExperienceStep({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const YR_OPTIONS = ["0", "<1", "1", "2", "3", "4", "5", "6-8", "9-12", "13+"];
  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; CALIBRATE_XP<Cursor /></div>
      <h2 className={styles.question}>Years of development experience?</h2>
      <div className={styles.chipGrid}>
        {YR_OPTIONS.map((yr) => (
          <button
            key={yr}
            className={`${styles.chip} ${data.yearsOfExperience === yr ? styles.chipActive : ""}`}
            onClick={() => onChange({ yearsOfExperience: yr })}
          >
            {yr === "0" ? "NONE" : `${yr} YR${yr === "1" ? "" : "S"}`}
          </button>
        ))}
      </div>
      <div className={styles.fieldGroup} style={{ marginTop: "32px" }}>
        <div className={styles.field}>
          <label className={styles.label}>AVAILABILITY</label>
          <div className={styles.availRow}>
            <button
              className={`${styles.availBtn} ${data.availability === "open" ? styles.availBtnActive : ""}`}
              onClick={() => onChange({ availability: "open" })}
            >
              OPEN_TO_WORK
            </button>
            <button
              className={`${styles.availBtn} ${data.availability === "not_open" ? styles.availBtnActive : ""}`}
              onClick={() => onChange({ availability: "not_open" })}
            >
              NOT_AVAILABLE
            </button>
          </div>
        </div>
      </div>
      <button
        className={styles.primaryBtn}
        onClick={onNext}
        disabled={!data.yearsOfExperience || !data.availability}
      >
        NEXT &rarr;
      </button>
    </div>
  );
}

function TechStep({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim().length > 0
    ? TECH_OPTIONS.filter(
        (t) =>
          t.toLowerCase().includes(query.toLowerCase()) &&
          !data.techStacks.includes(t)
      ).slice(0, 12)
    : [];

  function add(tech: string) {
    if (!data.techStacks.includes(tech)) {
      onChange({ techStacks: [...data.techStacks, tech] });
    }
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(tech: string) {
    onChange({ techStacks: data.techStacks.filter((t) => t !== tech) });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      add(filtered[0]);
    }
    if (e.key === "Backspace" && query === "" && data.techStacks.length > 0) {
      remove(data.techStacks[data.techStacks.length - 1]);
    }
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; LOAD_STACK<Cursor /></div>
      <h2 className={styles.question}>Build your tech stack.</h2>
      <p className={styles.subtitle}>Search and add technologies — at least 1.</p>

      {/* Search input */}
      <div className={styles.techSearchWrap}>
        <span className={styles.techSearchIcon}>›_</span>
        <input
          ref={inputRef}
          className={styles.techSearchInput}
          placeholder="Search technologies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Dropdown results */}
      {filtered.length > 0 && (
        <div className={styles.techDropdown}>
          {filtered.map((tech) => (
            <button
              key={tech}
              className={styles.techDropdownItem}
              onClick={() => add(tech)}
              type="button"
            >
              <span className={styles.techDropdownPlus}>+</span>
              {tech}
            </button>
          ))}
        </div>
      )}

      {/* Selected tags */}
      {data.techStacks.length > 0 && (
        <div className={styles.techSelected}>
          <div className={styles.techSelectedLabel}>SELECTED_STACK ({data.techStacks.length})</div>
          <div className={styles.techTags}>
            {data.techStacks.map((tech) => (
              <span key={tech} className={styles.techTag}>
                {tech}
                <button
                  className={styles.techTagRemove}
                  onClick={() => remove(tech)}
                  type="button"
                  aria-label={`Remove ${tech}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        className={styles.primaryBtn}
        onClick={onNext}
        disabled={data.techStacks.length === 0}
      >
        CONFIRM_STACK ({data.techStacks.length} selected) &rarr;
      </button>
    </div>
  );
}

function ExtrasStep({
  onNext,
}: {
  onNext: () => void;
}) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; SYSTEM_VERIFY<Cursor /></div>
      <h2 className={styles.question}>Almost done.</h2>
      <p className={styles.subtitle}>
        Your profile is being compiled. Your data is stored locally on your device and never shared without consent.
      </p>
      <div className={styles.verifyList}>
        {[
          "IDENTITY_CONFIRMED",
          "ROLE_ASSIGNED",
          "STACK_LOADED",
          "HANDLES_LINKED",
          "PROFILE_COMPILED",
        ].map((item, i) => (
          <div key={item} className={styles.verifyRow} style={{ animationDelay: `${i * 0.15}s` }}>
            <span className={styles.verifyCheck}>✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className={styles.legalBox}>
        <input 
          type="checkbox" 
          id="terms_agree" 
          checked={agreed} 
          onChange={(e) => setAgreed(e.target.checked)}
          className={styles.legalCheckbox}
        />
        <label htmlFor="terms_agree" className={styles.legalLabel}>
          I confirm that I have read, understood, and unconditionally agree to the <a href="/terms" target="_blank" rel="noreferrer" className={styles.legalLink}>Master Legal Documentation</a>, including the Platform Terms of Service, Governance Charter, and the Intellectual Property Assignment Agreement, which automatically assigns all my project contributions to TDC.
        </label>
      </div>

      <button className={styles.primaryBtn} onClick={onNext} disabled={!agreed}>
        LAUNCH_PROFILE &rarr;
      </button>
    </div>
  );
}

function DoneStep() {
  return (
    <div className={styles.stepContent}>
      <div className={styles.prompt}>&gt; ACCESS_GRANTED<Cursor /></div>
      <h2 className={styles.title}>PROFILE_COMPILED</h2>
      <p className={styles.subtitle}>Redirecting to your terminal...</p>
    </div>
  );
}

// ─── Loader ────────────────────────────────────────────────
export async function loader({ request }: Route.LoaderArgs) {
  const { getSessionUser } = await import("../lib/supabase.server");
  const { getProfileAuthGateStatus } = await import("../services/profile.server");
  const { getPhoneStatus } = await import("../services/phone-verification.server");
  const headers = new Headers();
  const user = await getSessionUser(request, headers);
  
  console.log("[AUTH_DEBUG] Onboarding loader check:", { 
    isLoggedIn: !!user, 
    email: user?.email,
    cookie: request.headers.get("Cookie")?.substring(0, 30) + "..." 
  });

  if (!user) {
    console.warn("[AUTH_DEBUG] No session in onboarding loader, redirecting to login.");
    return redirect("/login", { headers });
  }
  const gate = await getProfileAuthGateStatus(user.id);
  const phoneStatus = await getPhoneStatus(user.id);
  return Response.json({
    userId: user.id,
    userEmail: user.email,
    hasGithub: gate.hasGithub,
    githubHandle: gate.githubHandle,
    phoneVerified: phoneStatus.phone_verified,
    phoneNumber: phoneStatus.phone_number,
  }, { headers });
}

// ─── Action (save profile to Supabase) ────────────────────
export async function action({ request }: Route.ActionArgs) {
  const { getSessionUser } = await import("../lib/supabase.server");
  const { updateProfile, generateUniqueTag, getProfileAuthGateStatus } = await import("../services/profile.server");
  const { ensureLinkedinUrl } = await import("../lib/utils");
  
  const headers = new Headers();
  const user = await getSessionUser(request, headers);
  if (!user) return redirect("/login", { headers });

  const formData = await request.formData();
  const raw = String(formData.get("profileData") ?? "{}");

  let profileData: OnboardingData = { ...EMPTY_ONBOARDING };
  try { profileData = JSON.parse(raw); } catch { /* ignore */ }

  // Generate system tag
  const tag = await generateUniqueTag(request, headers);
  const gate = await getProfileAuthGateStatus(user.id);
  if (!gate.hasGithub) {
    return Response.json({ error: "Connect GitHub before completing onboarding." }, { headers, status: 400 });
  }

  const { error } = await updateProfile(request, headers, user.id, {
    email: user.email, // Required for new profile creation
    username: profileData.username?.toLowerCase().trim() || null,
    tag: tag,
    display_name: profileData.displayName || null,
    role: profileData.role || null,
    college_name: profileData.collegeName || null,
    company_name: profileData.companyName || null,
    startup_name: profileData.startupName || null,
    bio: profileData.bio || null,
    linkedin_handle: ensureLinkedinUrl(profileData.linkedinHandle) || null,
    resume_link: profileData.resumeLink || null,
    years_of_experience: profileData.yearsOfExperience || null,
    tech_stacks: profileData.techStacks.length > 0 ? profileData.techStacks : null,
    location: profileData.location || null,
    availability: profileData.availability || null,
    website: profileData.website || null,
    avatar_url: profileData.avatarUrl || null,
  });

  if (error) {
    // Handle unique constraint error (23505)
    if (error.includes("23505") || error.toLowerCase().includes("unique constraint") || error.toLowerCase().includes("already exists")) {
      return Response.json({ error: "Username already taken. Please go back and choose another." }, { headers, status: 400 });
    }
    return Response.json({ error }, { headers, status: 400 });
  }

  return redirect("/profile", { headers });
}

// ─── Main component ───────────────────────────────────────
export default function OnboardingPage() {
  const { userId, hasGithub, githubHandle, phoneVerified, phoneNumber } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string }>();
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [data, setData] = useState<OnboardingData>({ ...EMPTY_ONBOARDING });
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(Boolean(phoneVerified));
  const formRef = useRef<HTMLFormElement>(null);
  const draftKey = `${ONBOARDING_DRAFT_KEY_PREFIX}${userId}`;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "GITHUB_CONNECTED" && event.data?.success) {
        console.log("[ONBOARDING] GitHub connected successfully, reloading to sync state...");
        window.location.reload();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const currentStep = STEP_ORDER[stepIndex];
  const totalSteps = STEP_ORDER.length - 2;
  const displayStep = Math.max(1, Math.min(stepIndex, totalSteps));
  const pct = Math.round((stepIndex / (STEP_ORDER.length - 1)) * 100);

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(draftKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as { data?: Partial<OnboardingData>; stepIndex?: number };
      if (parsed.data) {
        setData({ ...EMPTY_ONBOARDING, ...parsed.data });
      }
      if (typeof parsed.stepIndex === "number") {
        const safeIndex = Math.max(0, Math.min(parsed.stepIndex, STEP_ORDER.length - 2));
        setStepIndex(safeIndex);
      }
    } catch {
      window.sessionStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  const saveDraftBeforeGithub = useCallback(() => {
    try {
      console.log("[GITHUB AUTH CLICK] Saving onboarding draft:", { draftKey, stepIndex, data });
      window.sessionStorage.setItem(draftKey, JSON.stringify({ data, stepIndex }));
      console.log("[GITHUB AUTH CLICK] Draft saved successfully.");
    } catch (err) {
      console.error("[GITHUB AUTH CLICK] Failed to save draft:", err);
    }
  }, [data, draftKey, stepIndex]);

  const transition = useCallback((cb?: () => void) => {
    setVisible(false);
    setTimeout(() => {
      cb?.();
      setVisible(true);
    }, 350);
  }, []);

  const goNext = useCallback(() => {
    if (stepIndex >= STEP_ORDER.length - 1) return;
    // Block leaving the WhatsApp step until the number is verified.
    if (STEP_ORDER[stepIndex] === "phone" && !isPhoneVerified) return;
    const nextIndex = stepIndex + 1;
    const nextStep = STEP_ORDER[nextIndex];

    transition(() => {
      setStepIndex(nextIndex);
    });

    if (nextStep === "done") {
      // Submit profile to server via hidden form — the action redirects to /profile on success
      if (formRef.current) {
        const profileInput = formRef.current.querySelector<HTMLInputElement>("[name=profileData]");
        if (profileInput) profileInput.value = JSON.stringify(data);
        formRef.current.submit();
      }
    }
  }, [stepIndex, data, transition, isPhoneVerified]);

  // keyboard shortcut
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  // void ref usage to avoid stale closures in event listener
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  if (!userId) return null;

  return (
    <div className={styles.root}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Onboarding — The Developer Community",
            description: "Complete your developer profile and access your terminal on The Developer Community.",
            url: `${SITE_URL}/onboarding`,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
                { "@type": "ListItem", position: 2, name: "Onboarding", item: `${SITE_URL}/onboarding` },
              ],
            },
          }),
        }}
      />
      <div className={styles.scanlineOverlay} aria-hidden />
      <div className={styles.bgGrid} aria-hidden />

      {/* Hidden form to submit profile data server-side */}
      <form ref={formRef} method="post" style={{ display: "none" }}>
        <input type="hidden" name="profileData" defaultValue="{}" />
      </form>

      {/* Top bar */}
      <header className={styles.topBar}>
        <span className={styles.logo}>THE_DEVELOPER_COMMUNITY</span>
        {currentStep !== "welcome" && currentStep !== "done" && (
          <div className={styles.topRight}>
            <StepLabel current={displayStep} total={totalSteps} />
            <ProgressBar pct={pct} />
          </div>
        )}
      </header>

      {/* Step content */}
      <main className={`${styles.main} ${visible ? styles.fadeIn : styles.fadeOut}`}>
        {actionData && "error" in actionData && actionData.error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorPrefix}>[ERROR]:</span> {actionData.error}
          </div>
        )}
        {currentStep === "welcome" && <WelcomeStep onNext={goNext} />}
        {currentStep === "phone" && (
          <PhoneStep
            initialVerified={isPhoneVerified}
            initialPhone={phoneNumber}
            onVerified={setIsPhoneVerified}
            onNext={goNext}
          />
        )}
        {currentStep === "role" && <RoleStep data={data} onChange={update} onNext={goNext} />}
        {currentStep === "identity" && <IdentityStep data={data} onChange={update} onNext={goNext} />}
        {currentStep === "avatar" && <AvatarStep data={data} onChange={update} onNext={goNext} />}
        {currentStep === "org" && <OrgStep data={data} onChange={update} onNext={goNext} />}
        {currentStep === "links" && (
          <LinksStep
            data={data}
            onChange={update}
            onNext={goNext}
            hasGithub={hasGithub}
            githubHandle={githubHandle}
            onConnectGithub={saveDraftBeforeGithub}
          />
        )}
        {currentStep === "experience" && <ExperienceStep data={data} onChange={update} onNext={goNext} />}
        {currentStep === "tech" && <TechStep data={data} onChange={update} onNext={goNext} />}
        {currentStep === "extras" && <ExtrasStep onNext={goNext} />}
        {currentStep === "done" && <DoneStep />}
      </main>

      {/* Bottom status */}
      <footer className={styles.bottomBar}>
        <span>DEVCOM_OS v2.4.1</span>
        <span>ENCRYPTED SESSION</span>
        <span className={styles.pulse} />
        <span>SECURE</span>
      </footer>
    </div>
  );
}
