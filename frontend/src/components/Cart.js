import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Cart = ({ cartItems, removeFromCart, updateQuantity, clearCart }) => {
    const [showPayment, setShowPayment] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: 'ঢাকা',
        payment_method: 'cod' // cod, bkash, rocket, nagad
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [orderStatus, setOrderStatus] = useState(null);
    const [paymentDetails, setPaymentDetails] = useState({
        transaction_id: '',
        payment_method: 'bkash'
    });
    
    // API URL
    const API_BASE_URL = 'https://organic.satbeta.top';
    // const API_BASE_URL = 'http://127.0.0.1:8000'; // বিকল্প
    
    // delivery charge গণনা
    const calculateDeliveryCharge = () => {
        const total = calculateTotal();
        // ৫০০ টাকার বেশি হলে ফ্রি ডেলিভারি
        if (total >= 500) {
            return 0;
        }
        // ঢাকার জন্য ৬০, অন্যান্য জেলার জন্য ১২০
        return customerInfo.city === 'ঢাকা' ? 60 : 120;
    };
    
    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };
    
    const calculateGrandTotal = () => {
        return calculateTotal() + calculateDeliveryCharge();
    };
    
    const handleCheckout = () => {
        if (cartItems.length === 0) {
            alert('কার্ট খালি! কিছু পণ্য যোগ করুন।');
            return;
        }
        
        // গ্রাহকের তথ্য চাওয়া হবে
        setShowCustomerForm(true);
    };
    
    const validateCustomerInfo = () => {
        const errors = [];
        
        if (!customerInfo.name.trim()) {
            errors.push('নাম আবশ্যক');
        }
        
        if (!customerInfo.phone.trim()) {
            errors.push('মোবাইল নম্বর আবশ্যক');
        } else if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(customerInfo.phone)) {
            errors.push('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)');
        }
        
        if (!customerInfo.address.trim()) {
            errors.push('ঠিকানা আবশ্যক');
        }
        
        if (errors.length > 0) {
            alert('ত্রুটি:\n' + errors.join('\n'));
            return false;
        }
        
        return true;
    };
    
    const handleCustomerSubmit = async () => {
        if (!validateCustomerInfo()) {
            return;
        }
        
        setLoading(true);
        
        try {
            // ১. Backend-এ অর্ডার তৈরি
            const orderData = {
                name: customerInfo.name,
                email: customerInfo.email || 'no-email@example.com',
                phone: customerInfo.phone,
                address: `${customerInfo.address}, ${customerInfo.city}`,
                city: customerInfo.city,
                payment_method: customerInfo.payment_method,
                status: 'pending',
                delivery_charge: calculateDeliveryCharge(),
                subtotal: calculateTotal(),
                total_price: calculateGrandTotal(),
                order_items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price
                }))
            };
            
            console.log('Sending order data:', orderData);
            
            const orderResponse = await axios.post(
                `${API_BASE_URL}/api/orders/`,
                orderData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );
            
            console.log('Order created:', orderResponse.data);
            
            // ২. অর্ডার সেভ করে পরবর্তী ধাপে যান
            const newOrder = orderResponse.data;
            setCurrentOrder(newOrder);
            setOrderStatus('created');
            
            if (customerInfo.payment_method === 'cod') {
                // COD হলে সরাসরি confirmation
                handleOrderConfirmation(newOrder);
            } else {
                // অনলাইন পেমেন্ট হলে পেমেন্ট পেজ দেখান
                setShowCustomerForm(false);
                setShowPayment(true);
            }
            
        } catch (error) {
            console.error('Order creation error:', error);
            
            let errorMessage = 'অর্ডার তৈরি করতে সমস্যা হয়েছে।';
            
            if (error.response) {
                console.error('Error Response:', error.response.data);
                
                if (error.response.status === 400) {
                    const serverErrors = error.response.data;
                    if (typeof serverErrors === 'object') {
                        const errorList = Object.values(serverErrors).flat();
                        errorMessage = 'ত্রুটি:\n' + errorList.join('\n');
                    }
                }
            }
            
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePaymentSubmit = async () => {
        if (!paymentDetails.transaction_id.trim()) {
            alert('ট্রাঞ্জাকশন ID দিন');
            return;
        }
        
        setLoading(true);
        
        try {
            const paymentData = {
                order_id: currentOrder.id,
                transaction_id: paymentDetails.transaction_id,
                payment_method: paymentDetails.payment_method,
                amount: currentOrder.total_price,
                status: 'completed'
            };
            
            console.log('Processing payment:', paymentData);
            
            // পেমেন্ট API কল
            const paymentResponse = await axios.post(
                `${API_BASE_URL}/api/payments/`,
                paymentData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Payment response:', paymentResponse.data);
            
            // অর্ডার স্ট্যাটাস আপডেট
            await axios.patch(
                `${API_BASE_URL}/api/orders/${currentOrder.id}/`,
                { status: 'processing' },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            handleOrderConfirmation(currentOrder, paymentDetails.transaction_id);
            
        } catch (error) {
            console.error('Payment error:', error);
            alert('পেমেন্ট প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setLoading(false);
        }
    };
    
    const handleOrderConfirmation = (order, transactionId = null) => {
        setOrderStatus('confirmed');
        setShowPayment(false);
        setShowCustomerForm(false);
        
        // স্থানীয় স্টোরেজে অর্ডার সেভ (ঐচ্ছিক)
        const orderData = {
            id: order.id,
            order_number: `ORD-${order.id}`,
            total: order.total_price,
            customer: customerInfo.name,
            phone: customerInfo.phone,
            address: `${customerInfo.address}, ${customerInfo.city}`,
            payment_method: customerInfo.payment_method,
            transaction_id: transactionId,
            date: new Date().toLocaleString('bn-BD'),
            items: cartItems
        };
        
        // স্থানীয় স্টোরেজে সেভ
        localStorage.setItem('last_order', JSON.stringify(orderData));
        
        // কার্ট খালি করুন
        if (clearCart) {
            clearCart();
        }
    };
    
    const handleCancelOrder = () => {
        setShowPayment(false);
        setShowCustomerForm(false);
        setCurrentOrder(null);
        setOrderStatus(null);
    };
    
    // অর্ডার কনফার্মেশন পেজ
    if (orderStatus === 'confirmed') {
        const lastOrder = JSON.parse(localStorage.getItem('last_order') || '{}');
        
        return (
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card border-success shadow">
                            <div className="card-header bg-success text-white">
                                <h3 className="mb-0">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    অর্ডার সফল!
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="text-center mb-4">
                                    <div className="display-1 text-success mb-3">
                                        <i className="bi bi-check-circle"></i>
                                    </div>
                                    <h4 className="text-success">ধন্যবাদ! আপনার অর্ডার গ্রহণ করা হয়েছে</h4>
                                    <p className="text-muted">আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবে</p>
                                </div>
                                
                                <div className="alert alert-success">
                                    <h5>
                                        <i className="bi bi-receipt me-2"></i>
                                        অর্ডার নং: <strong>ORD-{lastOrder.id}</strong>
                                    </h5>
                                </div>
                                
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <div className="card h-100">
                                            <div className="card-header bg-light">
                                                <h6 className="mb-0">গ্রাহক তথ্য</h6>
                                            </div>
                                            <div className="card-body">
                                                <p className="mb-1"><strong>নাম:</strong> {lastOrder.customer}</p>
                                                <p className="mb-1"><strong>ফোন:</strong> {lastOrder.phone}</p>
                                                <p className="mb-1"><strong>ঠিকানা:</strong> {lastOrder.address}</p>
                                                <p className="mb-0"><strong>পেমেন্ট:</strong> {
                                                    lastOrder.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' :
                                                    lastOrder.payment_method === 'bkash' ? 'bKash' :
                                                    lastOrder.payment_method === 'rocket' ? 'Rocket' : 'Nagad'
                                                }</p>
                                                {lastOrder.transaction_id && (
                                                    <p className="mb-0"><strong>ট্রাঞ্জাকশন ID:</strong> {lastOrder.transaction_id}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card h-100">
                                            <div className="card-header bg-light">
                                                <h6 className="mb-0">অর্ডার বিবরণ</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-sm">
                                                        <thead>
                                                            <tr>
                                                                <th>পণ্য</th>
                                                                <th className="text-center">পরিমাণ</th>
                                                                <th className="text-end">মূল্য</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {lastOrder.items && lastOrder.items.map(item => (
                                                                <tr key={item.id}>
                                                                    <td>{item.name}</td>
                                                                    <td className="text-center">{item.quantity}</td>
                                                                    <td className="text-end">৳{item.price * item.quantity}</td>
                                                                </tr>
                                                            ))}
                                                            <tr>
                                                                <td colSpan="2" className="fw-bold">ডেলিভারি চার্জ</td>
                                                                <td className="text-end">৳{lastOrder.delivery_charge || calculateDeliveryCharge()}</td>
                                                            </tr>
                                                            <tr className="table-success">
                                                                <td colSpan="2" className="fw-bold">মোট</td>
                                                                <td className="text-end fw-bold">৳{lastOrder.total}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="alert alert-info">
                                    <h6>
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        পরবর্তী ধাপ
                                    </h6>
                                    <ul className="mb-0">
                                        <li>অর্ডার কনফার্মেশন এসএমস আপনার ফোনে যাবে</li>
                                        <li>পণ্য ডেলিভারি: {customerInfo.city === 'ঢাকা' ? '২৪ ঘণ্টার মধ্যে' : '২-৩ কার্যদিবসের মধ্যে'}</li>
                                        <li>যেকোনো প্রশ্নের জন্য কল করুন: 09678-123456</li>
                                    </ul>
                                </div>
                                
                                <div className="d-flex flex-wrap gap-3 justify-content-center">
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => window.print()}
                                    >
                                        <i className="bi bi-printer me-2"></i>
                                        প্রিন্ট করুন
                                    </button>
                                    <Link to="/orders" className="btn btn-primary">
                                        <i className="bi bi-list-ul me-2"></i>
                                        আমার অর্ডার দেখুন
                                    </Link>
                                    <Link to="/" className="btn btn-success">
                                        <i className="bi bi-cart me-2"></i>
                                        আরো শপিং করুন
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // পেমেন্ট পেজ
    if (showPayment && currentOrder) {
        const paymentMethod = customerInfo.payment_method;
        
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="bi bi-credit-card me-2"></i>
                                    পেমেন্ট প্রসেস
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="alert alert-success">
                                    <h5>
                                        <i className="bi bi-check-circle me-2"></i>
                                        অর্ডার সফলভাবে তৈরি হয়েছে!
                                    </h5>
                                    <p className="mb-0">
                                        <strong>অর্ডার নং:</strong> #{currentOrder.id} | 
                                        <strong> মোট:</strong> ৳{currentOrder.total_price}
                                    </p>
                                </div>
                                
                                <div className="payment-instructions mb-4">
                                    <h5 className="mb-3">
                                        {paymentMethod === 'bkash' ? 'bKash' :
                                         paymentMethod === 'rocket' ? 'Rocket' :
                                         paymentMethod === 'nagad' ? 'Nagad' : 'অনলাইন'} পেমেন্ট
                                    </h5>
                                    
                                    <div className="card border-primary">
                                        <div className="card-body">
                                            <ol className="mb-0">
                                                <li>আপনার {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'rocket' ? 'Rocket' : 'Nagad'} অ্যাপ খুলুন</li>
                                                <li>Send Money সিলেক্ট করুন</li>
                                                <li>মার্চেন্ট নম্বর দিন: <strong>017XXXXXXXX</strong></li>
                                                <li>টাকার পরিমাণ দিন: <strong className="text-danger">৳{currentOrder.total_price}</strong></li>
                                                <li>Reference হিসেবে লিখুন: <strong>ORD{currentOrder.id}</strong></li>
                                                <li>আপনার PIN দিন এবং Send Money কনফার্ম করুন</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <h6 className="mb-3">পেমেন্ট তথ্য</h6>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                {paymentMethod === 'bkash' ? 'bKash' :
                                                 paymentMethod === 'rocket' ? 'Rocket' :
                                                 'Nagad'} ট্রাঞ্জাকশন ID
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="ট্রাঞ্জাকশন ID দিন"
                                                value={paymentDetails.transaction_id}
                                                onChange={(e) => setPaymentDetails({
                                                    ...paymentDetails,
                                                    transaction_id: e.target.value.toUpperCase()
                                                })}
                                            />
                                            <small className="text-muted">
                                                ১০-১২ ডিজিট/অক্ষরের ট্রাঞ্জাকশন ID (SMS বা অ্যাপ থেকে কপি করুন)
                                            </small>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">পেমেন্ট মেথড</label>
                                            <select
                                                className="form-select"
                                                value={paymentDetails.payment_method}
                                                onChange={(e) => setPaymentDetails({
                                                    ...paymentDetails,
                                                    payment_method: e.target.value
                                                })}
                                            >
                                                <option value="bkash">bKash</option>
                                                <option value="rocket">Rocket</option>
                                                <option value="nagad">Nagad</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="alert alert-warning">
                                    <h6 className="mb-2">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        গুরুত্বপূর্ণ
                                    </h6>
                                    <ul className="mb-0">
                                        <li>পেমেন্টের পর ট্রাঞ্জাকশন ID সঠিক ভাবে লিখুন</li>
                                        <li>ভুল ট্রাঞ্জাকশন ID দিলে অর্ডার বাতিল হয়ে যাবে</li>
                                        <li>যেকোনো সমস্যায় কল করুন: 09678-123456</li>
                                    </ul>
                                </div>
                                
                                <div className="d-flex flex-wrap gap-3">
                                    <button 
                                        className="btn btn-success px-4"
                                        onClick={handlePaymentSubmit}
                                        disabled={loading || !paymentDetails.transaction_id.trim()}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                প্রসেসিং...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-circle me-2"></i>
                                                পেমেন্ট কনফার্ম করুন
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary"
                                        onClick={handleCancelOrder}
                                        disabled={loading}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        বাতিল করুন
                                    </button>
                                    <Link to="/" className="btn btn-outline-primary">
                                        <i className="bi bi-house me-2"></i>
                                        হোমপেজ
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // গ্রাহক ফর্ম দেখানো
    if (showCustomerForm) {
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="bi bi-person-circle me-2"></i>
                                    গ্রাহকের তথ্য
                                </h4>
                            </div>
                            <div className="card-body">
                                <p className="text-muted mb-4">অর্ডার সম্পন্ন করতে আপনার তথ্য দিন</p>
                                
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">পূর্ণ নাম *</label>
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
                                    
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">মোবাইল নম্বর *</label>
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
                                        <small className="text-muted">11 ডিজিটের মোবাইল নম্বর</small>
                                    </div>
                                    
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">ডেলিভারি ঠিকানা *</label>
                                        <textarea 
                                            className="form-control"
                                            value={customerInfo.address}
                                            onChange={(e) => setCustomerInfo({
                                                ...customerInfo, 
                                                address: e.target.value
                                            })}
                                            placeholder="বিস্তারিত ঠিকানা (বাড়ি নম্বর, রোড, এলাকা)"
                                            rows="3"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">শহর *</label>
                                        <select 
                                            className="form-select"
                                            value={customerInfo.city}
                                            onChange={(e) => setCustomerInfo({
                                                ...customerInfo, 
                                                city: e.target.value
                                            })}
                                        >
                                            <option value="ঢাকা">ঢাকা</option>
                                            <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                                            <option value="রাজশাহী">রাজশাহী</option>
                                            <option value="খুলনা">খুলনা</option>
                                            <option value="সিলেট">সিলেট</option>
                                            <option value="বরিশাল">বরিশাল</option>
                                            <option value="রংপুর">রংপুর</option>
                                            <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                                            <option value="অন্যান্য">অন্যান্য জেলা</option>
                                        </select>
                                    </div>
                                    
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">পেমেন্ট মেথড *</label>
                                        <select 
                                            className="form-select"
                                            value={customerInfo.payment_method}
                                            onChange={(e) => setCustomerInfo({
                                                ...customerInfo, 
                                                payment_method: e.target.value
                                            })}
                                        >
                                            <option value="cod">ক্যাশ অন ডেলিভারি</option>
                                            <option value="bkash">bKash</option>
                                            <option value="rocket">Rocket</option>
                                            <option value="nagad">Nagad</option>
                                        </select>
                                        <small className="text-muted">
                                            {customerInfo.payment_method === 'cod' ? 
                                                'পণ্য ডেলিভারির সময় নগদ অর্থ প্রদান করুন' : 
                                                'অনলাইন পেমেন্ট'}
                                        </small>
                                    </div>
                                    
                                    <div className="col-12">
                                        <label className="form-label">ইমেইল (ঐচ্ছিক)</label>
                                        <input 
                                            type="email" 
                                            className="form-control"
                                            value={customerInfo.email}
                                            onChange={(e) => setCustomerInfo({
                                                ...customerInfo, 
                                                email: e.target.value
                                            })}
                                            placeholder="you@example.com"
                                        />
                                        <small className="text-muted">অর্ডার আপডেট পেতে ইমেইল দিন</small>
                                    </div>
                                </div>
                                
                                {/* অর্ডার সামারি */}
                                <div className="mt-5">
                                    <h5 className="mb-3">
                                        <i className="bi bi-receipt me-2"></i>
                                        অর্ডার সামারি
                                    </h5>
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>পণ্য</th>
                                                            <th className="text-end">দাম</th>
                                                            <th className="text-center">পরিমাণ</th>
                                                            <th className="text-end">মোট</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {cartItems.map(item => (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <img 
                                                                            src={item.image || 'https://via.placeholder.com/50x50'}
                                                                            alt={item.name}
                                                                            style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }}
                                                                            className="rounded"
                                                                        />
                                                                        <span>{item.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="text-end">৳{item.price}</td>
                                                                <td className="text-center">{item.quantity}</td>
                                                                <td className="text-end">৳{item.price * item.quantity}</td>
                                                            </tr>
                                                        ))}
                                                        <tr>
                                                            <td colSpan="2"></td>
                                                            <td className="fw-bold">সাবটোটাল:</td>
                                                            <td className="text-end">৳{calculateTotal()}</td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan="2"></td>
                                                            <td className="fw-bold">ডেলিভারি:</td>
                                                            <td className="text-end">
                                                                {calculateDeliveryCharge() === 0 ? (
                                                                    <span className="text-success">ফ্রি</span>
                                                                ) : (
                                                                    `৳${calculateDeliveryCharge()}`
                                                                )}
                                                            </td>
                                                        </tr>
                                                        <tr className="table-success">
                                                            <td colSpan="2"></td>
                                                            <td className="fw-bold">মোট:</td>
                                                            <td className="text-end fw-bold">৳{calculateGrandTotal()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="d-flex flex-wrap gap-3 mt-4">
                                    <button 
                                        className="btn btn-success px-4"
                                        onClick={handleCustomerSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                প্রসেসিং...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-circle me-2"></i>
                                                অর্ডার কনফার্ম করুন
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowCustomerForm(false)}
                                        disabled={loading}
                                    >
                                        <i className="bi bi-arrow-left me-2"></i>
                                        পিছনে
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // কার্ট খালি
    if (cartItems.length === 0) {
        return (
            <div className="container mt-5 py-5">
                <div className="text-center">
                    <div className="display-1 text-muted mb-4">
                        <i className="bi bi-cart"></i>
                    </div>
                    <h3 className="mb-3">আপনার কার্ট খালি</h3>
                    <p className="text-muted mb-4">আপনার শপিং কার্টে এখনো কোনো পণ্য নেই</p>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                        <Link to="/" className="btn btn-primary btn-lg">
                            <i className="bi bi-shop me-2"></i>
                            শপিং চালিয়ে যান
                        </Link>
                        <Link to="/products" className="btn btn-outline-primary btn-lg">
                            <i className="bi bi-box-seam me-2"></i>
                            সব পণ্য দেখুন
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
    
    // মূল কার্ট পেজ
    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-lg-8 mb-4">
                    <div className="card">
                        <div className="card-header bg-light">
                            <h4 className="mb-0">
                                <i className="bi bi-cart3 me-2"></i>
                                শপিং কার্ট
                                <span className="badge bg-primary ms-2">{cartItems.length}</span>
                            </h4>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th width="10%"></th>
                                            <th>পণ্য</th>
                                            <th className="text-end">দাম</th>
                                            <th className="text-center">পরিমাণ</th>
                                            <th className="text-end">মোট</th>
                                            <th width="5%"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartItems.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    <img 
                                                        src={item.image || 'https://via.placeholder.com/60x60'}
                                                        alt={item.name}
                                                        className="rounded"
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                    />
                                                </td>
                                                <td>
                                                    <div>
                                                        <h6 className="mb-1">{item.name}</h6>
                                                        {item.category && (
                                                            <small className="text-muted">
                                                                <i className="bi bi-tag me-1"></i>
                                                                {item.category.name}
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-end fw-semibold">৳{item.price}</td>
                                                <td className="text-center">
                                                    <div className="input-group input-group-sm" style={{ width: '120px', margin: '0 auto' }}>
                                                        <button 
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <i className="bi bi-dash"></i>
                                                        </button>
                                                        <input 
                                                            type="number" 
                                                            className="form-control text-center" 
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value) || 1;
                                                                updateQuantity(item.id, Math.max(1, value));
                                                            }}
                                                            min="1"
                                                            style={{ maxWidth: '60px' }}
                                                        />
                                                        <button 
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <i className="bi bi-plus"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="text-end fw-bold">৳{item.price * item.quantity}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeFromCart(item.id)}
                                                        title="Remove"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="d-flex justify-content-between mt-3">
                                <Link to="/" className="btn btn-outline-primary">
                                    <i className="bi bi-arrow-left me-2"></i>
                                    শপিং চালিয়ে যান
                                </Link>
                                <button 
                                    className="btn btn-outline-danger"
                                    onClick={clearCart}
                                >
                                    <i className="bi bi-trash me-2"></i>
                                    সব মুছুন
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-lg-4">
                    <div className="card sticky-top" style={{ top: '20px' }}>
                        <div className="card-header bg-light">
                            <h5 className="mb-0">
                                <i className="bi bi-receipt me-2"></i>
                                অর্ডার সামারি
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>পণ্যের মূল্য:</span>
                                    <span>৳{calculateTotal()}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>ডেলিভারি চার্জ:</span>
                                    <span>
                                        {calculateDeliveryCharge() === 0 ? (
                                            <span className="text-success">ফ্রি</span>
                                        ) : (
                                            `৳${calculateDeliveryCharge()}`
                                        )}
                                    </span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between">
                                    <h5 className="mb-0">মোট:</h5>
                                    <h4 className="text-primary mb-0">৳{calculateGrandTotal()}</h4>
                                </div>
                                {calculateTotal() >= 500 && (
                                    <div className="alert alert-success mt-3 py-2">
                                        <small>
                                            <i className="bi bi-check-circle me-1"></i>
                                            আপনি ফ্রি ডেলিভারি এর জন্য যোগ্য!
                                        </small>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                className="btn btn-success w-100 py-2 fw-bold mb-3"
                                onClick={handleCheckout}
                            >
                                <i className="bi bi-credit-card me-2"></i>
                                চেকআউট করুন
                            </button>
                            
                            <div className="alert alert-light border">
                                <h6 className="mb-2">
                                    <i className="bi bi-shield-check text-success me-2"></i>
                                    নিরাপদ শপিং
                                </h6>
                                <ul className="small mb-0">
                                    <li>১০০% নিরাপদ পেমেন্ট</li>
                                    <li>৭ দিন রিটার্ন পলিসি</li>
                                    <li>সুরক্ষিত ডেটা</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;