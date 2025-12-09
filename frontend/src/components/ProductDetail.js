import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

const ProductDetail = ({ addToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [showQuickCheckout, setShowQuickCheckout] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [orderProcessing, setOrderProcessing] = useState(false);
    
    useEffect(() => {
        fetchProduct();
    }, [id]);
    
    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(`https://organic.satbeta.top/api/products/${id}/`);
            setProduct(response.data);
            
            if (response.data.category && response.data.category.id) {
                try {
                    const relatedResponse = await axios.get(
                        `https://organic.satbeta.top/api/products/?category=${response.data.category.slug}`
                    );
                    
                    const allRelated = relatedResponse.data.results || relatedResponse.data;
                    const filteredRelated = Array.isArray(allRelated) 
                        ? allRelated.filter(p => p.id !== response.data.id).slice(0, 4)
                        : [];
                    setRelatedProducts(filteredRelated);
                } catch (relatedError) {
                    console.log('Could not fetch related products:', relatedError);
                }
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching product:', error);
            setError('পণ্য লোড করতে সমস্যা হচ্ছে।');
            setLoading(false);
        }
    };
    
    const handleAddToCart = () => {
        if (product && addToCart) {
            addToCart(product, quantity);
            alert('পণ্য কার্টে যোগ করা হয়েছে! ✅');
        }
    };
    
    const handleBuyNow = () => {
        if (product && product.available && product.stock > 0) {
            setShowQuickCheckout(true);
        }
    };
    
    const handleQuantityChange = (newQuantity) => {
        const maxStock = product ? product.stock : 1;
        if (newQuantity >= 1 && newQuantity <= maxStock) {
            setQuantity(newQuantity);
        }
    };
    
    const handleQuickOrder = async () => {
        // ভ্যালিডেশন চেক
        if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
            alert('নাম, ফোন এবং ঠিকানা আবশ্যক');
            return;
        }
        
        if (customerInfo.phone.length < 11) {
            alert('সঠিক মোবাইল নম্বর দিন (11 ডিজিট)');
            return;
        }
        
        if (quantity > product.stock) {
            alert(`দুঃখিত! স্টক এ মাত্র ${product.stock} টি আছে।`);
            return;
        }
        
        setOrderProcessing(true);
        
        try {
            // ১. Backend-এ অর্ডার তৈরি
            const totalPrice = product.price * quantity;
            
            const orderData = {
                name: customerInfo.name,
                email: 'no-email@example.com',
                phone: customerInfo.phone,
                address: customerInfo.address,
                total_price: totalPrice,
                items: [{
                    product_id: product.id,
                    quantity: quantity
                }]
            };
            
            console.log('Sending quick order:', orderData);
            
            const orderResponse = await axios.post(
                'https://organic.satbeta.top/api/orders/',
                orderData
            );
            
            console.log('Quick order created:', orderResponse.data);
            
            // ২. সাফল্য মেসেজ দেখান
            alert(`
                🎉 অর্ডার সফলভাবে তৈরি হয়েছে!
                
                অর্ডার নং: #${orderResponse.data.id}
                মোট: ৳${totalPrice}
                
                পেমেন্ট করার জন্য নিচের যেকোনো নম্বরে টাকা পাঠান:
                bKash: 017XXXXXXXX
                Rocket: 017XXXXXXXX
                Nagad: 017XXXXXXXX
                
                Reference: ORD${orderResponse.data.id}
            `);
            
            // ৩. সবকিছু রিসেট
            setShowQuickCheckout(false);
            setCustomerInfo({
                name: '',
                phone: '',
                address: ''
            });
            setQuantity(1);
            
            // ৪. কনফার্মেশন পেজে নিয়ে যেতে চাইলে
            // navigate(`/order-confirmation/${orderResponse.data.id}`);
            
        } catch (error) {
            console.error('Quick order error:', error.response || error);
            alert('অর্ডার করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
        } finally {
            setOrderProcessing(false);
        }
    };
    
    // লোডিং স্টেট
    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">লোড হচ্ছে...</span>
                </div>
                <p className="mt-3">পণ্য লোড হচ্ছে...</p>
            </div>
        );
    }
    
    // এরর স্টেট
    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <h4>এরর!</h4>
                    <p>{error}</p>
                    <div className="mt-3">
                        <Link to="/" className="btn btn-primary">
                            হোমপেজে ফিরে যান
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    
    // পণ্য না পাওয়া গেলে
    if (!product) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning">
                    <h4>পণ্য পাওয়া যায়নি</h4>
                    <p>আপনার চাহিদা অনুযায়ী পণ্যটি পাওয়া যায়নি।</p>
                    <Link to="/" className="btn btn-primary">
                        সব পণ্য দেখুন
                    </Link>
                </div>
            </div>
        );
    }
    
    // কুইক চেকআউট ফর্ম দেখানো
    if (showQuickCheckout) {
        return (
            <div className="container mt-4">
                <div className="card">
                    <div className="card-body">
                        <h3>দ্রুত অর্ডার - {product.name}</h3>
                        <p className="text-muted">আপনার তথ্য দিন এবং এখনই কিনুন</p>
                        
                        <div className="row">
                            <div className="col-md-6">
                                <div className="card mb-3">
                                    <div className="card-body">
                                        <h5>পণ্যের তথ্য</h5>
                                        <div className="d-flex align-items-center">
                                            <img 
                                                src={product.image_url || (product.image ? `https://organic.satbeta.top${product.image}` : '')}
                                                alt={product.name}
                                                className="img-thumbnail me-3"
                                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <h6>{product.name}</h6>
                                                <p className="mb-1">দাম: ৳{product.price}</p>
                                                <p className="mb-1">পরিমাণ: {quantity}</p>
                                                <h5 className="text-primary">মোট: ৳{product.price * quantity}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">পূর্ণ নাম *</label>
                                    <input 
                                        type="text" 
                                        className="form-control"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({
                                            ...customerInfo, 
                                            name: e.target.value
                                        })}
                                        placeholder="আপনার পূর্ণ নাম"
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">মোবাইল নম্বর *</label>
                                    <input 
                                        type="tel" 
                                        className="form-control"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({
                                            ...customerInfo, 
                                            phone: e.target.value
                                        })}
                                        placeholder="01XXXXXXXXX"
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">ডেলিভারি ঠিকানা *</label>
                                    <textarea 
                                        className="form-control"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({
                                            ...customerInfo, 
                                            address: e.target.value
                                        })}
                                        placeholder="বিস্তারিত ঠিকানা"
                                        rows="3"
                                        required
                                    />
                                </div>
                                
                                <div className="alert alert-info small">
                                    <strong>নোট:</strong> অর্ডার কনফার্ম করার পর পেমেন্টের নির্দেশনা দেওয়া হবে।
                                </div>
                            </div>
                        </div>
                        
                        <div className="d-flex gap-2 mt-3">
                            <button 
                                className="btn btn-success"
                                onClick={handleQuickOrder}
                                disabled={orderProcessing}
                            >
                                {orderProcessing ? 'প্রসেসিং...' : 'অর্ডার কনফার্ম করুন'}
                            </button>
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={() => setShowQuickCheckout(false)}
                                disabled={orderProcessing}
                            >
                                পিছনে
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // ইমেজ URL তৈরি
    const imageUrl = product.image_url || 
                    (product.image ? `https://organic.satbeta.top${product.image}` : '');
    
    return (
        <div className="container mt-4">
            {/* ব্রেডক্রাম্ব */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/">হোম</Link>
                    </li>
                    {product.category && (
                        <li className="breadcrumb-item">
                            <Link to={`/category/${product.category.slug}`}>
                                {product.category.name}
                            </Link>
                        </li>
                    )}
                    <li className="breadcrumb-item active" aria-current="page">
                        {product.name}
                    </li>
                </ol>
            </nav>
            
            <div className="row">
                {/* বাম পাশ: ইমেজ */}
                <div className="col-lg-6 col-md-6 mb-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-3">
                            <div className="product-image-container text-center">
                                <img 
                                    src={imageUrl || 'https://via.placeholder.com/500x400?text=No+Image'} 
                                    alt={product.name}
                                    className="img-fluid rounded"
                                    style={{ 
                                        maxHeight: '400px', 
                                        width: 'auto',
                                        objectFit: 'contain' 
                                    }}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/500x400?text=Image+Error';
                                    }}
                                />
                            </div>
                            
                            <div className="d-flex justify-content-center mt-3">
                                <div className="thumbnail-container">
                                    <img 
                                        src={imageUrl || 'https://via.placeholder.com/80x60?text=Thumb'} 
                                        alt="Thumbnail"
                                        className="img-thumbnail mx-1"
                                        style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* ডান পাশ: পণ্য তথ্য */}
                <div className="col-lg-6 col-md-6 mb-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <h1 className="h2 fw-bold">{product.name}</h1>
                            
                            {product.category && (
                                <div className="mb-3">
                                    <Link 
                                        to={`/category/${product.category.slug}`}
                                        className="badge bg-light text-dark border text-decoration-none"
                                    >
                                        {product.category.name}
                                    </Link>
                                </div>
                            )}
                            
                            <div className="mb-4">
                                <h2 className="text-primary fw-bold">৳{product.price}</h2>
                                <small className="text-muted">বিক্রয় কর ও ভ্যাট অন্তর্ভুক্ত</small>
                            </div>
                            
                            <div className="mb-4">
                                <div className="d-flex align-items-center">
                                    <span className={`badge ${product.available && product.stock > 0 ? 'bg-success' : 'bg-danger'} me-2`}>
                                        {product.available && product.stock > 0 ? 'ইন স্টক' : 'স্টক নেই'}
                                    </span>
                                    <span className="text-muted">
                                        {product.stock > 0 ? `${product.stock} টি অবশিষ্ট` : 'স্টক ফুরিয়ে গেছে'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2">পণ্যের বর্ণনা</h5>
                                <p className="mt-2" style={{ whiteSpace: 'pre-line' }}>
                                    {product.description || 'এই পণ্যের জন্য কোনো বর্ণনা নেই।'}
                                </p>
                            </div>
                            
                            <div className="mb-4">
                                <h5 className="mb-3">পরিমাণ নির্বাচন করুন</h5>
                                <div className="d-flex align-items-center">
                                    <div className="input-group" style={{ width: '150px' }}>
                                        <button 
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => handleQuantityChange(quantity - 1)}
                                            disabled={quantity <= 1}
                                        >
                                            −
                                        </button>
                                        <input 
                                            type="number" 
                                            className="form-control text-center"
                                            value={quantity}
                                            min="1"
                                            max={product.stock}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 1;
                                                handleQuantityChange(val);
                                            }}
                                        />
                                        <button 
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => handleQuantityChange(quantity + 1)}
                                            disabled={quantity >= product.stock}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="ms-3">
                                        <small className="text-muted">
                                            সর্বোচ্চ: {product.stock} টি
                                        </small>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <div className="d-grid gap-2">
                                    <button 
                                        className="btn btn-primary btn-lg"
                                        onClick={handleAddToCart}
                                        disabled={!product.available || product.stock === 0}
                                    >
                                        <i className="bi bi-cart-plus me-2"></i>
                                        কার্টে যোগ করুন
                                    </button>
                                    
                                    <button 
                                        className="btn btn-success btn-lg"
                                        onClick={handleBuyNow}
                                        disabled={!product.available || product.stock === 0}
                                    >
                                        <i className="bi bi-lightning-charge me-2"></i>
                                        এখনই কিনুন
                                    </button>
                                </div>
                            </div>
                            
                            <div className="border-top pt-3 mt-3">
                                <div className="row small text-muted">
                                    <div className="col-6">
                                        <div className="mb-1">
                                            <i className="bi bi-box me-1"></i>
                                            <strong>পণ্য কোড:</strong> #{product.id}
                                        </div>
                                        <div className="mb-1">
                                            <i className="bi bi-calendar me-1"></i>
                                            <strong>যোগ করা:</strong> {new Date(product.created).toLocaleDateString('bn-BD')}
                                        </div>
                                    </div>
                                    <div className="col-6 text-end">
                                        <div className="mb-1">
                                            <strong>শেয়ার করুন:</strong>
                                        </div>
                                        <div>
                                            <button className="btn btn-sm btn-outline-secondary me-1">
                                                <i className="bi bi-facebook"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary me-1">
                                                <i className="bi bi-whatsapp"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <i className="bi bi-link-45deg"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {relatedProducts.length > 0 && (
                <div className="mt-5 pt-4 border-top">
                    <h3 className="mb-4">একই ক্যাটাগরির অন্যান্য পণ্য</h3>
                    <div className="row">
                        {relatedProducts.map(relatedProduct => (
                            <div key={relatedProduct.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                                <div className="card h-100 shadow-sm">
                                    <Link to={`/product/${relatedProduct.id}`} className="text-decoration-none text-dark">
                                        <img 
                                            src={relatedProduct.image_url || 
                                                 (relatedProduct.image ? `https://organic.satbeta.top${relatedProduct.image}` : 
                                                 'https://via.placeholder.com/300x200?text=Image')}
                                            className="card-img-top"
                                            alt={relatedProduct.name}
                                            style={{ height: '180px', objectFit: 'cover' }}
                                        />
                                        <div className="card-body">
                                            <h6 className="card-title" style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {relatedProduct.name}
                                            </h6>
                                            <p className="text-primary fw-bold mb-1">৳{relatedProduct.price}</p>
                                            <small className={`badge ${relatedProduct.available ? 'bg-success' : 'bg-danger'}`}>
                                                {relatedProduct.available ? 'ইন স্টক' : 'স্টক নেই'}
                                            </small>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="mt-4 text-center">
                <Link to="/" className="btn btn-outline-secondary">
                    ← সব পণ্য দেখুন
                </Link>
            </div>
        </div>
    );
};

export default ProductDetail;