import React, { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/router";
import styles from "styles/componentes/SearchBar.module.css";

export default function SearchBar({
    mode = "route",
    resultsPage = "/catalogo",
    paramName = "query",
    syncFromUrl = true,
    apiEndpoint = (q) => `/api/v1/listings/search/${encodeURIComponent(q)}`,
    onResults,
    onSearchStart,
    onSearchEnd,
    onError,
    placeholder = "Buscar...",
    defaultValue = "",
    className = "",
}) {
    const router = useRouter();
    const [term, setTerm] = useState(defaultValue);
    const [loading, setLoading] = useState(false);
    const canSearch = !loading && term.trim().length > 0;

    useEffect(() => {
        if (!syncFromUrl) return;
        const v = router.query?.[paramName];
        if (typeof v === "string") setTerm(v);
    }, [router.query, paramName, syncFromUrl]);

    const doSearch = useCallback(async () => {
        const q = term.trim();
        if (!q) return;

        if (mode === "route") {
            await router.push({ pathname: resultsPage, query: { [paramName]: q } });
            return;
        }

        try {
            setLoading(true);
            onSearchStart?.(q);
            const res = await fetch(apiEndpoint(q));
            if (!res.ok) throw new Error("Sem resultados para a pesquisa.");
            const data = await res.json();
            onResults?.(data);
        } catch (e) {
            onError?.(e);
        } finally {
            setLoading(false);
            onSearchEnd?.();
        }
    }, [term, mode, resultsPage, paramName, router, apiEndpoint, onResults, onSearchStart, onSearchEnd, onError]);

    function handleSubmit(e) {
        e.preventDefault();
        if (canSearch) doSearch();
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={className ? `${styles.searchBar} ${className}` : styles.searchBar}
            role="search"
        >
            <input
                type="text"
                placeholder={placeholder}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                autoComplete="off"
            />
            <button
                type="submit"
                className={styles.searchIconWrapper}
                disabled={!canSearch}
            >
                <FaSearch />
            </button>
        </form>
    );
}
