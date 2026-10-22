"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  formatAddressLine,
  INTERNATIONAL_SHIPPING_CENTS,
  isDomesticCountry,
  type AddressSuggestion,
  type VerifiedShipping,
} from "@/lib/shippingAddress";
import { formatCentsAsCurrency } from "@/lib/money";

type Props = {
  value: VerifiedShipping | null;
  onChange: (next: VerifiedShipping | null) => void;
};

type SearchState = "idle" | "loading" | "empty" | "error";

const MIN_QUERY_LENGTH = 4;

function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AddressAutocomplete({ value, onChange }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const sessionRef = useRef(newSessionToken());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) return;
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
  }, [query, value]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const [name, setName] = useState("");
  useEffect(() => {
    if (value) setName(value.address.name);
  }, [value]);

  const select = async (suggestion: AddressSuggestion) => {
    setErrorMessage("");
    const carryName = name;
    if (suggestion.resolved) {
      onChange({
        address: { ...suggestion.resolved.address, name: carryName, line2: null },
        token: suggestion.resolved.token,
      });
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
      finishSelect();
    } catch {
      setErrorMessage("Address lookup is unavailable right now.");
      setSearchState("error");
    } finally {
      setResolvingId(null);
    }
  };

  const finishSelect = () => {
    setOpen(false);
    setSuggestions([]);
    setQuery("");
    setSearchState("idle");
    sessionRef.current = newSessionToken();
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    setSuggestions([]);
    setSearchState("idle");
    setErrorMessage("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void select(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const international = value ? !isDomesticCountry(value.address.country) : false;
  const trimmedQuery = query.trim();
  const showNoMatch =
    !value && trimmedQuery.length >= MIN_QUERY_LENGTH && searchState === "empty";
  const showPrompt =
    !value &&
    trimmedQuery.length >= MIN_QUERY_LENGTH &&
    suggestions.length > 0 &&
    searchState === "idle";

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="space-y-1">
        <label htmlFor={`${listId}-name`} className="text-sm font-medium text-neutral-900">
          Full name
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
          className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
        />
      </div>

      {value ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified address
              </div>
              <div className="mt-1 text-sm text-neutral-900">
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
          <div className="space-y-1">
            <label htmlFor={`${listId}-line2`} className="text-sm font-medium text-neutral-900">
              Apt, suite, unit <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
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
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </div>
          {international && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              International orders add a flat {formatCentsAsCurrency(INTERNATIONAL_SHIPPING_CENTS)}{" "}
              shipping fee and are paid by card.
            </p>
          )}
        </div>
      ) : (
        <div className="relative space-y-1">
          <label htmlFor={`${listId}-search`} className="text-sm font-medium text-neutral-900">
            Shipping address
          </label>
          <input
            id={`${listId}-search`}
            type="text"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={`${listId}-options`}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setErrorMessage("");
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Start typing your street address"
            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
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
            </ul>
          )}
          {searchState === "loading" && trimmedQuery.length >= MIN_QUERY_LENGTH && (
            <p className="text-xs text-neutral-500">Looking up addresses…</p>
          )}
          {showPrompt && (
            <p className="text-xs text-neutral-500">Pick your address from the list to continue.</p>
          )}
          {showNoMatch && (
            <p className="text-sm text-red-600" role="alert">
              We couldn&apos;t find that address. Check the street number, street name, and city —
              only real addresses can be used.
            </p>
          )}
          {searchState === "error" && errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
