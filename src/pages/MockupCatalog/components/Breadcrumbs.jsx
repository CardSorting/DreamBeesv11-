import React from 'react';

const Breadcrumbs = ({ path, onNavigate }) => {
    return (
        <nav className="mc-breadcrumbs" aria-label="Breadcrumb">
            <span
                className={`mc-crumb ${path.length === 0 ? 'active' : ''}`}
                onClick={() => onNavigate(null)}
            >
                Catalog
            </span>

            {path.map((crumb, index) => (
                <React.Fragment key={crumb}>
                    <span className="mc-separator">/</span>
                    <span
                        className={`mc-crumb ${index === path.length - 1 ? 'active' : ''}`}
                        onClick={() => {
                            // If user clicks "Home & Living" in "Catalog / Home & Living / Home",
                            // we want to navigate to just "Home & Living".
                            // Path is array, so we slice up to this index + 1
                            if (index < path.length - 1) {
                                // Navigate to this parent level
                                // Ideally the parent component handles this logic, 
                                // we just pass the target crumb or implementing logic here implies knowledge of history
                                // Let's simplify: pass the hierarchy back?
                                // Actually, simpler: just let parent handle "go to level X"
                                // But here we just have a list of strings.
                                // Let's assume onNavigate handles 'level' or 'crumb value'
                                onNavigate(crumb, index);
                            }
                        }}
                    >
                        {crumb}
                    </span>
                </React.Fragment>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
