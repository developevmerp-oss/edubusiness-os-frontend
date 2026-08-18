// Dynamic Subdomain / Tenant Resolver for Client-side API request
export function getSubdomain(): string {
    if (typeof window === 'undefined') return 'abc';
    
    const host = window.location.host;
    const parts = host.split('.');
    
    // e.g. "abc.localhost:3000" or "abc.edubusiness.com"
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost') {
        return parts[0];
    }
    
    // In local dev, allow override via localStorage for testing different subdomains easily on localhost:3000
    const localOverride = localStorage.getItem('tenant_subdomain');
    return localOverride || 'abc';
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Fetch CSRF token cookie from browser cookies.
 */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

/**
 * Custom fetch client that automatically manages credentials, CSRF, and Tenant mapping headers.
 */
export async function apiRequest(path: string, options: RequestInit = {}) {
    const subdomain = getSubdomain();
    const headers = new Headers(options.headers || {});

    // Set Tenant identification header
    headers.set('X-Tenant-Subdomain', subdomain);

    // Set Content-Type default
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    // Set CSRF token for state-changing requests
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
        const csrfToken = getCookie('csrf-token') || getCookie('__Host-csrf-token');
        if (csrfToken) {
            headers.set('X-CSRF-Token', csrfToken);
        }
    }

        const url = `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    // If API responded with another subdomain header, sync it back (optional)
    const respTenantSubdomain = response.headers.get('X-Tenant-Subdomain');
    if (respTenantSubdomain && typeof window !== 'undefined') {
        // Log mismatch if local override isn't matching
    }

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    return response.json();
}


