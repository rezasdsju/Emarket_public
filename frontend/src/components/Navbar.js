import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = ({ cartItemsCount = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    // ✅ Bootstrap JS manually initialize করার জন্য
    useEffect(() => {
        // Bootstrap components initialize
        if (typeof window !== 'undefined') {
            // Bootstrap এর JavaScript components initialize
            const navbarToggler = document.querySelector('.navbar-toggler');
            if (navbarToggler) {
                console.log('✅ Navbar toggler found in DOM');
            }
        }
    }, []);

    // ✅ সার্চ হ্যান্ডলার
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            // সার্চ পেজে নিয়ে যান
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
            setSearchTerm(''); // সার্চ বক্স খালি করুন
            setIsOpen(false); // মোবাইলে মেনু বন্ধ করুন
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow fixed-top">
            <div className="container">
                {/* Brand */}
                <Link className="navbar-brand fw-bold" to="/" onClick={() => setIsOpen(false)}>
                    <i className="bi bi-shop me-2"></i>
                    অর্গানিক বাজার
                </Link>
                
                {/* Desktop Search Bar - Large screens only */}
                <div className="d-none d-lg-flex align-items-center" style={{ flexGrow: 1, maxWidth: '400px', margin: '0 20px' }}>
                    <form onSubmit={handleSearch} className="w-100">
                        <div className="input-group">
                            <input 
                                type="search" 
                                className="form-control" 
                                placeholder="পণ্য খুঁজুন (যেমন: মধু, কিচমিচ, আখরোট, বাদাম, খেজুর...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ 
                                    borderRight: 'none',
                                    borderRadius: '20px 0 0 20px',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button 
                                className="btn btn-light" 
                                type="submit"
                                style={{ 
                                    borderRadius: '0 20px 20px 0',
                                    paddingLeft: '15px',
                                    paddingRight: '15px'
                                }}
                            >
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Mobile Search Toggle Button */}
                <div className="d-lg-none me-2">
                    <button 
                        className="btn btn-outline-light"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#mobileSearch"
                        aria-expanded="false"
                        aria-controls="mobileSearch"
                        onClick={() => {
                            // অন্য collapse বন্ধ রাখা
                            const navbarCollapse = document.getElementById('navbarNav');
                            if (navbarCollapse.classList.contains('show')) {
                                navbarCollapse.classList.remove('show');
                            }
                        }}
                    >
                        <i className="bi bi-search"></i>
                    </button>
                </div>
                
                {/* Hamburger Button - Bootstrap compatible */}
                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" 
                    aria-expanded={isOpen}
                    aria-label="Toggle navigation"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                {/* Mobile Search (Collapsible) */}
                <div className="collapse" id="mobileSearch">
                    <div className="container py-2 d-lg-none">
                        <form onSubmit={handleSearch} className="d-flex">
                            <div className="input-group">
                                <input 
                                    type="search" 
                                    className="form-control" 
                                    placeholder="পণ্য খুঁজুন..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button className="btn btn-light" type="submit">
                                    <i className="bi bi-search"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                {/* Collapsible Menu */}
                <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link 
                                className={`nav-link ${location.pathname === '/' ? 'active fw-bold' : ''}`} 
                                to="/"
                                onClick={() => {
                                    setIsOpen(false);
                                    // মোবাইল সার্চ বন্ধ করুন
                                    const mobileSearch = document.getElementById('mobileSearch');
                                    if (mobileSearch.classList.contains('show')) {
                                        mobileSearch.classList.remove('show');
                                    }
                                }}
                            >
                                <i className="bi bi-house-door me-1"></i>
                                হোম
                            </Link>
                        </li>
                        
                        <li className="nav-item">
                            <Link 
                                className={`nav-link ${location.pathname === '/products' ? 'active fw-bold' : ''}`} 
                                to="/products"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="bi bi-box-seam me-1"></i>
                                পণ্য
                            </Link>
                        </li>
                        
                        <li className="nav-item">
                            <Link 
                                className={`nav-link ${location.pathname.includes('/category') ? 'active fw-bold' : ''}`} 
                                to="/categories"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="bi bi-tags me-1"></i>
                                ক্যাটাগরি
                            </Link>
                        </li>
                        
                        {/* ✅ সার্চ মেনু আইটেম যোগ করা হয়েছে */}
                        <li className="nav-item d-lg-none">
                            <Link 
                                className={`nav-link ${location.pathname === '/search' ? 'active fw-bold' : ''}`} 
                                to="/search"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="bi bi-search me-1"></i>
                                সার্চ
                            </Link>
                        </li>
                        
                        <li className="nav-item">
                            <Link 
                                className={`nav-link ${location.pathname === '/cart' ? 'active fw-bold' : ''}`} 
                                to="/cart"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="bi bi-cart3 me-1"></i>
                                কার্ট
                                {cartItemsCount > 0 && (
                                    <span className="badge bg-danger ms-1">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </Link>
                        </li>
                        
                        <li className="nav-item">
                            <Link 
                                className={`nav-link ${location.pathname === '/about' ? 'active fw-bold' : ''}`} 
                                to="/about"
                                onClick={() => setIsOpen(false)}
                            >
                                <i className="bi bi-info-circle me-1"></i>
                                আমাদের সম্পর্কে
                            </Link>
                        </li>
                    </ul>
                    
                    {/* Desktop Cart Icon (Right side) */}
                    <div className="d-none d-lg-flex align-items-center">
                        <Link 
                            to="/cart" 
                            className="nav-link text-white position-relative"
                            title="শপিং কার্ট"
                            onClick={() => setIsOpen(false)}
                        >
                            <i className="bi bi-cart3 fs-5"></i>
                            {cartItemsCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    {cartItemsCount}
                                    <span className="visually-hidden">কার্ট আইটেম</span>
                                </span>
                            )}
                        </Link>
                    </div>
                    
                    {/* Mobile Quick Search Suggestions */}
                    <div className="d-lg-none mt-3">
                        <div className="card">
                            <div className="card-body p-2">
                                <p className="small text-muted mb-2">দ্রুত সার্চ:</p>
                                <div className="d-flex flex-wrap gap-1">
                                    {['মধু', 'কিচমিচ', ' আখরোট', 'বাদাম', 'খেজুর'].map((term) => (
                                        <button
                                            key={term}
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                                setSearchTerm(term);
                                                navigate(`/search?q=${encodeURIComponent(term)}`);
                                                setIsOpen(false);
                                            }}
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Custom CSS */}
            <style jsx>{`
                .navbar {
                    padding-top: 0.5rem;
                    padding-bottom: 0.5rem;
                    z-index: 1030;
                }
                
                .navbar-brand {
                    font-size: 1.5rem;
                }
                
                /* Desktop search bar */
                .input-group input:focus {
                    box-shadow: none;
                    border-color: #dee2e6;
                }
                
                /* Mobile responsive */
                @media (max-width: 991.98px) {
                    .navbar-collapse {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        z-index: 1000;
                        background: white;
                        padding: 1rem;
                        border-radius: 0 0 10px 10px;
                        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                        max-height: 80vh;
                        overflow-y: auto;
                    }
                    
                    .navbar-dark .navbar-collapse .nav-link {
                        color: #333 !important;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid #eee;
                    }
                    
                    .navbar-dark .navbar-collapse .nav-link:last-child {
                        border-bottom: none;
                    }
                    
                    .navbar-dark .navbar-collapse .nav-link.active {
                        color: #0d6efd !important;
                        font-weight: 600;
                    }
                    
                    .navbar-collapse.show {
                        animation: slideDown 0.3s ease;
                    }
                    
                    #mobileSearch {
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: white;
                        z-index: 1001;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    }
                    
                    #mobileSearch.collapse.show {
                        animation: fadeIn 0.3s ease;
                    }
                    
                    @keyframes slideDown {
                        from { 
                            opacity: 0; 
                            transform: translateY(-10px); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0); 
                        }
                    }
                    
                    @keyframes fadeIn {
                        from { 
                            opacity: 0; 
                            transform: translateY(-5px); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0); 
                        }
                    }
                }
                
                .navbar-toggler:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
                }
                
                .nav-link {
                    transition: all 0.3s ease;
                }
                
                .nav-link:hover {
                    transform: translateY(-2px);
                }
                
                .btn-outline-light:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                
                /* Cart badge animation */
                .badge {
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;