import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  idPrefix?: string;
}

const PURPOSES = [
  "Tourism",
  "Student / Study",
  "Work",
  "Business",
  "Family Reunion",
  "Transit",
  "Medical Treatment",
  "Permanent Residency",
];

const NATIONALITIES = [
  "Afghan",
  "Albanian",
  "Algerian",
  "American",
  "Andorran",
  "Angolan",
  "Argentine",
  "Armenian",
  "Australian",
  "Austrian",
  "Azerbaijani",
  "Bahraini",
  "Bangladeshi",
  "Belarusian",
  "Belgian",
  "Bolivian",
  "Bosnian",
  "Brazilian",
  "British",
  "Bulgarian",
  "Cambodian",
  "Cameroonian",
  "Canadian",
  "Chilean",
  "Chinese",
  "Colombian",
  "Congolese",
  "Croatian",
  "Cuban",
  "Czech",
  "Danish",
  "Dutch",
  "Egyptian",
  "Emirati",
  "Estonian",
  "Ethiopian",
  "Filipino",
  "Finnish",
  "French",
  "Georgian",
  "German",
  "Ghanaian",
  "Greek",
  "Guatemalan",
  "Hungarian",
  "Indian",
  "Indonesian",
  "Iranian",
  "Iraqi",
  "Irish",
  "Israeli",
  "Italian",
  "Jamaican",
  "Japanese",
  "Jordanian",
  "Kazakhstani",
  "Kenyan",
  "Korean",
  "Kuwaiti",
  "Latvian",
  "Lebanese",
  "Lithuanian",
  "Malaysian",
  "Mexican",
  "Moroccan",
  "Nepalese",
  "New Zealander",
  "Nigerian",
  "Norwegian",
  "Pakistani",
  "Peruvian",
  "Polish",
  "Portuguese",
  "Qatari",
  "Romanian",
  "Russian",
  "Saudi",
  "Serbian",
  "Singaporean",
  "Slovak",
  "South African",
  "Spanish",
  "Sri Lankan",
  "Swedish",
  "Swiss",
  "Taiwanese",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Uruguayan",
  "Venezuelan",
  "Vietnamese",
  "Zimbabwean",
];

const DESTINATIONS = [
  "Australia",
  "Austria",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Egypt",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kenya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Norway",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "UAE",
  "United Kingdom",
  "United States",
  "Vietnam",
];

const selectChevron =
  "appearance-none bg-[length:10px] bg-[right_16px_center] bg-no-repeat bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 10 6%22><path fill=%22%237a746a%22 d=%22M0 0l5 6 5-6z%22/></svg>')]";

export function LeadForm({ idPrefix = "f1" }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPaid, tier } = useSubscription();
  const [step, setStep] = useState<1 | 2>(1);
  const [nationality, setNationality] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allThreeSelected = Boolean(nationality && destination && purpose);

  const selectBase =
    "w-full h-14 px-4 text-[14px] bg-card text-foreground border focus:outline-none focus:border-cream/40 transition-colors";

  const borderFor = (key: string) =>
    errors.has(key) ? "border-destructive" : "border-border-strong";

  async function goToRoadmap(emailToUse: string) {
    setSubmitting(true);
    setSubmitError(null);
    // Save lead best-effort, but don't block roadmap generation if it fails
    if (emailToUse) {
      await supabase.from("leads").insert({
        email: emailToUse,
        nationality,
        destination,
        purpose,
      });
    }
    // Stable per-device fingerprint
    let fp = "";
    try {
      const KEY = "vc_fp";
      fp = localStorage.getItem(KEY) || "";
      if (!fp) {
        const seed = [
          navigator.userAgent,
          navigator.language,
          screen.width + "x" + screen.height,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          (navigator as unknown as { hardwareConcurrency?: number }).hardwareConcurrency ?? "",
          crypto.randomUUID(),
        ].join("|");
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
        fp = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        localStorage.setItem(KEY, fp);
      }
    } catch {
      fp = "anon";
    }
    navigate({
      to: "/roadmap",
      search: { nationality, destination, purpose, email: emailToUse, fp },
    });
  }

  function handleGenerate(e: FormEvent) {
    e.preventDefault();
    const next = new Set<string>();
    if (!nationality) next.add("nationality");
    if (!destination) next.add("destination");
    if (!purpose) next.add("purpose");
    setErrors(next);
    if (next.size > 0) return;

    // Signed-in users skip the email step entirely.
    if (user?.email) {
      void goToRoadmap(user.email);
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = new Set<string>();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.add("email");
    setErrors(next);
    if (next.size > 0) return;
    await goToRoadmap(email.trim());
  }

  if (step === 2) {
    return (
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[760px] mx-auto border border-border-strong bg-card p-7 text-left"
        noValidate
      >
        <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-border-strong">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Your route
            </p>
            <p className="font-mono text-[13px] text-foreground">
              {nationality} → {destination} <span className="text-muted-foreground">·</span>{" "}
              {purpose}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream hover:text-cream/80 underline underline-offset-4"
          >
            Edit
          </button>
        </div>

        <label
          htmlFor={`${idPrefix}-email`}
          className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2"
        >
          Your email
        </label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoFocus
          className={`${selectBase} ${borderFor("email")} placeholder:text-muted-foreground/60`}
        />

        {submitError && <p className="mt-3 text-[13px] text-destructive">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-14 mt-4 bg-cream text-cream-foreground text-[14px] font-medium tracking-wide hover:bg-cream/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending..." : "Send me my roadmap  →"}
        </button>
        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          No account needed. We deliver to your inbox.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="w-full max-w-[760px] mx-auto" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          aria-label="Passport nationality"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className={`${selectBase} ${borderFor("nationality")} ${selectChevron}`}
        >
          <option value="" disabled>
            Your passport nationality
          </option>
          {NATIONALITIES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          aria-label="Destination country"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className={`${selectBase} ${borderFor("destination")} ${selectChevron}`}
        >
          <option value="" disabled>
            Destination country
          </option>
          {DESTINATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label="Purpose of travel"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className={`${selectBase} ${borderFor("purpose")} ${selectChevron}`}
        >
          <option value="" disabled>
            Purpose of travel
          </option>
          {PURPOSES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!allThreeSelected || submitting}
        className={`w-full h-14 mt-3 text-[14px] font-medium tracking-wide transition-colors ${
          allThreeSelected
            ? "bg-cream text-cream-foreground hover:bg-cream/90 cursor-pointer"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        } disabled:opacity-60`}
      >
        {submitting
          ? "Generating..."
          : user
            ? isPaid
              ? `Generate My Deep Roadmap  ★ ${tier === "pro_max" ? "Pro Max" : "Pro"}`
              : "Generate My Visa Roadmap"
            : "Generate My Visa Roadmap"}
      </button>
      <p className="mt-3 text-center text-[12px] text-muted-foreground">
        {!allThreeSelected
          ? "Select all three fields to continue"
          : user
            ? isPaid
              ? "Signed in — deep mode with sources, validated documents & full step-by-step depth."
              : `Signed in as ${user.email} — roadmap opens instantly.`
            : "Next: enter your email to receive the roadmap."}
      </p>
    </form>
  );
}
