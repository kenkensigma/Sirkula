# EXECUTION PROMPT — Green & White Authentication Pages

Act as a senior frontend engineer and UI/UX designer. Build a polished, production-quality **Login and Register experience** inspired by the uploaded authentication design reference.

Your goal is to recreate the reference's overall layout, visual hierarchy, spacing, and composition while developing an original green-and-white visual identity. Do not copy the original branding, purple color scheme, or illustration directly.

## 1. First, Inspect the Project

Before writing any code:

- Inspect the existing project structure, framework, dependencies, routing, and styling conventions.
- Read any available `system.md`, `design.md`, `prompt.md`, and `antislop.md` files. Treat these as project-specific instructions when present.
- Identify the existing authentication logic and reuse it if available.
- Preserve the current tech stack and avoid unnecessary dependency changes.
- If the project is empty or incomplete, establish the minimum structure needed to implement the authentication pages properly.

Do not stop after analyzing the project. Proceed with the actual implementation.

## 2. Design Direction

**Design concept:** Modern Minimalist Authentication with Soft Green Accents.

Create an elegant authentication interface inspired by the uploaded reference image.

The design should feel:
- Clean, modern, and welcoming.
- Minimalist without feeling empty or generic.
- Professional enough for a SaaS product or modern web application.
- Visually balanced, with a functional form on the left and a large illustrated visual on the right.

Avoid excessive decoration, generic dashboard aesthetics, and unnecessary UI elements.

## 3. Color Palette

Use the following green-and-white palette consistently throughout both pages.

| Token | Color | Usage |
|---|---|---|
| Primary Green | `#16A34A` | Primary buttons and key actions |
| Deep Green | `#166534` | Headings, emphasis, and strong accents |
| Soft Green | `#DCFCE7` | Illustration background and subtle highlights |
| Pale Green | `#F0FDF4` | Secondary surfaces |
| White | `#FFFFFF` | Main authentication card and form background |
| Page Gray | `#F3F4F3` | Outer page background |
| Text Primary | `#171717` | Main headings and form labels |
| Text Secondary | `#737373` | Supporting descriptions |
| Border | `#E5E7EB` | Input borders and subtle separators |
| Error | `#DC2626` | Validation errors |

Use green as a deliberate accent rather than painting every element green. Maintain strong contrast and a predominantly white interface.

## 4. Overall Layout

Build a large, horizontally oriented authentication container centered in the viewport.

### Desktop Layout

- Use a light gray outer background.
- Center a large white container with generous internal spacing.
- Give the container approximately `20–24px` rounded corners.
- Use a two-column layout:
  - **Left column:** Authentication form.
  - **Right column:** Large visual illustration.
- Keep the form vertically centered within its column.
- Let the right-side illustration occupy approximately 48–52% of the container width.
- Use consistent padding and carefully controlled spacing.
- Avoid unnecessary borders, heavy shadows, or excessive card nesting.

The result should resemble a refined authentication landing page rather than a conventional dashboard login screen.

### Left Column — Form

Include the following elements in this order:

1. A small brand mark and brand name near the top.
2. A prominent page heading.
3. A short supporting description.
4. Email input.
5. Password input.
6. A secondary row for password-related actions.
7. A prominent green submit button.
8. A small footer with a link to the alternate authentication page.

Keep the form relatively narrow, approximately `360–420px` at desktop sizes.

Use a bold, clean sans-serif typeface with a clear hierarchy. Headings should be prominent without becoming oversized.

## 5. Login Page

Create a login page with the following content:

**Brand:** Use the existing project brand if one exists. Otherwise, use a neutral placeholder brand that can be easily replaced.

**Heading:**
"Welcome Back"

**Supporting text:**
"Sign in to continue to your account."

**Form fields:**
- Email Address
- Password

**Additional controls:**
- Remember me checkbox.
- Forgot password link, only if a corresponding route or flow exists.

**Primary button:**
"Sign In"

**Footer:**
"Don't have an account? Create an account"

The footer link should navigate to the registration page.

### Login Interactions

- Use properly labeled form fields.
- Include appropriate email and password input types.
- Provide a password visibility toggle.
- Show loading feedback during submission.
- Disable repeated submissions while a request is processing.
- Display clear, accessible validation and authentication error messages.
- Preserve existing authentication behavior instead of replacing it with a fake success flow.

## 6. Register Page

Create a matching registration page that shares the same design system and overall layout.

**Heading:**
"Create Your Account"

**Supporting text:**
"Get started by creating your account."

**Form fields:**
- Full Name
- Email Address
- Password
- Confirm Password

**Primary button:**
"Create Account"

**Footer:**
"Already have an account? Sign In"

The footer link should navigate back to the login page.

### Registration Interactions

- Validate required fields.
- Validate email format.
- Require a reasonable minimum password length consistent with the project's authentication requirements.
- Confirm that both password fields match.
- Include password visibility controls.
- Show loading and error states.
- Display success feedback only when the registration operation actually succeeds.
- If the project has an existing registration API, connect to it instead of implementing a fake frontend-only flow.

If the application supports additional requirements, such as terms acceptance or email verification, integrate them only when they are relevant to the existing system.

## 7. Right-Side Illustration

Create a visually engaging illustration area inspired by the reference image.

Use a soft green background with a subtle green tonal variation. Avoid strong gradients that overwhelm the composition.

### Login Illustration

Represent a modern digital security concept, such as:

- A smartphone with a secure login interface.
- A fingerprint or shield symbol.
- A floating verification badge.
- Minimal cloud or geometric elements.
- A small illustrated character interacting with the interface, if suitable.

### Register Illustration

Use a complementary visual that communicates onboarding and account creation, such as:

- A profile card.
- A secure account creation interface.
- A verification badge.
- Simple geometric shapes and floating interface elements.

The illustrations should feel like parts of the same visual system.

### Illustration Implementation

Prefer the following approaches in order:

1. Reuse suitable illustration assets already present in the project.
2. Use an existing illustration library if the project already includes one.
3. Create a custom illustration with inline SVG or CSS when practical.
4. Use a suitable local image asset if one is available.

Do not introduce a large dependency solely for a decorative illustration.

Avoid emoji as illustration substitutes. Keep decorative shapes subordinate to the form and ensure they do not interfere with accessibility.

## 8. Typography and Components

Use the project's existing typography where appropriate. Otherwise, select a clean, readable sans-serif typeface.

Styling requirements:

- Strong heading hierarchy.
- Compact, readable supporting text.
- Consistent spacing between fields.
- Input height of approximately `46–50px`.
- Rounded input corners around `6–10px`.
- Clear focus states.
- Green primary buttons with white text.
- Subtle hover and active states.
- Consistent styling across login and registration pages.

Use reusable components where appropriate:

- `AuthLayout`
- `AuthBrand`
- `AuthInput`
- `PasswordInput`
- `AuthButton`
- `AuthIllustration`

Adapt component names and file organization to the existing project conventions.

Avoid duplicating large blocks of markup between the two pages.

## 9. Responsive Design

The experience must work well on desktop, tablet, and mobile.

### Desktop

Preserve the two-column layout and large illustration.

### Tablet

Reduce container padding and illustration size while keeping the form comfortable to use.

### Mobile

- Switch to a single-column layout.
- Keep the form fully visible and easy to interact with.
- Hide the illustration or replace it with a compact visual header when screen space is limited.
- Avoid horizontal scrolling.
- Allow the page to scroll naturally on short screens.
- Keep buttons and interactive controls comfortably touchable.

The design must remain polished at widths of `320px`, `375px`, `768px`, `1024px`, and `1440px`.

## 10. Animation and Microinteractions

Add restrained, smooth animations that improve the experience without slowing down the interface.

Suggested animations:

- A subtle fade-and-slide entrance for the authentication container.
- A gentle appearance animation for the illustration.
- Smooth input focus transitions.
- Button hover and active feedback.
- Subtle loading animation during form submission.
- Smooth transitions between login and register routes when appropriate.

Keep animations short and purposeful.

Respect `prefers-reduced-motion`. Do not add distracting floating objects, excessive parallax, or continuous motion without a clear design purpose.

## 11. Accessibility and Security

Follow accessible form design practices:

- Use semantic form elements.
- Associate every input with a visible or programmatic label.
- Support keyboard navigation.
- Provide visible focus indicators.
- Use appropriate autocomplete attributes, such as `email`, `current-password`, `new-password`, and `name`.
- Ensure sufficient color contrast.
- Announce relevant form errors accessibly.
- Do not rely on color alone to communicate errors.

For authentication behavior:

- Reuse the project's existing API, session, and authentication mechanisms.
- Never hardcode credentials, API secrets, or tokens.
- Never store plaintext passwords in browser storage.
- Do not treat frontend validation as a replacement for backend validation.
- Do not invent successful authentication responses.

## 12. Technical Requirements

- Follow the existing framework and project architecture.
- Use the existing routing solution.
- Reuse installed dependencies where possible.
- Keep components modular and maintainable.
- Use the project's existing styling system, whether Tailwind CSS, CSS Modules, or standard CSS.
- Avoid adding unnecessary packages.
- Ensure both pages render without console errors.
- Ensure links, buttons, validation, and form states behave correctly.
- Preserve unrelated application functionality.

If authentication endpoints are not available, implement the interface and its client-side validation without pretending that real authentication has been completed. Clearly identify any integration points that require a backend.

## 13. Anti-Generic Design Rules

Do not:

- Copy the purple palette from the reference.
- Replace the design with a generic centered login card.
- Use glassmorphism.
- Add excessive gradients or oversized shadows.
- Use too many rounded cards inside the main container.
- Add unnecessary navigation menus.
- Use emoji in place of real visual assets.
- Create fake authentication success messages.
- Invent a brand identity that conflicts with the existing project.
- Overcomplicate the illustration or make it visually louder than the form.
- Leave broken links, placeholder buttons, or nonfunctional controls.

Prioritize composition, whitespace, typography, alignment, and visual consistency.

## 14. Final Verification

After implementation:

1. Run the project's available linting and type-checking commands.
2. Run relevant tests if available.
3. Start the application and verify both authentication routes.
4. Test form validation and password visibility controls.
5. Verify navigation between login and registration.
6. Check responsive layouts at desktop and mobile widths.
7. Fix any implementation issues discovered during verification.

Do not stop after creating static markup or a design preview.https://127.0.0.1:64825/static/artifacts/52266201-b316-454a-b346-7ad0d13988af/.user_uploaded/media_1792818445924.png?csrf=fc205060-e711-43e6-8285-1d6cfdf549cb

## Final Deliverable

Implement complete, visually consistent Login and Register pages that closely follow the reference's two-column composition while establishing a distinctive green-and-white visual identity.

The final result should feel polished, intentional, responsive, accessible, and ready for integration with the application's real authentication system.

**Execution instruction:** Inspect the existing project first, follow its documentation, implement the pages directly in the codebase, and verify the finished result. Do not merely explain what should be built.