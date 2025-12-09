import React, { useState } from 'react';
import axios from 'axios';

const Payment = ({ order, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState('bkash');
    const [mobileNumber, setMobileNumber] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: মোবাইল নম্বর, 2: ট্রাঞ্জাকশন ID, 3: সম্পন্ন
    
    // প্রোডাকশন এবং ডেভেলপমেন্ট URL
    const API_BASE_URL = 'https://organic.satbeta.top';
    // const API_BASE_URL = 'http://127.0.0.1:8000'; // বিকল্প
    
    const paymentInstructions = {
        bkash: {
            name: 'bKash',
            merchant: '017XXXXXXXX',
            steps: [
                'আপনার bKash অ্যাপ খুলুন',
                'Send Money এ ক্লিক করুন',
                `নম্বর: 017XXXXXXXX (Merchant নম্বর)`,
                `Amount: ৳${order?.total_price || 0}`,
                'Reference: আপনার অর্ডার নম্বর ব্যবহার করুন',
                'PIN দিন এবং Send Money কনফার্ম করুন'
            ]
        },
        rocket: {
            name: 'Rocket',
            merchant: '017XXXXXXXX',
            steps: [
                'আপনার Rocket অ্যাপ খুলুন',
                'Send Money সিলেক্ট করুন',
                `নম্বর: 017XXXXXXXX (Merchant নম্বর)`,
                `Amount: ৳${order?.total_price || 0}`,
                'Reference: আপনার অর্ডার নম্বর ব্যবহার করুন',
                'PIN দিন এবং Send Money কনফার্ম করুন'
            ]
        },
        nagad: {
            name: 'Nagad',
            merchant: '017XXXXXXXX',
            steps: [
                'আপনার Nagad অ্যাপ খুলুন',
                'Send Money সিলেক্ট করুন',
                `নম্বর: 017XXXXXXXX (Merchant নম্বর)`,
                `Amount: ৳${order?.total_price || 0}`,
                'Reference: আপনার অর্ডার নম্বর ব্যবহার করুন',
                'PIN দিন এবং Send Money কনফার্ম করুন'
            ]
        },
        cod: {
            name: 'ক্যাশ অন ডেলিভারি',
            steps: [
                'পণ্য ডেলিভারির সময় নগদ অর্থ প্রদান করুন',
                'ডেলিভারি ম্যানকে পরিমাণ দিতে হবে: ৳' + (order?.total_price || 0),
                'পেমেন্ট রিসিট সংগ্রহ করুন'
            ]
        }
    };

    const validateMobileNumber = (number) => {
        const regex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
        return regex.test(number);
    };

    const handlePaymentInitiate = async () => {
        if (!mobileNumber || !validateMobileNumber(mobileNumber)) {
            alert('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX ফরম্যাটে)');
            return;
        }
        
        setLoading(true);
        
        try {
            const paymentData = {
                order_id: order.id,
                amount: order.total_price,
                payment_method: paymentMethod,
                mobile_number: mobileNumber,
                status: 'pending'
            };
            
            console.log('Sending payment data:', paymentData);
            
            const response = await axios.post(
                `${API_BASE_URL}/api/payments/`,
                paymentData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );
            
            console.log('Payment response:', response.data);
            
            // স্টেপ 2-এ যান (ট্রাঞ্জাকশন ID)
            setStep(2);
            
            alert(`${paymentInstructions[paymentMethod].name} পেমেন্ট শুরু হয়েছে। পেমেন্ট করুন এবং ট্রাঞ্জাকশন ID দিন।`);
            
        } catch (error) {
            console.error('Payment initiation error:', error);
            
            // ডিটেইলড error মেসেজ
            if (error.response) {
                console.error('Error response:', error.response.data);
                alert(`পেমেন্ট শুরু করতে সমস্যা: ${error.response.data.detail || error.response.statusText}`);
            } else if (error.request) {
                console.error('Error request:', error.request);
                alert('সার্ভার রেসপন্স দিচ্ছে না। দয়া করে নেটওয়ার্ক চেক করুন।');
            } else {
                alert('পেমেন্ট প্রসেস করতে সমস্যা হয়েছে: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentVerify = async () => {
        if (!transactionId.trim()) {
            alert('ট্রাঞ্জাকশন ID দিন');
            return;
        }
        
        setLoading(true);
        
        try {
            const verifyData = {
                order_id: order.id,
                transaction_id: transactionId,
                payment_method: paymentMethod,
                status: 'completed'
            };
            
            console.log('Verifying payment with:', verifyData);
            
            // পেমেন্ট আপডেট API কল (PUT/PATCH)
            const response = await axios.patch(
                `${API_BASE_URL}/api/payments/${order.id}/verify/`,
                verifyData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Verification response:', response.data);
            
            // পেমেন্ট সফল হলে
            setStep(3);
            
            if (onPaymentSuccess) {
                onPaymentSuccess({
                    ...response.data,
                    transaction_id: transactionId
                });
            }
            
            alert('পেমেন্ট সফলভাবে ভেরিফাই হয়েছে! আপনার অর্ডার কনফার্ম করা হয়েছে।');
            
        } catch (error) {
            console.error('Payment verification error:', error);
            
            if (error.response) {
                console.error('Error response:', error.response.data);
                
                // বিশেষ error হ্যান্ডলিং
                if (error.response.status === 404) {
                    alert('পেমেন্ট রেকর্ড পাওয়া যায়নি। প্রথমে পেমেন্ট শুরু করুন।');
                    setStep(1);
                } else if (error.response.status === 400) {
                    alert(`পেমেন্ট ভেরিফিকেশন সমস্যা: ${JSON.stringify(error.response.data)}`);
                } else {
                    alert(`পেমেন্ট ভেরিফাই করতে সমস্যা: ${error.response.statusText}`);
                }
            } else {
                alert('পেমেন্ট ভেরিফাই করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div className="mb-4">
            <h4 className="mb-3">পেমেন্ট মেথড সিলেক্ট করুন</h4>
            
            <div className="row mb-4">
                <div className="col-6 col-md-3 mb-2">
                    <button
                        type="button"
                        className={`btn w-100 ${paymentMethod === 'bkash' ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => setPaymentMethod('bkash')}
                        style={{ height: '60px' }}
                    >
                        <div className="d-flex flex-column align-items-center">
                            <span className="fw-bold">bKash</span>
                            <small>মোবাইল ব্যাংকিং</small>
                        </div>
                    </button>
                </div>
                <div className="col-6 col-md-3 mb-2">
                    <button
                        type="button"
                        className={`btn w-100 ${paymentMethod === 'rocket' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setPaymentMethod('rocket')}
                        style={{ height: '60px' }}
                    >
                        <div className="d-flex flex-column align-items-center">
                            <span className="fw-bold">Rocket</span>
                            <small>মোবাইল ব্যাংকিং</small>
                        </div>
                    </button>
                </div>
                <div className="col-6 col-md-3 mb-2">
                    <button
                        type="button"
                        className={`btn w-100 ${paymentMethod === 'nagad' ? 'btn-success' : 'btn-outline-success'}`}
                        onClick={() => setPaymentMethod('nagad')}
                        style={{ height: '60px' }}
                    >
                        <div className="d-flex flex-column align-items-center">
                            <span className="fw-bold">Nagad</span>
                            <small>মোবাইল ব্যাংকিং</small>
                        </div>
                    </button>
                </div>
                <div className="col-6 col-md-3 mb-2">
                    <button
                        type="button"
                        className={`btn w-100 ${paymentMethod === 'cod' ? 'btn-warning' : 'btn-outline-warning'}`}
                        onClick={() => setPaymentMethod('cod')}
                        style={{ height: '60px' }}
                    >
                        <div className="d-flex flex-column align-items-center">
                            <span className="fw-bold">Cash on Delivery</span>
                            <small>নগদ অর্থ</small>
                        </div>
                    </button>
                </div>
            </div>

            {paymentMethod !== 'cod' ? (
                <div className="mb-3">
                    <label className="form-label fw-bold">
                        আপনার {paymentInstructions[paymentMethod].name} মোবাইল নম্বর
                    </label>
                    <div className="input-group">
                        <span className="input-group-text">+88</span>
                        <input
                            type="tel"
                            className="form-control"
                            placeholder="01XXXXXXXXX"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            pattern="[0-9]{11}"
                            maxLength="11"
                        />
                    </div>
                    <small className="text-muted">
                        11 ডিজিটের মোবাইল নম্বর দিন (যে নম্বরটি {paymentInstructions[paymentMethod].name} অ্যাপে রেজিস্টার্ড)
                    </small>
                </div>
            ) : (
                <div className="alert alert-warning">
                    <h6>ক্যাশ অন ডেলিভারি নোটিশ:</h6>
                    <ul className="mb-0">
                        <li>পণ্য ডেলিভারির সময় নগদ অর্থ প্রদান করুন</li>
                        <li>ডেলিভারি চার্জ: ৳60 (ঢাকা সিটির ভিতরে)</li>
                        <li>ডেলিভারি সময়: ২-৩ কার্যদিবস</li>
                    </ul>
                </div>
            )}

            <button
                className="btn btn-success w-100 py-2 fw-bold"
                onClick={handlePaymentInitiate}
                disabled={loading || (paymentMethod !== 'cod' && !validateMobileNumber(mobileNumber))}
            >
                {loading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        প্রসেসিং...
                    </>
                ) : paymentMethod === 'cod' ? (
                    'অর্ডার কনফার্ম করুন'
                ) : (
                    'পেমেন্ট শুরু করুন'
                )}
            </button>
        </div>
    );

    const renderStep2 = () => (
        <div className="mb-4">
            <div className="alert alert-info">
                <h5>পেমেন্ট ইনস্ট্রাকশন</h5>
                <ol className="mb-3">
                    {paymentInstructions[paymentMethod].steps.map((step, index) => (
                        <li key={index}>{step}</li>
                    ))}
                </ol>
                <div className="alert alert-primary">
                    <strong>মনে রাখুন:</strong> ট্রাঞ্জাকশন ID সংগ্রহ করুন এবং নিচের বক্সে দিন
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label fw-bold">
                    {paymentInstructions[paymentMethod].name} ট্রাঞ্জাকশন ID
                </label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="ট্রাঞ্জাকশন ID দিন (যেমন: 8A7B6C5D4E)"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                />
                <small className="text-muted">
                    ট্রাঞ্জাকশন ID সাধারণত ১০-১২ ডিজিট/অক্ষরের হয়। SMS বা অ্যাপ থেকে কপি করুন।
                </small>
            </div>

            <div className="d-flex gap-2">
                <button
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={() => setStep(1)}
                    disabled={loading}
                >
                    ← ফিরে যান
                </button>
                <button
                    className="btn btn-primary flex-grow-1 py-2 fw-bold"
                    onClick={handlePaymentVerify}
                    disabled={loading || !transactionId.trim()}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            ভেরিফাই করছি...
                        </>
                    ) : (
                        'পেমেন্ট ভেরিফাই করুন'
                    )}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="text-center py-5">
            <div className="mb-4">
                <div className="display-1 text-success">
                    <i className="bi bi-check-circle-fill"></i>
                </div>
            </div>
            <h3 className="text-success mb-3">পেমেন্ট সফল!</h3>
            <p className="lead">আপনার অর্ডার #<strong>{order.id}</strong> সফলভাবে কনফার্ম হয়েছে।</p>
            
            <div className="card border-success mx-auto" style={{ maxWidth: '400px' }}>
                <div className="card-body">
                    <h5 className="card-title">অর্ডার ডিটেইলস</h5>
                    <ul className="list-unstyled">
                        <li>অর্ডার নং: <strong>#{order.id}</strong></li>
                        <li>মোট টাকা: <strong>৳{order.total_price}</strong></li>
                        <li>পেমেন্ট মেথড: <strong>{paymentInstructions[paymentMethod].name}</strong></li>
                        <li>ট্রাঞ্জাকশন ID: <strong>{transactionId}</strong></li>
                        <li>স্ট্যাটাস: <span className="badge bg-success">কনফার্মড</span></li>
                    </ul>
                </div>
            </div>
            
            <div className="mt-4">
                <button 
                    className="btn btn-outline-primary me-2"
                    onClick={() => window.print()}
                >
                    <i className="bi bi-printer me-1"></i> প্রিন্ট করুন
                </button>
                <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/orders'}
                >
                    <i className="bi bi-list-ul me-1"></i> আমার অর্ডার দেখুন
                </button>
            </div>
        </div>
    );

    const renderOrderSummary = () => (
        <div className="card mb-4">
            <div className="card-header bg-light">
                <h5 className="mb-0">অর্ডার সুমারি</h5>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6">
                        <p><strong>অর্ডার নং:</strong> #{order.id}</p>
                        <p><strong>অর্ডার তারিখ:</strong> {new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
                        <p><strong>ডেলিভারি ঠিকানা:</strong> {order.shipping_address}</p>
                    </div>
                    <div className="col-md-6">
                        <p><strong>পণ্যের মূল্য:</strong> ৳{order.subtotal || order.total_price}</p>
                        <p><strong>ডেলিভারি চার্জ:</strong> ৳{order.delivery_charge || 60}</p>
                        <p><strong>মোট টাকা:</strong> <span className="fs-5 text-primary fw-bold">৳{order.total_price}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!order) {
        return (
            <div className="alert alert-danger">
                <h4>অর্ডার তথ্য পাওয়া যায়নি</h4>
                <p>দয়া করে আবার অর্ডার তৈরি করুন অথবা হোমপেজে ফিরে যান।</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {renderOrderSummary()}
            
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">পেমেন্ট প্রসেস</h4>
                </div>
                <div className="card-body">
                    {/* Progress Steps */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className={`text-center ${step >= 1 ? 'text-primary' : 'text-muted'}`}>
                                <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step >= 1 ? 'bg-primary text-white' : 'bg-light'}`}
                                     style={{ width: '40px', height: '40px' }}>
                                    ১
                                </div>
                                <div className="mt-1 small">পেমেন্ট শুরু</div>
                            </div>
                            <div className={`flex-grow-1 border-top ${step >= 2 ? 'border-primary' : 'border-light'}`}></div>
                            <div className={`text-center ${step >= 2 ? 'text-primary' : 'text-muted'}`}>
                                <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step >= 2 ? 'bg-primary text-white' : 'bg-light'}`}
                                     style={{ width: '40px', height: '40px' }}>
                                    ২
                                </div>
                                <div className="mt-1 small">পেমেন্ট করুন</div>
                            </div>
                            <div className={`flex-grow-1 border-top ${step >= 3 ? 'border-primary' : 'border-light'}`}></div>
                            <div className={`text-center ${step >= 3 ? 'text-primary' : 'text-muted'}`}>
                                <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step >= 3 ? 'bg-primary text-white' : 'bg-light'}`}
                                     style={{ width: '40px', height: '40px' }}>
                                    ৩
                                </div>
                                <div className="mt-1 small">সম্পূর্ণ</div>
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    {/* Help Section */}
                    {step !== 3 && (
                        <div className="mt-4 pt-3 border-top">
                            <div className="accordion" id="paymentHelp">
                                <div className="accordion-item">
                                    <h2 className="accordion-header">
                                        <button className="accordion-button collapsed" type="button" 
                                                data-bs-toggle="collapse" data-bs-target="#helpContent">
                                            <i className="bi bi-question-circle me-2"></i>
                                            সাহায্য প্রয়োজন?
                                        </button>
                                    </h2>
                                    <div id="helpContent" className="accordion-collapse collapse">
                                        <div className="accordion-body">
                                            <p><strong>পেমেন্ট সমস্যা?</strong></p>
                                            <ul>
                                                <li>নিশ্চিত করুন আপনার মোবাইল নেটওয়ার্ক ভাল আছে</li>
                                                <li>আপনার {paymentInstructions[paymentMethod].name} অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স আছে</li>
                                                <li>ট্রাঞ্জাকশন ID সঠিক ভাবে লিখেছেন</li>
                                                <li>প্রয়োজনে হেল্পলাইন: 09678-123456 (সকাল ৯টা - রাত ১০টা)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Payment;