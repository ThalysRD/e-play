import useSWR from "swr";

const fetchUser = async (url) => {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
        const error = new Error('Ocorreu um erro ao buscar os daddos do usuário.');
        error.info = await response.json();
        error.status = response.status;
        throw error;
    }
    return response.json();
}

export default function useUser() {
    const { data, error, isLoading, mutate } = useSWR('/api/v1/user', fetchUser, {
        shouldRetryOnError: false
    });
    return {
        user: data,
        isLoading,
        isError: error,
        mutate,
    };
}