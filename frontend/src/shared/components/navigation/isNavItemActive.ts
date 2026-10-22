interface NavItemLocation {
  isRouteActive: boolean;
  targetPathname: string;
  targetHash: string;
  locationPathname: string;
  locationHash: string;
}

export function isNavItemActive({
  isRouteActive,
  targetPathname,
  targetHash,
  locationPathname,
  locationHash,
}: NavItemLocation): boolean {
  return targetHash
    ? locationPathname === targetPathname && locationHash === targetHash
    : isRouteActive;
}
