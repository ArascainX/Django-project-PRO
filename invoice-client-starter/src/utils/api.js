const API_URL = "http://localhost:8000";

// Refresh token funkce
const refreshAccessToken = async () => {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) throw new Error("Chybí refresh token.");

  const res = await fetch(`${API_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw new Error("Nelze obnovit přístupový token.");
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  return data.access;
};

// Univerzální fetch wrapper s obnovou tokenu
const fetchData = async (url, requestOptions = {}, responseType = "json", retry = true) => {
  let token = localStorage.getItem("access_token");

  const headers = {
    ...requestOptions.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const apiUrl = `${API_URL}${url}`;

  try {
    let response = await fetch(apiUrl, {
      ...requestOptions,
      headers,
    });

    if (response.status === 401 && retry) {
      try {
        token = await refreshAccessToken();
        const retryHeaders = {
          ...requestOptions.headers,
          Authorization: `Bearer ${token}`,
        };
        response = await fetch(apiUrl, {
          ...requestOptions,
          headers: retryHeaders,
        });
      } catch (refreshError) {
        console.error("Chyba při obnově tokenu:", refreshError);
        throw refreshError;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} – ${response.statusText}\n${errorText}`);
    }

    if (responseType === "blob") return await response.blob();
    if (responseType === "text") return await response.text();
    if (responseType === "json") return await response.json();
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

// GET požadavek s volitelnými parametry
export const apiGet = (url, params = {}, responseType = "json") => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([_, value]) => value != null)
  ).toString();

  const fullUrl = queryString ? `${url}?${queryString}` : url;

  const requestOptions = {
    method: "GET",
  };

  return fetchData(fullUrl, requestOptions, responseType);
};

// POST požadavek
export const apiPost = (url, data = {}) => {
  return fetchData(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

// PUT požadavek
export const apiPut = (url, data = {}) => {
  return fetchData(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

// DELETE požadavek
export const apiDelete = (url) => {
  return fetchData(url, {
    method: "DELETE",
  });
};

// Aktuálně přihlášený uživatel
export const getCurrentUser = () => {
  return apiGet("/api/me/");
};

// IČO dotazy
export const getSalesByIco = (ico) =>
  apiGet(`/api/identification/${ico}/sales`);

export const getPurchasesByIco = (ico) =>
  apiGet(`/api/identification/${ico}/purchases`);
