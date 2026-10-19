/**
 * useEVProfile — persists EV profile to localStorage.
 */
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ev_charging_assistant_profile';

const DEFAULT_PROFILE = {
  make: '',
  model: '',
  battery_capacity_kwh: '',
  current_soc_percent: '',
  target_soc_percent: 80,
  efficiency_km_per_kwh: '',
  connector_type: '',
  home_tariff_inr_per_kwh: '',
  preferred_charger_power_kw: '',
};

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function useEVProfile() {
  const [profile, setProfile] = useState(loadProfile);

  const saveProfile = useCallback((updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile({ ...DEFAULT_PROFILE });
  }, []);

  /** Returns profile with only numeric fields parsed (for API calls) */
  const apiProfile = {
    make: profile.make || undefined,
    model: profile.model || undefined,
    battery_capacity_kwh: parseFloat(profile.battery_capacity_kwh) || undefined,
    current_soc_percent: profile.current_soc_percent !== '' ? parseFloat(profile.current_soc_percent) : undefined,
    target_soc_percent: parseFloat(profile.target_soc_percent) || undefined,
    efficiency_km_per_kwh: parseFloat(profile.efficiency_km_per_kwh) || undefined,
    connector_type: profile.connector_type || undefined,
    home_tariff_inr_per_kwh: parseFloat(profile.home_tariff_inr_per_kwh) || undefined,
    preferred_charger_power_kw: parseFloat(profile.preferred_charger_power_kw) || undefined,
  };

  const hasProfile = !!(profile.make || profile.battery_capacity_kwh);

  return { profile, apiProfile, hasProfile, saveProfile, resetProfile };
}
