export type FunnelLocation = {
  pincode?: string;
  city?: string;
  locality?: string;
};

export function readFunnelLocation(searchParams: { get: (key: string) => string | null }): FunnelLocation {
  const pincode = searchParams.get("pincode") || undefined;
  const city = searchParams.get("city") || undefined;
  const locality = searchParams.get("locality") || undefined;
  return { pincode, city, locality };
}

export function buildFunnelLocationQuery(location: FunnelLocation): string {
  const params = new URLSearchParams();
  if (location.pincode) params.set("pincode", location.pincode);
  if (location.city) params.set("city", location.city);
  if (location.locality) params.set("locality", location.locality);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function applyFunnelLocationParams(params: URLSearchParams, location: FunnelLocation): URLSearchParams {
  if (location.pincode) params.set("pincode", location.pincode);
  if (location.city) params.set("city", location.city);
  if (location.locality) params.set("locality", location.locality);
  return params;
}
