const API_URL = "http://localhost:8000";

const fetchData = (url, requestOptions) => {
    const apiUrl = `${API_URL}${url}`;

    return fetch(apiUrl, requestOptions)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }

            if (requestOptions.method === 'GET' && requestOptions.responseType === 'blob') {
                return response.blob();
            }
            if (requestOptions.method !== 'DELETE') {
                return response.json();
            }
        })
        .catch((error) => {
            throw error;
        });
};

export const apiGet = (url, params, responseType) => {
    const filteredParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, value]) => value != null)
    );

    const queryString = new URLSearchParams(filteredParams).toString();
    const apiUrl = queryString ? `${url}?${queryString}` : url;

    const requestOptions = {
        method: "GET",
        responseType,
    };

    return fetchData(apiUrl, requestOptions);
};

export const apiPost = (url, data) => {
    const requestOptions = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    };

    return fetchData(url, requestOptions);
};

export const apiPut = (url, data) => {
    const requestOptions = {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    };

    return fetchData(url, requestOptions);
};

export const apiDelete = (url) => {
    const requestOptions = {
        method: "DELETE",
    };

    return fetchData(url, requestOptions);
};

export const getSalesByIco = (ico) => apiGet(`/api/identification/${ico}/sales`);
export const getPurchasesByIco = (ico) => apiGet(`/api/identification/${ico}/purchases`);