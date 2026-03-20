// Tests for src/services/compressor.js
// compressImage uses canvas + URL.createObjectURL — both mocked here.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Browser API mocks (canvas, URL, Image)
// ---------------------------------------------------------------------------

// Minimal canvas mock
const mockCtx = { drawImage: vi.fn() };
const mockCanvas = {
  getContext: vi.fn(() => mockCtx),
  toBlob: vi.fn((cb) => cb(new Blob(["fake"], { type: "image/jpeg" }))),
  width: 0,
  height: 0,
};
vi.stubGlobal("document", {
  createElement: vi.fn((tag) => {
    if (tag === "canvas") return mockCanvas;
    return {};
  }),
});

vi.stubGlobal("URL", {
  createObjectURL: vi.fn(() => "blob:fake-url"),
  revokeObjectURL: vi.fn(),
});

// Image mock — resolves onload synchronously.
// naturalWidth/naturalHeight are set on the prototype in beforeEach so
// individual tests can override them without instance-property shadowing.
class MockImage {
  constructor() {
    this._src = "";
  }
  set src(val) {
    this._src = val;
    Promise.resolve().then(() => this.onload?.());
  }
  get src() { return this._src; }
}
MockImage.prototype.naturalWidth = 800;
MockImage.prototype.naturalHeight = 600;
vi.stubGlobal("Image", MockImage);

// ---------------------------------------------------------------------------
// Re-import after mocks are set up
// ---------------------------------------------------------------------------
const { compressImage } = await import("../src/services/compressor.js");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("compressImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default image size
    MockImage.prototype.naturalWidth = 800;
    MockImage.prototype.naturalHeight = 600;
    // Reset toBlob to return a valid Blob
    mockCanvas.toBlob = vi.fn((cb) => cb(new Blob(["fake"], { type: "image/jpeg" })));
  });

  it("throws TypeError if input is not a File", async () => {
    await expect(compressImage("not-a-file")).rejects.toThrow(TypeError);
    await expect(compressImage(null)).rejects.toThrow(TypeError);
    await expect(compressImage(123)).rejects.toThrow(TypeError);
  });

  it("throws TypeError if file is not an image", async () => {
    const pdf = new File(["data"], "doc.pdf", { type: "application/pdf" });
    await expect(compressImage(pdf)).rejects.toThrow(TypeError);
  });

  it("returns a File instance", async () => {
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    const result = await compressImage(file);
    expect(result).toBeInstanceOf(File);
  });

  it("output file has image/jpeg type", async () => {
    const file = new File(["img"], "photo.png", { type: "image/png" });
    const result = await compressImage(file);
    expect(result.type).toBe("image/jpeg");
  });

  it("output filename has .jpg extension", async () => {
    const file = new File(["img"], "photo.png", { type: "image/png" });
    const result = await compressImage(file);
    expect(result.name).toBe("photo.jpg");
  });

  it("keeps original filename base (no extension in original name)", async () => {
    const file = new File(["img"], "myphoto", { type: "image/jpeg" });
    const result = await compressImage(file);
    expect(result.name).toBe("myphoto.jpg");
  });

  it("does NOT resize image when width <= maxWidth", async () => {
    MockImage.prototype.naturalWidth = 800;
    MockImage.prototype.naturalHeight = 600;
    const file = new File(["img"], "small.jpg", { type: "image/jpeg" });

    await compressImage(file, 1200, 0.75);

    // canvas should be set to original dimensions
    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(600);
  });

  it("resizes image proportionally when width > maxWidth", async () => {
    MockImage.prototype.naturalWidth = 2400;
    MockImage.prototype.naturalHeight = 1800;
    const file = new File(["img"], "large.jpg", { type: "image/jpeg" });

    await compressImage(file, 1200, 0.75);

    // ratio = 1200/2400 = 0.5 → 1200×900
    expect(mockCanvas.width).toBe(1200);
    expect(mockCanvas.height).toBe(900);
  });

  it("calls toBlob with clamped quality", async () => {
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await compressImage(file, 1024, 0.7);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/jpeg",
      0.7
    );
  });

  it("clamps quality above 1 to 1", async () => {
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await compressImage(file, 1024, 1.5);
    const calledQuality = mockCanvas.toBlob.mock.calls[0][2];
    expect(calledQuality).toBe(1);
  });

  it("clamps quality below 0 to 0", async () => {
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await compressImage(file, 1024, -0.5);
    const calledQuality = mockCanvas.toBlob.mock.calls[0][2];
    expect(calledQuality).toBe(0);
  });

  it("revokes the object URL after compression (no memory leak)", async () => {
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await compressImage(file);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });

  it("throws if toBlob returns null", async () => {
    mockCanvas.toBlob = vi.fn((cb) => cb(null));
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    await expect(compressImage(file)).rejects.toThrow("Image compression failed");
  });

  it("uses default maxWidth=1024 and quality=0.7 when not provided", async () => {
    MockImage.prototype.naturalWidth = 2000;
    MockImage.prototype.naturalHeight = 1000;
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });

    await compressImage(file);

    // Default maxWidth=1024 → ratio = 1024/2000 = 0.512 → 1024×512
    expect(mockCanvas.width).toBe(1024);
    expect(mockCanvas.height).toBe(512);
    const calledQuality = mockCanvas.toBlob.mock.calls[0][2];
    expect(calledQuality).toBe(0.7);
  });
});
