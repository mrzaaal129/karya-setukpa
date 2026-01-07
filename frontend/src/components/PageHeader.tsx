import React from 'react';

interface PageHeaderProps {
    content?: string;
    showOnFirstPageOnly?: boolean;
    isFirstPage?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    content = '',
    showOnFirstPageOnly = false,
    isFirstPage = false
}) => {
    // Don't show header if it's set to first page only and this isn't the first page
    if (showOnFirstPageOnly && !isFirstPage) {
        return null;
    }

    if (!content) {
        return null;
    }

    return (
        <div
            className="page-header border-b border-gray-300 pb-2 mb-4"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default PageHeader;
