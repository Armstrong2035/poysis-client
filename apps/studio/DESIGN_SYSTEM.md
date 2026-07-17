# Poysis Design System

Premium Ghost of Tsushima aesthetic with hierarchical skill tree visualization.

## Color Palette

```
Primary:
  Background:     #0A0B0F (deep obsidian)
  Text Primary:   #E8E9ED (bone white)
  Text Secondary: #E8E9ED/70 (dimmed)
  Text Tertiary:  #E8E9ED/40 (very dim)

Accent:
  Gold Primary:   #E8A547 (forge gold)
  Gold Light:     #F5B25F (lighter)
  Gold Dim:       #E8A547/60 (dimmed)
  Gold Very Dim:  #E8A547/20 (very dim)
  Gold Fade:      #E8A547/10 (faded)

Status:
  Success:        #6BB07A (confidence green)
  Error:          #C9534B (crimson)

Semantic:
  Gold/20:        rgba(232, 165, 71, 0.2)
  Gold/30:        rgba(232, 165, 71, 0.3)
  Gold/40:        rgba(232, 165, 71, 0.4)
  Dark/40:        rgba(10, 11, 15, 0.4)
  Dark/50:        rgba(10, 11, 15, 0.5)
  Dark/60:        rgba(10, 11, 15, 0.6)
```

## Typography

```
Serif (Headers - Calligraphic):
  Font:       'Crimson Text', serif
  Weights:    400, 600, 700
  Usage:      Headings, titles, node labels, premium text
  
  H1:         font-size: 36px, font-weight: 700, letter-spacing: -0.02em
  H2:         font-size: 24px, font-weight: 700, letter-spacing: -0.02em
  H3:         font-size: 18px, font-weight: 600
  Subtitle:   font-size: 13px, font-weight: 600, letter-spacing: 0.5px

Monospace (Data - Technical):
  Font:       system monospace
  Weights:    400, 500, 600
  Usage:      Doc counts, labels, metadata, hints
  
  Label:      font-size: 11px, font-weight: 600
  Metadata:   font-size: 9px, font-weight: 500
  Hint:       font-size: 10px, font-weight: 400

Sans-serif (Body - Modern):
  Font:       system sans-serif
  Weights:    400, 500, 600
  Usage:      Body text, buttons, UI copy
  
  Body:       font-size: 14px, font-weight: 400
  Button:     font-size: 14px, font-weight: 600
```

## Spacing Scale

```
xs:     4px
sm:     8px
md:     12px
lg:     16px
xl:     24px
2xl:    32px
3xl:    40px
4xl:    48px
```

## Border & Radius

```
Borders:
  Subtle:     1px solid #E8A547/20
  Medium:     1.5px solid #E8A547
  Strong:     2px solid #E8A547
  Thick:      2.5px solid #E8A547

Radius:
  sm:         4px
  md:         8px
  lg:         12px
  xl:         16px
```

## Effects & Animations

```
Glow Filter:
  <filter id="glow">
    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
    <feMerge>
      <feMergeNode in="coloredBlur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>

Backdrop Blur:
  Subtle:     backdrop-blur-sm
  Medium:     backdrop-blur-md
  Strong:     backdrop-blur-lg

Shadows:
  Node Hover: shadow-lg shadow-[#E8A547]/30
  Button:     shadow-lg shadow-[#E8A547]/30
  Elevated:   shadow-2xl shadow-[#E8A547]/40

Animations:
  Pulse:      animate-pulse (default browser)
  Drift:      Custom keyframe - particles floating down with drift
  Transition: duration-300 (standard), duration-500 (slow)

Gradient:
  Sidebar:    from-[#E8A547]/5 to-transparent
  Button:     from-[#E8A547] to-[#D4884A]
  Glow:       radial-gradient(ellipse_at_center, transparent 0%, #0A0B0F 100%)
  
Vignette:
  radial-gradient(ellipse_at_center, transparent 20%, #0A0B0F 100%)

Atmospheric Glows:
  Top Glow:    bg-[#E8A547], w-96 h-96, blur-3xl, opacity-5, mix-blend-screen
  Bottom Glow: bg-[#E8A547], w-96 h-96, blur-3xl, opacity-3, mix-blend-screen
```

## Component Patterns

### Header
```
Height:       80px (h-20)
Padding:      32px (px-8)
Border:       1px solid #E8A547/20
Background:   #0A0B0F/60 + backdrop-blur-md
Logo Size:    48x48px
```

### Nodes (Skill Tree)
```
Root Node:
  Radius:     45px
  Stroke:     2px #E8A547
  Fill:       #0A0B0F (unselected) or #E8A547 (selected)
  Inner Ring: 38px radius, 0.5px stroke
  Center Dot: 6px radius, #E8A547
  Glow:       70px outer glow for root nodes

Child Node:
  Radius:     45px
  Stroke:     1px-2px #E8A547 (based on state)
  Fill:       #0A0B0F (unselected) or #E8A547 (selected)
  
States:
  Unselected:  stroke opacity: 0.4, fill: #0A0B0F
  Selected:    stroke: 2.5px, fill: #E8A547, glow: active
  Connected:   stroke: 2px, opacity: 1
  Hovered:     glow effect, animate-pulse
  Inactive:    opacity: 0.4

Label Inside Node:
  Serif font, 13px (root) or 11px (child)
  Fill: #E8E9ED (unselected) or #0A0B0F (selected)
  
Doc Count:
  Monospace, 9px
  Fill: #E8A547, opacity varies by state
```

### Connection Lines
```
Glow Line:      3px, #E8A547, opacity: 0.05-0.4, filter: url(#glow)
Main Line:      1.5px, #E8A547, opacity: 0.2-0.8
Active State:   Opacity increases, both lines glow
Inactive State: Opacity decreases significantly
```

### Sidebar
```
Width:          320px (w-80)
Padding:        24px (px-6)
Border:         1px solid #E8A547/20
Background:     #0A0B0F/60 + backdrop-blur-md
Selected Info:  gradient background: from-[#E8A547]/5 to-transparent

Search Input:
  Padding:      12px (py-3, px-4)
  Border:       1px solid #E8A547/30
  Background:   #0A0B0F/50
  Focus Ring:   1px ring-[#E8A547]/60
  Rounded:      8px

Topic Button:
  Padding:      12px (py-3, px-4)
  Rounded:      8px
  Transition:   all duration-300
  Unselected:   bg-transparent, text-[#E8E9ED]/70
  Selected:     bg-[#E8A547], text-[#0A0B0F], shadow-lg shadow-[#E8A547]/30
```

### Command Bar
```
Height:       64px (h-16)
Padding:      32px (px-8)
Border:       1px solid #E8A547/20
Background:   #0A0B0F/60 + backdrop-blur-md

Input:
  Padding:      8px 16px (py-2, px-4)
  Border:       1px solid #E8A547/20
  Background:   #0A0B0F/50
  Rounded:      8px
  Focus Ring:   1px ring-[#E8A547]/40
  
Button:
  Padding:      10px 24px (py-2.5, px-6)
  Border:       none
  Background:   gradient from-[#E8A547] to-[#D4884A]
  Hover:        gradient from-[#F5B25F] to-[#E8A547]
  Text:         #0A0B0F, font-semibold, text-sm
  Rounded:      8px
  Shadow:       shadow-lg shadow-[#E8A547]/30
  Transition:   all duration-300
```

## Particle Effect

```javascript
@keyframes drift {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.4;
  }
  90% {
    opacity: 0.1;
  }
  100% {
    transform: translateY(100vh) translateX(100px);
    opacity: 0;
  }
}

Particle Properties:
  Size:       1px x 1px circles
  Color:      #E8A547
  Opacity:    0.3 (varies with animation)
  Blur:       blur(0.5px)
  Count:      15 particles
  Duration:   8-12s per particle
  Delay:      0-2s staggered
  Filter:     blur(0.5px)
```

## Grid Background

```css
backgroundImage: `repeating-linear-gradient(0deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px),
                  repeating-linear-gradient(90deg, #E8A547 0px, #E8A547 1px, transparent 1px, transparent 40px)`,
opacity: 0.05
```

## Responsive Breakpoints

```
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px

Skill Tree:
  Min Width:  1400px
  Min Height: 700px
  
Sidebar:
  Always visible on desktop
  Can be minimized/hidden on mobile
  
Header:
  Full width on all breakpoints
  Logo may scale on small screens
```

## Implementation Examples

### Node Styling
```jsx
<circle
  cx={node.position.x + 50}
  cy={node.position.y + 50}
  r="45"
  fill={isSelected ? "#E8A547" : "#0A0B0F"}
  stroke="#E8A547"
  strokeWidth={isSelected ? 2.5 : isConnected ? 2 : 1}
  opacity={selectedId === null ? 1 : isConnected ? 1 : 0.4}
  filter={isSelected || isHovered ? "url(#glow)" : ""}
  className="transition-all duration-300"
/>
```

### Button Styling
```jsx
className="px-6 py-2.5 bg-gradient-to-r from-[#E8A547] to-[#D4884A] 
           hover:from-[#F5B25F] hover:to-[#E8A547] text-[#0A0B0F] 
           rounded-lg font-semibold text-sm transition-all 
           shadow-lg shadow-[#E8A547]/30 hover:shadow-[#E8A547]/50"
```

### Header Styling
```jsx
className="border-b border-[#E8A547]/20 bg-[#0A0B0F]/60 backdrop-blur-md 
           h-20 flex items-center px-8"
```

## Design Tokens Reference

Use these consistently across the app:

```javascript
const DESIGN_TOKENS = {
  colors: {
    bg: {
      primary: '#0A0B0F',
      surface: 'rgba(10, 11, 15, 0.4)',
      surfaceAlt: 'rgba(10, 11, 15, 0.6)',
    },
    text: {
      primary: '#E8E9ED',
      secondary: '#E8E9ED70',
      tertiary: '#E8E9ED40',
    },
    accent: {
      primary: '#E8A547',
      light: '#F5B25F',
      dim: '#E8A54799',
    },
  },
  fonts: {
    serif: "'Crimson Text', serif",
    mono: "monospace",
    sans: "sans-serif",
  },
  spacing: [0, 4, 8, 12, 16, 24, 32, 40, 48],
  transitions: {
    fast: 'duration-300',
    slow: 'duration-500',
  },
};
```

---

**Design Philosophy:**
- Minimalist but luxurious
- Atmospheric and artistic
- Hierarchical and clear
- Smooth and refined
- Premium game-UI aesthetic
- Ghost of Tsushima inspired
