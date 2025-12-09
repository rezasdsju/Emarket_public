import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

const CategoryProducts = () => {
    const { slug } = useParams(); // URL থেকে category slug নিবে
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allCategories, setAllCategories] = useState([]);
    const [sortBy, setSortBy] = useState('default'); // ডিফল্ট, price_asc, price_desc, new
    
    // API URLs
    const API_BASE_URL = 'https://organic.satbeta.top';
    // const API_BASE_URL = 'http://127.0.0.1:8000'; // বিকল্প
    
    useEffect(() => {
        fetchData();
    }, [slug, sortBy]); // slug বা sortBy পরিবর্তন হলে আবার ফেচ করবে
    
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log(`Fetching data for category: ${slug}`);
            
            // ১. সব ক্যাটাগরি লোড
            const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories/`, {
                headers: { 'Accept': 'application/json' }
            }).catch(err => {
                console.error('Categories API Error:', err);
                // ফ্যালব্যাক
                return axios.get('http://127.0.0.1:8000/api/categories/');
            });
            
            let categoriesData = [];
            if (categoriesResponse.data.results) {
                categoriesData = categoriesResponse.data.results;
            } else if (Array.isArray(categoriesResponse.data)) {
                categoriesData = categoriesResponse.data;
            }
            
            setAllCategories(categoriesData);
            console.log(`Total categories: ${categoriesData.length}`);
            
            // ২. বর্তমান ক্যাটাগরি খুঁজে বের করা
            const currentCategory = categoriesData.find(cat => 
                cat.slug === slug || cat.id.toString() === slug
            );
            
            if (!currentCategory) {
                setError('ক্যাটাগরি পাওয়া যায়নি।');
                setLoading(false);
                return;
            }
            
            setCategory(currentCategory);
            console.log('Current category:', currentCategory);
            
            // ৩. এই ক্যাটাগরির পণ্য ফেচ করা
            let apiUrl = `${API_BASE_URL}/api/products/?category=${currentCategory.id}`;
            
            // সর্টিং প্যারামিটার যোগ
            switch(sortBy) {
                case 'price_asc':
                    apiUrl += '&ordering=price';
                    break;
                case 'price_desc':
                    apiUrl += '&ordering=-price';
                    break;
                case 'new':
                    apiUrl += '&ordering=-created_at';
                    break;
                default:
                    // ডিফল্ট: API ডিফল্ট অর্ডার
                    break;
            }
            
            console.log('Fetching products from:', apiUrl);
            
            try {
                const productsResponse = await axios.get(apiUrl, {
                    headers: { 'Accept': 'application/json' }
                }).catch(err => {
                    console.error('Products API Error:', err);
                    // ফ্যালব্যাক চেষ্টা
                    return axios.get(`http://127.0.0.1:8000/api/products/?category=${currentCategory.id}`);
                });
                
                console.log('Products API Response:', productsResponse.data);
                
                if (productsResponse.data.results) {
                    // পেজিনেশন আছে
                    const sortedProducts = sortProducts(productsResponse.data.results);
                    setProducts(sortedProducts);
                } else if (Array.isArray(productsResponse.data)) {
                    // সরাসরি অ্যারে
                    const sortedProducts = sortProducts(productsResponse.data);
                    setProducts(sortedProducts);
                } else {
                    setProducts([]);
                }
                
            } catch (apiError) {
                console.error('Alternative approach...');
                // সব পণ্য লোড করে ক্লায়েন্ট সাইডে ফিল্টার
                const allProductsResponse = await axios.get(`${API_BASE_URL}/api/products/`, {
                    headers: { 'Accept': 'application/json' }
                });
                
                const allProducts = allProductsResponse.data.results || allProductsResponse.data;
                
                if (Array.isArray(allProducts)) {
                    const filteredProducts = allProducts.filter(product => {
                        // বিভিন্ন ফরম্যাট চেক
                        if (product.category) {
                            if (typeof product.category === 'object') {
                                return product.category.slug === slug || 
                                       product.category.id.toString() === slug ||
                                       product.category.name?.toLowerCase() === currentCategory.name?.toLowerCase();
                            } else if (typeof product.category === 'number' || typeof product.category === 'string') {
                                return product.category.toString() === currentCategory.id.toString();
                            }
                        }
                        return false;
                    });
                    
                    const sortedProducts = sortProducts(filteredProducts);
                    setProducts(sortedProducts);
                } else {
                    setProducts([]);
                }
            }
            
            setLoading(false);
            
        } catch (err) {
            console.error('Error fetching category products:', err);
            
            let errorMessage = 'এই ক্যাটাগরির পণ্য লোড করতে সমস্যা হচ্ছে।';
            
            if (err.response) {
                console.error('Error Response:', err.response);
                if (err.response.status === 404) {
                    errorMessage = 'ক্যাটাগরি পাওয়া যায়নি।';
                }
            }
            
            setError(errorMessage);
            setProducts([]);
            setLoading(false);
        }
    };
    
    // ক্লায়েন্ট সাইড সর্টিং
    const sortProducts = (productsArray) => {
        if (!Array.isArray(productsArray)) return [];
        
        const sorted = [...productsArray];
        
        switch(sortBy) {
            case 'price_asc':
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price_desc':
                return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            case 'new':
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.created_at || a.date_added || 0);
                    const dateB = new Date(b.created_at || b.date_added || 0);
                    return dateB - dateA;
                });
            default:
                return sorted; // ডিফল্ট অর্ডার
        }
    };
    
    const handleCategoryChange = (newSlug) => {
        navigate(`/category/${newSlug}`);
    };
    
    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };
    
    const resetFilters = () => {
        setSortBy('default');
    };
    
    // লোডিং স্টেট
    if (loading) {
        return (
            <div className="container mt-5 py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                        <span className="visually-hidden">লোড হচ্ছে...</span>
                    </div>
                    <p className="mt-3 fs-5">
                        <strong>{category?.name || 'ক্যাটাগরি'}</strong> এর পণ্য লোড হচ্ছে...
                    </p>
                    <p className="text-muted">
                        <small>API: {API_BASE_URL}/api/products/?category={category?.id}</small>
                    </p>
                    <div className="progress mt-3" style={{ height: '4px', maxWidth: '300px', margin: '0 auto' }}>
                        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
                    </div>
                </div>
            </div>
        );
    }
    
    // এরর স্টেট
    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <h4 className="alert-heading">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        ক্যাটাগরি লোড করতে ব্যর্থ!
                    </h4>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex flex-wrap gap-2">
                        <Link to="/" className="btn btn-primary">
                            <i className="bi bi-house me-1"></i>
                            হোমপেজে ফিরে যান
                        </Link>
                        <button className="btn btn-outline-primary" onClick={fetchData}>
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            আবার চেষ্টা করুন
                        </button>
                        <Link to="/categories" className="btn btn-outline-secondary">
                            <i className="bi bi-tags me-1"></i>
                            অন্য ক্যাটাগরি দেখুন
                        </Link>
                    </div>
                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="category-products-page">
            {/* ব্রেডক্রাম্ব */}
            <nav aria-label="breadcrumb" className="container mt-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/" className="text-decoration-none">
                            <i className="bi bi-house me-1"></i>
                            হোম
                        </Link>
                    </li>
                    <li className="breadcrumb-item">
                        <Link to="/categories" className="text-decoration-none">
                            ক্যাটাগরি
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        <strong>{category?.name}</strong>
                    </li>
                </ol>
            </nav>
            
            {/* হেডার সেকশন */}
            <div className="container mt-3">
                <div className="category-header bg-gradient-light rounded-3 p-4 mb-4 shadow-sm">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1 className="display-6 fw-bold text-primary mb-2">
                                <i className="bi bi-tag me-2"></i>
                                {category?.name}
                            </h1>
                            <p className="lead mb-3">
                                {category?.description || `${category?.name} ক্যাটাগরির সেরা পণ্যসমূহ`}
                            </p>
                            <div className="d-flex flex-wrap gap-3 align-items-center">
                                <span className="badge bg-primary fs-6 py-2 px-3">
                                    <i className="bi bi-box-seam me-1"></i>
                                    {products.length} টি পণ্য
                                </span>
                                {category?.product_count && (
                                    <span className="badge bg-info fs-6 py-2 px-3">
                                        মোট: {category.product_count}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-4 text-center">
                            <div className="category-icon display-1 text-primary opacity-50">
                                <i className="bi bi-basket"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* সর্টিং ও ফিল্টার সেকশন */}
                <div className="row mb-4">
                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">
                                            <i className="bi bi-sort-down me-1"></i>
                                            সর্ট করুন:
                                        </label>
                                        <select 
                                            className="form-select" 
                                            value={sortBy}
                                            onChange={handleSortChange}
                                        >
                                            <option value="default">ডিফল্ট অর্ডার</option>
                                            <option value="new">নতুন আগে</option>
                                            <option value="price_asc">দাম: কম থেকে বেশি</option>
                                            <option value="price_desc">দাম: বেশি থেকে কম</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 d-flex align-items-end">
                                        <button 
                                            className="btn btn-outline-secondary w-100"
                                            onClick={resetFilters}
                                            disabled={sortBy === 'default'}
                                        >
                                            <i className="bi bi-arrow-clockwise me-1"></i>
                                            ফিল্টার রিসেট
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm bg-light h-100">
                            <div className="card-body text-center">
                                <div className="display-6 text-primary mb-2">
                                    <i className="bi bi-percent"></i>
                                </div>
                                <h5>ডিসকাউন্ট পণ্য</h5>
                                <p className="text-muted small">
                                    {products.filter(p => p.discount_price && p.discount_price < p.price).length} টি পণ্যে বিশেষ ছাড়
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* অন্যান্য ক্যাটাগরি */}
                <div className="mb-5">
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-grid-3x3-gap me-2"></i>
                        অন্যান্য ক্যাটাগরি
                    </h4>
                    <div className="row g-2">
                        {allCategories.filter(cat => cat.slug !== slug).slice(0, 12).map(cat => (
                            <div key={cat.id} className="col-lg-2 col-md-3 col-sm-4 col-6">
                                <button
                                    onClick={() => handleCategoryChange(cat.slug || cat.id)}
                                    className={`btn w-100 ${cat.slug === slug ? 'btn-primary' : 'btn-outline-primary'} btn-sm py-2`}
                                >
                                    <span className="d-block text-truncate">
                                        {cat.name}
                                    </span>
                                    <small className="text-muted">
                                        {cat.product_count || ''}
                                    </small>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* পণ্য লিস্ট */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold m-0">
                            <i className="bi bi-boxes me-2"></i>
                            {category?.name} - পণ্য সমূহ
                        </h3>
                        <div className="dropdown">
                            <button className="btn btn-outline-primary btn-sm dropdown-toggle" 
                                    type="button" 
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false">
                                <i className="bi bi-gear me-1"></i>
                                অপশন
                            </button>
                            <ul className="dropdown-menu">
                                <li>
                                    <button className="dropdown-item" onClick={() => navigate(`/category/${slug}/discount`)}>
                                        <i className="bi bi-percent me-2"></i>
                                        শুধু ডিসকাউন্ট পণ্য
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={() => navigate(`/category/${slug}/in-stock`)}>
                                        <i className="bi bi-check-circle me-2"></i>
                                        শুধু স্টক আছে
                                    </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item" onClick={fetchData}>
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        রিফ্রেশ
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    {products.length === 0 ? (
                        <div className="alert alert-warning">
                            <div className="d-flex">
                                <div className="me-3">
                                    <i className="bi bi-exclamation-triangle text-warning fs-3"></i>
                                </div>
                                <div>
                                    <h5 className="alert-heading">পণ্য পাওয়া যায়নি</h5>
                                    <p className="mb-2">এই ক্যাটাগরিতে এখনো কোনো পণ্য যোগ করা হয়নি।</p>
                                    <div className="d-flex flex-wrap gap-2">
                                        <Link to="/" className="btn btn-primary btn-sm">
                                            <i className="bi bi-house me-1"></i>
                                            হোমপেজে ফিরে যান
                                        </Link>
                                        <Link to="/products" className="btn btn-outline-primary btn-sm">
                                            <i className="bi bi-box-seam me-1"></i>
                                            সব পণ্য দেখুন
                                        </Link>
                                        <button className="btn btn-outline-secondary btn-sm" onClick={fetchData}>
                                            <i className="bi bi-arrow-clockwise me-1"></i>
                                            আবার চেষ্টা করুন
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* পণ্য কাউন্টার */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="alert alert-light border d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="badge bg-primary rounded-pill me-2">
                                                <i className="bi bi-box-seam"></i>
                                            </span>
                                            <strong>{products.length}</strong> টি পণ্য পাওয়া গেছে
                                        </div>
                                        <div className="text-muted small">
                                            সর্ট করা হয়েছে: {
                                                sortBy === 'default' ? 'ডিফল্ট' :
                                                sortBy === 'price_asc' ? 'দাম: কম থেকে বেশি' :
                                                sortBy === 'price_desc' ? 'দাম: বেশি থেকে কম' :
                                                'নতুন আগে'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* পণ্য গ্রিড */}
                            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                                {products.map(product => (
                                    <div key={product.id} className="col">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                            
                            {/* পেজিনেশন (যদি থাকে) */}
                            {products.length >= 20 && (
                                <div className="mt-5 text-center">
                                    <nav aria-label="Page navigation">
                                        <ul className="pagination justify-content-center">
                                            <li className="page-item disabled">
                                                <span className="page-link">পূর্ববর্তী</span>
                                            </li>
                                            <li className="page-item active">
                                                <span className="page-link">1</span>
                                            </li>
                                            <li className="page-item">
                                                <a className="page-link" href="#">2</a>
                                            </li>
                                            <li className="page-item">
                                                <a className="page-link" href="#">3</a>
                                            </li>
                                            <li className="page-item">
                                                <a className="page-link" href="#">পরবর্তী</a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                {/* ব্যাক বাটন */}
                <div className="mt-5 pt-4 border-top text-center">
                    <div className="d-flex flex-wrap justify-content-center gap-3">
                        <Link to="/" className="btn btn-outline-secondary">
                            <i className="bi bi-arrow-left me-1"></i>
                            হোমপেজে ফিরে যান
                        </Link>
                        <Link to="/categories" className="btn btn-outline-primary">
                            <i className="bi bi-tags me-1"></i>
                            সব ক্যাটাগরি দেখুন
                        </Link>
                        <Link to="/products" className="btn btn-primary">
                            <i className="bi bi-box-seam me-1"></i>
                            সব পণ্য দেখুন
                        </Link>
                    </div>
                </div>
                
                {/* ডিবাগ ইনফো (শুধু ডেভেলপমেন্টে) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-5 pt-4 border-top text-muted small">
                        <details>
                            <summary className="mb-2">
                                <strong>ডিবাগ তথ্য (Development Only)</strong>
                            </summary>
                            <ul className="list-unstyled mb-1">
                                <li>• <strong>Category Slug:</strong> {slug}</li>
                                <li>• <strong>Category ID:</strong> {category?.id}</li>
                                <li>• <strong>Category Name:</strong> {category?.name}</li>
                                <li>• <strong>Products Count:</strong> {products.length}</li>
                                <li>• <strong>Sort By:</strong> {sortBy}</li>
                                <li>• <strong>API URL:</strong> {API_BASE_URL}/api/products/?category={category?.id}</li>
                            </ul>
                        </details>
                    </div>
                )}
            </div>
            
            {/* CSS স্টাইলস */}
            <style jsx>{`
                .category-header {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                }
                
                .category-icon {
                    transition: transform 0.3s ease;
                }
                
                .category-header:hover .category-icon {
                    transform: rotate(15deg);
                }
                
                .btn-outline-primary.active {
                    background-color: var(--bs-primary);
                    color: white;
                }
                
                .product-grid {
                    transition: all 0.3s ease;
                }
            `}</style>
        </div>
    );
};

export default CategoryProducts;