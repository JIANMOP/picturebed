---
name: Frame - Dark
description: A quiet, gallery-inspired dark theme for an image hosting tool — the UI is the frame, the images are the art.

colors:
  primary: "#3B82F6"
  primary-hover: "#60A5FA"
  primary-light: "#1E3A5F"
  surface: "#1E293B"
  surface-raised: "#334155"
  background: "#0F172A"
  border: "#334155"
  border-hover: "#475569"
  text: "#F1F5F9"
  text-muted: "#64748B"
  success: "#22C55E"
  error: "#EF4444"
  warning: "#F59E0B"

typography:
  heading:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 1.5rem
    fontWeight: 600
  body:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
  mono:
    fontFamily: JetBrains Mono, Fira Code, monospace
    fontSize: 0.8125rem
  caption:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 0.75rem
    fontWeight: 400

rounded:
  sm: 6px
  md: 10px
  lg: 14px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px

components:
  upload-zone:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    borderColorHover: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "{spacing.xl}"
  sidebar:
    width: 56px
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  card-hover:
    backgroundColor: "{colors.surface-raised}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  input:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  input-focus:
    borderColor: "{colors.primary}"
---

## Overview

Dark gallery aesthetic. The UI is a quiet frame around the images — deep blue-black
background (`#0F172A`), layered gray surfaces, and a single blue accent (`#3B82F6`)
for interactive elements. Typography pairs Inter for UI with JetBrains Mono for
URLs and code. The design should feel calm and precise, like a well-lit gallery
at night.

## Colors

- **Primary (#3B82F6)**: The sole accent — buttons, links, focus rings, active nav.
- **Text (#F1F5F9)**: Near-white for body text, high contrast on dark backgrounds.
- **Text Muted (#64748B)**: Secondary info, captions, timestamps.
- **Surface (#1E293B)**: Card and panel backgrounds — one step above the base.
- **Surface Raised (#334155)**: Hover states, elevated panels.
- **Background (#0F172A)**: The page canvas — deep blue-black, not pure black.
- **Border (#334155)**: Subtle dividers and outlines.
- **Success/Error/Warning**: Green/Red/Yellow for status feedback.

## Typography

- **Inter**: All UI text — headings, body, labels, buttons.
- **JetBrains Mono**: URLs, code snippets, file sizes, config values.

## Layout

Left sidebar (56px fixed) + fluid right content area. Sidebar has icon-only
navigation links and a theme toggle at the bottom. Content area uses `max-w-5xl
mx-auto` centered layout with generous padding.

## Shapes

- Rounded corners: 6px (inputs, buttons), 10px (cards, dialogs), 14px (upload zone).
- No border-radius on sidebar or layout containers.
- Border width: 1px for dividers and card outlines.
