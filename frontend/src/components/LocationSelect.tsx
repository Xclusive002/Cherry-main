import { useEffect, useState } from 'react';

type Country = { name: string; code: string };
type Subdivision = { code: string | null; name: string };

export default function LocationSelect({
  value,
  onChange,
  className = '',
}: {
  value?: { country?: string; state?: string };
  onChange?: (v: { country?: string; state?: string }) => void;
  className?: string;
}) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<Subdivision[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(value?.country);
  const [selectedState, setSelectedState] = useState<string | undefined>(value?.state);

  useEffect(() => {
    let mounted = true;
    setLoadingCountries(true);
    const url = `/api/locations/countries/`;

    const attempt = async (tries = 2) => {
      try {
        const r = await fetch(url);
        if (!mounted) return;
        if (!r.ok) throw new Error('Non-OK response');
        const data = await r.json();
        if (!mounted) return;
        setCountries(data || []);
        setLoadingCountries(false);
      } catch (err) {
        if (tries > 0) {
          setTimeout(() => attempt(tries - 1), 500);
          return;
        }
        console.error('Failed to load countries from', url, err);
        if (!mounted) return;
        setCountries([]);
        setLoadingCountries(false);
      }
    };
    attempt();
    return () => {
      mounted = false;
    };
  }, []);

  // If the parent provided a country value (name or code), map it to the internal code once countries are loaded
  useEffect(() => {
    if (!countries.length || !value?.country) return;
    const provided = value.country;
    // if provided looks like a code (2 letters), use that
    if (provided.length === 2) {
      setSelectedCountry(provided.toUpperCase());
      if (value.state) {
        setSelectedState(value.state);
      }
      return;
    }
    const match = countries.find((c) => c.name.toLowerCase() === provided.toLowerCase() || c.code.toLowerCase() === provided.toLowerCase());
    if (match) {
      setSelectedCountry(match.code);
      if (value.state) {
        setSelectedState(value.state);
      }
    }
  }, [countries, value]);

  useEffect(() => {
    if (value?.state && !selectedState) {
      setSelectedState(value.state);
    }
  }, [value?.state, selectedState]);

  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      setSelectedState(undefined);
      onChange && onChange({ country: undefined, state: undefined });
      return;
    }
    setLoadingStates(true);
    const url = `/api/locations/states/?country=${selectedCountry}`;
    let mounted = true;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Non-OK response');
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        setStates(data || []);
      })
      .catch((err) => {
        console.error('Failed to load subdivisions from', url, err);
        if (!mounted) return;
        setStates([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingStates(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedCountry]);

  useEffect(() => {
    const countryName = countries.find((c) => c.code === selectedCountry)?.name;
    onChange && onChange({ country: countryName, state: selectedState });
  }, [selectedCountry, selectedState]);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-200">Country</label>
      <div className="relative">
        <select
          value={selectedCountry || ''}
          onChange={(e) => setSelectedCountry(e.target.value || undefined)}
          className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-2 appearance-none border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">{loadingCountries ? 'Loading countries...' : 'Select a country'}</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {(!loadingCountries && countries.length === 0) && (
          <button
            type="button"
            onClick={() => {
              // trigger a reload by updating key via setting countries to [] then re-running effect
              setCountries([]);
              // small hack: force a re-fetch by toggling loading state
              setLoadingCountries(true);
              setTimeout(() => {
                setLoadingCountries(false);
                // re-run effect by setting selectedCountry undefined
                setSelectedCountry(undefined);
              }, 50);
            }}
            className="absolute -bottom-8 right-0 text-xs text-pink-400 underline"
          >Retry countries</button>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.23 7.21a.75.75 0 011.06-.02L10 10.67l3.71-3.48a.75.75 0 111.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z" />
          </svg>
        </div>
      </div>

      <label className="block text-sm font-medium text-gray-200">State / Province</label>
      <div className="relative">
        <select
          value={selectedState || ''}
          onChange={(e) => setSelectedState(e.target.value || undefined)}
          disabled={!selectedCountry || loadingStates || states.length === 0}
          className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-2 appearance-none border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
        >
          <option value="">{loadingStates ? 'Loading states...' : states.length ? 'Select a state' : 'No states available'}</option>
          {states.map((s) => (
            <option key={s.code || s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.23 7.21a.75.75 0 011.06-.02L10 10.67l3.71-3.48a.75.75 0 111.04 1.08l-4.25 4a.75.75 0 01-1.04 0l-4.25-4a.75.75 0 01-.02-1.06z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
