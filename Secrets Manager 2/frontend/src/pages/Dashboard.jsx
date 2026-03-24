import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Plus, ArrowRight, Server } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/Button';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            if (!user) return;
            const data = await api.getProjects(user.id, user.isAdmin || user.is_admin);
            setProjects(data);
            setLoading(false);
        };
        loadProjects();
    }, [user]);

    const handleNewProject = async () => {
        const name = prompt("Enter project name:");
        if (name) {
            const p = await api.createProject(name, "New project");
            setProjects([...projects, p]);
        }
    };

    if (loading) return <div className="loading">Loading projects...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">Manage secrets across your applications</p>
                </div>
                {(user?.isAdmin || user?.is_admin) && (
                    <Button onClick={handleNewProject}>
                        <Plus size={16} className="mr-2" />
                        New Project
                    </Button>
                )}
            </header>

            <div className="projects-grid">
                {projects.map((project) => (
                    <Link key={project.id} href={`/project/${project.slug}`} className="project-card">
                        <div className="card-header">
                            <div className="icon-wrapper">
                                <Server size={20} />
                            </div>
                            <div className="meta">
                                <h3>{project.name}</h3>
                                <span className="slug">/{project.slug}</span>
                            </div>
                        </div>
                        <p className="description">{project.description}</p>
                        <div className="card-footer">
                            <span className="link-text">
                                Manage Secrets <ArrowRight size={14} />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
