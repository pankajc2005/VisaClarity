import { describe, expect, it } from "bun:test";
import {
  flattenCitations,
  type ResearchBundle,
  type ResearchCitation,
} from "./personalized-roadmap-research.server";

describe("flattenCitations", () => {
  it("should return an empty array when given no bundles", () => {
    expect(flattenCitations([])).toEqual([]);
  });

  it("should flatten a single bundle with citations", () => {
    const citation1: ResearchCitation = { title: "T1", url: "U1", snippet: "S1" };
    const citation2: ResearchCitation = { title: "T2", url: "U2", snippet: "S2" };
    const bundles: ResearchBundle[] = [
      {
        topic: "Topic 1",
        citations: [citation1, citation2],
      },
    ];

    expect(flattenCitations(bundles)).toEqual([citation1, citation2]);
  });

  it("should flatten multiple bundles with citations", () => {
    const citation1: ResearchCitation = { title: "T1", url: "U1", snippet: "S1" };
    const citation2: ResearchCitation = { title: "T2", url: "U2", snippet: "S2" };
    const citation3: ResearchCitation = { title: "T3", url: "U3", snippet: "S3" };
    const bundles: ResearchBundle[] = [
      {
        topic: "Topic 1",
        citations: [citation1],
      },
      {
        topic: "Topic 2",
        citations: [citation2, citation3],
      },
    ];

    expect(flattenCitations(bundles)).toEqual([citation1, citation2, citation3]);
  });

  it("should handle bundles with empty citations", () => {
    const citation1: ResearchCitation = { title: "T1", url: "U1", snippet: "S1" };
    const bundles: ResearchBundle[] = [
      {
        topic: "Topic 1",
        citations: [],
      },
      {
        topic: "Topic 2",
        citations: [citation1],
      },
      {
        topic: "Topic 3",
        citations: [],
      },
    ];

    expect(flattenCitations(bundles)).toEqual([citation1]);
  });

  it("should preserve duplicate citations if they exist (deduplication happens in researchPersonalizedRoadmap)", () => {
    const citation1: ResearchCitation = { title: "T1", url: "U1", snippet: "S1" };
    const bundles: ResearchBundle[] = [
      {
        topic: "Topic 1",
        citations: [citation1],
      },
      {
        topic: "Topic 2",
        citations: [citation1],
      },
    ];

    expect(flattenCitations(bundles)).toEqual([citation1, citation1]);
  });
});
