// content.js
const originalStyles = new WeakMap();
let extensionEnabled = true;
let currentlyFocusedElement = null;

function applyHighlightStyles(target) {
  const computedStyle = getComputedStyle(target);
  originalStyles.set(target, {
    backgroundColor: target.style.backgroundColor || computedStyle.backgroundColor,
    color: target.style.color || computedStyle.color,
    placeholderColor: computedStyle.getPropertyValue('::placeholder') || ''
  });

  target.style.backgroundColor = '#1a3c34';
  target.style.color = '#e6f5e6';
  target.style.caretColor = '#ffffff';
  
  const styleId = 'auto-bracket-placeholder-style';
  let styleElement = document.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  const uniqueClass = `auto-bracket-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  target.classList.add(uniqueClass);
  styleElement.textContent = `
    .${uniqueClass}::placeholder {
      color: #a1cda1 !important;
    }
  `;
  target.dataset.autoBracketClass = uniqueClass;
}

function removeHighlightStyles(target) {
  const styles = originalStyles.get(target);
  if (styles) {
    target.style.backgroundColor = styles.backgroundColor;
    target.style.color = styles.color;
    const uniqueClass = target.dataset.autoBracketClass;
    if (uniqueClass) {
      target.classList.remove(uniqueClass);
      delete target.dataset.autoBracketClass;
    }
    originalStyles.delete(target);
  }
}

function handleFocus(event) {
  if (!extensionEnabled) return;
  const target = event.target;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;

  currentlyFocusedElement = target;
  applyHighlightStyles(target);
}

function handleBlur(event) {
  if (!extensionEnabled) return;
  const target = event.target;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;

  removeHighlightStyles(target);
  currentlyFocusedElement = null;
}

function handleKeydown(event) {
  if (!extensionEnabled) return;
  const target = event.target;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;

  const cursorPos = target.selectionStart;
  const selectionEnd = target.selectionEnd;
  const text = target.value;
  const hasSelection = selectionEnd > cursorPos;
  const selectedText = hasSelection ? text.slice(cursorPos, selectionEnd) : '';

  const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    '*': '*'
  };

  // --- Smart Backspace for bracket pairs ---
  if (event.key === 'Backspace' && !hasSelection && cursorPos > 0) {
    const prevChar = text[cursorPos - 1];
    const nextChar = text[cursorPos];
    if (pairs[prevChar] && nextChar === pairs[prevChar]) {
      event.preventDefault();
      let charactersToRemove = 2; // For the pair
      if (text[cursorPos + 1] === ' ') { // Check for trailing space
        charactersToRemove++;
      }
      target.value = text.slice(0, cursorPos - 1) + text.slice(cursorPos -1 + charactersToRemove);
      target.selectionStart = target.selectionEnd = cursorPos - 1;
      return;
    }
  }
  if (pairs[event.key]) {
    event.preventDefault();
    const closingChar = pairs[event.key];
    let newText, newCursorPos, highlightStart, highlightEnd;

    if (hasSelection) {
      newText = text.slice(0, cursorPos) + event.key + selectedText + closingChar + ' ' + text.slice(selectionEnd);
      newCursorPos = cursorPos + selectedText.length + 2;
      highlightStart = cursorPos;
      highlightEnd = cursorPos + selectedText.length + 2;
    } else {
      newText = text.slice(0, cursorPos) + event.key + closingChar + ' ' + text.slice(cursorPos);
      newCursorPos = cursorPos + 1;
      highlightStart = cursorPos;
      highlightEnd = cursorPos + 2;
    }

    target.value = newText;
    target.selectionStart = target.selectionEnd = newCursorPos;
    target.selectionStart = highlightStart;
    target.selectionEnd = highlightEnd;

    setTimeout(() => {
      target.selectionStart = target.selectionEnd = newCursorPos;
    }, 0);
  }
  else if ([')', ']', '}', '"', '*'].includes(event.key)) {
    if (text[cursorPos] === event.key) {
      event.preventDefault();
      target.selectionStart = target.selectionEnd = cursorPos + 1;
    }
  }
  else if (event.key === 'Tab') {
    let leftPos = cursorPos - 1;
    let rightPos = cursorPos;
    let openingChar = null;
    let closingChar = null;

    while (leftPos >= 0) {
      const char = text[leftPos];
      if (['(', '[', '{', '"', '*'].includes(char)) {
        openingChar = char;
        closingChar = pairs[openingChar];
        break;
      }
      leftPos--;
    }

    if (openingChar) {
      while (rightPos < text.length) {
        if (text[rightPos] === closingChar) {
          event.preventDefault();
          let newCursorPos = rightPos + 1;
          if (text[newCursorPos] === ' ') {
            newCursorPos++;
          }
          target.selectionStart = target.selectionEnd = newCursorPos;
          break;
        }
        rightPos++;
      }
    }
  }
}

function toggleExtension() {
  extensionEnabled = !extensionEnabled;
  
  // If disabling and there's a focused element, remove its styles immediately
  if (!extensionEnabled && currentlyFocusedElement) {
    removeHighlightStyles(currentlyFocusedElement);
  }
  // If enabling and there's a focused element, apply styles immediately
  else if (extensionEnabled && currentlyFocusedElement) {
    applyHighlightStyles(currentlyFocusedElement);
  }
  
  chrome.runtime.sendMessage({action: "updateIcon", enabled: extensionEnabled});
}

// Initialize event listeners
function setupEventListeners() {
  document.addEventListener('focus', handleFocus, true);
  document.addEventListener('blur', handleBlur, true);
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'm') {
      toggleExtension();
    } else {
      handleKeydown(event);
    }
  }, true);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    toggleExtension();
  }
});

// Start the extension
setupEventListeners();
