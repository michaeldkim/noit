// src/lib/env.ts
export const ENV_LIST_KEY = 'noit_envs';
export const ENV_CURRENT_KEY = 'noit_env_current';
const DEFAULT_ENV = 'main';

export function listEnvs(): string[] {
  const raw = localStorage.getItem(ENV_LIST_KEY);
  if (!raw) {
    localStorage.setItem(ENV_LIST_KEY, JSON.stringify([DEFAULT_ENV]));
    localStorage.setItem(ENV_CURRENT_KEY, DEFAULT_ENV);
    return [DEFAULT_ENV];
  }
  try {
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) && arr.length ? arr : [DEFAULT_ENV];
  } catch {
    return [DEFAULT_ENV];
  }
}

export function getCurrentEnv(): string {
  return localStorage.getItem(ENV_CURRENT_KEY) || DEFAULT_ENV;
}

export function setCurrentEnv(name: string) {
  localStorage.setItem(ENV_CURRENT_KEY, name);
}

export function addEnv(name: string) {
    const clean = name.trim().toLowerCase();
    if (!clean) return;
    const set = new Set(listEnvs());
    set.add(clean);
    localStorage.setItem(ENV_LIST_KEY, JSON.stringify(Array.from(set)));
}

export function removeEnv(name: string) {
    const clean = name.trim().toLowerCase();
    if (!clean || clean === DEFAULT_ENV) return; // cannot delete main
    const set = new Set(listEnvs());
    set.delete(clean);
    localStorage.setItem(ENV_LIST_KEY, JSON.stringify(Array.from(set)));
    const curr = getCurrentEnv();
    if (curr === clean) setCurrentEnv(DEFAULT_ENV);
}

export function canDeleteEnv(name: string): boolean {
    return name.trim().toLowerCase() !== DEFAULT_ENV;
}
