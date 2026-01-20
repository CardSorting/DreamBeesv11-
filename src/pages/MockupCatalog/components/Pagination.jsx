import React from 'react';
import * as Icons from 'lucide-react';

const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    // Range generation
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div className="mc-pagination-wrapper">
            <div className="mc-pagination-controls">
                <button
                    className="mc-page-btn nav-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous Page"
                >
                    <Icons.ChevronLeft size={18} />
                </button>

                {pages.map(page => (
                    <button
                        key={page}
                        className={`mc-page-btn number-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}

                <button
                    className="mc-page-btn nav-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next Page"
                >
                    <Icons.ChevronRight size={18} />
                </button>
            </div>

            <div className="mc-page-info">
                Page <span className="current">{currentPage}</span> of {totalPages}
            </div>
        </div>
    );
};

export default Pagination;
