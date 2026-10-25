# Build a Couple Date Planner Website
Design following: design

## 1. Project Overview

Build a modern, responsive website for couples to discover, plan, and explore date activities.

The core experience should let users choose a curated date plan containing 2–3 destinations, preview photos and information about each location, visualize the route on an interactive map, and see estimated travel times and the total duration of the date.

The website should feel like a premium travel journal combined with a practical date-planning tool.

Prioritize a polished user experience, working interactions, clean code, and a functional MVP over unnecessary complexity.

## 2. Core User Journey

Implement the following flow:

1. The user opens the website.
2. The user browses curated date packages based on mood, budget, duration, and activity preferences.
3. The user selects a date package containing 2–3 destinations.
4. The website displays the full itinerary, destination photos, descriptions, and an interactive map.
5. The user taps a destination card or map pin to inspect the location.
6. The user can browse its photo gallery, view details, and open navigation.
7. The user can customize the itinerary by adding, removing, or reordering destinations.
8. The website updates the itinerary and route estimates accordingly.

## 3. Design Direction

Create a warm, modern editorial aesthetic inspired by premium travel magazines and lifestyle applications.

Visual guidelines:
- Warm cream or off-white background.
- Muted terracotta or dusty rose accents.
- Dark brown or charcoal typography.
- Large destination photography.
- Softly rounded cards and image containers.
- Subtle borders and restrained shadows.
- Elegant typography and generous whitespace.
- Smooth, understated transitions.
- Mobile-first responsive layouts.

Avoid:
- Generic SaaS dashboard styling.
- Excessive gradients and glassmorphism.
- Overly decorative animations.
- Excessive emojis.
- Dense layouts or too many competing visual elements.
- Fake buttons or interactions that do nothing.

The product should feel romantic but mature, tasteful, and practical rather than childish.

## 4. Main Pages and Components

### A. Discover Page

Create a landing page featuring:
- A concise hero section introducing the service.
- Mood selection cards: Cozy, Romantic, Outdoorsy, Foodie, Artsy, and Spontaneous.
- Budget and available-time filters.
- Date package cards featuring cover photos, destination counts, estimated duration, and budget ranges.
- A clear action to explore each package.

### B. Date Package Details

Each package should include:
- Package title and description.
- Mood and activity tags.
- Total number of destinations.
- Estimated total date duration.
- Estimated travel time between stops.
- Estimated budget for two people.
- A destination itinerary and interactive map.

Use sample packages such as:
- The Slow Sunday: cafe → bookstore → dessert.
- A Little Escape: garden → scenic viewpoint → dinner.
- After-Dark Date: dinner → night market → dessert.

Clearly label sample locations, prices, and travel times as illustrative until verified.

### C. Destination Photo Gallery

Create a reusable destination detail panel or modal.

It should include:
- A large featured photo.
- A row or grid of image thumbnails.
- Previous and next photo controls.
- A photo counter, such as "2 of 5".
- Swipe gestures on mobile where practical.
- Destination name and category.
- A concise description of the atmosphere and experience.
- Address and map location.
- Opening hours when available.
- Estimated cost for two.
- Recommended visit duration.
- A save-to-favorites action.
- An add-to-itinerary action.
- A navigation button.

Interaction requirements:
- Clicking a thumbnail updates the featured image.
- Clicking previous or next changes the displayed photo.
- Clicking the featured image may open a larger lightbox.
- Escape closes the modal on desktop.
- Clicking the close control dismisses the modal.
- On mobile, the gallery should remain easy to browse with one hand.
- Provide accessible labels, keyboard navigation, and meaningful image alt text.

### D. Interactive Map

Implement an interactive map showing all destinations in the selected date plan.

Map requirements:
- Display numbered pins representing itinerary order.
- Draw a route connecting destinations in the planned order.
- Fit the map viewport to show all selected stops.
- Display travel-time estimates between stops when available.
- Provide zoom and pan controls.
- Highlight the active destination.
- Show a compact location preview when a pin is clicked.
- Include the destination thumbnail, name, visit duration, and a "View details" action in the preview.
- Provide a route overview and an external navigation link.

Pin interaction:
1. Clicking a pin selects its destination.
2. The corresponding itinerary card becomes highlighted.
3. The map centers on or focuses the selected destination.
4. A preview card appears.
5. Selecting "View details" opens the destination gallery.

Card interaction:
1. Clicking an itinerary card selects its corresponding map pin.
2. The map highlights the selected destination.
3. The map viewport updates where appropriate.
4. The destination information remains synchronized across components.

Use a shared selected-destination state. Avoid separate, conflicting selection states between the map, gallery, and itinerary.

Use Mapbox or Google Maps if the project supports the necessary API configuration. If API credentials are unavailable, implement a clear map integration abstraction and a useful fallback instead of inventing real map data.

### E. Itinerary Panel

Display each stop in chronological order with:
- Stop number.
- Destination thumbnail.
- Name and category.
- Planned arrival and departure times.
- Recommended visit duration.
- Estimated travel time to the next destination.
- Estimated price.
- An option to inspect details.
- Controls to remove or reorder stops.

Keep the map and itinerary synchronized.

When a destination is added, removed, or reordered:
- Update the stop numbering.
- Update the displayed itinerary.
- Recalculate the total visit duration.
- Recalculate route estimates if a routing provider is available.
- Update the map markers and route.

If a route cannot be calculated, clearly mark the estimate as unavailable instead of displaying fabricated values.

## 5. Time and Budget Calculations

Distinguish between:
- Time spent visiting destinations.
- Travel time between destinations.
- Total estimated date duration.

Use this formula:

Total estimated duration = Sum of visit durations + Sum of travel durations.

Budget estimates should include the expected cost for two people where possible.

Clearly distinguish verified prices from estimates. Do not invent live business details, ratings, opening hours, routes, or travel times.

If real-time data is unavailable, use explicitly labeled sample data.

## 6. Data Model

Create reusable types for destinations and date packages.

Suggested destination fields:
- id
- name
- category
- description
- latitude
- longitude
- address
- photos
- estimatedPriceMin
- estimatedPriceMax
- visitDurationMinutes
- openingHours
- tags
- directionsUrl

Suggested date package fields:
- id
- title
- description
- coverPhoto
- mood
- destinationIds
- estimatedBudgetMin
- estimatedBudgetMax
- tags

Represent photos as an array of objects containing a stable ID, image URL, alt text, and optional caption.

Keep sample data separate from UI components. Use stable destination IDs rather than relying on array indexes.

Opening hours, prices, and other optional fields should support missing values gracefully.

## 7. Technical Requirements

First inspect the existing project and identify its framework, dependencies, directory structure, and current implementation.

If the repository already exists:
- Preserve its existing architecture and conventions.
- Reuse suitable dependencies and components.
- Avoid unnecessary rewrites.
- Do not introduce breaking changes without justification.

If starting from scratch, use:
- Next.js.
- TypeScript.
- Tailwind CSS.
- A suitable interactive map library or provider.
- A lightweight icon library.
- Local mock data for the initial prototype.

Keep the implementation modular, with reusable components such as:
- DatePackageCard
- DestinationCard
- DestinationGallery
- DestinationDetailModal
- InteractiveMap
- MapPinPreview
- ItineraryPanel
- ItineraryStop
- BudgetSummary

Do not add a database, authentication, or complex backend unless required by the existing project or explicitly requested.

Keep API keys out of source control. Use environment variables and document any required setup.

## 8. Responsive Design

Desktop:
- Display the itinerary and map side by side where space permits.
- Keep destination cards and route information easy to scan.
- Use a spacious photo gallery.

Mobile:
- Stack itinerary and map sections naturally.
- Use a swipeable photo gallery.
- Make map pins and controls easy to tap.
- Use a bottom sheet or full-screen modal for destination details.
- Keep primary actions accessible without excessive scrolling.
- Prevent horizontal overflow.

## 9. Quality and Testing

Before considering the implementation complete, verify:
- Destination cards display the correct data.
- Gallery navigation works.
- The selected photo counter updates correctly.
- Opening and closing the destination modal works.
- Clicking a map pin highlights the correct itinerary stop.
- Clicking an itinerary stop selects the corresponding map pin.
- Route and duration estimates update after itinerary changes.
- Missing photos and optional fields have graceful fallbacks.
- The layout works on mobile and desktop.
- No console errors or broken interactions remain.

Add appropriate tests for important calculations and state synchronization when the project's testing setup permits.

## 10. Implementation Workflow

Work in the following order:

1. Inspect the repository and summarize the existing setup.
2. Propose a concise implementation plan.
3. Implement the core UI and sample data.
4. Build the destination photo gallery.
5. Implement map pins and synchronized selection.
6. Connect the itinerary to the map.
7. Implement duration and budget calculations.
8. Add responsive layouts and interaction polish.
9. Run available tests, linting, and build checks.
10. Summarize completed work, modified files, required environment variables, and any limitations.

Prefer working, understandable code over excessive abstraction.

Do not stop after producing a design proposal. After reviewing the existing project, proceed with implementation unless a critical missing requirement prevents it.

## Definition of Done

The result should be a working prototype where a user can select a date package, inspect destination photos, click map pins, synchronize the selected destination with the itinerary, customize the stops, and view updated duration and route information.

The website should feel cohesive, polished, responsive, and ready for further development.