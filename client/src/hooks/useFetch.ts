import { useAuth } from "@clerk/clerk-react"

export default function useFetch() {
    // Use `useAuth()` to access the `getToken()` method
    const { getToken } = useAuth()

    const authenticatedFetch = async (url: string, options?: RequestInit) => {
        // Use `getToken()` to get the current session token
        const token = await getToken();

        // Add the session token to the request headers
        const fetchOptions: RequestInit = {
            ...options,
            headers: {
                ...options?.headers,
                Authorization: `Bearer ${token}`
            }
        }

        const response = await fetch(url, fetchOptions);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.msg ?? 'Something went wrong')
        }
        return data;
    }

    return { authenticatedFetch }
}