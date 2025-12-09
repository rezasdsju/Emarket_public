import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
    // ইমেজ URL তৈরি - 127.0.0.1:8000 থেকে সরাসরি সার্ভার URL এ পরিবর্তন
    const getImageUrl = () => {
        // যদি সম্পূর্ণ URL থাকে
        if (product.image_url && product.image_url.startsWith('http')) {
            return product.image_url;
        }
        
        // যদি রিলেটিভ path থাকে
        if (product.image) {
            // Remove any leading slash if present
            const imagePath = product.image.startsWith('/') ? product.image.substring(1) : product.image;
            return `https://organic.satbeta.top/media/${imagePath}`;
        }
        
        // যদি image field থাকে (Media URL)
        if (product.image) {
            return `https://organic.satbeta.top${product.image}`;
        }
        
        // ডিফল্ট placeholder
        return 'https://via.placeholder.com/300x200.png?text=No+Image';
    };
    
    const imageUrl = getImageUrl();
    
    return (
        <div className="card h-100 shadow-sm hover-shadow" style={{
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            border: '1px solid #e0e0e0'
        }}>
            <div 
                className="position-relative" 
                style={{ 
                    height: '200px', 
                    overflow: 'hidden',
                    backgroundColor: '#f8f9fa'
                }}
            >
                <img 
                    src={imageUrl} 
                    className="card-img-top" 
                    alt={product.name || 'Product Image'}
                    style={{ 
                        height: '100%', 
                        width: '100%', 
                        objectFit: 'contain',
                        padding: '10px'
                    }}
                    loading="lazy"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200.png?text=Image+Not+Found';
                        e.target.style.objectFit = 'cover';
                        e.target.style.padding = '0';
                    }}
                />
                
                {!product.available && (
                    <div className="position-absolute top-0 start-0 bg-danger text-white p-2" 
                         style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        স্টক নেই
                    </div>
                )}
                
                {product.discount_price && product.discount_price < product.price && (
                    <div className="position-absolute top-0 end-0 bg-success text-white p-2" 
                         style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {Math.round(((product.price - product.discount_price) / product.price) * 100)}% ছাড়
                    </div>
                )}
            </div>
            
            <div className="card-body d-flex flex-column p-3">
                <h6 className="card-title fw-bold mb-2" style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '48px',
                    color: '#333'
                }}>
                    {product.name || 'পণ্যের নাম নেই'}
                </h6>
                
                <div className="price-section mb-2">
                    {product.discount_price && product.discount_price < product.price ? (
                        <div className="d-flex align-items-center">
                            <h5 className="text-danger fw-bold mb-0 me-2">
                                ৳{product.discount_price.toLocaleString('bn-BD')}
                            </h5>
                            <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.9rem' }}>
                                ৳{product.price.toLocaleString('bn-BD')}
                            </span>
                        </div>
                    ) : (
                        <h5 className="text-primary fw-bold mb-0">
                            ৳{product.price ? product.price.toLocaleString('bn-BD') : '0'}
                        </h5>
                    )}
                </div>
                
                <p className="card-text text-muted mb-3 flex-grow-1" style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    fontSize: '0.85rem',
                    minHeight: '63px'
                }}>
                    {product.description || 'পণ্যের বিবরণ নেই।'}
                </p>
                
                <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="stock-info">
                            <span className={`badge ${product.available ? 'bg-success' : 'bg-danger'} me-2`}>
                                {product.available ? 'ইন স্টক' : 'স্টক নেই'}
                            </span>
                            <span className="badge bg-secondary">
                                স্টক: {product.stock || 0}
                            </span>
                        </div>
                        
                        <Link 
                            to={`/product/${product.id}`} 
                            className="btn btn-primary btn-sm px-3"
                            style={{ 
                                fontWeight: '600',
                                fontSize: '0.85rem'
                            }}
                        >
                            বিস্তারিত
                        </Link>
                    </div>
                    
                    {product.category && (
                        <div className="category-section mt-2 pt-2 border-top">
                            <small className="text-muted d-block mb-1">ক্যাটাগরি:</small>
                            <span className="badge bg-light text-dark border px-3 py-1" 
                                  style={{ fontSize: '0.8rem' }}>
                                {product.category.name || 'সাধারণ'}
                            </span>
                        </div>
                    )}
                    
                    {product.brand && (
                        <div className="brand-section mt-2 pt-2 border-top">
                            <small className="text-muted d-block mb-1">ব্র্যান্ড:</small>
                            <span className="badge bg-info text-white px-3 py-1" 
                                  style={{ fontSize: '0.8rem' }}>
                                {product.brand}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Hover Effects */}
            <style jsx>{`
                .hover-shadow:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
                
                .card-img-top {
                    transition: transform 0.5s ease;
                }
                
                .card:hover .card-img-top {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};

export default ProductCard;