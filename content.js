// Store original styles for each element to restore on blur
const originalStyles = new WeakMap();

document.addEventListener('focus', (event) => {
  const target = event.target;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;

  // Store original styles
  const computedStyle = getComputedStyle(target);
  originalStyles.set(target, {
    backgroundColor: target.style.backgroundColor || computedStyle.backgroundColor,
    color: target.style.color || computedStyle.color,
    placeholderColor: computedStyle.getPropertyValue('::placeholder') || ''
  });

  // Apply highlight styles
  target.style.backgroundColor = '#1a3c34'; // Dark green background
  target.style.color = '#e6f5e6'; // Nearly white green shade for text
  // Apply placeholder style using a dynamic style element for ::placeholder
  const styleId = 'auto-bracket-placeholder-style';
  let styleElement = document.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  // Target specific element using a unique class
  const uniqueClass = `auto-bracket-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  target.classList.add(uniqueClass);
  styleElement.textContent = `
    .${uniqueClass}::placeholder {
      color: #2a5c4a !important; /* Slightly darker green for placeholder */
    }
  `;
  // Store unique class for removal on blur
  target.dataset.autoBracketClass = uniqueClass;
}, true);

document.addEventListener('blur', (event) => {
  const target = event.target;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;

  // Restore original styles
  const styles = originalStyles.get(target);
  if (styles) {
    target.style.backgroundColor = styles.backgroundColor;
    target.style.color = styles.color;
    // Remove placeholder style
    const uniqueClass = target.dataset.autoBracketClass;
    if (uniqueClass) {
      target.classList.remove(uniqueClass);
      delete target.dataset.autoBracketClass;
    }
    originalStyles.delete(target);
  }
}, true);

document.addEventListener('keydown', (event) => {
  const target = event.target;
  // Check if the focused element is an input or textarea
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;

  const cursorPos = target.selectionStart;
  const selectionEnd = target.selectionEnd;
  const text = target.value;
  const hasSelection = selectionEnd > cursorPos;
  const selectedText = hasSelection ? text.slice(cursorPos, selectionEnd) : '';

  // Define bracket/quote pairs
  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'"
  };

  // Handle opening brackets/quotes
  if (pairs[event.key]) {
    event.preventDefault();
    const closingChar = pairs[event.key];
    let newText, newCursorPos, highlightStart, highlightEnd;

    if (hasSelection) {
      // Wrap selected text in brackets/quotes
      newText = text.slice(0, cursorPos) + event.key + selectedText + closingChar + ' ' + text.slice(selectionEnd);
      newCursorPos = cursorPos + selectedText.length + 2; // After closing char
      highlightStart = cursorPos; // Start of opening char
      highlightEnd = cursorPos + selectedText.length + 2; // End of closing char
    } else {
      // Insert new bracket/quote pair
      newText = text.slice(0, cursorPos) + event.key + closingChar + ' ' + text.slice(cursorPos);
      newCursorPos = cursorPos + 1; // Between pair
      highlightStart = cursorPos; // Start of opening char
      highlightEnd = cursorPos + 2; // End of closing char
    }

    // Update textbox
    target.value = newText;
    // Set cursor position
    target.selectionStart = target.selectionEnd = newCursorPos;
    // Highlight the pair
    target.selectionStart = highlightStart;
    target.selectionEnd = highlightEnd;

    // Schedule clearing the highlight to allow visual feedback
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = newCursorPos;
    }, 0);
  }
  // Handle closing brackets/quotes
  else if ([')', ']', '}', '"', "'"].includes(event.key)) {
    // Check if the next character matches the closing character
    if (text[cursorPos] === event.key) {
      event.preventDefault();
      // Move cursor past existing closing character
      target.selectionStart = target.selectionEnd = cursorPos + 1;
    }
    // Else, allow normal insertion (handled by browser)
  }
});