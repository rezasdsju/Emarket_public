import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const API_BASE_URL = 'https://organic.satbeta.top';
    
    // ক্লিক আউটসাইড ডিটেক্ট
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // অটোকমপ্লিট সুজেশন ফেচ
    useEffect(() => {
        if (searchTerm.length >= 2) {
            fetchSuggestions();
        } else {
            setSuggestions([]);
        }
    }, [searchTerm]);
    
    const fetchSuggestions = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/search/autocomplete/?q=${encodeURIComponent(searchTerm)}`,
                {
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    timeout: 5000
                }
            );
            setSuggestions(response.data.suggestions || []);
            setError(null);
        } catch (error) {
            console.error('Suggestion fetch error:', error);
            setSuggestions([]);
        }
    };
    
    const handleSearch = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (!searchTerm.trim()) {
            setError('সার্চ ক্যোয়ারী প্রয়োজন');
            return;
        }
        
        setLoading(true);
        setShowSuggestions(false);
        
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/search/?q=${encodeURIComponent(searchTerm)}`,
                {
                    headers: { 
                        'Accept': 'application/json',
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    timeout: 10000
                }
            );
            
            // সার্চ পেজে নেভিগেট
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`, {
                state: { searchData: response.data }
            });
            
        } catch (error) {
            console.error('Search error:', error);
            
            if (error.code === 'ECONNABORTED') {
                setError('সার্চ রিকোয়েস্ট টাইমআউট হয়েছে। আবার চেষ্টা করুন।');
            } else if (error.response) {
                if (error.response.status === 400) {
                    setError('সার্চ ক্যোয়ারী ভুল ফর্ম্যাট।');
                } else if (error.response.status === 500) {
                    setError('সার্ভারে সমস্যা হয়েছে। দয়া করে পরে চেষ্টা করুন।');
                } else {
                    setError(`সার্চ করতে সমস্যা হয়েছে: ${error.response.status}`);
                }
            } else if (error.request) {
                setError('সার্ভারে সংযোগ করতে সমস্যা হচ্ছে। ইন্টারনেট সংযোগ চেক করুন।');
            } else {
                setError('সার্চ করতে সমস্যা হয়েছে।');
            }
            
            // Fallback: সরাসরি search page এ যান
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSuggestionClick = (suggestion) => {
        setSearchTerm(suggestion.name);
        setShowSuggestions(false);
        setError(null);
        
        if (suggestion.type === 'product') {
            navigate(`/product/${suggestion.id}`);
        } else if (suggestion.type === 'category') {
            navigate(`/category/${suggestion.slug}`);
        } else {
            navigate(`/search?q=${encodeURIComponent(suggestion.name)}`);
        }
    };
    
    const handleQuickSearch = (term) => {
        setSearchTerm(term);
        navigate(`/search?q=${encodeURIComponent(term)}`);
    };
    
    return (
        <>
            {/* গ্লোবাল স্টাইল ইনজেক্ট - বাংলা ফন্টের জন্য */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap');
                
                /* সার্চ বার এবং সমস্ত বাংলা টেক্সটের জন্য ফন্ট */
                .search-container input,
                .search-container button,
                .search-container .alert,
                .suggestions-dropdown {
                    font-family: 'Hind Siliguri', 'Noto Sans Bengali', 'Segoe UI', sans-serif !important;
                }
                
                /* Placeholder বাংলা টেক্সটের জন্য */
                input::placeholder {
                    font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif !important;
                    color: #6c757d !important;
                    font-weight: 400 !important;
                }
            `}</style>
            
            <div className="search-container" ref={searchRef}>
                <form onSubmit={handleSearch} className="d-flex">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="পণ্য খুঁজুন (যেমন: খেজুর, মধু, আখরোট, বাদাম...)"
                            value={searchTerm}
                            onChange={(e) => { 
                                setSearchTerm(e.target.value);
                                setError(null);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            aria-label="Search products"
                            style={{
                                borderRight: 'none',
                                borderRadius: '20px 0 0 20px',
                                paddingLeft: '20px',
                                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
                                fontSize: '16px'
                            }}
                        />
                        
                        <button 
                            className="btn btn-primary" 
                            type="submit"
                            disabled={loading || !searchTerm.trim()}
                            style={{
                                borderRadius: '0 20px 20px 0',
                                padding: '0 20px',
                                fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                            }}
                        >
                            {loading ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                                <i className="bi bi-search"></i>
                            )}
                        </button>
                    </div>
                </form>
                
                {/* Error Message */}
                {error && (
                    <div className="alert alert-warning alert-dismissible fade show mt-2" role="alert" style={{ 
                        fontSize: '0.9rem',
                        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                    }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}
                
                {/* অটোকমপ্লিট সুজেশন ড্রপডাউন */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown shadow-lg border rounded bg-white mt-1 position-absolute"
                         style={{
                             width: '100%',
                             maxHeight: '400px',
                             overflowY: 'auto',
                             zIndex: 1050,
                             fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                         }}>
                        <div className="suggestion-header p-2 border-bottom bg-light">
                            <small className="text-muted">
                                <i className="bi bi-lightbulb me-1"></i>
                                সার্চ সুজেশন ({suggestions.length})
                            </small>
                        </div>
                        
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={`${suggestion.type}-${index}`}
                                className="suggestion-item p-3 border-bottom hover-bg"
                                onClick={() => handleSuggestionClick(suggestion)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div className="d-flex align-items-center">
                                    <div className="suggestion-icon me-3">
                                        {suggestion.type === 'product' ? (
                                            <i className="bi bi-box text-primary"></i>
                                        ) : suggestion.type === 'category' ? (
                                            <i className="bi bi-tag text-success"></i>
                                        ) : (
                                            <i className="bi bi-fire text-danger"></i>
                                        )}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold">{suggestion.name}</div>
                                        <div className="text-muted small">
                                            {suggestion.type === 'product' ? 'পণ্য' : 
                                             suggestion.type === 'category' ? 'ক্যাটাগরি' : 
                                             'জনপ্রিয় সার্চ'}
                                        </div>
                                    </div>
                                    <div>
                                        <i className="bi bi-chevron-right text-muted"></i>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <div className="p-2 border-top bg-light">
                            <button 
                                className="btn btn-sm btn-outline-primary w-100"
                                onClick={() => handleQuickSearch(searchTerm)}
                                style={{ 
                                    fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
                                }}
                            >
                                <i className="bi bi-search me-1"></i>
                                "{searchTerm}" সার্চ করুন
                            </button>
                        </div>
                    </div>
                )}
                
                {/* CSS স্টাইল */}
                <style jsx>{`
                    .search-container {
                        position: relative;
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    
                    .hover-bg:hover {
                        background-color: #f8f9fa;
                    }
                    
                    .suggestions-dropdown {
                        animation: fadeIn 0.2s ease;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .suggestion-item:hover {
                        background-color: #f8f9fa !important;
                    }
                `}</style>
            </div>
        </>
    );
};

export default SearchBar;