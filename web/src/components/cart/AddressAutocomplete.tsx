"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  formatAddressLine,
  INTERNATIONAL_SHIPPING_CENTS,
  isDomesticCountry,
  parseUsFreeformAddress,
  US_STATE_OPTIONS,
  type AddressSuggestion,
  type VerifiedShipping,
} from "@/lib/shippingAddress";
import { formatCentsAsCurrency } from "@/lib/money";

type Props = {
  value: VerifiedShipping | null;
  onChange: (next: VerifiedShipping | null) => void;
};

type SearchState = "idle" | "loading" | "empty" | "error";
type EntryMode = "lookup" | "manual";

const MIN_QUERY_LENGTH = 4;

const MANUAL_COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "MX", name: "Mexico" },
];

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none";

function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const emptyManual = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
};

export default function AddressAutocomplete({ value, onChange }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>("lookup");
  const [manual, setManual] = useState(emptyManual);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [allowUnverified, setAllowUnverified] = useState(false);
  const [name, setName] = useState("");
  const [showLine2, setShowLine2] = useState(false);
  const [acceptedUnverified, setAcceptedUnverified] = useState(false);
  const sessionRef = useRef(newSessionToken());
  const containerRef = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value || entryMode !== "lookup") return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setSearchState("idle");
      return;
    }

    const controller = new AbortController();
    setSearchState("loading");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/address/suggest?q=${encodeURIComponent(trimmed)}&session=${sessionRef.current}`,
          { signal: controller.signal }
        );
        const data = (await res.json().catch(() => ({}))) as {
          suggestions?: AddressSuggestion[];
          error?: string;
        };
        if (!res.ok) {
          setSuggestions([]);
          setErrorMessage(data.error || "Address lookup is unavailable right now.");
          setSearchState("error");
          return;
        }
        const next = data.suggestions ?? [];
        setSuggestions(next);
        setActiveIndex(-1);
        setSearchState(next.length ? "idle" : "empty");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setSuggestions([]);
        setErrorMessage("Address lookup is unavailable right now.");
        setSearchState("error");
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, value, entryMode]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (value) setName(value.address.name);
    else {
      setShowLine2(false);
      setAcceptedUnverified(false);
    }
  }, [value]);

  useEffect(() => {
    if (showLine2) line2Ref.current?.focus();
  }, [showLine2]);

  const finishSelect = () => {
    setOpen(false);
    setSuggestions([]);
    setQuery("");
    setSearchState("idle");
    setErrorMessage("");
    setEntryMode("lookup");
    setAllowUnverified(false);
    sessionRef.current = newSessionToken();
  };

  const select = async (suggestion: AddressSuggestion) => {
    setErrorMessage("");
    const carryName = name;
    if (suggestion.resolved) {
      onChange({
        address: { ...suggestion.resolved.address, name: carryName, line2: null },
        token: suggestion.resolved.token,
      });
      setAcceptedUnverified(false);
      finishSelect();
      return;
    }
    setResolvingId(suggestion.id);
    try {
      const res = await fetch("/api/address/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: suggestion.id, session: sessionRef.current }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        address?: VerifiedShipping["address"];
        token?: string;
        error?: string;
      };
      if (!res.ok || !data.address || !data.token) {
        setErrorMessage(data.error || "That address could not be verified.");
        setSearchState("error");
        return;
      }
      onChange({
        address: { ...data.address, name: carryName, line2: null },
        token: data.token,
      });
      setAcceptedUnverified(false);
      finishSelect();
    } catch {
      setErrorMessage("Address lookup is unavailable right now.");
      setSearchState("error");
    } finally {
      setResolvingId(null);
    }
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    setSuggestions([]);
    setSearchState("idle");
    setErrorMessage("");
    setAllowUnverified(false);
    setAcceptedUnverified(false);
    setManual(emptyManual);
  };

  const switchToManual = () => {
    setEntryMode("manual");
    setOpen(false);
    setSuggestions([]);
    setErrorMessage("");
    setSearchState("idle");
    setAllowUnverified(false);

    const trimmed = query.trim();
    if (!trimmed) return;

    const parsed = parseUsFreeformAddress(trimmed);
    if (parsed) {
      setManual({
        line1: parsed.line1,
        line2: parsed.line2 ?? "",
        city: parsed.city,
        state: parsed.state,
        postal_code: parsed.postal_code,
        country: "US",
      });
      return;
    }

    // Seed street from whatever they already typed when freeform isn't complete.
    setManual((prev) => (prev.line1 ? prev : { ...prev, line1: trimmed }));
  };

  const switchToLookup = () => {
    setEntryMode("lookup");
    setErrorMessage("");
    setAllowUnverified(false);
  };

  const applyManualResult = (
    address: VerifiedShipping["address"],
    token: string,
    unverified: boolean
  ) => {
    onChange({
      address: {
        ...address,
        name: name.trim(),
        line2: address.line2 ?? null,
      },
      token,
    });
    setAcceptedUnverified(unverified);
    finishSelect();
  };

  const submitManualFields = async (forceUnverified = false) => {
    setErrorMessage("");
    if (!name.trim()) {
      setErrorMessage("Enter the full name for the package.");
      return;
    }
    if (!manual.line1.trim() || !manual.city.trim()) {
      setErrorMessage("Enter the street address and city.");
      return;
    }
    if (manual.country === "US" && (!manual.state || !manual.postal_code.trim())) {
      setErrorMessage("Select a state and enter a ZIP code.");
      return;
    }

    setManualSubmitting(true);
    try {
      const res = await fetch("/api/address/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manual,
          line2: manual.line2.trim() || null,
          confirmUnverified: forceUnverified || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        address?: VerifiedShipping["address"];
        token?: string;
        error?: string;
        code?: string;
        unverified?: boolean;
      };
      if (res.status === 422 && data.code === "UNRECOGNIZED") {
        setAllowUnverified(true);
        setErrorMessage(
          data.error ||
            "USPS does not recognize that address. You can still use it as typed."
        );
        return;
      }
      if (!res.ok || !data.address || !data.token) {
        setErrorMessage(data.error || "Please check the address and try again.");
        return;
      }
      applyManualResult(data.address, data.token, Boolean(data.unverified));
    } catch {
      setErrorMessage("Address lookup is unavailable right now.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const submitTypedAddress = async (forceUnverified = false) => {
    setErrorMessage("");
    const trimmed = query.trim();
    if (!trimmed) {
      setErrorMessage("Type your shipping address to continue.");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Add the name on the package above.");
      return;
    }
    const parsed = parseUsFreeformAddress(trimmed);
    if (!parsed) {
      setErrorMessage(
        "Include street, city, state, and ZIP — or enter the address manually."
      );
      return;
    }

    setManualSubmitting(true);
    setOpen(false);
    try {
      const res = await fetch("/api/address/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          confirmUnverified: forceUnverified || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        address?: VerifiedShipping["address"];
        token?: string;
        error?: string;
        code?: string;
        unverified?: boolean;
      };
      if (res.status === 422 && data.code === "UNRECOGNIZED") {
        setAllowUnverified(true);
        setErrorMessage(
          data.error ||
            "USPS does not recognize that address. You can still use it as typed."
        );
        // Keep fields ready if they switch to the structured form.
        setManual({
          line1: parsed.line1,
          line2: parsed.line2 ?? "",
          city: parsed.city,
          state: parsed.state,
          postal_code: parsed.postal_code,
          country: "US",
        });
        return;
      }
      if (!res.ok || !data.address || !data.token) {
        setErrorMessage(data.error || "Please check the address and try again.");
        return;
      }
      applyManualResult(data.address, data.token, Boolean(data.unverified));
    } catch {
      setErrorMessage("Address lookup is unavailable right now.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (open && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        return;
      }
      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        void select(suggestions[activeIndex]);
        return;
      }
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (parseUsFreeformAddress(query.trim())) void submitTypedAddress();
    }
  };

  const international = value ? !isDomesticCountry(value.address.country) : false;
  const trimmedQuery = query.trim();
  const freeformReady = Boolean(parseUsFreeformAddress(trimmedQuery));
  const showNoMatch =
    !value &&
    entryMode === "lookup" &&
    trimmedQuery.length >= MIN_QUERY_LENGTH &&
    searchState === "empty";
  const showPrompt =
    !value &&
    entryMode === "lookup" &&
    trimmedQuery.length >= MIN_QUERY_LENGTH &&
    suggestions.length > 0 &&
    searchState === "idle";
  const showUseTyped =
    !value && entryMode === "lookup" && freeformReady && searchState !== "loading";
  const usManual = manual.country === "US";

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="space-y-1">
        <label htmlFor={`${listId}-name`} className="sr-only">
          Name on the package
        </label>
        <input
          id={`${listId}-name`}
          type="text"
          autoComplete="name"
          value={name}
          maxLength={120}
          onChange={(event) => {
            setName(event.target.value);
            if (value) {
              onChange({ ...value, address: { ...value.address, name: event.target.value } });
            }
          }}
          placeholder="Name on the package"
          className={inputClass}
        />
      </div>

      {value ? (
        <div className="space-y-3">
          <div
            className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 ${
              acceptedUnverified
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="min-w-0">
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${
                  acceptedUnverified ? "text-amber-800" : "text-emerald-700"
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {acceptedUnverified ? "Address saved as typed" : "Verified address"}
              </div>
              <div className="mt-1 text-sm text-neutral-900">
                {value.address.name ? `${value.address.name} · ` : ""}
                {formatAddressLine({ ...value.address, line2: null })}
              </div>
            </div>
            <button
              type="button"
              onClick={clear}
              className="shrink-0 text-sm font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
            >
              Change
            </button>
          </div>
          {showLine2 || value.address.line2 ? (
            <div className="space-y-1">
              <label htmlFor={`${listId}-line2`} className="text-xs font-medium text-neutral-700">
                Apt, suite, unit
              </label>
              <input
                ref={line2Ref}
                id={`${listId}-line2`}
                type="text"
                autoComplete="address-line2"
                value={value.address.line2 ?? ""}
                maxLength={100}
                onChange={(event) =>
                  onChange({
                    ...value,
                    address: { ...value.address, line2: event.target.value || null },
                  })
                }
                placeholder="Apt 4B"
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLine2(true)}
              className="text-[10px] leading-none text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
            >
              Add apt, suite, or unit
            </button>
          )}
          {international && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              International orders add a flat {formatCentsAsCurrency(INTERNATIONAL_SHIPPING_CENTS)}{" "}
              shipping fee and are paid by card.
            </p>
          )}
        </div>
      ) : entryMode === "manual" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-neutral-900">Enter address manually</h3>
            <button
              type="button"
              onClick={switchToLookup}
              className="text-sm font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
            >
              Use address lookup
            </button>
          </div>

          <div className="space-y-1">
            <label htmlFor={`${listId}-m-line1`} className="text-sm font-medium text-neutral-900">
              Street address
            </label>
            <input
              id={`${listId}-m-line1`}
              type="text"
              autoComplete="address-line1"
              value={manual.line1}
              maxLength={200}
              onChange={(event) => {
                setManual((prev) => ({ ...prev, line1: event.target.value }));
                setErrorMessage("");
                setAllowUnverified(false);
              }}
              placeholder="5223 Farmville Rd"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor={`${listId}-m-line2`} className="text-xs font-medium text-neutral-700">
              Apt, suite, unit <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              id={`${listId}-m-line2`}
              type="text"
              autoComplete="address-line2"
              value={manual.line2}
              maxLength={100}
              onChange={(event) => setManual((prev) => ({ ...prev, line2: event.target.value }))}
              placeholder="Apt 4B"
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 space-y-1 sm:col-span-1">
              <label htmlFor={`${listId}-m-city`} className="text-sm font-medium text-neutral-900">
                City
              </label>
              <input
                id={`${listId}-m-city`}
                type="text"
                autoComplete="address-level2"
                value={manual.city}
                maxLength={100}
                onChange={(event) => {
                  setManual((prev) => ({ ...prev, city: event.target.value }));
                  setErrorMessage("");
                  setAllowUnverified(false);
                }}
                placeholder="Farmville"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${listId}-m-state`} className="text-sm font-medium text-neutral-900">
                State
              </label>
              {usManual ? (
                <select
                  id={`${listId}-m-state`}
                  autoComplete="address-level1"
                  value={manual.state}
                  onChange={(event) => {
                    setManual((prev) => ({ ...prev, state: event.target.value }));
                    setErrorMessage("");
                    setAllowUnverified(false);
                  }}
                  className={inputClass}
                >
                  <option value="">Select</option>
                  {US_STATE_OPTIONS.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.code} — {state.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${listId}-m-state`}
                  type="text"
                  autoComplete="address-level1"
                  value={manual.state}
                  maxLength={100}
                  onChange={(event) => {
                    setManual((prev) => ({ ...prev, state: event.target.value }));
                    setErrorMessage("");
                    setAllowUnverified(false);
                  }}
                  placeholder="State / region"
                  className={inputClass}
                />
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor={`${listId}-m-zip`} className="text-sm font-medium text-neutral-900">
                {usManual ? "ZIP" : "Postal code"}
              </label>
              <input
                id={`${listId}-m-zip`}
                type="text"
                autoComplete="postal-code"
                value={manual.postal_code}
                maxLength={20}
                onChange={(event) => {
                  setManual((prev) => ({ ...prev, postal_code: event.target.value }));
                  setErrorMessage("");
                  setAllowUnverified(false);
                }}
                placeholder={usManual ? "23901" : "Postal code"}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor={`${listId}-m-country`} className="text-sm font-medium text-neutral-900">
              Country
            </label>
            <select
              id={`${listId}-m-country`}
              autoComplete="country"
              value={manual.country}
              onChange={(event) => {
                const country = event.target.value;
                setManual((prev) => ({
                  ...prev,
                  country,
                  state:
                    country === "US" && prev.state.length === 2
                      ? prev.state
                      : country === "US"
                        ? ""
                        : prev.state,
                }));
                setErrorMessage("");
                setAllowUnverified(false);
              }}
              className={inputClass}
            >
              {MANUAL_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          {allowUnverified ? (
            <button
              type="button"
              disabled={manualSubmitting}
              onClick={() => void submitManualFields(true)}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {manualSubmitting ? "Saving…" : "Use this address anyway"}
            </button>
          ) : (
            <button
              type="button"
              disabled={manualSubmitting}
              onClick={() => void submitManualFields(false)}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {manualSubmitting ? "Checking address…" : "Use this address"}
            </button>
          )}
          <p className="text-xs text-neutral-500">
            We try to match US addresses with USPS. If yours isn&apos;t listed, you can still
            continue with the address you typed.
          </p>
        </div>
      ) : (
        <div className="relative space-y-1">
          <label htmlFor={`${listId}-search`} className="sr-only">
            Shipping address
          </label>
          <input
            id={`${listId}-search`}
            type="text"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={`${listId}-options`}
            aria-autocomplete="list"
            autoComplete="street-address"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setErrorMessage("");
              setAllowUnverified(false);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Street, city, state, ZIP"
            className={inputClass}
          />
          {open && suggestions.length > 0 && (
            <ul
              id={`${listId}-options`}
              role="listbox"
              className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void select(suggestion)}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    index === activeIndex ? "bg-neutral-100" : ""
                  }`}
                >
                  <div className="font-medium text-neutral-900">
                    {resolvingId === suggestion.id ? "Verifying…" : suggestion.primary}
                  </div>
                  <div className="text-xs text-neutral-500">{suggestion.secondary}</div>
                </li>
              ))}
              {showUseTyped && (
                <li
                  role="option"
                  aria-selected={false}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void submitTypedAddress()}
                  className="cursor-pointer border-t border-black/10 px-3 py-2.5 text-sm"
                >
                  <div className="font-medium text-neutral-900">
                    {manualSubmitting ? "Checking address…" : "Use the address you typed"}
                  </div>
                  <div className="truncate text-xs text-neutral-500">{trimmedQuery}</div>
                </li>
              )}
              <li
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={switchToManual}
                className="cursor-pointer border-t border-black/10 px-3 py-2.5 text-sm"
              >
                <div className="font-medium text-neutral-900">Enter address manually</div>
                <div className="text-xs text-neutral-500">
                  Street, city, state, and ZIP in separate fields
                </div>
              </li>
            </ul>
          )}
          {searchState === "loading" && trimmedQuery.length >= MIN_QUERY_LENGTH && (
            <p className="text-xs text-neutral-500">Looking up addresses…</p>
          )}
          {showPrompt && !showUseTyped && (
            <p className="text-xs text-neutral-500">
              Pick your address from the list, or enter it manually.
            </p>
          )}
          {showNoMatch && !showUseTyped && (
            <p className="text-xs text-neutral-500">
              No suggestions yet — keep typing, or enter the address manually below.
            </p>
          )}
          {showUseTyped && !(open && suggestions.length > 0) && !allowUnverified && (
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-neutral-500">
                No matching suggestions — we&apos;ll check the address you typed.
              </p>
              <button
                type="button"
                disabled={manualSubmitting}
                onClick={() => void submitTypedAddress()}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {manualSubmitting ? "Checking address…" : "Use this address"}
              </button>
            </div>
          )}
          {allowUnverified && entryMode === "lookup" && (
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                disabled={manualSubmitting}
                onClick={() => void submitTypedAddress(true)}
                className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {manualSubmitting ? "Saving…" : "Use this address anyway"}
              </button>
            </div>
          )}
          {(searchState === "error" || errorMessage) && errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={switchToManual}
            className="pt-1 text-sm font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            {showNoMatch || searchState === "error" || allowUnverified
              ? "Enter address manually"
              : "Can't find your address? Enter it manually"}
          </button>
        </div>
      )}
    </div>
  );
}
