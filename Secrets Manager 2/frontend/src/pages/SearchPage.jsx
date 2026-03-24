import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Folder, Key, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'wouter';
import { Button } from '../components/ui/Button';

import './SearchPage.css';

export default function SearchPage() {
    const [location, setLocation] = useLocation();
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';

    // Extract query from URL manually if wouter doesn't give it easily in this version
    // Actually wouter doesn't parse query strings by default, so window.location is safe fallback.

    const [results, setResults] = useState({ projects: [], secrets: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (query) {
            performSearch(query);
        }
    }, [query]);

    const performSearch = async (q) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.searchGlobal(q);
            setResults(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-page-root">
            <header className="page-header">
                <h1 className="page-title">Search Results for "<span className="query-text">{query}</span>"</h1>
            </header>

            {loading ? (
                <div className="loading-container">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            ) : error ? (
                <div className="error-container">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : (
                <>
                    {/* Projects Section */}
                    <section className="results-section">
                        <h2 className="section-title">
                            <Folder size={20} /> Projects
                        </h2>
                        {results.projects.length === 0 ? (
                            <div className="no-results">No projects found matching "{query}".</div>
                        ) : (
                            <div className="projects-grid">
                                {results.projects.map(p => (
                                    <div key={p.id} className="project-card">
                                        <div className="card-header">
                                            <h3 className="project-name">{p.name}</h3>
                                        </div>
                                        <p className="project-desc">{p.description || 'No description provided.'}</p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setLocation(`/project/${p.slug}`)}
                                            className="card-action"
                                        >
                                            View Project
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Secrets Section */}
                    <section className="results-section">
                        <h2 className="section-title">
                            <Key size={20} /> Secrets
                        </h2>
                        {results.secrets.length === 0 ? (
                            <div className="no-results">No secrets found matching "{query}".</div>
                        ) : (
                            <div className="secrets-container">
                                <table className="secrets-table">
                                    <thead>
                                        <tr>
                                            <th>Secret Key</th>
                                            <th>Used In Projects</th>
                                            <th style={{ textAlign: 'right' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.secrets.map(s => (
                                            <tr key={s.key}>
                                                <td className="secret-key-cell">{s.key}</td>
                                                <td>
                                                    <div className="used-in-cell">
                                                        {s.usedIn.map(proj => (
                                                            <Link key={proj.id} href={`/project/${proj.slug}`}>
                                                                <a className="project-badge">
                                                                    <Folder size={12} className="badge-icon" />
                                                                    {proj.name}
                                                                </a>
                                                            </Link>
                                                        ))}
                                                        {s.usedIn.length === 0 && <span className="text-muted">Not used</span>}
                                                    </div>
                                                </td>
                                                <td className="action-cell">
                                                    {s.usedIn.length > 0 && (
                                                        <button
                                                            className="compare-btn"
                                                            onClick={() => setLocation(`/project/${s.usedIn[0].slug}/compare`)}
                                                        >
                                                            Compare <ArrowRight size={14} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
