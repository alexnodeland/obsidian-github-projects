import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { ProjectSummary } from '../../api/types';
import { LoadingSpinner } from './LoadingSpinner';

interface ProjectSelectorProps {
    availableProjects: ProjectSummary[];
    isLoading: boolean;
    onSelectProject: (project: ProjectSummary) => void;
}

export const ProjectSelector = ({ availableProjects, isLoading, onSelectProject }: ProjectSelectorProps) => {
    const [selectedOwner, setSelectedOwner] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Get unique owners
    const owners = ['all', ...new Set(availableProjects.map(p =>
        p.ownerType === 'user' ? 'Personal' : p.owner
    ))];

    // Filter projects
    const filteredProjects = availableProjects.filter(project => {
        const matchesOwner = selectedOwner === 'all' ||
            (selectedOwner === 'Personal' && project.ownerType === 'user') ||
            (selectedOwner === project.owner);

        const matchesSearch = searchQuery === '' ||
            project.title.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesOwner && matchesSearch && !project.closed;
    });

    // Group projects by owner
    const groupedProjects = filteredProjects.reduce((acc, project) => {
        const key = project.ownerType === 'user' ? 'Personal Projects' : `${project.owner} (Organization)`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
        return acc;
    }, {} as Record<string, ProjectSummary[]>);

    return (
        <div className="project-selector-container">
            <div className="project-selector">
                <div className="project-selector-header">
                    <h2>Select a GitHub Project</h2>
                    <p>Choose a project to open, or set a default in settings</p>
                </div>

                {isLoading ? (
                    <div className="project-selector-loading">
                        <LoadingSpinner size="large" />
                        <p>Loading available projects...</p>
                    </div>
                ) : availableProjects.length === 0 ? (
                    <div className="project-selector-empty">
                        <p>No projects found</p>
                        <p className="muted">Make sure your GitHub token has the necessary permissions</p>
                    </div>
                ) : (
                    <>
                        <div className="project-selector-filters">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="project-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                            />
                            {owners.length > 2 && (
                                <select
                                    className="project-owner-filter"
                                    value={selectedOwner}
                                    onChange={(e) => setSelectedOwner((e.target as HTMLSelectElement).value)}
                                >
                                    {owners.map(owner => (
                                        <option key={owner} value={owner}>
                                            {owner === 'all' ? 'All Owners' : owner}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {filteredProjects.length === 0 ? (
                            <div className="project-selector-empty">
                                <p>No projects match your search</p>
                            </div>
                        ) : (
                            <div className="project-selector-list">
                                {Object.entries(groupedProjects).map(([groupName, projects]) => (
                                    <div key={groupName} className="project-group">
                                        <h3 className="project-group-title">{groupName}</h3>
                                        <div className="project-cards">
                                            {projects.map(project => (
                                                <button
                                                    key={`${project.ownerType}-${project.owner}-${project.number}`}
                                                    className="project-card"
                                                    onClick={() => onSelectProject(project)}
                                                >
                                                    <div className="project-card-title">{project.title}</div>
                                                    <div className="project-card-meta">
                                                        <span className="project-number">#{project.number}</span>
                                                        {project.ownerType === 'organization' && (
                                                            <span className="project-owner">{project.owner}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};