/** @jest-environment node */

import {
  resolveCountryInfo,
  cleanCountryCode,
  getFlagCdnUrl,
} from "@/lib/country-flags";
import { getCountryName } from "@/lib/utils";

describe("Country and Flags Verification Suite", () => {
  describe("resolveCountryInfo", () => {
    it("should correctly resolve Burkina Faso with city Ouagadougou", () => {
      const result = resolveCountryInfo({
        countryCode: "BF",
        city: "Ouagadougou",
      });

      expect(result.countryCode).toBe("BF");
      expect(result.countryName).toBe("Burkina Faso");
      expect(result.city).toBe("Ouagadougou");
      expect(result.flagUrl).toBe("https://flagcdn.com/w20/bf.png");
      expect(result.flagEmoji).toBe("🇧🇫");
      expect(result.isKnown).toBe(true);
    });

    it("should FIX the bug: when city is Ouagadougou and countryCode is BF, countryName MUST NOT be France", () => {
      // Représentation exacte du bug de la capture d'écran
      const buggyEvent = {
        countryCode: "BF",
        countryName: "France",
        city: "Ouagadougou",
      };

      const fixed = resolveCountryInfo(buggyEvent);

      expect(fixed.countryCode).toBe("BF");
      expect(fixed.countryName).toBe("Burkina Faso");
      expect(fixed.city).toBe("Ouagadougou");
      expect(fixed.flagUrl).toBe("https://flagcdn.com/w20/bf.png");
      expect(fixed.countryName).not.toBe("France");
    });

    it("should infer countryCode BF when city is Ouagadougou even if code was corrupted or set to FR", () => {
      const result = resolveCountryInfo({
        countryCode: "FR",
        countryName: "France",
        city: "Ouagadougou",
      });

      expect(result.countryCode).toBe("BF");
      expect(result.countryName).toBe("Burkina Faso");
      expect(result.city).toBe("Ouagadougou");
      expect(result.flagUrl).toBe("https://flagcdn.com/w20/bf.png");
    });

    it("should correctly resolve United Kingdom / London", () => {
      const result = resolveCountryInfo({
        countryCode: "GB",
        city: "London",
      });

      expect(result.countryCode).toBe("GB");
      expect(result.countryName).toBe("Royaume-Uni");
      expect(result.countryNameEn).toBe("United Kingdom");
      expect(result.flagUrl).toBe("https://flagcdn.com/w20/gb.png");
    });

    it("should correctly resolve United States / Ashburn", () => {
      const result = resolveCountryInfo({
        countryCode: "US",
        city: "Ashburn",
      });

      expect(result.countryCode).toBe("US");
      expect(result.countryName).toBe("États-Unis");
      expect(result.countryNameEn).toBe("United States");
      expect(result.flagUrl).toBe("https://flagcdn.com/w20/us.png");
    });

    it("should correctly resolve France / Paris", () => {
      const result = resolveCountryInfo({
        countryCode: "FR",
        city: "Paris",
      });

      expect(result.countryCode).toBe("FR");
      expect(result.countryName).toBe("France");
      expect(result.flagUrl).toBe("https://flagcdn.com/w20/fr.png");
    });

    it("should handle unknown / empty country codes gracefully without broken flag images", () => {
      const result = resolveCountryInfo({
        countryCode: "XX",
        city: "",
      });

      expect(result.countryCode).toBe("XX");
      expect(result.countryName).toBe("Inconnu");
      expect(result.flagUrl).toBe("");
      expect(result.flagEmoji).toBe("🌐");
      expect(result.isKnown).toBe(false);
    });
  });

  describe("getCountryName (lib/utils)", () => {
    it("should return French localized country names by default", () => {
      expect(getCountryName("BF")).toBe("Burkina Faso");
      expect(getCountryName("FR")).toBe("France");
      expect(getCountryName("GB")).toBe("Royaume-Uni");
      expect(getCountryName("US")).toBe("États-Unis");
      expect(getCountryName("DE")).toBe("Allemagne");
      expect(getCountryName("CA")).toBe("Canada");
      expect(getCountryName("CI")).toBe("Côte d'Ivoire");
      expect(getCountryName("SN")).toBe("Sénégal");
    });

    it("should return English country names when requested", () => {
      expect(getCountryName("GB", "en")).toBe("United Kingdom");
      expect(getCountryName("US", "en")).toBe("United States");
      expect(getCountryName("DE", "en")).toBe("Germany");
      expect(getCountryName("CI", "en")).toBe("Ivory Coast");
    });
  });

  describe("Flag URLs and country codes normalization", () => {
    it("should normalize lowercase and padded codes", () => {
      expect(cleanCountryCode("  bf ")).toBe("BF");
      expect(cleanCountryCode("gb")).toBe("GB");
      expect(cleanCountryCode("")).toBe("XX");
      expect(cleanCountryCode(null)).toBe("XX");
    });

    it("should generate valid FlagCDN URLs", () => {
      expect(getFlagCdnUrl("BF")).toBe("https://flagcdn.com/w20/bf.png");
      expect(getFlagCdnUrl("FR", 40)).toBe("https://flagcdn.com/w40/fr.png");
      expect(getFlagCdnUrl("XX")).toBe("");
    });
  });
});
