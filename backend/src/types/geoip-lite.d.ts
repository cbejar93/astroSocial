declare module 'geoip-lite' {
  export interface GeoIpLookupResult {
    country?: string;
    region?: string;
    city?: string;
  }

  export function lookup(ip: string): GeoIpLookupResult | null;
}
