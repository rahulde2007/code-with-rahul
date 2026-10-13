export type ProjectDetailContent = {
  summary: string;
  overview: string[];
  problem: string;
  goals: string[];
  features: { title: string; description: string }[];
  workflow: string[];
  technologies: { name: string; role: string }[];
  implementation: string[];
  challenges?: { challenge: string; solution: string }[];
  useCases: string[];
  learning: string[];
};

export const projectDetails: Record<string, ProjectDetailContent> = {
  'wifi-qr-generator': {
    summary:
      'Create a scannable WiFi QR code in the browser, then print or download it without sending network credentials to a QR service.',
    overview: [
      'WiFi QR Generator turns a wireless network name (SSID) and password into a QR code that a compatible phone can scan to join the network. It replaces the back-and-forth of reading and typing a long password with a scannable, shareable card.',
      'Generation happens in the browser with a bundled QR library rather than a remote QR service. The interface updates as the network details are entered and also supports printing a WiFi card or downloading the generated code as a JPG.',
    ],
    problem:
      'Manually sharing WiFi credentials can be inconvenient and error-prone, especially when passwords contain punctuation or need to be entered on a phone.',
    goals: [
      'Make it quick to create a standard WiFi configuration QR code from network credentials.',
      'Keep credential processing on the device instead of sending it to an external QR service.',
      'Make the generated code convenient to scan, print, or save.',
    ],
    features: [
      {
        title: 'Live QR generation',
        description:
          'The SSID and password fields update the QR preview as the user types, so the code is ready without a separate generate step.',
      },
      {
        title: 'WiFi payload escaping',
        description:
          'Reserved characters in the network name and password are escaped before they are placed into the standard WPA WiFi payload.',
      },
      {
        title: 'Local and offline generation',
        description:
          'A bundled QR engine creates the code in the browser without calling a QR API. After the page assets are available, generation itself does not need a network connection.',
      },
      {
        title: 'Print and JPG export',
        description:
          'A print action uses the browser print dialog, while a separate download action converts the current QR preview into a JPG file.',
      },
      {
        title: 'Input guidance',
        description:
          'The interface shows a warning while required network details are missing and reveals export controls when the fields are valid.',
      },
    ],
    workflow: [
      'Enter the network name (SSID) and password.',
      'The app escapes special characters and assembles a WiFi configuration payload.',
      'The bundled QR engine renders the payload into an SVG-backed preview.',
      'Scan the code with a compatible device, print a WiFi card, or download a JPG copy.',
    ],
    technologies: [
      { name: 'HTML5', role: 'Provides the semantic form, credential inputs, QR preview, and accessible page structure.' },
      { name: 'CSS3', role: 'Styles the responsive interface, animated feedback, and print-specific card layout.' },
      { name: 'JavaScript ES modules', role: 'Validates inputs, escapes WiFi payload characters, updates the QR preview, and handles print and JPG export.' },
      { name: 'Vite', role: 'Runs the development server and bundles the static application for production.' },
      { name: 'Bundled QR engine', role: 'Generates the QR code locally and outputs SVG data for the preview.' },
    ],
    implementation: [
      'The form logic builds a `WIFI:T:WPA;S:…;P:…;;` payload and escapes backslash, semicolon, comma, quotation mark, and colon characters in user-provided values.',
      'The QR library is bundled with the application. The code prefers SVG data-URL output and supports a data-URL fallback, with no QR-generation API request.',
      'The export path draws the QR image onto a white canvas before producing a JPG, and the print action delegates formatting to the page print stylesheet.',
    ],
    challenges: [
      {
        challenge: 'Network names and passwords may contain characters that have special meaning in a WiFi QR payload.',
        solution: 'Escape those reserved characters before constructing the payload so valid credential input retains its intended value.',
      },
      {
        challenge: 'Sending credentials to a third-party QR service would expose information that should remain private.',
        solution: 'Run QR generation locally with the bundled library; the README also states that credentials are not persisted in local storage or cookies.',
      },
    ],
    useCases: [
      'Sharing home or guest WiFi with visitors without asking them to type a password.',
      'Printing a small WiFi access card for a shared space or event.',
      'Saving a QR image for later use on a device that can scan it.',
    ],
    learning: [
      'How to serialize user input into a device-readable WiFi QR payload and correctly escape reserved characters.',
      'How a local browser library can generate an image without uploading input to an external service.',
      'How to make one generated result useful across an on-screen preview, JPG download, and print layout.',
    ],
  },
  'github-achievement-hunt': {
    summary:
      'Explore six GitHub profile achievements through badge artwork, search and filters, practical guidance, and clear caveats about unconfirmed eligibility.',
    overview: [
      'GitHub Achievement Hunt is a reference and browsing tool for six GitHub profile achievement badges: Quickdraw, Pull Shark, YOLO, Galaxy Brain, Starstruck, and Pair Extraordinaire. It explains the activity commonly associated with each badge and provides original badge artwork alongside the guidance.',
      'The project is intentionally careful about certainty. Its dataset marks profile status as unknown and distinguishes general community descriptions from official award rules; its linked GitHub documentation covers related platform features, not complete achievement eligibility thresholds.',
    ],
    problem:
      'Achievement advice online can present community lore as guaranteed criteria. The project makes it easier to explore common associations while warning users not to treat unconfirmed thresholds as official rules.',
    goals: [
      'Make achievement names, categories, badge artwork, and related activities easier to browse.',
      'Offer practical, repository-respectful guidance for common contribution workflows.',
      'Clearly identify unknown profile status and undocumented eligibility rather than implying that a badge is guaranteed.',
    ],
    features: [
      {
        title: 'Six achievement entries',
        description:
          'The local dataset covers Quickdraw, Pull Shark, YOLO, Galaxy Brain, Starstruck, and Pair Extraordinaire, organized by activity category.',
      },
      {
        title: 'Search, filter, and sort',
        description:
          'Visitors can search achievement descriptions and keywords, filter by category or profile status, and sort by guide order, category, or name.',
      },
      {
        title: 'Badge artwork and detail dialog',
        description:
          'Each card includes its badge artwork and a control to open a detail view with the description, availability note, requirement caveat, practical steps, and source link.',
      },
      {
        title: 'Safety-conscious contribution guidance',
        description:
          'The guides encourage genuine issues, useful pull requests, real co-authorship, and normal project review practices; they explicitly discourage bypassing repository safeguards.',
      },
      {
        title: 'Eligibility caveats',
        description:
          'The interface explains that current availability, exact thresholds, and award decisions are not confirmed by the linked public documentation.',
      },
    ],
    workflow: [
      'Browse the achievement catalogue or search by badge name, category, or related activity.',
      'Narrow the results with category and profile-status filters or choose a sort order.',
      'Open an achievement’s instructions to review its common association, uncertainty note, practical steps, and related GitHub documentation.',
      'Follow the repository’s own contribution process and check the GitHub profile for any actual award; the guide does not claim or verify eligibility.',
    ],
    technologies: [
      { name: 'HTML5', role: 'Defines the page structure, search and filter controls, achievement catalogue, and accessible dialog.' },
      { name: 'CSS3', role: 'Provides the responsive layout, theme styling, badge-card presentation, and interface animations.' },
      { name: 'JavaScript ES modules', role: 'Loads the local achievement dataset, filters and sorts entries, renders cards, and manages the detail dialog and theme preference.' },
    ],
    implementation: [
      'Achievement records and their source links are stored in a local JavaScript dataset; the explorer uses that data rather than requesting profile activity from GitHub.',
      'Filtering is implemented as a separate function that matches query text, category, and status, and applies the selected sort order.',
      'The detail dialog combines per-achievement guidance with carefully qualified requirements. The public documentation linked by the project does not establish complete award thresholds.',
      'The reviewed source contains no GitHub account connection or live contribution tracker. It is a guide and catalogue, not a contribution dashboard or a roadmap tracker.',
    ],
    useCases: [
      'Beginners learning the GitHub activities associated with profile achievement names.',
      'Open-source contributors looking for reminders about issues, pull requests, discussions, and accurate co-author attribution.',
      'Anyone checking achievement claims who wants to distinguish documented platform features from unverified award criteria.',
    ],
    learning: [
      'How to structure a browsable catalogue around reusable records, category filters, search, sorting, and a detail dialog.',
      'Why interface copy should separate verifiable platform documentation from commonly repeated but unconfirmed eligibility claims.',
      'How to encourage useful contributions without incentivizing rushed work or bypassing project safeguards.',
    ],
  },
  'rahuls-3d-world': {
    summary:
      'An interactive portfolio that combines a Three.js character scene, scroll-linked animation, responsive sections, and selected work.',
    overview: [
      "Rahul's 3D World is an interactive portfolio that presents an introduction, profile, capabilities, career information, selected work, and contact details as a continuous visual experience. A real-time Three.js character scene anchors the landing section and responds to pointer input.",
      'Scroll-triggered GSAP timelines coordinate movement in the scene with changes between page sections. The implementation also adapts its composition to desktop and smaller screens, resizes the WebGL renderer, and checks the visitor’s reduced-motion preference before running character and scroll animations.',
    ],
    problem:
      'A conventional portfolio can make the introduction, skills, work, and contact information feel like disconnected destinations. This project brings those parts together in one navigable portfolio experience with a distinctive 3D focal point.',
    goals: [
      'Present the owner’s background and work through clear portfolio sections.',
      'Use a 3D character and scroll-linked motion to connect the landing experience with the content below it.',
      'Keep the interface usable across viewport sizes and account for reduced-motion preferences.',
    ],
    features: [
      {
        title: 'Interactive 3D character scene',
        description:
          'A Three.js WebGL renderer displays the character model and lighting. Pointer movement drives head rotation, with touch movement handled for touch devices.',
      },
      {
        title: 'Scroll-linked scene animation',
        description:
          'GSAP timelines with ScrollTrigger coordinate character rotation, camera position, and section transitions with the visitor’s scroll position.',
      },
      {
        title: 'Portfolio sections and work carousel',
        description:
          'The page brings together landing, about, capabilities, career, work, tech stack, and contact sections. The Work section presents projects in a carousel with previous/next controls.',
      },
      {
        title: 'Responsive composition',
        description:
          'The main container changes how content is placed for desktop and smaller viewports, while renderer sizing and scroll timelines respond to window resizing.',
      },
      {
        title: 'Motion and rendering care',
        description:
          'The character scene caps device pixel ratio at 1.5, cleans up listeners and animation resources, and avoids character motion when reduced motion is requested.',
      },
    ],
    workflow: [
      'Arrive at the landing section and meet the portfolio owner through the animated introduction.',
      'Scroll through the profile and skills sections while the character scene and camera respond to scroll progress.',
      'Explore career information and featured work, using the carousel controls to move between work entries.',
      'Continue to the tech stack and contact sections, or use the navigation and social links to reach other destinations.',
    ],
    technologies: [
      { name: 'React', role: 'Composes the portfolio from page sections and interactive components.' },
      { name: 'TypeScript', role: 'Types component props, scene state, and browser interaction code.' },
      { name: 'Three.js', role: 'Creates the WebGL scene, renderer, camera, lighting, and animated character presentation.' },
      { name: 'GSAP', role: 'Coordinates scroll-triggered timelines and scene transitions.' },
      { name: 'Vite', role: 'Provides the development server and production build pipeline.' },
      { name: 'Tailwind CSS', role: 'Supplies utility classes for the project’s responsive interface styling.' },
    ],
    implementation: [
      'The main container composes the landing, about, capabilities, career, work, and contact components, and defers loading the tech-stack component until it approaches the viewport on desktop.',
      'The character scene creates an antialiased WebGL renderer, caps pixel ratio, handles resize events, and connects mouse or touch movement to the model.',
      'ScrollTrigger timelines animate the camera and character across sections; the motion utilities check reduced-motion preferences before enabling those animations.',
      'The portfolio’s Work component uses a React state-driven carousel with previous and next controls.',
    ],
    challenges: [
      {
        challenge: 'A live 3D scene needs to resize with its container and avoid unnecessarily expensive rendering on high-density screens.',
        solution: 'The scene recalculates renderer and camera dimensions on resize and caps renderer pixel ratio to a maximum of 1.5.',
      },
      {
        challenge: 'Large scroll-linked scenes can be distracting or unsuitable for visitors who prefer reduced motion.',
        solution: 'The animation utilities check the reduced-motion preference, and scene motion is skipped when that preference is active.',
      },
    ],
    useCases: [
      'Presenting a developer’s background, skills, work samples, and contact options in one portfolio.',
      'Demonstrating the integration of a Three.js scene with a React interface.',
      'Exploring responsive interaction patterns that combine pointer, touch, and scroll input.',
    ],
    learning: [
      'How to coordinate a Three.js render loop and model interactions with React component lifecycle and cleanup.',
      'How GSAP ScrollTrigger can link camera and scene transitions to page sections.',
      'How to account for resize behavior, touch input, rendering cost, and reduced motion in an animation-heavy interface.',
    ],
  },
  'calcx-pro-calculator': {
    summary:
      'A responsive arithmetic and scientific calculator with calculation history, conversion tools, and an installable PWA shell.',
    overview: [
      'CalcX-Pro is a calculator for quick everyday arithmetic and more advanced scientific expressions. Visitors can switch between standard and scientific modes, enter expressions with the keypad or physical keyboard, and see a live preview while completing an expression.',
      'The surrounding tools make it more than a keypad: the app includes calculation history, memory controls, angle-unit selection, a unit converter, and persisted calculator state. Its Vite PWA configuration packages the static application for installation and caches build assets for offline access; live currency conversion still needs a network connection.',
    ],
    problem:
      'A basic calculator is not enough when a user needs scientific functions, a recoverable record of calculations, or common unit conversions in the same interface.',
    goals: [
      'Provide everyday arithmetic and scientific operations through distinct, understandable modes.',
      'Make longer expressions practical with keyboard entry, live preview, memory, and calculation history.',
      'Keep the calculator core available as an installable web app with offline caching for its static assets.',
    ],
    features: [
      {
        title: 'Standard and scientific modes',
        description:
          'Mode tabs switch between the standard keypad and a scientific keypad with expression, function, constant, and postfix-operation inputs.',
      },
      {
        title: 'Expression engine and live preview',
        description:
          'The app uses a dedicated calculation engine and shows a result preview for valid, complete expressions while the user is entering them.',
      },
      {
        title: 'Keyboard and memory controls',
        description:
          'Physical keyboard input is supported alongside the on-screen keypad, with shared memory clear, recall, add, and subtract controls.',
      },
      {
        title: 'Calculation history',
        description:
          'Users can revisit a previous calculation, remove individual history items, clear the history with confirmation, and export it as CSV.',
      },
      {
        title: 'Unit and currency converter',
        description:
          'The converter supports category-based unit conversion and fetches live currency rates when the currency category is selected.',
      },
      {
        title: 'Installable PWA and offline assets',
        description:
          'Vite PWA generates a web app manifest and service worker, with Workbox precaching selected built assets and automatic service-worker updates.',
      },
    ],
    workflow: [
      'Choose Standard, Scientific, or Converter from the calculator’s mode controls.',
      'Enter values using the keypad or enabled physical keyboard; scientific mode also exposes angle-unit selection.',
      'Review the live expression preview and calculate the result.',
      'Open history to restore or manage calculations, or export the history as CSV.',
      'Install the app where supported; cached application assets can load offline, while live currency rates require connectivity.',
    ],
    technologies: [
      { name: 'React', role: 'Builds the calculator, history, converter, settings, and modal interfaces as reusable components.' },
      { name: 'TypeScript', role: 'Defines calculator state, actions, expression data, and component contracts.' },
      { name: 'Vite', role: 'Runs the development workflow and bundles the production application.' },
      { name: 'Tailwind CSS', role: 'Styles the responsive calculator interface and its design tokens.' },
      { name: 'Vite PWA / Workbox', role: 'Generates the installable web app manifest and service worker, and precaches selected static build assets.' },
    ],
    implementation: [
      'The calculator UI delegates state and operations to a custom hook and reducer, while expression work is separated into tokenizer, parser, evaluator, and validation modules.',
      'The source identifies its expression engine as Shunting Yard and passes the selected angle unit into calculation and live-preview evaluation.',
      'History and calculator preferences are hydrated from persisted state and saved through the persistence utilities; the history panel supports CSV export, selection, deletion, and confirmed clearing.',
      'The unit converter covers multiple categories and obtains live currency rates through a separate provider. Currency conversion is therefore not an offline feature.',
      'Vite PWA config enables automatic service-worker updates and Workbox precaching for configured static asset types.',
    ],
    challenges: [
      {
        challenge: 'Scientific expressions require more than directly evaluating a string of button presses.',
        solution: 'The repository separates tokenization, parsing, evaluation, and validation into engine modules and exposes a typed calculation result to the UI.',
      },
      {
        challenge: 'Offline use must be distinguished from features that need a live service.',
        solution: 'The PWA caches application assets, while the currency converter fetches rates when its category is selected and reports unavailable network data separately.',
      },
    ],
    useCases: [
      'Everyday arithmetic and scientific calculations from a desktop or mobile browser.',
      'Revisiting a previous calculation or keeping/exporting a calculation record.',
      'Converting supported units, with a network connection for live currency rates.',
      'Using the installable calculator shell when offline after its assets have been cached.',
    ],
    learning: [
      'How to split expression handling into tokenization, parsing, validation, and evaluation instead of coupling it to UI events.',
      'How reducer-driven state and persistence can support calculator modes, angle units, memory, and history.',
      'How to describe offline PWA behavior precisely when a specific feature still depends on a live API.',
    ],
  },
};
