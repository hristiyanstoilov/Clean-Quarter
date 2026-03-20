import { capitalize, applyPasswordChecklist } from "../src/utils/helpers.js";

describe("helpers.js — capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("test")).toBe("Test");
    expect(capitalize("Тест")).toBe("Тест");
    expect(capitalize("clean")).toBe("Clean");
    expect(capitalize("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// applyPasswordChecklist
// ---------------------------------------------------------------------------

/**
 * Build a minimal fake DOM environment for the checklist tests:
 * - A fake input element with an addEventListener that stores the handler
 * - Four fake indicator elements with a classList that tracks classes
 */
function buildEnv() {
  let inputHandler = null;

  const input = {
    addEventListener: (_evt, fn) => {
      inputHandler = fn;
    },
  };

  const indicators = {};
  ["length", "uppercase", "lowercase", "digit"].forEach((key) => {
    const classes = new Set(["text-danger"]); // start as failing
    indicators[key] = {
      id: `pw-${key}`,
      classList: {
        toggle(cls, force) {
          if (force) classes.add(cls);
          else classes.delete(cls);
        },
        has: (cls) => classes.has(cls),
      },
    };
  });

  // Patch document.getElementById to return our fake elements
  const origGetById = global.document?.getElementById;
  const getById = (id) => {
    const entry = Object.values(indicators).find((el) => el.id === id);
    return entry || null;
  };

  return { input, indicators, getById, inputHandler: () => inputHandler };
}

describe("applyPasswordChecklist", () => {
  let savedGetById;

  beforeEach(() => {
    savedGetById = global.document?.getElementById;
  });

  afterEach(() => {
    if (savedGetById !== undefined) global.document.getElementById = savedGetById;
  });

  function wire(env) {
    global.document = global.document || {};
    global.document.getElementById = env.getById;

    applyPasswordChecklist(env.input, {
      length: "pw-length",
      uppercase: "pw-uppercase",
      lowercase: "pw-lowercase",
      digit: "pw-digit",
    });
  }

  function fire(env, value) {
    const handler = env.inputHandler();
    if (handler) handler({ target: { value } });
  }

  it("does nothing when inputEl is null", () => {
    // Should not throw
    expect(() =>
      applyPasswordChecklist(null, {
        length: "pw-length",
        uppercase: "pw-uppercase",
        lowercase: "pw-lowercase",
        digit: "pw-digit",
      })
    ).not.toThrow();
  });

  it("registers an input event listener on the element", () => {
    const env = buildEnv();
    wire(env);
    expect(env.inputHandler()).toBeTypeOf("function");
  });

  it("marks length indicator success when password >= 8 chars", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "Abcde123");
    expect(env.indicators.length.classList.has("text-success")).toBe(true);
  });

  it("marks length indicator danger when password < 8 chars", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "Ab1");
    expect(env.indicators.length.classList.has("text-danger")).toBe(true);
  });

  it("marks uppercase indicator success when password has uppercase", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "Abcde123");
    expect(env.indicators.uppercase.classList.has("text-success")).toBe(true);
  });

  it("marks uppercase indicator danger when password has no uppercase", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "abcde123");
    expect(env.indicators.uppercase.classList.has("text-danger")).toBe(true);
  });

  it("marks lowercase indicator success when password has lowercase", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "Abcde123");
    expect(env.indicators.lowercase.classList.has("text-success")).toBe(true);
  });

  it("marks lowercase indicator danger when password has no lowercase", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "ABCDE123");
    expect(env.indicators.lowercase.classList.has("text-danger")).toBe(true);
  });

  it("marks digit indicator success when password has a digit", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "Abcde123");
    expect(env.indicators.digit.classList.has("text-success")).toBe(true);
  });

  it("marks digit indicator danger when password has no digit", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "Abcdefgh");
    expect(env.indicators.digit.classList.has("text-danger")).toBe(true);
  });

  it("all indicators success for a strong password", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "Secure123");
    ["length", "uppercase", "lowercase", "digit"].forEach((key) => {
      expect(env.indicators[key].classList.has("text-success")).toBe(true);
    });
  });

  it("all indicators danger for an empty password", () => {
    const env = buildEnv();
    wire(env);
    fire(env, "");
    ["length", "uppercase", "lowercase", "digit"].forEach((key) => {
      expect(env.indicators[key].classList.has("text-danger")).toBe(true);
    });
  });

  it("updates correctly when user types progressively", () => {
    const env = buildEnv();
    wire(env);

    fire(env, "a"); // short, no upper, has lower, no digit
    expect(env.indicators.length.classList.has("text-danger")).toBe(true);
    expect(env.indicators.lowercase.classList.has("text-success")).toBe(true);

    fire(env, "Secure123"); // all pass
    ["length", "uppercase", "lowercase", "digit"].forEach((key) => {
      expect(env.indicators[key].classList.has("text-success")).toBe(true);
    });
  });
});
