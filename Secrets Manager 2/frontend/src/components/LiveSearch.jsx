import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search, Loader2, Folder, Key, ChevronRight, Command } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import './LiveSearch.css';

export function LiveSearch() {
    const [, setLocation] = useLocation();

    // State
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ projects: [], secrets: [] });
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Debounce query (300ms)
    const debouncedQuery = useDebounce(query, 300);

    // Refs
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch results
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setResults({ projects: [], secrets: [] });
                return;
            }

            setLoading(true);
            try {
                const data = await api.searchGlobal(debouncedQuery);
                setResults(data);
                setSelectedIndex(-1); // Reset selection on new results
                setIsOpen(true);
            } catch (e) {
                console.error("Search failed:", e);
            } finally {
                setLoading(false);
            }
        };

        if (debouncedQuery) fetchResults();
    }, [debouncedQuery]);

    // Flatten results for keyboard navigation
    const getFlatItems = () => {
        const items = [];
        if (results.projects.length > 0) {
            results.projects.forEach(p => items.push({ ...p, group: 'Projects' }));
        }
        if (results.secrets.length > 0) {
            results.secrets.forEach(s => items.push({ ...s, group: 'Secrets' }));
        }
        return items;
    };

    const flatItems = getFlatItems();

    const handleSelect = (item) => {
        setIsOpen(false);
        setQuery(''); // Clear input? Or keep it? Usually clear on navigation.

        if (item.type === 'PROJECT') {
            setLocation(`/project/${item.slug}`);
        } else if (item.type === 'SECRET') {
            // If secret is used in projects, go to the first one's compare page?
            // Or go to the global search page for full details? 
            // Let's go to search page for details if ambiguous, 
            // or if used in 1 project, go to project.
            // For now, let's stick to the "Advanced Search" pattern for complex views,
            // but for quick jump, maybe the global search page is best for secrets.
            setLocation(`/search?q=${encodeURIComponent(item.key)}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > -1 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && flatItems[selectedIndex]) {
                handleSelect(flatItems[selectedIndex]);
            } else if (query) {
                // If nothing selected, go to full search page
                setIsOpen(false);
                setLocation(`/search?q=${encodeURIComponent(query)}`);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    // Highlight text logic
    const Highlight = ({ text, highlight }) => {
        if (!highlight) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ?
                        <span key={i} className="bg-blue-100 text-blue-900 font-medium">{part}</span> : part
                )}
            </span>
        );
    };

    return (
        <div className="live-search-root" ref={containerRef}>
            {/* Input Wrapper */}
            <div className={cn("search-input-wrapper", (isOpen || query) && "active")}>
                <Search size={18} className="search-icon-left" />

                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Search projects, secrets..."
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        if (!isOpen && e.target.value) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (query && (results.projects.length || results.secrets.length)) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                />

                <div className="search-suffix">
                    {loading ? (
                        <Loader2 size={18} className="spinner" />
                    ) : (
                        <div className="kbd-shortcut">
                            <Command size={10} /> <span>K</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="dropdown-menu animate-in">

                    {/* Empty / Loading State */}
                    {flatItems.length === 0 && !loading && query.length >= 2 && (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <Search size={20} />
                            </div>
                            <p className="empty-title">No results found</p>
                            <p className="empty-desc">We couldn't find anything matching "{query}"</p>
                        </div>
                    )}

                    {/* Results List */}
                    {flatItems.length > 0 && (
                        <div className="results-list">
                            {/* Projects Group */}
                            {results.projects.length > 0 && (
                                <div className="result-group">
                                    <div className="group-header">
                                        <Folder size={12} className="group-icon project-icon" /> Projects
                                    </div>
                                    <div className="group-items">
                                        {results.projects.map((item, idx) => {
                                            const flatIndex = idx;
                                            const isSelected = selectedIndex === flatIndex;
                                            return (
                                                <div
                                                    key={`p-${item.id}`}
                                                    className={cn("result-item", isSelected && "selected")}
                                                    onClick={() => handleSelect(item)}
                                                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                                                >
                                                    <div className="item-content">
                                                        <div className={cn("item-icon-box project", isSelected && "selected")}>
                                                            <Folder size={16} />
                                                        </div>
                                                        <div className="item-details">
                                                            <span className={cn("item-title", isSelected && "selected")}>
                                                                <Highlight text={item.name} highlight={query} />
                                                            </span>
                                                            <span className="item-subtitle">{item.slug}</span>
                                                        </div>
                                                    </div>
                                                    {isSelected && <ChevronRight size={16} className="arrow-icon" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Secrets Group */}
                            {results.secrets.length > 0 && (
                                <div className="result-group mt-divider">
                                    <div className="group-header">
                                        <Key size={12} className="group-icon secret-icon" /> Secrets
                                    </div>
                                    <div className="group-items">
                                        {results.secrets.map((item, idx) => {
                                            const flatIndex = results.projects.length + idx;
                                            const isSelected = selectedIndex === flatIndex;
                                            return (
                                                <div
                                                    key={`s-${item.key}`}
                                                    className={cn("result-item", isSelected && "selected")}
                                                    onClick={() => handleSelect(item)}
                                                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                                                >
                                                    <div className="item-content">
                                                        <div className={cn("item-icon-box secret", isSelected && "selected")}>
                                                            <Key size={16} />
                                                        </div>
                                                        <div className="item-details">
                                                            <span className={cn("item-title mono", isSelected && "selected")}>
                                                                <Highlight text={item.key} highlight={query} />
                                                            </span>
                                                            <span className="item-subtitle">
                                                                Used in {item.count} project{item.count !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {isSelected && <ChevronRight size={16} className="arrow-icon" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="dropdown-footer">
                        <div
                            className={cn("footer-action", selectedIndex === flatItems.length && "selected")}
                            onClick={() => {
                                setIsOpen(false);
                                setLocation(`/search?q=${encodeURIComponent(query)}`);
                            }}
                            onMouseEnter={() => setSelectedIndex(flatItems.length)}
                        >
                            <span className="action-text">
                                <Search size={14} />
                                Advanced Search for "{query}"
                            </span>
                            <span className="enter-badge">ENTER</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
