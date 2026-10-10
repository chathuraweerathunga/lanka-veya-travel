import { describe, expect, it } from "vitest";
import { mapEmbedFromInput } from "@/lib/map-location";

describe("mapEmbedFromInput", () => {
  it("accepts plain coordinates", () => {
    expect(mapEmbedFromInput("6.9271, 79.8612")).toBe("https://www.google.com/maps?q=6.927100,79.861200&z=15&output=embed");
  });
  it("prefers the place pin (!3d/!4d) over the map centre (@)", () => {
    const url = "https://www.google.com/maps/place/Lanka+Veya/@6.90,79.80,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d6.9271!4d79.8612";
    expect(mapEmbedFromInput(url)).toContain("q=6.927100,79.861200");
  });
  it("falls back to the @ centre", () => {
    expect(mapEmbedFromInput("https://www.google.com/maps/@7.2906,80.6337,14z")).toContain("q=7.290600,80.633700");
  });
  it("passes through Google's embed links", () => {
    const e = "https://www.google.com/maps/embed?pb=!1m18!1m12";
    expect(mapEmbedFromInput(e)).toBe(e);
  });
  it("rejects short links, names and out-of-range numbers", () => {
    expect(mapEmbedFromInput("https://maps.app.goo.gl/PhCNGJZ2jYwk6yYh9")).toBeNull();
    expect(mapEmbedFromInput("Lanka Veya Travel")).toBeNull();
    expect(mapEmbedFromInput("95, 200")).toBeNull();
    expect(mapEmbedFromInput("")).toBeNull();
  });
});
