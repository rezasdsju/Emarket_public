import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from './ProductCard';

const SearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchData, setSearchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        min_price: '',
        max_price: '',
        sort_by: 'relevance'
    });
    
    const query = new URLSearchParams(location.search).get('q') || '';
    const API_BASE_URL = 'https://organic.satbeta.top';
    
    useEffect(() => {
        if (query) {
            performSearch();
        } else {
            navigate('/');
        }
    }, [query, location.state, filters]);
    
    const performSearch = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let apiUrl = `${API_BASE_URL}/api/search/?q=${encodeURIComponent(query)}`;
            
            // ফিল্টার প্যারামিটার যোগ
            const params = [];
            if (filters.category) params.push(`category=${filters.category}`);
            if (filters.min_price) params.push(`min_price=${filters.min_price}`);
            if (filters.max_price) params.push(`max_price=${filters.max_price}`);
            
            if (params.length > 0) {
                apiUrl += '&' + params.join('&');
            }
            
            const response = await axios.get(apiUrl, {
                headers: { 'Accept': 'application/json' }
            });
            
            setSearchData(response.data);
            
        } catch (err) {
            console.error('Search error:', err);
            setError('সার্চ করতে সমস্যা হয়েছে।');
        } finally {
            setLoading(false);
        }
    };
    
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };
    
    const clearFilters = () => {
        setFilters({
            category: '',
            min_price: '',
            max_price: '',
            sort_by: 'relevance'
        });
    };
    
    // যদি state থেকে ডাটা থাকে
    useEffect(() => {
        if (location.state?.searchData) {
            setSearchData(location.state.searchData);
            setLoading(false);
        }
    }, [location.state]);
    
    if (loading) {
        return (
            <div className="container mt-5 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">লোড হচ্ছে...</span>
                </div>
                <p className="mt-3">
                    "{query}" এর জন্য সার্চ রেজাল্ট লোড হচ্ছে...
                </p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <h4>সার্চ এরর</h4>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={performSearch}>
                        আবার চেষ্টা করুন
                    </button>
                </div>
            </div>
        );
    }
    
    if (!searchData || !searchData.success) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning">
                    <h4>সার্চ ফলাফল পাওয়া যায়নি</h4>
                    <p>"{query}" এর সাথে মিলে এমন কোনো পণ্য পাওয়া যায়নি।</p>
                </div>
            </div>
        );
    }
    
    const { products, total_results, total_pages, current_page } = searchData;
    
    return (
        <div className="search-results-page container mt-4">
            {/* হেডার */}
            <div className="search-header mb-4">
                <h1 className="h3 fw-bold mb-3">
                    <i className="bi bi-search me-2"></i>
                    সার্চ ফলাফল: "{query}"
                </h1>
                
                <div className="row">
                    <div className="col-md-8">
                        <div className="alert alert-light border d-flex justify-content-between align-items-center">
                            <div>
                                <span className="badge bg-primary rounded-pill me-2">
                                    <i className="bi bi-box-seam"></i>
                                </span>
                                <strong>{total_results}</strong> টি পণ্য পাওয়া গেছে
                            </div>
                            <div className="text-muted small">
                                পৃষ্ঠা {current_page} / {total_pages}
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-4">
                        <div className="dropdown">
                            <button className="btn btn-outline-secondary w-100 dropdown-toggle" 
                                    type="button" 
                                    data-bs-toggle="dropdown">
                                <i className="bi bi-sort-down me-1"></i>
                                সর্ট করুন
                            </button>
                            <ul className="dropdown-menu">
                                <li>
                                    <button className="dropdown-item" 
                                            onClick={() => handleFilterChange('sort_by', 'relevance')}>
                                        রিলেভেন্স
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" 
                                            onClick={() => handleFilterChange('sort_by', 'price_asc')}>
                                        দাম: কম থেকে বেশি
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" 
                                            onClick={() => handleFilterChange('sort_by', 'price_desc')}>
                                        দাম: বেশি থেকে কম
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" 
                                            onClick={() => handleFilterChange('sort_by', 'newest')}>
                                        নতুন আগে
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* ফিল্টার সাইডবার এবং রেজাল্ট */}
            <div className="row">
                {/* ফিল্টার সাইডবার */}
                <div className="col-lg-3 mb-4">
                    <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-funnel me-2"></i>
                                ফিল্টার
                            </h5>
                        </div>
                        <div className="card-body">
                            {/* প্রাইস ফিল্টার */}
                            <div className="mb-4">
                                <h6 className="border-bottom pb-2 mb-3">দামের রেঞ্জ</h6>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            placeholder="সর্বনিম্ন"
                                            value={filters.min_price}
                                            onChange={(e) => handleFilterChange('min_price', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            placeholder="সর্বোচ্চ"
                                            value={filters.max_price}
                                            onChange={(e) => handleFilterChange('max_price', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* সার্চ টিপস */}
                            <div className="alert alert-info">
                                <h6>
                                    <i className="bi bi-lightbulb me-2"></i>
                                    সার্চ টিপস
                                </h6>
                                <ul className="small mb-0">
                                    <li>বেশি ভালো রেজাল্ট পেতে পুরো শব্দ ব্যবহার করুন</li>
                                    <li>ব্র্যান্ড নাম দিয়ে সার্চ করুন</li>
                                    <li>ক্যাটাগরি অনুযায়ী ব্রাউজ করুন</li>
                                </ul>
                            </div>
                            
                            {/* ফিল্টার রিসেট */}
                            {(filters.min_price || filters.max_price || filters.category) && (
                                <button 
                                    className="btn btn-outline-secondary w-100 mt-3"
                                    onClick={clearFilters}
                                >
                                    <i className="bi bi-x-circle me-1"></i>
                                    সব ফিল্টার ক্লিয়ার করুন
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* সার্চ রেজাল্ট */}
                <div className="col-lg-9">
                    {products.length === 0 ? (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <div className="display-1 text-muted mb-4">
                                    <i className="bi bi-search"></i>
                                </div>
                                <h4 className="text-muted mb-3">কোনো পণ্য পাওয়া যায়নি</h4>
                                <p className="text-muted mb-4">
                                    "{query}" এর সাথে মিলে এমন কোনো পণ্য নেই। 
                                    অন্য কিওয়ার্ড দিয়ে চেষ্টা করুন অথবা ক্যাটাগরি ব্রাউজ করুন।
                                </p>
                                <div className="d-flex flex-wrap gap-2 justify-content-center">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => navigate('/')}
                                    >
                                        <i className="bi bi-house me-1"></i>
                                        হোমপেজ
                                    </button>
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => navigate('/categories')}
                                    >
                                        <i className="bi bi-tags me-1"></i>
                                        ক্যাটাগরি ব্রাউজ করুন
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* পণ্য গ্রিড */}
                            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
                                {products.map(product => (
                                    <div key={product.id} className="col">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                            
                            {/* পেজিনেশন */}
                            {total_pages > 1 && (
                                <nav className="mt-5">
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${current_page <= 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link"
                                                onClick={() => navigate(`/search?q=${query}&page=${current_page - 1}`)}
                                            >
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                        </li>
                                        
                                        {Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <li key={pageNum} className={`page-item ${current_page === pageNum ? 'active' : ''}`}>
                                                    <button 
                                                        className="page-link"
                                                        onClick={() => navigate(`/search?q=${query}&page=${pageNum}`)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        
                                        <li className={`page-item ${current_page >= total_pages ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link"
                                                onClick={() => navigate(`/search?q=${query}&page=${current_page + 1}`)}
                                            >
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {/* সার্চ টার্ম সুজেশন */}
            <div className="mt-5 pt-4 border-top">
                <h5 className="mb-3">সম্পর্কিত সার্চ টার্মস</h5>
                <div className="d-flex flex-wrap gap-2">
                    {['মধু', 'আখরোট', 'কিচমিচ', 'বাদাম', 'চেরিফল', 'কালজিরা', 'হানি নাট'].map(term => (
                        <button
                            key={term}
                            className="btn btn-outline-secondary"
                            onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* CSS */}
            <style jsx>{`
                .search-header {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 20px;
                    border-radius: 10px;
                }
                
                .product-card {
                    transition: all 0.3s ease;
                }
                
                .product-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default SearchResults;