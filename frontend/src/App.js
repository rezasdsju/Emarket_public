import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import CategoryProducts from './components/CategoryProducts';
import SearchResults from './components/SearchResults'; // ✅ নতুন লাইন যোগ হয়েছে

function App() {
    const [cartItems, setCartItems] = useState([]);
    
    // localStorage থেকে কার্ট লোড
    useEffect(() => {
        const savedCart = localStorage.getItem('ghorerbazar_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
                setCartItems([]);
            }
        }
    }, []);
    
    // localStorage এ কার্ট সেভ
    useEffect(() => {
        try {
            localStorage.setItem('ghorerbazar_cart', JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }, [cartItems]);
    
    const addToCart = (product, quantity = 1) => {
        // পণ্য ভ্যালিডেশন
        if (!product || !product.id) {
            console.error('Invalid product data');
            return;
        }
        
        const existingItem = cartItems.find(item => item.id === product.id);
        
        if (existingItem) {
            setCartItems(cartItems.map(item =>
                item.id === product.id
                    ? { 
                        ...item, 
                        quantity: item.quantity + quantity,
                        price: parseFloat(product.price) // পুনরায় price সেট করা
                    }
                    : item
            ));
        } else {
            // নতুন আইটেম যোগ করার সময় সব তথ্য ঠিকমত রাখা
            const newItem = {
                id: product.id,
                name: product.name || 'Unknown Product',
                price: parseFloat(product.price) || 0,
                image: product.image_url || 
                      (product.image ? `https://organic.satbeta.top${product.image}` : 
                      'https://via.placeholder.com/300x200?text=No+Image'),
                quantity: Math.max(1, quantity),
                product: product // সম্পূর্ণ পণ্য ডেটা সেভ করা (অপশনাল)
            };
            
            setCartItems([...cartItems, newItem]);
        }
    };
    
    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter(item => item.id !== productId));
    };
    
    const updateQuantity = (productId, quantity) => {
        setCartItems(cartItems.map(item =>
            item.id === productId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
        ));
    };
    
    const clearCart = () => {
        setCartItems([]);
        // localStorage থেকেও মুছে ফেলা
        localStorage.removeItem('ghorerbazar_cart');
    };
    
    const cartItemsCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    
    return (
        <Router>
            <div className="App">
                <Navbar cartItemsCount={cartItemsCount} />
                
                {/* Main content with padding for fixed navbar */}
                <div className="pt-5">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route 
                            path="/product/:id" 
                            element={
                                <ProductDetail 
                                    addToCart={addToCart} 
                                />
                            } 
                        />
                        <Route 
                            path="/cart" 
                            element={
                                <Cart 
                                    cartItems={cartItems}
                                    removeFromCart={removeFromCart}
                                    updateQuantity={updateQuantity}
                                    clearCart={clearCart}
                                />
                            } 
                        />
                        <Route path="/category/:slug" element={<CategoryProducts />} />
                        
                        {/* ✅ নতুন সার্চ রেজাল্টস রাউট যোগ হয়েছে */}
                        <Route path="/search" element={<SearchResults />} />
                        
                        {/* 404 Page */}
                        <Route 
                            path="*" 
                            element={
                                <div className="container mt-5 text-center">
                                    <h1>404 - পৃষ্ঠা পাওয়া যায়নি</h1>
                                    <p>আপনার চাওয়া পৃষ্ঠাটি খুঁজে পাওয়া যায়নি।</p>
                                    <a href="/" className="btn btn-primary mt-3">হোমপেজে ফিরে যান</a>
                                </div>
                            } 
                        />
                    </Routes>
                </div>
                
                {/* Footer */}
                <footer className="bg-dark text-white mt-5 py-4">
                    <div className="container">
                        <div className="row">
                            <div className="col-md-4">
                                <h5>অর্গানিক বাজার</h5>
                                <p>প্রাকৃতিক ও স্বাস্থ্যকর খাবার সরবরাহ করে।</p>
                                <div className="d-flex gap-2">
                                    <span className="badge bg-primary">পণ্য: ১০০+</span>
                                    <span className="badge bg-success">গ্রাহক: ৫০০+</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <h5>যোগাযোগ</h5>
                                <p className="mb-1">
                                    <i className="bi bi-envelope me-2"></i>
                                    support@organicbazar.com
                                </p>
                                <p className="mb-1">
                                    <i className="bi bi-telephone me-2"></i>
                                    ০১৭২২২৯২৬০৩
                                </p>
                                <p className="mb-1">
                                    <i className="bi bi-geo-alt me-2"></i>
                                    সাভার, ঢাকা, বাংলাদেশ
                                </p>
                            </div>
                            <div className="col-md-4">
                                <h5>গুরুত্বপূর্ণ লিংক</h5>
                                <ul className="list-unstyled">
                                    <li className="mb-1">
                                        <a href="#privacy" className="text-white text-decoration-none">
                                            <i className="bi bi-shield-check me-1"></i>
                                            প্রাইভেসি পলিসি
                                        </a>
                                    </li>
                                    <li className="mb-1">
                                        <a href="#terms" className="text-white text-decoration-none">
                                            <i className="bi bi-file-text me-1"></i>
                                            টার্মস অ্যান্ড কন্ডিশন
                                        </a>
                                    </li>
                                    <li className="mb-1">
                                        <a href="#return" className="text-white text-decoration-none">
                                            <i className="bi bi-arrow-return-left me-1"></i>
                                            রিটার্ন পলিসি
                                        </a>
                                    </li>
                                    <li className="mb-1">
                                        <a href="#shipping" className="text-white text-decoration-none">
                                            <i className="bi bi-truck me-1"></i>
                                            শিপিং পলিসি
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <hr className="bg-light my-3" />
                        
                        {/* Payment Methods */}
                        <div className="row">
                            <div className="col-12">
                                <h6 className="text-center mb-3">সাপোর্টেড পেমেন্ট মেথড</h6>
                                <div className="d-flex justify-content-center gap-3">
                                    <div className="bg-white p-2 rounded">
                                        <span className="text-dark fw-bold">bKash</span>
                                    </div>
                                    <div className="bg-white p-2 rounded">
                                        <span className="text-dark fw-bold">Rocket</span>
                                    </div>
                                    <div className="bg-white p-2 rounded">
                                        <span className="text-dark fw-bold">Nagad</span>
                                    </div>
                                    <div className="bg-white p-2 rounded">
                                        <span className="text-dark fw-bold">Card</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <hr className="bg-light my-3" />
                        
                        <p className="text-center mb-0">
                            &copy; {new Date().getFullYear()} অর্গানিক বাজার। সকল স্বত্ব সংরক্ষিত।
                        </p>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

export default App;