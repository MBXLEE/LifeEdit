# The Life Edit Figma Extraction

> Version 2 direction: the user explicitly requested a full desktop application,
> not the prototype's phone viewer. The phone dimensions and viewer layout below
> are historical extraction notes, not implementation requirements. Current
> screens use a full-width workspace, responsive sidebar, mobile bottom tabs,
> and the extracted palette, typography, and component styling. See
> `version-two.md` for the current behavior and setup.

The Figma Make prototype is the visual source of truth for this build. The implementation in `components/figma-life-edit.tsx` follows these extracted rules and should be kept aligned with them as new product features are connected.

## Screens Analyzed

- Prototype shell with top toolbar, theme dots, grouped left sidebar, centered mobile device frame.
- Onboarding, Home, Planner, Focus, Journal, Life Edit, Insights.
- Finance, Gym Planner, Habit Manager, Quit Habits.
- Theme Studio, User Flow, App Architecture.

## Color System

Default Ocean/Powder Blue:

- Page background: `#E8EEF4`
- Phone/card surface: `#FAFAFA` and white cards
- Soft tint: `#DCEEFF`
- Primary slate blue: `#5B7C99`
- Deep text: `#1A2332`
- Muted text: `#9BA5B5`
- Border: `#E2E6ED`
- Light control fill: `#F2F4F7`

Secondary semantic colors used in the prototype:

- Fitness/positive: `#6B9A72`
- Finance/warm: `#C9A96E`
- Social/attention: `#D4848A`
- Spiritual: `#9B8EC4`
- Calm blue: `#8AAEC8`

Theme variants:

- Powder Blue: bg `#E8EEF4`, surface `#FAFAFA`, soft `#DCEEFF`, primary `#5B7C99`, deep `#1A2332`
- Blush Rose: bg `#F4EAEB`, surface `#FFFCFC`, soft `#F7E8E8`, primary `#B5737A`, deep `#2B2023`
- Sage Green: bg `#EAF1EA`, surface `#FCFDFC`, soft `#E8F0EA`, primary `#5F8A67`, deep `#1D2B20`
- Warm Cream: bg `#F2ECE1`, surface `#FFFCF7`, soft `#FFF5E6`, primary `#9A7B4F`, deep `#2B241A`
- Midnight: bg `#141B2A`, surface `#1A2332`, soft `#26364A`, primary `#8AAEC8`, deep `#F4F7FA`

## Spacing System

- Desktop top toolbar: 48-56px high, 24px horizontal padding.
- Desktop sidebar: 208px wide, 12px horizontal padding, 20px top padding.
- Stage: centered content with 32px desktop padding and 40px top breathing room.
- Mobile frame: fixed 375px x 812px, 44px radius.
- Phone content: 24px horizontal padding for most screens, 28px for onboarding.
- Card padding: 12px for compact stats, 16px for default cards, 20px for hero cards.
- Common gaps: 8px compact rows, 10-12px cards/grids, 16px screen sections, 20px major blocks.

## Navigation Patterns

- Desktop uses a prototype viewer shell, not a SaaS dashboard: top toolbar, grouped sidebar, centered phone preview.
- Sidebar groups: Setup, Navigation, Modules, Settings.
- Phone navigation uses a bottom tab bar with icon-first items: Home, Planner, Focus, Journal, Life Edit.
- Specialist modules open as dedicated phone screens without bottom navigation: Finance, Gym Planner, Habit Manager, Quit Habits.
- Internal screen modes use pill segmented controls, especially Planner, Focus, Life Edit, Finance, and Gym Planner.

## Typography

- Display headings use a refined serif via `.font-display`.
- Main phone titles: 30-36px display text with tight line height.
- Large metrics: 40-48px display text.
- Section labels: 10px uppercase, semibold, wide tracking.
- Body copy: 12-14px sans-serif, muted slate color, generous line height.
- Buttons and cards use semibold 12-14px labels.

## Components

- Phone frame: rounded 44px, `#FAFAFA`, thin border, layered shadow `0 20px 60px rgba(0,0,0,.15)`.
- Cards: white surface, 16-24px radius, soft shadow `0 2px 14px rgba(0,0,0,.06)`.
- Hero cards: 28px radius, primary-to-deep gradient, white editorial text.
- Segmented controls: `#F2F4F7` track, white active pill, subtle active shadow.
- Progress rings and meters: soft theme track with primary or semantic progress.
- Habit grids: seven compact rounded day cells.
- Chart bars: rounded-top bars with muted tint and one active primary bar.
- Theme cards: large rounded cards with embedded mini phone preview and color swatches.

## Layout Structures

- Home: greeting, affirmation, daily score card, today focus list, habit grid, upcoming events, two compact lifestyle cards.
- Planner: segmented view switcher, horizontal date strip, vertical time-block timeline.
- Focus: preset tabs, large circular timer, focus/break switch, controls, weekly stats and bar chart.
- Journal: stats card, prompt card, two-column journal type grid, recent entries.
- Life Edit: future identity hero, pillars/goals/vision tabs, pillar cards, goal rhythm, vision board.
- Insights: life wheel, monthly metrics, trends, smart balance recommendation.
- Finance: monthly overview hero, income/spent/remaining stats, internal tabs, monthly summary, budget meters, spending chart.
- Gym Planner: week dots, workout tabs, workout type grid, today plan, weekly stats, warm-up note.
- Theme Studio/User Flow/Architecture: desktop prototype-board views with editorial scale and rounded information panels.
