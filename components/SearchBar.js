import React from 'react';
import { FaSearch } from 'react-icons/fa';
import styles from 'styles/componentes/SearchBar.module.css';

export default function SearchBar() {
    return (
        <div className={styles.searchBar}>
            <input type="text" placeholder="Pesquisar..." />
            <button type="button" className={styles.searchIconWrapper}>
                <FaSearch />
            </button>
        </div>
    );
}