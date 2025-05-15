# Main Features of AutoBracketExtension

1. Basic auto-bracketing on focused text element
2. Textbox highlighting
    - On focused textbox: highlight textbox by giving it a dark green background, a text color of a nearly white shade of green, and placeholder text is the same color as the text color, but just a tiny bit darker. Cursor/Carot is white.
    - On lost focus textbox: textbox formatting is restored to original formatting
    
3. Special Tab behavior: whenever cursor is inside pair of bracketing characters--like parenthesis--pressing Tab has special behavior, illustrated by following table:

> **NOTE:** The following table details the resulting text plus the position of the cursor after a key is pressed. In the Result Text & Cursor State column, a '_' represents the cursor's position.

|Step #|Key Pressed|Result Text & Cursor State|
|--|--|--|
| 0. |  | '' |
| 1. | '(' | '(_) ' |
| 2. | 'X' | '(X_) ' |
| 3. | Tab | '(X) _' |

**NOTE:** Respect all whitespace in table. For instance, in steps 1, 2, and three there is an extra Space character at the end of the result text. This is to move the cursor one character beyond the next closing bracketing character.