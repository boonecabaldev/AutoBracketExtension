# AutoBracketExtension

A browser extension that provides IDE-like auto-bracketing and textbox highlighting features for all webpages.

## Features

### 1. Auto-Bracketing
- Automatically completes bracket/quote pairs when typing:
  - Parentheses: `(` → `(_) `
  - Square brackets: `[` → `[_] `
  - Curly braces: `{` → `{_} `
  - Quotes: `"` → `"_" ` and `'` → `'_' `
- When text is selected, wraps the selection with the pair
- Smart cursor placement between pairs
- Pressing closing character when it already exists moves cursor past it

### 2. Special Tab Behavior
- When inside a bracket/quote pair, Tab jumps to after the closing character
- Respects trailing space after pairs (as shown in examples below)

Example workflow:
| Step | Key Pressed | Result            |
|------|------------|-------------------|
| 1    | `(`        | `(_) `            |
| 2    | `X`        | `(X_) `           |
| 3    | `Tab`      | `(X) _`           |

### 3. Textbox Highlighting
- **Enabled**: 
  - Dark green background (`#1a3c34`)
  - Nearly white green text (`#e6f5e6`)
  - Slightly darker placeholder text (`#d4e6d4`)
  - White cursor/caret
- **Disabled**: Original styles restored

### 4. Toggle Methods
- **Keyboard Shortcut**: Ctrl+M (Cmd+M on Mac)
- **Extension Icon Click**: Click the toolbar icon to toggle

### 5. Visual Status Indicator
- **Green checkmark overlay**: Features enabled
- **Red X overlay**: Features disabled

## Installation

1. Clone this repository or download the source files
2. In Chrome/Edge:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension folder

## Requirements

- Chrome, Edge, or other Chromium-based browser (manifest v3 compatible)
- Icon files in `/icons` directory (provided in repository)

## Known Issues

- May conflict with websites that heavily modify textbox behavior
- Placeholder styling might not work on some older websites

## Future Enhancements

- Customizable keyboard shortcuts
- User-configurable highlight colors
- Per-site enable/disable preferences

---

**Note**: Both the auto-bracketing and highlighting features are toggled together using either the keyboard shortcut or extension icon click.