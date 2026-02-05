// Integration тест за Supabase campaigns
import { describe, it, expect } from "vitest";
import supabase from "../supabase.js";

describe("Supabase campaigns integration", () => {
  let campaignId;
  const testCampaign = {
    title: "E2E Test Campaign",
    description: "Integration test description",
    location_lat: 42.65,
    location_lng: 23.37,
    status: "active",
    before_photo_url: "test-url",
    created_by: "00000000-0000-0000-0000-000000000000", // valid UUID for test
    neighborhood: "Дървеница",
  };

  it("създава нова кампания", async () => {
    const { data, error } = await supabase.from("campaigns").insert([testCampaign]).select();
    expect(error).toBeNull();
    expect(data).toBeDefined();
    campaignId = data[0]?.id;
    expect(campaignId).toBeDefined();
  });

  it("чете кампанията по id", async () => {
    const { data, error } = await supabase.from("campaigns").select().eq("id", campaignId);
    expect(error).toBeNull();
    expect(data[0].title).toBe(testCampaign.title);
  });
});
