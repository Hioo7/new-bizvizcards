import { useState, useCallback } from "react";
import type { ExtendedUserProfile, UserSocials } from "../types";
import { DEFAULT_EXTENDED_PROFILE } from "../config/profileDefaults";

const STORAGE_KEY_PREFIX = "bizviz_profile_";

function loadProfile(userId: string): ExtendedUserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return DEFAULT_EXTENDED_PROFILE;
    return { ...DEFAULT_EXTENDED_PROFILE, ...(JSON.parse(raw) as Partial<ExtendedUserProfile>) };
  } catch {
    return DEFAULT_EXTENDED_PROFILE;
  }
}

function saveProfile(userId: string, profile: ExtendedUserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(profile));
  } catch { /* ignore */ }
}

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<ExtendedUserProfile>(() => loadProfile(userId));

  const updateContact = useCallback((phone: string, countryCode: string) => {
    setProfile(prev => {
      const next = { ...prev, phone, countryCode };
      saveProfile(userId, next);
      return next;
    });
  }, [userId]);

  const updateBio = useCallback((profession: string, about: string, description: string) => {
    setProfile(prev => {
      const next = { ...prev, profession, about, description };
      saveProfile(userId, next);
      return next;
    });
  }, [userId]);

  const updateSocials = useCallback((socials: UserSocials) => {
    setProfile(prev => {
      const next = { ...prev, socials };
      saveProfile(userId, next);
      return next;
    });
  }, [userId]);

  return { profile, updateContact, updateBio, updateSocials };
}
