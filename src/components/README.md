# Components

How to add a component without breaking the look or the habits already here.

## Where it goes

| Folder | What lives there | Naming |
| --- | --- | --- |
| `src/components/ui/` | Small, reusable building blocks with no page knowledge: `Button`, `Input`, `Select`, `Status`, `FormCard`, `FormError`, `PageHeader`, `BrandNav`, `TreeSapling` | `PascalCase.tsx` |
| `src/components/` | Larger pieces that compose `ui/` parts into a page shape or hold app behavior: `OnboardingPage`, `StatusPage`, `GlobeCard`, `AuthHashListener` | `kebab-case.tsx` |
| `src/app/[locale]/<route>/` | A form or section used by one route only, such as `accept-form.tsx` | `kebab-case.tsx`, next to its `page.tsx` and `actions.ts` |

Start in the route folder. Move a component up to `components/` or `ui/` when a second place needs it, not before.

## Before writing one

1. **Check the Figma frame or symbol.** Match the real spacing, type size, and states. Base symbols are Button primary and secondary, Input, Status, and Brand mark.
2. **Look for an existing piece.** A page that needs a card plus actions should use `FormCard` or `StatusPage`, not a new wrapper.
3. **Decide server or client.** Default to a server component. Add `"use client"` only for state, effects, event handlers, or hooks such as `useActionState` and `useTranslations`. Both `Button` and `Input` are client components, so they work in either kind of page.

## Writing it

- **Props interface.** Declare `interface <Name>Props` above the component. Extend the native element's attributes (`InputHTMLAttributes<HTMLInputElement>`) when wrapping an HTML element, and spread the rest onto it.
- **Named export.** `export function Name`, no default exports.
- **Style with design tokens.** Colors and radius come from the CSS variables in `src/app/globals.css`, for example `bg-[var(--color-sage)]` and `rounded-[var(--radius-card)]`. Do not paste hex values. If a token is missing, add it to `:root` first.
- **Share class strings.** Styles used by more than one component go in a small module, as `field-styles.ts` does for `Input` and `Select`.
- **Variants are props.** Use a union such as `variant: "primary" | "secondary"` and map it to classes. Avoid separate near-copies of a component.
- **Widths.** Block elements fill their parent by default. Buttons that should keep their natural width pass `fullWidth={false}` and a `min-w-[222px]` class.
- **No hard-coded copy.** User-facing text is a message key in `messages/en.json`. Presentational components take text as props or `children`. Client forms call `useTranslations()`. Add keys under a namespace for the feature.
- **Accessibility.** Every input has a visible `<label>` tied by `htmlFor` and `id`. Buttons that do not submit a form use `type="button"`. Errors render as text, not only as color.
- **Empty and error states.** Return `null` when there is nothing to show, as `FormError` does.

## Testing it

Add `tests/ui/<name>.test.tsx` for `ui/` parts and `tests/<feature>/` for route-level forms. Use Testing Library and assert what a user sees: labels, roles, and the token classes that define the look. Wrap anything that calls `useTranslations` in `NextIntlClientProvider` with `messages/en.json`.

```tsx
render(
  <NextIntlClientProvider locale="en" messages={en}>
    <MyForm />
  </NextIntlClientProvider>
);
expect(screen.getByLabelText("Your name")).toBeInTheDocument();
```

## Checklist

- [ ] Matches the Figma frame at desktop and mobile widths
- [ ] Uses tokens, not hex values
- [ ] No hard-coded strings
- [ ] Server component unless it needs the browser
- [ ] Test added and `pnpm test --run`, `pnpm lint`, and `pnpm exec tsc --noEmit` pass
