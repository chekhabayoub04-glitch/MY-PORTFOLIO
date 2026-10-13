# Graph Report - MY-PORTFOLIO  (2026-10-13)

## Corpus Check
- 22 files · ~781,523 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .css 1)

## Summary
- 134 nodes · 132 edges · 22 communities (14 shown, 8 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `84798482`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- three-bg.js
- main.js
- initCarousel
- work-exhibition.js
- Ponytail Help
- Ayoub Chekhab — Portfolio Website 🦇
- AGENTS.md
- portfolio-gallery.js
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- Ponytail
- bat-companion.js
- service-ui.js
- ponytail-debt/SKILL.md
- OmniRoute (optional, run on your own machine)
- CLAUDE.md
- .claude/CLAUDE.md
- session-start.sh
- brand-identity/README.md
- editing/README.md

## God Nodes (most connected - your core abstractions)
1. `initCarousel()` - 9 edges
2. `Ponytail Help` - 7 edges
3. `Ayoub Chekhab — Portfolio Website 🦇` - 7 edges
4. `goToIndex()` - 6 edges
5. `showViewerItem()` - 4 edges
6. `updateToggle()` - 4 edges
7. `Ponytail Gain` - 4 edges
8. `Ponytail` - 4 edges
9. `visibleItems()` - 3 edges
10. `openViewer()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (22 total, 8 thin omitted)

### Community 0 - "three-bg.js"
Cohesion: 0.09
Nodes (22): animate(), batImgTexture, batMeshes, camera, canvas, clock, floatingShapes, loader (+14 more)

### Community 1 - "main.js"
Cohesion: 0.14
Nodes (10): copyrightYear, counterObs, cursorDot, cursorRing, hamburger, mobileMenu, navbar, navLinks (+2 more)

### Community 2 - "initCarousel"
Cohesion: 0.36
Nodes (10): initCarousel(), angleForIndex(), animateTo(), step(), applyRotation(), goToIndex(), next(), prev() (+2 more)

### Community 3 - "work-exhibition.js"
Cohesion: 0.33
Nodes (5): closeImage(), goTo(), openImage(), updateActive(), updateToggle()

### Community 4 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 5 - "Ayoub Chekhab — Portfolio Website 🦇"
Cohesion: 0.25
Nodes (7): 🎬 Add videos, Ayoub Chekhab — Portfolio Website 🦇, 🌐 Deploy to GitHub Pages, 🖼️ Images, 📁 Project Structure, 🚀 Run Locally, 🛠️ Technologies Used

### Community 6 - "AGENTS.md"
Cohesion: 0.33
Nodes (4): Project, Save tokens, Skills available, Work like a senior engineer

### Community 7 - "portfolio-gallery.js"
Cohesion: 0.67
Nodes (5): closeViewer(), openViewer(), renderCards(), showViewerItem(), visibleItems()

### Community 8 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Map first, 2. Look for, 3. Check before you report, 4. Output

### Community 9 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 10 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Understand first, 2. Look for, 3. Check before you report, 4. Output

### Community 11 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 14 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 15 - "OmniRoute (optional, run on your own machine)"
Cohesion: 0.50
Nodes (3): Know before you use it, OmniRoute (optional, run on your own machine), Safe setup

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initCarousel()` connect `initCarousel` to `service-ui.js`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `initCarousel()` (e.g. with `service-ui.js` and `goToIndex()`) actually correct?**
  _`initCarousel()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `three-bg.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._