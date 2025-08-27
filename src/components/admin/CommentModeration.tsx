import { useState, useEffect } from 'react';
import { FiEye, FiCheck, FiX, FiFlag, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Comment {
  id: string;
  content: string;
  status: string;
  contentType: string;
  contentId: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reports: any[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export default function CommentModeration() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  
  // Filter-Zustände
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Kommentare laden
  const fetchComments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        contentType: contentTypeFilter,
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/admin/moderation/comments?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kommentare');
      }
      
      const data = await response.json();
      setComments(data.comments);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Fehler beim Laden der Kommentare:', err);
      setError('Die Kommentare konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };
  
  // Kommentarstatus aktualisieren
  const updateCommentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/moderation/comments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Status');
      }
      
      // Kommentare neu laden
      fetchComments();
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Status:', err);
      setError('Der Status konnte nicht aktualisiert werden.');
    }
  };
  
  // Kommentar löschen
  const deleteComment = async (id: string) => {
    if (!confirm('Möchten Sie diesen Kommentar wirklich löschen?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/moderation/comments/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Kommentars');
      }
      
      // Kommentare neu laden
      fetchComments();
    } catch (err) {
      console.error('Fehler beim Löschen des Kommentars:', err);
      setError('Der Kommentar konnte nicht gelöscht werden.');
    }
  };
  
  // Seitenwechsel
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) {
      return;
    }
    
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  // Filter zurücksetzen
  const resetFilters = () => {
    setStatusFilter('all');
    setContentTypeFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };
  
  // Kommentare laden, wenn sich Filter oder Pagination ändern
  useEffect(() => {
    fetchComments();
  }, [pagination.page, pagination.limit, statusFilter, contentTypeFilter, sortBy, sortOrder]);
  
  // Status-Badge anzeigen
  const renderStatusBadge = (status: string) => {
    let badgeClass = '';
    let statusText = '';
    
    switch (status) {
      case 'APPROVED':
        badgeClass = 'bg-green-100 text-green-800';
        statusText = 'Genehmigt';
        break;
      case 'REJECTED':
        badgeClass = 'bg-red-100 text-red-800';
        statusText = 'Abgelehnt';
        break;
      case 'PENDING':
        badgeClass = 'bg-yellow-100 text-yellow-800';
        statusText = 'Ausstehend';
        break;
      case 'FLAGGED':
        badgeClass = 'bg-orange-100 text-orange-800';
        statusText = 'Markiert';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        statusText = status;
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
        {statusText}
      </span>
    );
  };
  
  // Inhaltstyp-Badge anzeigen
  const renderContentTypeBadge = (contentType: string) => {
    let badgeClass = '';
    let typeText = '';
    
    switch (contentType) {
      case 'REVIEW':
        badgeClass = 'bg-blue-100 text-blue-800';
        typeText = 'Bewertung';
        break;
      case 'BLOG':
        badgeClass = 'bg-purple-100 text-purple-800';
        typeText = 'Blog';
        break;
      case 'FORUM':
        badgeClass = 'bg-indigo-100 text-indigo-800';
        typeText = 'Forum';
        break;
      default:
        badgeClass = 'bg-gray-100 text-gray-800';
        typeText = contentType;
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
        {typeText}
      </span>
    );
  };
  
  if (loading && comments.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Kommentarmoderation</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={resetFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Filter zurücksetzen
          </button>
        </div>
      </div>
      
      {/* Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">Alle Status</option>
              <option value="APPROVED">Genehmigt</option>
              <option value="REJECTED">Abgelehnt</option>
              <option value="PENDING">Ausstehend</option>
              <option value="FLAGGED">Markiert</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="contentTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Inhaltstyp
            </label>
            <select
              id="contentTypeFilter"
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">Alle Typen</option>
              <option value="REVIEW">Bewertungen</option>
              <option value="BLOG">Blog</option>
              <option value="FORUM">Forum</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sortieren nach
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="createdAt">Erstellungsdatum</option>
              <option value="reports">Meldungen</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
              Reihenfolge
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="desc">Absteigend</option>
              <option value="asc">Aufsteigend</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Fehlermeldung */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Kommentartabelle */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kommentar
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Benutzer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meldungen
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Keine Kommentare gefunden
                  </td>
                </tr>
              ) : (
                comments.map((comment) => (
                  <tr key={comment.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {comment.content.length > 100 ? `${comment.content.substring(0, 100)}...` : comment.content}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderContentTypeBadge(comment.contentType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {comment.user.firstName} {comment.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{comment.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(comment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comment.reports.length > 0 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {comment.reports.length}
                        </span>
                      ) : (
                        <span>0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => router.push(`/admin/moderation/comments/${comment.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Details anzeigen"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateCommentStatus(comment.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-900"
                          title="Genehmigen"
                        >
                          <FiCheck className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateCommentStatus(comment.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900"
                          title="Ablehnen"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateCommentStatus(comment.id, 'FLAGGED')}
                          className="text-orange-600 hover:text-orange-900"
                          title="Markieren"
                        >
                          <FiFlag className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Löschen"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Zeige <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> bis{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
                  </span>{' '}
                  von <span className="font-medium">{pagination.totalItems}</span> Ergebnissen
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Zurück</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  
                  {/* Seitenzahlen */}
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    const isCurrentPage = pageNumber === pagination.page;
                    
                    // Nur bestimmte Seiten anzeigen, um die Pagination übersichtlich zu halten
                    if (
                      pageNumber === 1 ||
                      pageNumber === pagination.totalPages ||
                      (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => changePage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isCurrentPage
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    
                    // Ellipsis anzeigen
                    if (
                      (pageNumber === 2 && pagination.page > 3) ||
                      (pageNumber === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                    ) {
                      return (
                        <span
                          key={pageNumber}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.page === pagination.totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Weiter</span>
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
