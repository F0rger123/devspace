// src/lib/mockBlueprints.ts
// Production Blueprint & Template Engine for DevSpace Design Studio

import { 
  FITPULSE_APP_CODE, 
  FITPULSE_PRO_APP_CODE,
  BITEEXPRESS_APP_CODE,
  BITEEXPRESS_PRO_APP_CODE,
  TASKFLOW_APP_CODE,
  TASKFLOW_PRO_APP_CODE,
  CRYPTOPULSE_APP_CODE,
  CRYPTOPULSE_PRO_APP_CODE,
  WHISPER_APP_CODE,
  WHISPER_PRO_APP_CODE,
  AURA_SAAS_APP_CODE,
  AURA_SAAS_PRO_APP_CODE,
  VANGUARD_APP_CODE,
  VANGUARD_PRO_APP_CODE,
  LUXE_APP_CODE,
  LUXE_PRO_APP_CODE,
  PIXELCRAFT_APP_CODE,
  PIXELCRAFT_PRO_APP_CODE,
  K8S_HUB_APP_CODE,
  K8S_HUB_PRO_APP_CODE,
  VELOCITY_CRM_APP_CODE,
  VELOCITY_CRM_PRO_APP_CODE,
  APEX_TELEMETRY_APP_CODE,
  APEX_TELEMETRY_PRO_APP_CODE,
  FINTECH_TERMINAL_APP_CODE,
  FINTECH_TERMINAL_PRO_APP_CODE,
  FOCUS_HUB_APP_CODE,
  FOCUS_HUB_PRO_APP_CODE,
  buildCustomAppCode,
  buildCustomAppVariantCode
} from './mockBlueprintsTemplates';

export function generateMockStitchResponse(prompt: string, personality: string = "scrum", optionsCount: number = 2): any {
  const norm = (prompt || "").toLowerCase();
  
  // TaskFlow Agile Project & Kanban Board
  if (norm.includes("taskflow") || norm.includes("kanban") || norm.includes("backlog") || (norm.includes("sprint") && norm.includes("task")) || (norm.includes("project") && norm.includes("task"))) {
    return {
      options: [
        {
          id: "taskflow-opt-1",
          name: "TaskFlow Agile Project & Kanban Suite",
          title: "TaskFlow Project Engine",
          category: "PRODUCTIVITY",
          badge: "Agile Kanban",
          prompt: prompt,
          description: "Full-featured agile management suite with multi-stage Kanban board (Backlog, In Progress, Code Review, Done), subtask checklists, issue details drawer, team discussion threads, and velocity burndown metrics.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Kanban Engine"],
          dbSchema: "### Firestore Collections\n- `tasks/{taskId}`: title, description, column, priority, story_points, subtasks\n- `sprints/{sprintId}`: sprint name, burndown_points, start_end_dates\n- `comments/{commentId}`: author, message, timestamp",
          endpoints: [
            { path: "/api/tasks/move", method: "POST", description: "Transitions task across workflow stages" },
            { path: "/api/tasks/create", method: "POST", description: "Creates a new sprint backlog issue" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": TASKFLOW_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Scrum Master", role: "Sprint Velocity Coordinator", officeZone: "scrum", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Track burndown velocity", "Balance engineer story points"] }
          ]
        },
        {
          id: "taskflow-opt-2",
          name: "TaskFlow AI Resource Balancing & Capacity",
          title: "TaskFlow Capacity Engine",
          category: "PRODUCTIVITY",
          badge: "Resource AI",
          prompt: prompt,
          description: "AI-assisted sprint planning with automated workload distribution, sprint risk forecasting, and cross-team dependency mapping.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Capacity Planner"],
          dbSchema: "### Firestore Collections\n- `team_capacity/{uid}`: hours allocated, story points velocity, holidays",
          endpoints: [
            { path: "/api/sprint/capacity", method: "GET", description: "Calculates team available workload" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": TASKFLOW_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Capacity Sentinel", role: "Workload Balancer", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Prevent developer burnout", "Forecast sprint risk"] }
          ]
        }
      ]
    };
  }

  // CryptoPulse / Algo-Trading Terminal
  if (norm.includes("cryptopulse") || norm.includes("algo-trading") || (norm.includes("crypto") && norm.includes("trading")) || (norm.includes("trading") && norm.includes("terminal")) || norm.includes("perpetual futures")) {
    return {
      options: [
        {
          id: "cryptopulse-opt-1",
          name: "CryptoPulse DeFi & Algo-Trading Terminal",
          title: "CryptoPulse Trading Terminal",
          category: "ANALYTICS",
          badge: "Trading Pro",
          prompt: prompt,
          description: "High-density trading terminal with interactive SVG charts, timeframe selectors (1H, 24H, 1W, 1M), live watchlist tickers, leverage order panel (1x-20x), and positions manager with real-time P&L calculations.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Algo Trading"],
          dbSchema: "### Firestore Collections\n- `positions/{posId}`: symbol, leverage, side, entry_price, size\n- `orders/{orderId}`: order_type, price, status, timestamps\n- `wallets/{uid}`: total_margin, free_balance, 24h_pnl",
          endpoints: [
            { path: "/api/orders/place", method: "POST", description: "Executes market or limit leverage order" },
            { path: "/api/positions/close", method: "POST", description: "Closes open margin position" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": CRYPTOPULSE_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Risk Manager", role: "Liquidation Guardian", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Monitor collateral margins", "Calculate liquidation barriers"] }
          ]
        },
        {
          id: "cryptopulse-opt-2",
          name: "CryptoPulse Quant Orderbook Depth & Liquidity Engine",
          title: "CryptoPulse Quant Engine",
          category: "ANALYTICS",
          badge: "Quant Edition",
          prompt: prompt,
          description: "Microstructure liquidity analyzer with Level 2 orderbook depth heatmaps, funding rate arbitrage scanner, and automated market making (AMM) telemetry.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Orderbook DOM"],
          dbSchema: "### Firestore Collections\n- `orderbook_l2/{symbol}`: bids, asks, aggregated depth levels",
          endpoints: [
            { path: "/api/quant/depth", method: "GET", description: "Retrieves Level 2 DOM depth map" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": CRYPTOPULSE_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Quant Trader", role: "Arbitrage Scanner", officeZone: "dev_bay", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Scan funding rates", "Optimize limit execution queue"] }
          ]
        }
      ]
    };
  }

  // 1. FitPulse Mobile Workout Tracker
  if (norm.includes("fitpulse") || (norm.includes("workout") && norm.includes("ring")) || norm.includes("fitness") || norm.includes("health & workout") || norm.includes("workout tracker")) {
    return {
      options: [
        {
          id: "fitpulse-opt-1",
          name: "FitPulse Mobile Workout Tracker (Glassmorphism)",
          title: "FitPulse Mobile Workout Tracker",
          category: "MOBILE",
          badge: "Mobile App",
          prompt: prompt,
          description: "Mobile-first health tracker with circular goal rings (Calories, Steps, Active Time), live interactive workout logger with timer, streak tracking, and community feed.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Mobile Glassmorphism"],
          dbSchema: "### Firestore Collections\n- `users/{uid}`: daily goals, step counts, streaks\n- `workouts/{workoutId}`: exercise logs, sets, reps, duration\n- `activity_feed/{feedId}`: friends activity, kudos, comments",
          endpoints: [
            { path: "/api/workouts/log", method: "POST", description: "Logs a completed exercise session" },
            { path: "/api/goals/rings", method: "GET", description: "Fetches active ring progress values" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": FITPULSE_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Atlas Fitness", role: "Biomechanics Coach", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Validate workout logs", "Calculate calorie burn curves"] },
            { name: "Pulse QA", role: "Mobile Viewport Tester", officeZone: "dev_bay", projectTaskSector: "qa", modelEngine: "gemini-2.5-flash", goals: ["Test touch targets", "Verify SVG ring stroke calculations"] }
          ]
        },
        {
          id: "fitpulse-opt-2",
          name: "FitPulse Pro Performance & Heart Rate Analytics",
          title: "FitPulse Pro Performance & Heart Rate Analytics",
          category: "MOBILE",
          badge: "Pro Edition",
          prompt: prompt,
          description: "Advanced performance edition featuring real-time heart rate zone telemetry, interval HIIT timers, macronutrient breakdown, and training recovery index.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Heart Rate Telemetry"],
          dbSchema: "### Firestore Collections\n- `users/{uid}/hr_zones`: aerobic, anaerobic, VO2 max metrics\n- `training_plans/{planId}`: scheduled intervals and rest blocks\n- `nutrition_logs/{logId}`: proteins, carbs, fats, water intake",
          endpoints: [
            { path: "/api/hr/zones", method: "GET", description: "Retrieves biometric heart rate distribution" },
            { path: "/api/nutrition/macro-summary", method: "GET", description: "Calculates daily macro balance" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": FITPULSE_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Cardio Sentinel", role: "Biometric Analyst", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Monitor heart rate zones", "Alert on recovery deficit"] }
          ]
        }
      ]
    };
  }

  // 2. BiteExpress Food Delivery
  if (norm.includes("biteexpress") || norm.includes("food delivery") || norm.includes("restaurant") || norm.includes("pizza") || norm.includes("sushi") || norm.includes("dining")) {
    return {
      options: [
        {
          id: "biteexpress-opt-1",
          name: "BiteExpress Food & Dining Delivery",
          title: "BiteExpress Food Delivery",
          category: "MOBILE",
          badge: "Mobile App",
          prompt: prompt,
          description: "On-demand food delivery app with category filter pills, restaurant cards, item customization modal, sliding cart with discount calculator, and live order tracking.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Interactive Cart"],
          dbSchema: "### Firestore Collections\n- `restaurants/{restaurantId}`: menu items, delivery ETA, ratings\n- `orders/{orderId}`: cart items, delivery coordinates, courier status\n- `coupons/{code}`: discount percentage, expiration dates",
          endpoints: [
            { path: "/api/cart/checkout", method: "POST", description: "Places order and starts live courier tracking" },
            { path: "/api/restaurants/filter", method: "GET", description: "Queries restaurants by food category" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": BITEEXPRESS_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Chef Bot", role: "Menu Optimizer", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Manage modifier variations", "Calculate kitchen preparation time"] }
          ]
        },
        {
          id: "biteexpress-opt-2",
          name: "BiteExpress Gourmet & Curated Feast Edition",
          title: "BiteExpress Gourmet Edition",
          category: "MOBILE",
          badge: "Gourmet Edition",
          prompt: prompt,
          description: "Curated artisan dining experience with wine pairing suggestions, chef tasting menus, VIP table reservations, and live courier GPS route simulation.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "VIP Dining"],
          dbSchema: "### Firestore Collections\n- `tasting_menus/{id}`: multi-course sets, dietary tags\n- `sommelier_pairings/{wineId}`: vintage recommendations\n- `reservations/{resId}`: table bookings, deposit status",
          endpoints: [
            { path: "/api/reservations/book", method: "POST", description: "Reserves VIP dining slots" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": BITEEXPRESS_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Sommelier AI", role: "Wine Pairing Expert", officeZone: "docs_lab", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Suggest pairings", "Manage wine cellar inventory"] }
          ]
        }
      ]
    };
  }

  // 3. Whisper Social & Chat
  if (norm.includes("whisper") || norm.includes("social & chat") || norm.includes("story avatar") || (norm.includes("chat") && norm.includes("feed")) || norm.includes("direct messaging")) {
    return {
      options: [
        {
          id: "whisper-opt-1",
          name: "Whisper Social & Live Chat Network",
          title: "Whisper Social & Chat",
          category: "MOBILE",
          badge: "Mobile App",
          prompt: prompt,
          description: "Mobile-first social platform with interactive story avatars, post feed with reactions, direct messaging with voice note waveforms, and user profile showcase.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Real-Time Chat"],
          dbSchema: "### Firestore Collections\n- `posts/{postId}`: text, media, heart reaction counters, comment subcollection\n- `threads/{threadId}`: direct messages, typing states, audio voice notes\n- `stories/{storyId}`: 24h expiring story reels, viewer lists",
          endpoints: [
            { path: "/api/chat/send", method: "POST", description: "Dispatches direct message" },
            { path: "/api/posts/like", method: "POST", description: "Toggles heart reaction on feed post" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": WHISPER_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Whisper AI", role: "Feed Curator", officeZone: "dev_bay", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Filter spam", "Rank trending stories"] }
          ]
        },
        {
          id: "whisper-opt-2",
          name: "Whisper Community & Audio Spaces",
          title: "Whisper Community Spaces",
          category: "MOBILE",
          badge: "Audio Spaces",
          prompt: prompt,
          description: "Audio-first creator network with live community voice stages, screen-sharing rooms, tip jar tokens, and encrypted private channels.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "WebRTC Audio"],
          dbSchema: "### Firestore Collections\n- `audio_rooms/{roomId}`: active speakers, listeners, hand raises\n- `creator_tips/{tipId}`: token tips, transaction receipts",
          endpoints: [
            { path: "/api/rooms/join-stage", method: "POST", description: "Promotes user to active audio speaker" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": WHISPER_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Stage Manager", role: "Voice Moderation", officeZone: "sentinel", projectTaskSector: "qa", modelEngine: "gemini-2.5-flash", goals: ["Manage mic queues", "Suppress background noise"] }
          ]
        }
      ]
    };
  }

  // 4. Aura SaaS Product Landing
  if (norm.includes("aura") || norm.includes("saas landing") || norm.includes("marketing homepage") || norm.includes("pricing toggle") || norm.includes("product landing")) {
    return {
      options: [
        {
          id: "aura-opt-1",
          name: "Aura SaaS Marketing & Conversion Portal",
          title: "Aura SaaS Product Landing",
          category: "WEBSITE",
          badge: "Marketing",
          prompt: prompt,
          description: "High-conversion SaaS homepage with gradient hero showcase, annual vs monthly pricing calculator, feature cards with hover animations, customer testimonials, and reactive FAQ.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "SaaS Conversion"],
          dbSchema: "### Firestore Collections\n- `leads/{leadId}`: email subscribers, enterprise demo requests\n- `pricing_tiers/{tierId}`: plan features, Stripe price IDs\n- `testimonials/{id}`: client quotes, company logos",
          endpoints: [
            { path: "/api/leads/subscribe", method: "POST", description: "Stores newsletter subscriber" },
            { path: "/api/demo/schedule", method: "POST", description: "Books enterprise product walkthrough" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": AURA_SAAS_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Conversion AI", role: "CRO Specialist", officeZone: "docs_lab", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["A/B test CTA placements", "Optimize page load speed"] }
          ]
        },
        {
          id: "aura-opt-2",
          name: "Aura Enterprise Cloud Solutions & ROI Hub",
          title: "Aura Enterprise Cloud Hub",
          category: "WEBSITE",
          badge: "Enterprise",
          prompt: prompt,
          description: "Enterprise edition featuring an interactive cloud cost ROI calculator, SOC2 & HIPAA compliance certifications, and customer case study breakdowns.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "ROI Calculator"],
          dbSchema: "### Firestore Collections\n- `enterprise_quotes/{quoteId}`: calculated cost estimates, server requirements",
          endpoints: [
            { path: "/api/roi/calculate", method: "POST", description: "Computes infrastructure savings" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": AURA_SAAS_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Enterprise Architect", role: "SLA Specialist", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Verify enterprise compliance", "Model server scale curves"] }
          ]
        }
      ]
    };
  }

  // 5. Vanguard Agency Portfolio
  if (norm.includes("vanguard") || norm.includes("agency portfolio") || norm.includes("creative portfolio") || norm.includes("case study") || norm.includes("creative agency")) {
    return {
      options: [
        {
          id: "vanguard-opt-1",
          name: "Vanguard Creative Agency & Editorial Portfolio",
          title: "Vanguard Agency Portfolio",
          category: "WEBSITE",
          badge: "Portfolio",
          prompt: prompt,
          description: "Dark luxury agency showcase with high-contrast typography, filterable project grid (Web, Branding, Motion, AI), interactive case study modal, and project inquiry form.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Editorial Design"],
          dbSchema: "### Firestore Collections\n- `projects/{projectId}`: client name, deliverables, award badges, media gallery\n- `inquiries/{inquiryId}`: client brief, budget tier, timeline",
          endpoints: [
            { path: "/api/inquiries/submit", method: "POST", description: "Receives project brief submission" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": VANGUARD_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Art Director", role: "Visual Polisher", officeZone: "scrum", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Audit typographic balance", "Curate gallery layout"] }
          ]
        },
        {
          id: "vanguard-opt-2",
          name: "Vanguard Interactive Studio & Motion Lab",
          title: "Vanguard Motion Lab",
          category: "WEBSITE",
          badge: "Motion Lab",
          prompt: prompt,
          description: "Experimental design lab showcasing 3D WebGL experiments, interactive generative art, and client branding design systems.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Interactive Lab"],
          dbSchema: "### Firestore Collections\n- `lab_experiments/{expId}`: shader parameters, live demo links",
          endpoints: [
            { path: "/api/lab/experiments", method: "GET", description: "Fetches generative shader prototypes" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": VANGUARD_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Creative Technologist", role: "Motion Engineer", officeZone: "dev_bay", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Optimize canvas render loops", "Ensure smooth 60fps transitions"] }
          ]
        }
      ]
    };
  }

  // 6. Luxe Apparel Storefront
  if (norm.includes("luxe") || norm.includes("apparel") || norm.includes("fashion") || norm.includes("clothing") || norm.includes("storefront") || (norm.includes("e-commerce") && norm.includes("cart"))) {
    return {
      options: [
        {
          id: "luxe-opt-1",
          name: "Luxe Minimalist Apparel Storefront",
          title: "Luxe Apparel Storefront",
          category: "ECOMMERCE",
          badge: "E-Commerce",
          prompt: prompt,
          description: "Luxury fashion storefront with hover product zooms, size/color selectors, sliding shopping bag with free shipping progress bar, promo discounts, and instant checkout modal.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Sliding Cart Drawer"],
          dbSchema: "### Firestore Collections\n- `products/{productId}`: sizes, color swatches, inventory counts, price\n- `carts/{cartId}`: item quantities, applied promo codes\n- `orders/{orderId}`: shipping addresses, Stripe payment status",
          endpoints: [
            { path: "/api/checkout/create-session", method: "POST", description: "Creates Stripe Checkout payment session" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": LUXE_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Merchandiser", role: "Catalog Specialist", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Track inventory levels", "Calculate dynamic shipping tiers"] }
          ]
        },
        {
          id: "luxe-opt-2",
          name: "Luxe Haute Couture & Virtual Fitting Room",
          title: "Luxe Haute Couture",
          category: "ECOMMERCE",
          badge: "Couture Edition",
          prompt: prompt,
          description: "Bespoke luxury boutique with custom garment tailoring measurements, VIP private styling appointments, and fabric swatch inspector.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Custom Tailoring"],
          dbSchema: "### Firestore Collections\n- `tailoring_profiles/{uid}`: chest, waist, inseam measurements\n- `styling_sessions/{id}`: private video consultation bookings",
          endpoints: [
            { path: "/api/tailoring/save-measurements", method: "POST", description: "Stores custom fit profile" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": LUXE_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Couturier AI", role: "Style Advisor", officeZone: "docs_lab", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Recommend sizing based on measurements", "Manage appointments"] }
          ]
        }
      ]
    };
  }

  // 7. PixelCraft Digital Asset Store
  if (norm.includes("pixelcraft") || norm.includes("asset store") || norm.includes("digital asset") || norm.includes("3d models") || norm.includes("marketplace")) {
    return {
      options: [
        {
          id: "pixelcraft-opt-1",
          name: "PixelCraft Digital Asset Marketplace",
          title: "PixelCraft Asset Store",
          category: "ECOMMERCE",
          badge: "Marketplace",
          prompt: prompt,
          description: "Digital creator marketplace with live search filtering, asset preview tags, multi-tier licensing selector (Personal, Commercial, Enterprise), and downloadable library inventory.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Asset Licensing"],
          dbSchema: "### Firestore Collections\n- `assets/{assetId}`: file types, poly count, preview renders, licensing tiers\n- `user_licenses/{uid}`: purchased asset keys, download links",
          endpoints: [
            { path: "/api/assets/purchase", method: "POST", description: "Generates digital license key and download token" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": PIXELCRAFT_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Asset Validator", role: "File Format Inspector", officeZone: "dev_bay", projectTaskSector: "qa", modelEngine: "gemini-2.5-flash", goals: ["Validate polygon counts", "Generate license certificates"] }
          ]
        },
        {
          id: "pixelcraft-opt-2",
          name: "PixelCraft Studio Cloud Sync & Subscription",
          title: "PixelCraft Studio Pro",
          category: "ECOMMERCE",
          badge: "Subscription",
          prompt: prompt,
          description: "Unlimited asset subscription hub with direct Blender/Figma plugin integration, automated texture maps, and team seat management.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Cloud Sync"],
          dbSchema: "### Firestore Collections\n- `subscriptions/{uid}`: team seats, monthly download credits",
          endpoints: [
            { path: "/api/plugins/sync", method: "POST", description: "Syncs asset directly to 3D software workspace" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": PIXELCRAFT_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Plugin Bridge", role: "Integration Handler", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Manage WebSocket sync to local editors"] }
          ]
        }
      ]
    };
  }

  // 8. Kubernetes Command Hub
  if (norm.includes("k8s") || norm.includes("kubernetes") || norm.includes("command hub") || norm.includes("cluster") || norm.includes("container") || norm.includes("pod")) {
    return {
      options: [
        {
          id: "k8s-opt-1",
          name: "Kubernetes Operations Command Hub",
          title: "Kubernetes Command Hub",
          category: "SOFTWARE",
          badge: "DevOps",
          prompt: prompt,
          description: "Cloud Kubernetes command center with node cluster health matrix, interactive pod auto-scaling sliders, live streaming container log terminal, and incident alert drawer.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Live Log Stream"],
          dbSchema: "### Firestore Collections\n- `clusters/{clusterId}`: node health, CPU/Memory telemetry\n- `deployments/{depId}`: desired replicas, container image tags\n- `incidents/{id}`: severity levels, remediation notes",
          endpoints: [
            { path: "/api/k8s/scale", method: "POST", description: "Updates deployment replica count" },
            { path: "/api/k8s/logs", method: "GET", description: "Streams container stdout/stderr events" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": K8S_HUB_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Kube Sentinel", role: "Cluster Health Guard", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Monitor OOMKilled pods", "Enforce auto-scaler limits"] }
          ]
        },
        {
          id: "k8s-opt-2",
          name: "Kubernetes Multi-Cloud Mesh & Cost Optimizer",
          title: "Kubernetes Mesh & Cost Optimizer",
          category: "SOFTWARE",
          badge: "Multi-Cloud",
          prompt: prompt,
          description: "Multi-cloud Kubernetes manager across AWS EKS, GCP GKE, and Azure AKS with spot-instance cost optimization and zero-trust service mesh routing.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Multi-Cloud Ops"],
          dbSchema: "### Firestore Collections\n- `cloud_providers/{providerId}`: spot instance rates, billing quotas",
          endpoints: [
            { path: "/api/k8s/optimize-spot", method: "POST", description: "Migrates workloads to low-cost spot nodes" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": K8S_HUB_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "FinOps Bot", role: "Cloud Cost Optimizer", officeZone: "scrum", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Reduce idle cloud expenditure", "Recommend right-sizing"] }
          ]
        }
      ]
    };
  }

  // 9. Velocity Sales CRM
  if (norm.includes("velocity") || norm.includes("crm") || norm.includes("sales") || (norm.includes("deal") && norm.includes("pipeline")) || norm.includes("sales pipeline")) {
    return {
      options: [
        {
          id: "velocity-opt-1",
          name: "Velocity Sales Pipeline & Deal Stage CRM",
          title: "Velocity Sales CRM",
          category: "SOFTWARE",
          badge: "SaaS CRM",
          prompt: prompt,
          description: "Interactive sales CRM featuring a deal stage Kanban board (Lead, Contacted, Proposal, Negotiation, Closed Won), revenue forecast charts, quick deal creator modal, and client directory.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Kanban Pipeline"],
          dbSchema: "### Firestore Collections\n- `deals/{dealId}`: company name, deal value, stage, probability %, owner\n- `contacts/{contactId}`: email, phone, activity history\n- `pipeline_goals/{month}`: target quota, current revenue",
          endpoints: [
            { path: "/api/deals/move-stage", method: "POST", description: "Transitions deal to next Kanban column" },
            { path: "/api/deals/create", method: "POST", description: "Creates new sales deal" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": VELOCITY_CRM_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Pipeline Copilot", role: "Deal Probability Estimator", officeZone: "docs_lab", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Score lead close probability", "Auto-generate follow-up tasks"] }
          ]
        },
        {
          id: "velocity-opt-2",
          name: "Velocity Enterprise Account Intelligence & Sequences",
          title: "Velocity Account Intelligence",
          category: "SOFTWARE",
          badge: "Account-Based",
          prompt: prompt,
          description: "Account-based sales automation system with email sequence cadence builder, stakeholder org chart mapping, and contract signature tracking.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Sales Sequences"],
          dbSchema: "### Firestore Collections\n- `sequences/{seqId}`: automated email steps, open rates",
          endpoints: [
            { path: "/api/sequences/enroll", method: "POST", description: "Enrolls contact in outreach campaign" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": VELOCITY_CRM_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Outreach Bot", role: "Sequence Orchestrator", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Track email open rates", "Schedule follow-up meetings"] }
          ]
        }
      ]
    };
  }

  // 10. Apex Telemetry Dashboard
  if (norm.includes("apex") || norm.includes("telemetry") || norm.includes("latency") || (norm.includes("cpu") && norm.includes("sparkline")) || norm.includes("performance dashboard")) {
    return {
      options: [
        {
          id: "apex-opt-1",
          name: "Apex High-Frequency Telemetry Dashboard",
          title: "Apex Telemetry Dashboard",
          category: "ANALYTICS",
          badge: "Dashboard",
          prompt: prompt,
          description: "Real-time developer telemetry dashboard with pulsing latency gauges, CPU/Memory sparkline charts, worker node topology controls, and streaming event console.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Real-Time Telemetry"],
          dbSchema: "### Firestore Collections\n- `metrics/{timestamp}`: latency_ms, rps, error_rate, cpu_pct\n- `nodes/{nodeId}`: status, region, allocated_memory\n- `events/{eventId}`: severity, source_service, payload",
          endpoints: [
            { path: "/api/telemetry/metrics", method: "GET", description: "Fetches 60-second rolling metric buffer" },
            { path: "/api/nodes/restart", method: "POST", description: "Triggers rolling worker node restart" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": APEX_TELEMETRY_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Telemetry Watcher", role: "Anomaly Detector", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Alert on p99 latency spikes", "Aggregate metric streams"] }
          ]
        },
        {
          id: "apex-opt-2",
          name: "Apex Distributed Tracing & Flamegraph Studio",
          title: "Apex Distributed Tracing",
          category: "ANALYTICS",
          badge: "Tracing Pro",
          prompt: prompt,
          description: "Distributed trace visualizer with waterfall span timing, OpenTelemetry span explorer, and database query bottleneck profiler.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Flamegraphs"],
          dbSchema: "### Firestore Collections\n- `traces/{traceId}`: span breakdown, parent_span_ids, durations",
          endpoints: [
            { path: "/api/traces/query", method: "GET", description: "Retrieves waterfall span tree" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": APEX_TELEMETRY_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Trace Profiler", role: "Bottleneck Diagnostician", officeZone: "dev_bay", projectTaskSector: "qa", modelEngine: "gemini-2.5-flash", goals: ["Pinpoint slow database queries", "Map microservice dependencies"] }
          ]
        }
      ]
    };
  }

  // 11. Fintech Wealth Terminal
  if (norm.includes("fintech") || norm.includes("trading") || norm.includes("wealth") || norm.includes("order book") || norm.includes("algo-trading") || norm.includes("crypto")) {
    return {
      options: [
        {
          id: "fintech-opt-1",
          name: "Fintech Wealth & Algo-Trading Terminal",
          title: "Fintech Wealth Terminal",
          category: "ANALYTICS",
          badge: "Fintech",
          prompt: prompt,
          description: "High-density wealth terminal with live interactive price charts, timeframe selectors (1D, 1W, 1M, 1Y), real-time order book DOM (bids/asks), buy/sell order modal, and portfolio breakdown.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Financial Charts"],
          dbSchema: "### Firestore Collections\n- `market_prices/{ticker}`: OHLC candlesticks, 24h volume\n- `order_book/{ticker}`: bid/ask depth ladder\n- `portfolios/{uid}`: cash balance, active holdings, executed trade history",
          endpoints: [
            { path: "/api/trade/place-order", method: "POST", description: "Executes market or limit trade order" },
            { path: "/api/portfolio/holdings", method: "GET", description: "Fetches user asset allocations" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": FINTECH_TERMINAL_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Quantitative Algo", role: "Order Execution Engine", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Calculate VWAP executions", "Enforce risk margin limits"] }
          ]
        },
        {
          id: "fintech-opt-2",
          name: "Fintech Autonomous AI Yield & Portfolio Rebalancer",
          title: "Fintech AI Yield Rebalancer",
          category: "ANALYTICS",
          badge: "AI Wealth",
          prompt: prompt,
          description: "Autonomous wealth manager with automated index rebalancing, tax-loss harvesting simulator, and multi-asset dividend forecast calendar.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Yield Rebalancing"],
          dbSchema: "### Firestore Collections\n- `rebalance_rules/{uid}`: target allocations, risk tolerance index",
          endpoints: [
            { path: "/api/wealth/rebalance", method: "POST", description: "Triggers automated portfolio rebalance" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": FINTECH_TERMINAL_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Wealth Advisor", role: "Tax Optimization Strategist", officeZone: "docs_lab", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Model retirement forecasts", "Optimize dividend tax drag"] }
          ]
        }
      ]
    };
  }

  // 12. Focus Flow Pomodoro Suite
  if (norm.includes("focus") || norm.includes("pomodoro") || norm.includes("timer") || norm.includes("soundscape") || norm.includes("productivity suite")) {
    return {
      options: [
        {
          id: "focus-opt-1",
          name: "Focus Flow Pomodoro & Ambient Soundscape Hub",
          title: "Focus Flow Pomodoro Suite",
          category: "PRODUCTIVITY",
          badge: "Productivity",
          prompt: prompt,
          description: "Zen focus productivity suite with interactive circular timer (Pomodoro 25m, Short Break 5m, Long Break 15m), ambient soundscapes (Rain, Waves, Campfire, Cafe), task checklist, and streak stats.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Pomodoro Engine"],
          dbSchema: "### Firestore Collections\n- `focus_sessions/{sessionId}`: start_time, duration_minutes, mode, completed\n- `tasks/{taskId}`: title, priority, is_done, estimated_pomodoros\n- `user_streaks/{uid}`: daily_streak_count, total_focus_hours",
          endpoints: [
            { path: "/api/focus/log-session", method: "POST", description: "Records finished focus session and increments streak" },
            { path: "/api/tasks/toggle", method: "POST", description: "Toggles task completion status" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": FOCUS_HUB_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Zen Master", role: "Focus Rhythm Coach", officeZone: "scrum", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Suggest break intervals", "Track daily deep work quotas"] }
          ]
        },
        {
          id: "focus-opt-2",
          name: "Focus Flow Deep Work Team Sync & Flow States",
          title: "Focus Flow Team Sync",
          category: "PRODUCTIVITY",
          badge: "Team Flow",
          prompt: prompt,
          description: "Collaborative focus rooms where remote teams run synchronized Pomodoro sprints with silent focus badges and shared goal checklists.",
          techStack: ["React 18", "Tailwind CSS", "Lucide React", "Team Synchronization"],
          dbSchema: "### Firestore Collections\n- `sprint_rooms/{roomId}`: active members, shared timer state, team goals",
          endpoints: [
            { path: "/api/rooms/sync-timer", method: "POST", description: "Synchronizes group Pomodoro timer" }
          ],
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": FOCUS_HUB_PRO_APP_CODE,
            "src/index.css": "@import 'tailwindcss';"
          },
          subAgents: [
            { name: "Flow Orchestrator", role: "Sprint Coordinator", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Synchronize group breaks", "Calculate team velocity"] }
          ]
        }
      ]
    };
  }

  // 13. Dynamic Custom Prompt (For any custom idea typed by user)
  let cleanTitle = prompt.trim();
  if (cleanTitle.length > 35) cleanTitle = cleanTitle.substring(0, 32) + "...";
  cleanTitle = cleanTitle ? (cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)) : "Interactive Application Blueprint";

  return {
    options: [
      {
        id: "custom-opt-1",
        name: `Option 1: Modern Interactive ${cleanTitle}`,
        title: `Modern Interactive ${cleanTitle}`,
        category: "SOFTWARE",
        badge: "Interactive UI",
        prompt: prompt,
        description: `Full-featured modern application layout for "${prompt}". Features responsive views, live metric counters, interactive search and forms, data cards, and tab navigation.`,
        techStack: ["React 18", "Tailwind CSS", "Lucide React", "Interactive State"],
        dbSchema: `### Firestore Collections\n- \`records/{id}\`: core data attributes, timestamps, status tags\n- \`categories/{id}\`: taxonomy groupings\n- \`activity_log/{id}\`: user action audit history`,
        endpoints: [
          { path: "/api/records/list", method: "GET", description: "Queries paginated records with search filter" },
          { path: "/api/records/create", method: "POST", description: "Adds a new record to the collection" }
        ],
        files: {
          "index.html": "<div id='root'></div>",
          "src/App.tsx": buildCustomAppCode(prompt, cleanTitle),
          "src/index.css": "@import 'tailwindcss';"
        },
        subAgents: [
          { name: "Frontend Architect", role: "UI/UX Specialist", officeZone: "scrum", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Optimize component reactivity", "Maintain clean typography hierarchy"] }
        ]
      },
      {
        id: "custom-opt-2",
        name: `Option 2: High-Density Analytics & Management ${cleanTitle}`,
        title: `High-Density Analytics & Management ${cleanTitle}`,
        category: "ANALYTICS",
        badge: "Analytics Pro",
        prompt: prompt,
        description: `Advanced data-dense dashboard architecture for "${prompt}" with telemetry sparklines, metric summaries, batch operations, and system health status.`,
        techStack: ["React 18", "Tailwind CSS", "Lucide React", "Dense Data Grid"],
        dbSchema: `### Firestore Collections\n- \`metrics/{id}\`: time-series performance data\n- \`audit_events/{id}\`: system security log entries`,
        endpoints: [
          { path: "/api/analytics/summary", method: "GET", description: "Fetches aggregated KPIs and trend curves" }
        ],
        files: {
          "index.html": "<div id='root'></div>",
          "src/App.tsx": buildCustomAppVariantCode(prompt, cleanTitle),
          "src/index.css": "@import 'tailwindcss';"
        },
        subAgents: [
          { name: "Data Engineer", role: "Telemetry Architect", officeZone: "sentinel", projectTaskSector: "feature", modelEngine: "gemini-2.5-flash", goals: ["Aggregate real-time metrics", "Optimize table indexing"] }
        ]
      }
    ]
  };
}
