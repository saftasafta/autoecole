import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  // Calculate which pages to show (e.g., current - 1, current, current + 1)
  let startPage = Math.max(1, page - 1);
  let endPage = Math.min(totalPages, page + 1);

  if (page === 1) {
    endPage = Math.min(totalPages, startPage + 2);
  }
  if (page === totalPages) {
    startPage = Math.max(1, endPage - 2);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', padding: '1rem 0' }}>
      <button 
        className="btn" 
        style={{ padding: '0.5rem', backgroundColor: page === 1 ? '#F1F5F9' : '#FFFFFF', color: page === 1 ? '#94A3B8' : '#1E293B', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        onClick={() => page > 1 && onPageChange(page - 1)}
        disabled={page === 1}
      >
        <FiChevronLeft />
      </button>

      {startPage > 1 && (
        <>
          <button className="btn" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FFFFFF', color: '#1E293B' }} onClick={() => onPageChange(1)}>1</button>
          {startPage > 2 && <span style={{ color: '#94A3B8' }}>...</span>}
        </>
      )}

      {pages.map(p => (
        <button 
          key={p} 
          className="btn" 
          style={{ 
            padding: '0.5rem 0.75rem', 
            backgroundColor: p === page ? 'var(--primary-blue)' : '#FFFFFF', 
            color: p === page ? '#FFFFFF' : '#1E293B'
          }}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{ color: '#94A3B8' }}>...</span>}
          <button className="btn" style={{ padding: '0.5rem 0.75rem', backgroundColor: '#FFFFFF', color: '#1E293B' }} onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button 
        className="btn" 
        style={{ padding: '0.5rem', backgroundColor: page === totalPages ? '#F1F5F9' : '#FFFFFF', color: page === totalPages ? '#94A3B8' : '#1E293B', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        onClick={() => page < totalPages && onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        <FiChevronRight />
      </button>
    </div>
  );
};

export default Pagination;
