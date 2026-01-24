# Landing Page & Dashboard Separation Plan

## 📊 Current State Audit

### Existing Structure
- **`/` (app/page.tsx)**: Hybrid page showing both public and authenticated content
  - Shows login/signup buttons when not authenticated
  - Shows project list and create form when authenticated
  - Mixes landing page and dashboard concerns

- **Issues**:
  - No compelling landing page for new users
  - No clear value proposition or features showcase
  - Authenticated users see unnecessary marketing content
  - Poor first impression for visitors
  - No onboarding flow

### Existing Pages
```
/                           → Hybrid landing/dashboard
/auth/login                → Login page
/auth/signup               → Signup page
/projects/[slug]           → Project detail
/projects/[slug]/docs/[...path] → Document editor
```

---

## 🎯 Proposed Structure

### New Architecture
```
/                           → Public landing page (NEW)
/dashboard                  → Authenticated dashboard (NEW - moved from /)
/auth/login                → Login page (keep)
/auth/signup               → Signup page (keep)
/projects/[slug]           → Project detail (keep)
/projects/[slug]/docs/[...path] → Document editor (keep)
```

### Routing Logic
1. **Unauthenticated users**:
   - `/` → Landing page with hero, features, pricing, CTA
   - Can click "Get Started" → `/auth/signup`
   - Can click "Login" → `/auth/login`

2. **Authenticated users**:
   - `/` → Landing page (still accessible, but with "Go to Dashboard" in header)
   - `/dashboard` → Projects dashboard (main workspace)
   - Middleware does NOT redirect `/` to `/dashboard` (user choice)
   - After login → redirect to `/dashboard` instead of `/`

---

## 🎨 Design System - Unique & Polished

### Design Inspiration (NOT copying, just inspired by):
- **Linear**: Clean, fast, monochrome with purple accent
- **Notion**: Calm, warm grays, excellent spacing
- **Vercel**: Dark mode first, sharp edges, gradients
- **Raycast**: Playful gradients, glassmorphism

### Our Unique Identity: "Docjays" 🐦

**Theme**: Documentation as flight - smooth, elevated, effortless

**Color Palette** (Light & Dark Mode):
```css
/* Primary - Sky Blue (Unique, not Atlassian blue) */
--brand-sky: #0EA5E9;        /* Lighter, more vibrant */
--brand-sky-dark: #0284C7;
--brand-sky-light: #38BDF8;

/* Secondary - Sunset Orange */
--brand-sunset: #F97316;
--brand-sunset-dark: #EA580C;
--brand-sunset-light: #FB923C;

/* Accent - Jade Green */
--brand-jade: #10B981;
--brand-jade-dark: #059669;

/* Neutrals - Light Mode */
--neutral-50: #FAFAF9;
--neutral-100: #F5F5F4;
--neutral-200: #E7E5E4;
--neutral-300: #D6D3D1;
--neutral-400: #A8A29E;
--neutral-500: #78716C;
--neutral-600: #57534E;
--neutral-700: #44403C;
--neutral-800: #292524;
--neutral-900: #1C1917;

/* Dark Mode Specific */
--dark-bg-primary: #0A0A0A;
--dark-bg-secondary: #141414;
--dark-bg-elevated: #1A1A1A;
--dark-border: #2A2A2A;

/* Gradients */
--gradient-hero: linear-gradient(135deg, #0EA5E9 0%, #8B5CF6 100%);
--gradient-card: linear-gradient(135deg, #F97316 0%, #F59E0B 100%);
--gradient-dark-hero: linear-gradient(135deg, #0284C7 0%, #7C3AED 100%);
```

**Typography**:
- **Headings**: Inter (bold, tight spacing)
- **Body**: Inter (regular, comfortable line height 1.6)
- **Code**: JetBrains Mono

**Visual Style**:
- **Rounded corners**: 12px (softer than Atlassian's 3px)
- **Shadows**: Soft, elevated (not flat)
- **Borders**: Subtle, 1px, low opacity
- **Spacing**: Generous (1.5x typical padding)
- **Icons**: Lucide React (consistent, modern)
- **Animations**: Subtle fade-ins, smooth transitions (300ms ease-out)

---

## 🏠 Landing Page Design

### Section Breakdown

#### 1. **Hero Section**
```tsx
<section className="hero">
  {/* Background: Subtle gradient mesh */}
  <div className="gradient-mesh-bg" />

  {/* Navigation */}
  <nav>
    <Logo />
    <Links: Features | Pricing | Docs | Blog />
    <AuthButtons: Login | Sign Up />
  </nav>

  {/* Hero Content */}
  <div className="hero-content">
    <Badge>🚀 Now with AI-powered version control</Badge>
    <h1>Documentation that flies</h1>
    <p>Docjays brings AI-native version control to your documentation.
       Let AI agents propose changes, review with diff views, and ship faster.</p>
    <CTAs>
      <PrimaryButton>Start for Free</PrimaryButton>
      <SecondaryButton>View Demo ↗</SecondaryButton>
    </CTAs>

    {/* Hero Image/Animation */}
    <div className="hero-visual">
      {/* Animated mockup or Lottie animation */}
      <MockupAnimation />
    </div>
  </div>
</section>
```

**Visual Style**:
- Large, bold headline (60px)
- Gradient text for "flies"
- Floating animation on hero visual
- Glassmorphism effect on cards

---

#### 2. **Features Section**
```tsx
<section className="features">
  <SectionHeader>
    <h2>Built for teams that ship fast</h2>
    <p>Everything you need to keep docs in sync with code</p>
  </SectionHeader>

  <FeatureGrid>
    <Feature icon="🤖">
      <h3>AI-Powered Proposals</h3>
      <p>Claude and other AI agents can propose doc changes via MCP</p>
    </Feature>

    <Feature icon="🔍">
      <h3>Visual Diff Viewer</h3>
      <p>Review changes with side-by-side diffs, just like code</p>
    </Feature>

    <Feature icon="📂">
      <h3>Virtual Folders</h3>
      <p>Organize docs in folders without database complexity</p>
    </Feature>

    <Feature icon="⏱️">
      <h3>Version History</h3>
      <p>Time-travel through every change, every author</p>
    </Feature>

    <Feature icon="👥">
      <h3>Team Collaboration</h3>
      <p>Invite teammates with role-based permissions</p>
    </Feature>

    <Feature icon="🔗">
      <h3>MCP Integration</h3>
      <p>Connect AI agents directly to your documentation</p>
    </Feature>
  </FeatureGrid>
</section>
```

**Visual Style**:
- 3-column grid (responsive to 1-column on mobile)
- Feature cards with hover lift effect
- Gradient icons in circles
- Subtle border glow on hover

---

#### 3. **How It Works Section**
```tsx
<section className="how-it-works">
  <SectionHeader>
    <h2>From idea to docs in 3 steps</h2>
  </SectionHeader>

  <Steps>
    <Step number="1" visual={<EditorScreenshot />}>
      <h3>Create your project</h3>
      <p>Start with a README, add folders, organize your docs</p>
    </Step>

    <Step number="2" visual={<MCPScreenshot />}>
      <h3>Connect AI agents</h3>
      <p>Install MCP server, let Claude read and propose changes</p>
    </Step>

    <Step number="3" visual={<DiffScreenshot />}>
      <h3>Review and approve</h3>
      <p>See what changed, approve with one click, ship it</p>
    </Step>
  </Steps>
</section>
```

**Visual Style**:
- Horizontal timeline on desktop, vertical on mobile
- Animated connection lines between steps
- Screenshot previews with shadow and border
- Numbers in gradient circles

---

#### 4. **Social Proof Section** (Future)
```tsx
<section className="social-proof">
  <SectionHeader>
    <h2>Trusted by documentation teams</h2>
  </SectionHeader>

  <Testimonials>
    {/* User testimonials with avatars */}
  </Testimonials>

  <Stats>
    <Stat value="10K+" label="Documents created" />
    <Stat value="500+" label="Teams using Docjays" />
    <Stat value="50K+" label="AI proposals reviewed" />
  </Stats>
</section>
```

---

#### 5. **Pricing Section** (Future)
```tsx
<section className="pricing">
  <SectionHeader>
    <h2>Simple, transparent pricing</h2>
  </SectionHeader>

  <PricingCards>
    <PricingCard tier="Free">
      <Price>$0</Price>
      <Features>
        - 3 projects
        - Unlimited docs
        - Version history
        - MCP integration
      </Features>
      <CTA>Start Free</CTA>
    </PricingCard>

    <PricingCard tier="Pro" featured>
      <Badge>Most Popular</Badge>
      <Price>$19/mo</Price>
      <Features>
        - Unlimited projects
        - Team collaboration
        - Custom domains
        - Priority support
      </Features>
      <CTA>Start Free Trial</CTA>
    </PricingCard>

    <PricingCard tier="Enterprise">
      <Price>Custom</Price>
      <Features>
        - SSO & SAML
        - Dedicated support
        - SLA guarantees
        - Custom integrations
      </Features>
      <CTA>Contact Sales</CTA>
    </PricingCard>
  </PricingCards>
</section>
```

---

#### 6. **CTA Section**
```tsx
<section className="final-cta">
  <div className="cta-card">
    <h2>Ready to elevate your docs?</h2>
    <p>Start shipping better documentation today. No credit card required.</p>
    <CTAs>
      <PrimaryButton size="large">Get Started Free</PrimaryButton>
      <SecondaryButton>Schedule a Demo</SecondaryButton>
    </CTAs>
  </div>
</section>
```

**Visual Style**:
- Full-width gradient background
- Large, centered card with glassmorphism
- Animated gradient border

---

#### 7. **Footer**
```tsx
<footer>
  <FooterGrid>
    <FooterColumn title="Product">
      <Link>Features</Link>
      <Link>Pricing</Link>
      <Link>Changelog</Link>
      <Link>Roadmap</Link>
    </FooterColumn>

    <FooterColumn title="Resources">
      <Link>Documentation</Link>
      <Link>API Reference</Link>
      <Link>Guides</Link>
      <Link>Blog</Link>
    </FooterColumn>

    <FooterColumn title="Company">
      <Link>About</Link>
      <Link>Careers</Link>
      <Link>Contact</Link>
    </FooterColumn>

    <FooterColumn title="Legal">
      <Link>Privacy Policy</Link>
      <Link>Terms of Service</Link>
    </FooterColumn>
  </FooterGrid>

  <FooterBottom>
    <Logo />
    <Copyright>© 2026 Docjays. All rights reserved.</Copyright>
    <SocialLinks>Twitter | GitHub | Discord</SocialLinks>
  </FooterBottom>
</footer>
```

---

## 📱 Dashboard Design (`/dashboard`)

### Layout
```tsx
<DashboardLayout>
  {/* Sidebar Navigation */}
  <Sidebar>
    <UserProfile />
    <Nav>
      <NavItem icon={<Home />}>Dashboard</NavItem>
      <NavItem icon={<Folder />}>Projects</NavItem>
      <NavItem icon={<GitPullRequest />}>Proposals</NavItem>
      <NavItem icon={<Settings />}>Settings</NavItem>
    </Nav>
    <UpgradeCard />
  </Sidebar>

  {/* Main Content */}
  <Main>
    <Header>
      <Breadcrumbs />
      <Actions>
        <SearchBar />
        <NotificationsDropdown />
        <UserMenu />
      </Actions>
    </Header>

    <Content>
      {/* Dashboard Content */}
      <WelcomeCard user={user} />

      <QuickStats>
        <Stat icon="📄" value={stats.totalDocs} label="Total Documents" />
        <Stat icon="📁" value={stats.projects} label="Projects" />
        <Stat icon="✅" value={stats.proposalsApproved} label="Proposals Approved" />
      </QuickStats>

      <ProjectsSection>
        <SectionHeader>
          <h2>Your Projects</h2>
          <Button>New Project</Button>
        </SectionHeader>
        <ProjectGrid>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ProjectGrid>
      </ProjectsSection>

      <RecentActivity>
        <h3>Recent Activity</h3>
        <ActivityFeed />
      </RecentActivity>
    </Content>
  </Main>
</DashboardLayout>
```

**Visual Style**:
- Sidebar: 240px wide, subtle background, sticky
- Main content: Max-width 1440px, centered
- Cards: Elevated, rounded, hover effects
- Project cards: Gradient border on hover
- Stats: Large numbers, icons, gradients

---

## 🎨 Component Library

### Buttons
```tsx
// Primary - Gradient background
<Button variant="primary">
  Get Started
</Button>

// Secondary - Transparent with border
<Button variant="secondary">
  Learn More
</Button>

// Ghost - Transparent, no border
<Button variant="ghost">
  Cancel
</Button>
```

### Cards
```tsx
// Feature Card
<Card hover glow>
  <Icon gradient />
  <Title />
  <Description />
</Card>

// Project Card
<Card interactive>
  <CardHeader>
    <ProjectIcon />
    <ProjectName />
    <ProjectMenu />
  </CardHeader>
  <CardStats>
    <Stat>12 docs</Stat>
    <Stat>3 proposals</Stat>
  </CardStats>
  <CardFooter>
    <UpdatedAt />
  </CardFooter>
</Card>
```

### Navigation
```tsx
<Nav variant="landing">
  {/* Transparent with blur */}
</Nav>

<Nav variant="dashboard">
  {/* Solid with sidebar */}
</Nav>
```

---

## 🛠️ Implementation Plan

### Phase 1: Design System Setup (Week 1)
- [ ] Install dependencies (next-themes, lucide-react, framer-motion, etc.)
- [ ] Set up next-themes provider with system/light/dark support
- [ ] Create `tailwind.config.ts` with custom color palette (dark mode aware)
- [ ] Set up Inter and JetBrains Mono fonts
- [ ] Create ThemeToggle component (system/light/dark switcher)
- [ ] Create base component library:
  - [ ] Button variants
  - [ ] Card variants
  - [ ] Typography components
  - [ ] Icon wrappers
- [ ] Add Lucide React icons
- [ ] Create animation utilities

### Phase 2: Landing Page (Week 1-2)
- [ ] Create `app/page.tsx` (new landing page)
- [ ] Move current home content to `app/dashboard/page.tsx`
- [ ] Build landing page sections:
  - [ ] Hero with navigation
  - [ ] Features grid
  - [ ] How it works
  - [ ] Final CTA
  - [ ] Footer
- [ ] Add animations and interactions
- [ ] Make responsive (mobile-first)

### Phase 3: Dashboard (Week 2)
- [ ] Create `app/dashboard/page.tsx`
- [ ] Create `app/dashboard/layout.tsx` with sidebar
- [ ] Build dashboard components:
  - [ ] Sidebar navigation
  - [ ] Welcome card
  - [ ] Quick stats
  - [ ] Project grid (reuse from old home)
  - [ ] Recent activity feed
- [ ] Update auth redirects to point to `/dashboard`

### Phase 4: Routing & Middleware (Week 2)
- [ ] Update login redirect: `/auth/login` → `/dashboard` after success
- [ ] Update signup redirect: `/auth/signup` → `/dashboard` after success
- [ ] Keep `/` accessible to authenticated users (no forced redirect)
- [ ] Add "Go to Dashboard" button in landing page header for auth users
- [ ] Update internal links throughout app

### Phase 5: Polish & Animations (Week 3)
- [ ] Add Framer Motion for animations
- [ ] Implement scroll-triggered animations
- [ ] Add loading skeletons
- [ ] Optimize images and assets
- [ ] Add micro-interactions
- [ ] Test all responsive breakpoints
- [ ] Accessibility audit (WCAG AA)

---

## 📦 Dependencies to Add

```bash
npm install lucide-react framer-motion next-themes
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-dialog
npm install @radix-ui/react-avatar
npm install clsx tailwind-merge
```

**next-themes**: Provides system/light/dark theme switching with no flash of unstyled content

---

## 🎯 Success Metrics

### Landing Page
- [ ] Clear value proposition visible in 3 seconds
- [ ] CTA above the fold on all devices
- [ ] Page load < 2 seconds
- [ ] Lighthouse score > 90

### Dashboard
- [ ] Projects visible in 2 clicks
- [ ] Create project in 1 click
- [ ] All actions accessible without scrolling (on desktop)
- [ ] Feels faster than current implementation

### Design
- [ ] Unique brand identity (not Atlassian clone)
- [ ] Consistent spacing system
- [ ] Smooth animations (60fps)
- [ ] Dark mode support with system preference detection

---

## 🚫 What We're NOT Doing (Scope Control)

- ❌ Full CMS or blog system (just static pages for now)
- ❌ Complex animations (keep it performant)
- ❌ Multiple pricing tiers (focus on free + pro)
- ❌ User-generated content on landing page
- ❌ A/B testing infrastructure (add later)

---

## 📝 Notes

- **Performance First**: Landing page should load in < 2s
- **Mobile First**: Design for mobile, enhance for desktop
- **Accessibility**: Use semantic HTML, ARIA labels, keyboard navigation
- **SEO**: Proper meta tags, structured data, sitemap
- **Analytics**: Add Plausible or similar (privacy-friendly)

---

**Status**: 📋 Planning Complete - Ready for Implementation
**Next Step**: Create design system and component library
**Est. Timeline**: 2-3 weeks for full implementation
