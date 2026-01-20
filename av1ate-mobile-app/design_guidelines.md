# AIRFAX Design Guidelines

## Brand Identity
**Personality**: Premium, minimalist, Tesla-inspired aviation tool  
**Visual Direction**: Dark, high-contrast, card-based interface with calm spacing  
**Memorable Element**: Status pills with aviation-grade color coding (green/yellow/red) against a dark cockpit-like background

## Navigation Architecture
**Root Navigation**: Stack-only (single-screen app for now)  
**Screens**:
1. Home (app/index.tsx) - Aircraft health dashboard

## Screen-by-Screen Specifications

### Home Screen (app/index.tsx)
**Purpose**: Aircraft health overview with maintenance status at-a-glance

**Layout**:
- **Header**: Custom dark header
  - Aircraft model: "Piper PA-28"
  - Tail number: "N28PA"
  - Title: "Aircraft Health"
  - No left/right buttons
  - Transparent background
- **Main Content**: Scrollable vertical stack
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl

**Components** (top to bottom):
1. Overall Status Pill
   - Rounded pill shape with status color + label text
   - Mock status: YELLOW ("DUE SOON")
2. Current Hours Card
   - Dark card with rounded corners
   - Label: "Hobbs"
   - Value: "1243.6" (large, bold)
   - "Update" button (placeholder, no action)
3. Next Due Maintenance List
   - Section title: "Next Due"
   - List items (mock data):
     - Annual Inspection — due in 23 days — YELLOW
     - Oil Change — due in 7.4 hours — YELLOW
     - ELT Battery — due in 4 months — GREEN
   - Each item: colored status dot, name, due text, chevron (right arrow)
4. Documents Card
   - Dark card
   - Text: "Logbooks, annual sign-offs, invoices"
   - "Open documents" button (placeholder)

## Color Palette
- **Background**: #0B0B0C (deep black-charcoal)
- **Surface/Cards**: #1A1A1C (elevated dark surface)
- **Primary**: #FFFFFF (white text)
- **Secondary**: #8E8E93 (muted gray for labels)
- **Status Green**: #34C759 (healthy/good)
- **Status Yellow**: #FFD60A (due soon/caution)
- **Status Red**: #FF3B30 (overdue/critical)
- **Accent**: #007AFF (interactive elements, buttons)

## Typography
- **Font**: System (SF Pro for iOS, Roboto for Android)
- **Type Scale**:
  - Heading: 28pt Bold (#FFFFFF)
  - Subheading: 20pt Semibold (#FFFFFF)
  - Body: 17pt Regular (#FFFFFF)
  - Label: 13pt Regular (#8E8E93)
  - Value/Metric: 34pt Bold (#FFFFFF)

## Visual Design
- **Card Style**: Dark background (#1A1A1C), corner radius 12px, no shadow (flat design)
- **Spacing**: Generous padding (16-24px between elements)
- **Icons**: Use Feather icons from @expo/vector-icons
- **Status Indicators**: Circular dots (8px diameter) or rounded pills
- **Buttons**: Rounded corners (8px), subtle press feedback (opacity change)
- **High Contrast**: Ensure all text meets WCAG standards against dark background

## Assets to Generate
1. **icon.png** - App icon with aircraft silhouette or tail number on dark background - USED: Device home screen
2. **splash-icon.png** - Simplified aircraft icon for launch screen - USED: App launch
3. **empty-maintenance.png** - Minimal illustration of clipboard/checklist - USED: Empty state if no maintenance items exist (future)
4. **documents-icon.png** - Simple folder/logbook icon - USED: Documents card header (optional decorative element)

**Asset Style**: Minimal line art, monochrome white/gray on transparent background, aviation-inspired