// content.js

// --- Auto-bracket logic (modularized, but inlined here) ---
const autoBracket = (() => {
  const pairs = {
    "(": ")",
    "[": "]",
    "{": "}",
    '"': '"',
    "*": "*",
  };

  function handleBracketInsert({ text, cursorPos, selectionEnd, key }) {
    const hasSelection = selectionEnd > cursorPos;
    const selectedText = hasSelection
      ? text.slice(cursorPos, selectionEnd)
      : "";
    const closingChar = pairs[key];
    let newText, newCursorPos, highlightStart, highlightEnd;

    if (hasSelection) {
      newText =
        text.slice(0, cursorPos) +
        key +
        selectedText +
        closingChar +
        text.slice(selectionEnd);
      newCursorPos = cursorPos + selectedText.length + 2;
      highlightStart = cursorPos;
      highlightEnd = cursorPos + selectedText.length + 2;
    } else {
      newText =
        text.slice(0, cursorPos) + key + closingChar + text.slice(cursorPos);
      newCursorPos = cursorPos + 1;
      highlightStart = cursorPos;
      highlightEnd = cursorPos + 2;
    }
    return { newText, newCursorPos, highlightStart, highlightEnd };
  }

  function handleSmartBackspace({ text, cursorPos }) {
    if (cursorPos === 0) return null;
    const prevChar = text[cursorPos - 1];
    const nextChar = text[cursorPos];
    if (pairs[prevChar] && nextChar === pairs[prevChar]) {
      let charactersToRemove = 2;
      if (text[cursorPos + 1] === " ") {
        charactersToRemove++;
      }
      const newText =
        text.slice(0, cursorPos - 1) +
        text.slice(cursorPos - 1 + charactersToRemove);
      return { newText, newCursorPos: cursorPos - 1 };
    }
    return null;
  }

  function handleSkipClosing({ text, cursorPos, key }) {
    if (text[cursorPos] === key) {
      return { newCursorPos: cursorPos + 1 };
    }
    return null;
  }

  function handleTabSpace({ text, cursorPos }) {
    const pairs = autoBracket.pairs;
    const openers = Object.keys(pairs);
    const closers = Object.values(pairs);

    // Find the innermost unmatched opener before the cursor
    let stack = [];
    for (let i = 0; i < cursorPos; i++) {
      const ch = text[i];
      if (openers.includes(ch)) {
        stack.push({ ch, pos: i });
      } else if (closers.includes(ch)) {
        if (stack.length && pairs[stack[stack.length - 1].ch] === ch) {
          stack.pop();
        }
      }
    }

    if (stack.length) {
      // The innermost opener
      const { ch: opener } = stack[stack.length - 1];
      const closer = pairs[opener];

      // Find the matching closer after the cursor
      let depth = 1;
      let closerPos = -1;
      for (let i = cursorPos; i < text.length; i++) {
        if (text[i] === opener) depth++;
        if (text[i] === closer) {
          depth--;
          if (depth === 0) {
            closerPos = i;
            break;
          }
        }
      }
      if (closerPos !== -1) {
        // If cursor is before or at the closer, move after closer and insert space if not present
        if (cursorPos <= closerPos) {
          const afterCloser = closerPos + 1;
          if (text[afterCloser] === ' ') {
            // Space already present, move cursor after space
            return {
              newText: text,
              newCursorPos: afterCloser + 1
            };
          } else {
            // Insert space after closer, cursor just after closer (before space)
            return {
              newText: text.slice(0, afterCloser) + ' ' + text.slice(afterCloser),
              newCursorPos: afterCloser + 1
            };
          }
        }
        // If cursor is after closer but before space, move after space
        if (cursorPos === closerPos + 1 && text[cursorPos] === ' ') {
          return {
            newText: text,
            newCursorPos: cursorPos + 1
          };
        }
        return null;
      }
      // If no closer found, fall through to symmetric fallback below
    }

    // Fallback for symmetric pairs (like * or ")
    if (
      cursorPos > 0 &&
      cursorPos < text.length &&
      (text[cursorPos] === '"' || text[cursorPos] === '*') &&
      text.slice(0, cursorPos).includes(text[cursorPos])
    ) {
      const afterCloser = cursorPos + 1;
      if (text[afterCloser] === ' ') {
        return {
          newText: text,
          newCursorPos: afterCloser + 1
        };
      } else {
        return {
          newText: text.slice(0, afterCloser) + ' ' + text.slice(afterCloser),
          newCursorPos: afterCloser + 1
        };
      }
    }

    return null;
  }

  return {
    handleBracketInsert,
    handleSmartBackspace,
    handleSkipClosing,
    handleTabSpace,
    pairs,
  };
})();

// --- UI and event logic ---
const originalStyles = new WeakMap();
let extensionEnabled = true;
let currentlyFocusedElement = null;

function applyHighlightStyles(target) {
  const computedStyle = getComputedStyle(target);
  originalStyles.set(target, {
    backgroundColor:
      target.style.backgroundColor || computedStyle.backgroundColor,
    color: target.style.color || computedStyle.color,
    placeholderColor: computedStyle.getPropertyValue("::placeholder") || "",
  });

  target.style.backgroundColor = "#1a3c34";
  target.style.color = "#e6f5e6";
  target.style.caretColor = "#ffffff";

  const styleId = "auto-bracket-placeholder-style";
  let styleElement = document.getElementById(styleId);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  const uniqueClass = `auto-bracket-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
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
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  currentlyFocusedElement = target;
  applyHighlightStyles(target);
}

function handleBlur(event) {
  if (!extensionEnabled) return;
  const target = event.target;
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  removeHighlightStyles(target);
  currentlyFocusedElement = null;
}

function handleKeydown(event) {
  if (!extensionEnabled) return;
  const target = event.target;
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  const cursorPos = target.selectionStart;
  const selectionEnd = target.selectionEnd;
  const text = target.value;

  // --- Smart Backspace for bracket pairs ---
  if (
    event.key === "Backspace" &&
    selectionEnd === cursorPos &&
    cursorPos > 0
  ) {
    const result = autoBracket.handleSmartBackspace({ text, cursorPos });
    if (result) {
      event.preventDefault();
      target.value = result.newText;
      target.selectionStart = target.selectionEnd = result.newCursorPos;
      return;
    }
  }

  if (autoBracket.pairs[event.key]) {
    event.preventDefault();
    const result = autoBracket.handleBracketInsert({
      text,
      cursorPos,
      selectionEnd,
      key: event.key,
    });
    target.value = result.newText;
    target.selectionStart = result.highlightStart;
    target.selectionEnd = result.highlightEnd;
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = result.newCursorPos;
    }, 0);
  } else if ([")", "]", "}", '"', "*"].includes(event.key)) {
    const result = autoBracket.handleSkipClosing({
      text,
      cursorPos,
      key: event.key,
    });
    if (result) {
      event.preventDefault();
      target.selectionStart = target.selectionEnd = result.newCursorPos;
    }
  } else if (event.key === "Tab") {
    const result = autoBracket.handleTabSpace({ text, cursorPos });
    if (result) {
      event.preventDefault();
      target.value = result.newText;
      target.selectionStart = target.selectionEnd = result.newCursorPos;
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

  chrome.runtime.sendMessage({
    action: "updateIcon",
    enabled: extensionEnabled,
  });
}

// Initialize event listeners
function setupEventListeners() {
  document.addEventListener("focus", handleFocus, true);
  document.addEventListener("blur", handleBlur, true);
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.ctrlKey && event.key === "m") {
        toggleExtension();
      } else {
        handleKeydown(event);
      }
    },
    true
  );
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    toggleExtension();
  }
});

// Start the extension
setupEventListeners();

// --- UNIT TESTS FOR AUTO-BRACKET LOGIC (only runs in test environments) ---
if (typeof describe === "function") {
  describe("autoBracket.handleBracketInsert", () => {
    it("inserts bracket pair at cursor with no selection", () => {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 1,
        selectionEnd: 1,
        key: "(",
      });
      expect(result.newText).toBe("f()oo");
      expect(result.newCursorPos).toBe(2);
      expect(result.highlightStart).toBe(1);
      expect(result.highlightEnd).toBe(3);
    });

    it("wraps selection with bracket pair", () => {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 0,
        selectionEnd: 3,
        key: "[",
      });
      expect(result.newText).toBe("[foo]");
      expect(result.newCursorPos).toBe(5);
      expect(result.highlightStart).toBe(0);
      expect(result.highlightEnd).toBe(5);
    });

    it("works at end of text", () => {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 3,
        selectionEnd: 3,
        key: "{",
      });
      expect(result.newText).toBe("foo{}");
      expect(result.newCursorPos).toBe(4);
      expect(result.highlightStart).toBe(3);
      expect(result.highlightEnd).toBe(5);
    });

    it("works at start of text", () => {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 0,
        selectionEnd: 0,
        key: '"',
      });
      expect(result.newText).toBe('""foo');
      expect(result.newCursorPos).toBe(1);
      expect(result.highlightStart).toBe(0);
      expect(result.highlightEnd).toBe(2);
    });

    it("works with * as bracket", () => {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 1,
        selectionEnd: 2,
        key: "*",
      });
      expect(result.newText).toBe("f*o*o");
      expect(result.newCursorPos).toBe(4);
      expect(result.highlightStart).toBe(1);
      expect(result.highlightEnd).toBe(4);
    });

    it("handles empty string", () => {
      const result = autoBracket.handleBracketInsert({
        text: "",
        cursorPos: 0,
        selectionEnd: 0,
        key: "(",
      });
      expect(result.newText).toBe("()");
      expect(result.newCursorPos).toBe(1);
      expect(result.highlightStart).toBe(0);
      expect(result.highlightEnd).toBe(2);
    });
  });

  describe("autoBracket.handleSmartBackspace", () => {
    it("removes bracket pair if cursor is between them", () => {
      const result = autoBracket.handleSmartBackspace({
        text: "f()",
        cursorPos: 2,
      });
      expect(result.newText).toBe("f");
      expect(result.newCursorPos).toBe(1);
    });

    it("removes bracket pair and space if present", () => {
      const result = autoBracket.handleSmartBackspace({
        text: "f() bar",
        cursorPos: 2,
      });
      expect(result.newText).toBe("fbar");
      expect(result.newCursorPos).toBe(1);
    });

    it("returns null if not between bracket pair", () => {
      const result = autoBracket.handleSmartBackspace({
        text: "foo",
        cursorPos: 2,
      });
      expect(result).toBeNull();
    });

    it("returns null at start of text", () => {
      const result = autoBracket.handleSmartBackspace({
        text: "()",
        cursorPos: 0,
      });
      expect(result).toBeNull();
    });

    it("removes * pair", () => {
      const result = autoBracket.handleSmartBackspace({
        text: "f**",
        cursorPos: 2,
      });
      expect(result.newText).toBe("f");
      expect(result.newCursorPos).toBe(1);
    });
  });

  describe("autoBracket.handleSkipClosing", () => {
    it("skips closing bracket if at cursor", () => {
      const result = autoBracket.handleSkipClosing({
        text: "()",
        cursorPos: 1,
        key: ")",
      });
      expect(result.newCursorPos).toBe(2);
    });

    it("returns null if not at closing", () => {
      const result = autoBracket.handleSkipClosing({
        text: "()",
        cursorPos: 0,
        key: ")",
      });
      expect(result).toBeNull();
    });

    it("works with ]", () => {
      const result = autoBracket.handleSkipClosing({
        text: "[]",
        cursorPos: 1,
        key: "]",
      });
      expect(result.newCursorPos).toBe(2);
    });

    it("works with *", () => {
      const result = autoBracket.handleSkipClosing({
        text: "**",
        cursorPos: 1,
        key: "*",
      });
      expect(result.newCursorPos).toBe(2);
    });
  });

  describe("autoBracket.handleTabSpace", () => {
    it("inserts space after closing bracket", () => {
      const result = autoBracket.handleTabSpace({
        text: "(foo)",
        cursorPos: 4,
      });
      expect(result.newText).toBe("(foo) ");
      expect(result.newCursorPos).toBe(6);
    });

    it("does nothing if no matching closing", () => {
      const result = autoBracket.handleTabSpace({ text: "(foo", cursorPos: 4 });
      expect(result).toBeNull();
    });

    it("does nothing if no opening before", () => {
      const result = autoBracket.handleTabSpace({ text: "foo)", cursorPos: 3 });
      expect(result).toBeNull();
    });

    it("works with nested brackets", () => {
      const result = autoBracket.handleTabSpace({
        text: "([foo])",
        cursorPos: 5,
      });
      expect(result.newText).toBe("([foo] )");
      expect(result.newCursorPos).toBe(7);
    });

    it("works with * as bracket", () => {
      const result = autoBracket.handleTabSpace({
        text: "*foo*",
        cursorPos: 4,
      });
      expect(result.newText).toBe("*foo* ");
      expect(result.newCursorPos).toBe(6);
    });
  });
}

// --- SIMPLE IN-BROWSER TESTS FOR AUTO-BRACKET LOGIC ---
(function () {
  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        `❌ ${message}\n   Expected: ${expected}\n   Actual:   ${actual}`
      );
    }
  }
  function assertNull(actual, message) {
    if (actual !== null) {
      throw new Error(
        `❌ ${message}\n   Expected: null\n   Actual:   ${actual}`
      );
    }
  }
  function runTest(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
    } catch (e) {
      console.error(e.message);
    }
  }
  function group(name, fn) {
    console.group(name);
    fn();
    console.groupEnd();
  }

  group("autoBracket.handleBracketInsert", function () {
    runTest("inserts bracket pair at cursor with no selection", function () {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 1,
        selectionEnd: 1,
        key: "(",
      });
      assertEqual(result.newText, "f()oo", "newText");
      assertEqual(result.newCursorPos, 2, "newCursorPos");
      assertEqual(result.highlightStart, 1, "highlightStart");
      assertEqual(result.highlightEnd, 3, "highlightEnd");
    });

    runTest("wraps selection with bracket pair", function () {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 0,
        selectionEnd: 3,
        key: "[",
      });
      assertEqual(result.newText, "[foo]", "newText");
      assertEqual(result.newCursorPos, 5, "newCursorPos");
      assertEqual(result.highlightStart, 0, "highlightStart");
      assertEqual(result.highlightEnd, 5, "highlightEnd");
    });

    runTest("works at end of text", function () {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 3,
        selectionEnd: 3,
        key: "{",
      });
      assertEqual(result.newText, "foo{}", "newText");
      assertEqual(result.newCursorPos, 4, "newCursorPos");
      assertEqual(result.highlightStart, 3, "highlightStart");
      assertEqual(result.highlightEnd, 5, "highlightEnd");
    });

    runTest("works at start of text", function () {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 0,
        selectionEnd: 0,
        key: '"',
      });
      assertEqual(result.newText, '""foo', "newText");
      assertEqual(result.newCursorPos, 1, "newCursorPos");
      assertEqual(result.highlightStart, 0, "highlightStart");
      assertEqual(result.highlightEnd, 2, "highlightEnd");
    });

    runTest("works with * as bracket", function () {
      const result = autoBracket.handleBracketInsert({
        text: "foo",
        cursorPos: 1,
        selectionEnd: 2,
        key: "*",
      });
      assertEqual(result.newText, "f*o*o", "newText");
      assertEqual(result.newCursorPos, 4, "newCursorPos");
      assertEqual(result.highlightStart, 1, "highlightStart");
      assertEqual(result.highlightEnd, 4, "highlightEnd");
    });

    runTest("handles empty string", function () {
      const result = autoBracket.handleBracketInsert({
        text: "",
        cursorPos: 0,
        selectionEnd: 0,
        key: "(",
      });
      assertEqual(result.newText, "()", "newText");
      assertEqual(result.newCursorPos, 1, "newCursorPos");
      assertEqual(result.highlightStart, 0, "highlightStart");
      assertEqual(result.highlightEnd, 2, "highlightEnd");
    });
  });

  group("autoBracket.handleSmartBackspace", function () {
    runTest("removes bracket pair if cursor is between them", function () {
      const result = autoBracket.handleSmartBackspace({
        text: "f()",
        cursorPos: 2,
      });
      assertEqual(result.newText, "f", "newText");
      assertEqual(result.newCursorPos, 1, "newCursorPos");
    });

    runTest("removes bracket pair and space if present", function () {
      const result = autoBracket.handleSmartBackspace({
        text: "f() bar",
        cursorPos: 2,
      });
      assertEqual(result.newText, "fbar", "newText");
      assertEqual(result.newCursorPos, 1, "newCursorPos");
    });

    runTest("returns null if not between bracket pair", function () {
      const result = autoBracket.handleSmartBackspace({
        text: "foo",
        cursorPos: 2,
      });
      assertNull(result, "should return null");
    });

    runTest("returns null at start of text", function () {
      const result = autoBracket.handleSmartBackspace({
        text: "()",
        cursorPos: 0,
      });
      assertNull(result, "should return null");
    });

    runTest("removes * pair", function () {
      const result = autoBracket.handleSmartBackspace({
        text: "f**",
        cursorPos: 2,
      });
      assertEqual(result.newText, "f", "newText");
      assertEqual(result.newCursorPos, 1, "newCursorPos");
    });
  });

  group("autoBracket.handleSkipClosing", function () {
    runTest("skips closing bracket if at cursor", function () {
      const result = autoBracket.handleSkipClosing({
        text: "()",
        cursorPos: 1,
        key: ")",
      });
      assertEqual(result.newCursorPos, 2, "newCursorPos");
    });

    runTest("returns null if not at closing", function () {
      const result = autoBracket.handleSkipClosing({
        text: "()",
        cursorPos: 0,
        key: ")",
      });
      assertNull(result, "should return null");
    });

    runTest("works with ]", function () {
      const result = autoBracket.handleSkipClosing({
        text: "[]",
        cursorPos: 1,
        key: "]",
      });
      assertEqual(result.newCursorPos, 2, "newCursorPos");
    });

    runTest("works with *", function () {
      const result = autoBracket.handleSkipClosing({
        text: "**",
        cursorPos: 1,
        key: "*",
      });
      assertEqual(result.newCursorPos, 2, "newCursorPos");
    });
  });

  group("autoBracket.handleTabSpace", function () {
    runTest("inserts space after closing bracket", function () {
      const result = autoBracket.handleTabSpace({
        text: "(foo)",
        cursorPos: 4,
      });
      assertEqual(result.newText, "(foo) ", "newText");
      assertEqual(result.newCursorPos, 6, "newCursorPos");
    });

    runTest("does nothing if no matching closing", function () {
      const result = autoBracket.handleTabSpace({ text: "(foo", cursorPos: 4 });
      assertNull(result, "should return null");
    });

    runTest("does nothing if no opening before", function () {
      const result = autoBracket.handleTabSpace({ text: "foo)", cursorPos: 3 });
      assertNull(result, "should return null");
    });

    runTest("works with nested brackets", function () {
      const result = autoBracket.handleTabSpace({
        text: "([foo])",
        cursorPos: 5,
      });
      assertEqual(result.newText, "([foo] )", "newText");
      assertEqual(result.newCursorPos, 7, "newCursorPos");
    });

    runTest("works with * as bracket", function () {
      const result = autoBracket.handleTabSpace({
        text: "*foo*",
        cursorPos: 4,
      });
      assertEqual(result.newText, "*foo* ");
      assertEqual(result.newCursorPos, 6);
    });
  });

  console.log("All autoBracket tests complete.");
})();
