# Frontend Skill

## Core Principles
- User experience comes first — performance, accessibility, responsiveness
- Component-based architecture with clear data flow
- Progressive enhancement when possible
- Mobile-first responsive design
- Semantic HTML with ARIA labels for accessibility

## React/Component Patterns
- Keep components small and focused
- Lift state up to the nearest common ancestor
- Use composition patterns (render props, children, hooks)
- Memoize expensive computations (useMemo, useCallback)
- Avoid unnecessary re-renders

## CSS/Styling
- Use CSS modules, Tailwind, or styled-components (match project convention)
- Design tokens for colors, spacing, typography
- Responsive breakpoints (mobile-first)
- Consistent spacing scale

## Testing
- Test user behavior, not implementation details
- Use testing library's accessibility queries (getByRole, getByLabelText)
- Test responsive layouts at key breakpoints
- Visual regression testing for critical UI

## Performance
- Lazy load routes and heavy components
- Optimize images (format, size, lazy loading)
- Minimize bundle size (tree shaking, code splitting)
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
