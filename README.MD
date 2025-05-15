# AutoBracketExtension

A Chrome extension that brings IDE-like auto-bracketing and enhanced text input features to any textbox or textarea on a webpage. It simplifies coding and text entry by automatically handling bracket/quote pairs, highlighting focused textboxes, and providing smart Tab navigation within bracketed content.

## Features

### 1. Auto-Bracketing for Brackets and Quotes
Automatically inserts matching closing brackets or quotes when you type an opening character, and smartly handles closing characters to prevent duplicates. Supports parentheses `()`, square brackets `[]`, curly braces `{}`, double quotes `""`, and single quotes `''`.

- **Behavior**:
  - Typing an opening character (e.g., `(`) inserts the pair (e.g., `()`) with the cursor placed between them and adds a trailing space.
  - If text is selected, the selected text is wrapped with the bracket/quote pair.
  - Typing a closing character (e.g., `)`) when the cursor is before an existing closing character moves the cursor past it instead of inserting a duplicate.
- **Example**:
  - Type `(` → Result: `(_) ` (cursor between parentheses, space after `)`).
  - Select `hello` and type `"` → Result: `"hello" _` (cursor after quote, space added).
  - Type `)` before an existing `)` → Cursor moves past `)` without adding another.

### 2. Textbox Highlighting
Enhances the visual feedback for focused textboxes and textareas with a distinct color scheme, reverting to original styles when focus is lost.

- **On Focus**:
  - Background: Dark green (`#1a3c34`).
  - Text: Nearly white green shade (`#e6f5e6`).
  - Placeholder: Slightly darker green than text (`#d4e6d4`).
  - Cursor/Caret: White (`#ffffff`).
- **On Blur**:
  - Restores the textbox’s original background, text color, placeholder color, and caret style.
- **Example**:
  - Click into a textbox → It turns dark green with white-green text and a white cursor.
  - Click away → The textbox reverts to its default appearance (e.g., white background, black text).

### 3. Smart Tab Navigation Within Bracket Pairs
When the cursor is inside a pair of brackets or quotes, pressing the Tab key moves the cursor to one position past the closing character, ensuring a space exists after the closing character for consistent cursor placement.

- **Behavior**:
  - If the cursor is between an opening and closing bracket/quote (e.g., `(` and `)`), Tab moves the cursor to the space after the closing character.
  - If no space exists after the closing character, a space is automatically added.
  - Applies to `()`, `[]`, `{}`, `""`, and `''`.
- **Example** (as per the following table):
  - The table below shows the text and cursor position (`_`) after each key press, starting from an empty textbox.

  | Step # | Key Pressed | Result Text & Cursor State |
  |--------|-------------|----------------------------|
  | 0.     |             | ''                         |
  | 1.     | `(`         | `(_) `                     |
  | 2.     | `X`         | `(X_) `                    |
  | 3.     | Tab         | `(X) _`                    |

  **Note**: The trailing space in steps 1–3 ensures the cursor lands one character beyond the closing bracket after Tab, as shown in `(X) _`.

- **Additional Cases**:
  - If the space after the closing bracket is missing (e.g., `(X)`), pressing Tab adds a space, resulting in `(X) _`.
  - overgrown to ensure the cursor always lands on a space.

## Installation

1. **Download or Clone the Repository**:
   - Clone this repository or download the ZIP file and extract it.

2. **Load the Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked** and select the folder containing the extension files (`manifest.json`, `content.js`).
   - The extension will appear in your extensions list and be active on all webpages.

3. **Verify**:
   - Open any webpage with a textbox or textarea (e.g., a form or code editor).
   - Test the features by typing brackets, focusing/blurring textboxes, and using Tab within bracket pairs.

## Usage

- **Auto-Bracketing**:
  - Type `(`, `[`, `{`, `"`, or `'` in any textbox to see the closing character appear automatically.
  - Select text and type a bracket/quote to wrap it.
  - Type a closing character before an existing one to skip past it.

- **Textbox Highlighting**:
  - Click into a textbox to see the dark green background and white-green text.
  - Click outside to restore the original appearance.

- **Smart Tab Navigation**:
  - Type a bracket pair (e.g., `()`), place the cursor inside (e.g., `(X_)`), and press Tab to jump to the space after the closing bracket (e.g., `(X) _`).
  - Try deleting the space and pressing Tab to see a new space added.

## Notes

- **Compatibility**: Works on any webpage with `<input>` or `<textarea>` elements, as specified in the `manifest.json` (`<all_urls>`).
- **Performance**: The extension uses lightweight event listeners and a `WeakMap` to store original styles, ensuring minimal impact on page performance.
- **Edge Cases**:
  - Nested brackets (e.g., `((X))`) are handled correctly; Tab jumps to the matching closing bracket.
  - If no closing bracket is found, Tab behaves normally (browser default).
  - The extension avoids interfering with other textbox behaviors (e.g., form submissions).
- **Limitations**:
  - Only applies to `<input>` and `<textarea>` elements, not contenteditable divs or other input types.
  - Placeholder color changes may not work in browsers with limited `::placeholder` support.

## Contributing

Feel free to submit issues or pull requests to improve the extension. Ideas for new features (e.g., support for additional characters, customizable colors) are welcome!

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by IDEs like Visual Studio Code and Sublime Text, which offer similar auto-bracketing and navigation features for coding efficiency.
