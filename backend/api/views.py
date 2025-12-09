# api/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db import models
import uuid

from .models import Category, Product, Order, OrderItem, Payment
from .serializers import (
    CategorySerializer, 
    ProductSerializer, 
    OrderSerializer, 
    OrderItemSerializer,
    PaymentSerializer
)

# ============================ Category ViewSet ============================
class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for categories
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'


# ============================ Product ViewSet ============================
class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for products
    """
    queryset = Product.objects.filter(available=True)
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'available', 'featured']  # ✅ featured যোগ করুন
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created', 'name']
    ordering = ['-created']
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_context(self):
        """Add request to serializer context for image URL"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """
        Get products by category slug
        Example: /api/products/by_category/?category_slug=electronics
        """
        category_slug = request.query_params.get('category_slug')
        if not category_slug:
            return Response(
                {"error": "category_slug parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        category = get_object_or_404(Category, slug=category_slug)
        products = Product.objects.filter(category=category, available=True)
        
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Get featured products
        """
        featured_products = Product.objects.filter(available=True, featured=True).order_by('-created')[:8]
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)


# ============================ Order ViewSet ============================
class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for orders
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def perform_create(self, serializer):
        """Calculate total price before saving"""
        order = serializer.save()
        
        # Calculate total price from items
        total = 0
        items_data = self.request.data.get('items', [])
        
        for item_data in items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity', 1)
            
            product = get_object_or_404(Product, id=product_id)
            price = product.price
            
            OrderItem.objects.create(
                order=order,
                product=product,
                price=price,
                quantity=quantity
            )
            
            total += price * quantity
            
            # Update product stock
            if product.stock >= quantity:
                product.stock -= quantity
                if product.stock == 0:
                    product.available = False
                product.save()
        
        order.total_price = total
        order.save()


# ============================ OrderItem ViewSet ============================
class OrderItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for order items
    """
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer


# ============================ Payment ViewSet ============================
class PaymentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for payments
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def perform_create(self, serializer):
        """Create payment with unique transaction ID"""
        # Unique transaction ID তৈরি
        transaction_id = f"TXN{str(uuid.uuid4())[:8].upper()}"
        
        payment = serializer.save(
            transaction_id=transaction_id,
            status='pending'
        )
        
        # Log payment creation
        print(f"Payment created: {transaction_id} for Order #{payment.order.id}")
        
        # এখানে bKash/Rocket API কল করতে হবে (পরে যোগ করব)
        # payment.payment_method অনুযায়ী আলাদা API কল হবে


# ============================ SEARCH VIEWS ============================
@api_view(['GET'])
def search_products(request):
    """
    উন্নত সার্চ ফিচার - ফুল-টেক্সট সার্চ
    """
    query = request.GET.get('q', '').strip()
    category_slug = request.GET.get('category', None)
    min_price = request.GET.get('min_price', None)
    max_price = request.GET.get('max_price', None)
    
    if not query:
        return Response({
            'success': False,
            'error': 'সার্চ ক্যোয়ারী প্রয়োজন'
        }, status=400)
    
    # সার্চ ক্যোয়ারী প্রসেসিং
    search_terms = query.split()
    
    # প্রোডাক্ট কুয়েরি
    products_qs = Product.objects.filter(available=True)
    
    # ক্যাটাগরি ফিল্টার
    if category_slug:
        try:
            category = Category.objects.get(slug=category_slug)
            products_qs = products_qs.filter(category=category)
        except Category.DoesNotExist:
            pass
    
    # প্রাইস ফিল্টার
    if min_price:
        try:
            products_qs = products_qs.filter(price__gte=float(min_price))
        except:
            pass
    
    if max_price:
        try:
            products_qs = products_qs.filter(price__lte=float(max_price))
        except:
            pass
    
    # মাল্টিপল ফিল্ডে সার্চ
    q_objects = Q()
    
    for term in search_terms:
        if len(term) >= 2:  # অন্তত ২ অক্ষরের শব্দ
            q_objects |= (
                Q(name__icontains=term) |
                Q(description__icontains=term) |
                Q(category__name__icontains=term)
            )
    
    # যদি কোনো টার্ম না মেলে, তাহলে সম্পূর্ণ ক্যোয়ারী দিয়ে সার্চ
    if not q_objects:
        q_objects = (
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        )
    
    products = products_qs.filter(q_objects).distinct()
    
    # ✅ রিলেভেন্স স্কোরিং ফাংশন - fixed
    def calculate_relevance(product, query):
        score = 0
        
        # নামে এক্সাক্ট ম্যাচ
        if query.lower() in product.name.lower():
            score += 100
        
        # নামে পার্শিয়াল ম্যাচ
        for term in search_terms:
            if term.lower() in product.name.lower():
                score += 50
        
        # ডেসক্রিপশনে ম্যাচ
        for term in search_terms:
            if term.lower() in (product.description or '').lower():
                score += 20
        
        # ক্যাটাগরিতে ম্যাচ
        for term in search_terms:
            if term.lower() in (product.category.name or '').lower():
                score += 30
        
        # জনপ্রিয় পণ্যের বোনাস - ✅ hasattr চেক যোগ করুন
        if hasattr(product, 'featured') and product.featured:
            score += 10
        
        # স্টক থাকলে বোনাস
        if product.stock > 0:
            score += 5
        
        return score
    
    # প্রোডাক্ট লিস্ট তৈরি
    product_list = []
    for product in products:
        try:
            serializer = ProductSerializer(product, context={'request': request})
            product_data = serializer.data
            product_data['relevance_score'] = calculate_relevance(product, query)
            product_list.append(product_data)
        except Exception as e:
            # লগ করুন কিন্তু প্রোগ্রাম ক্রাশ করবেন না
            print(f"Error serializing product {product.id}: {e}")
            continue
    
    # রিলেভেন্স অনুসারে সর্টিং
    product_list.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    # পেজিনেশন
    page = request.GET.get('page', 1)
    try:
        page = int(page)
    except:
        page = 1
    
    items_per_page = 20
    total_items = len(product_list)
    total_pages = (total_items + items_per_page - 1) // items_per_page
    
    start_index = (page - 1) * items_per_page
    end_index = min(start_index + items_per_page, total_items)
    
    paginated_products = product_list[start_index:end_index]
    
    return Response({
        'success': True,
        'query': query,
        'total_results': total_items,
        'total_pages': total_pages,
        'current_page': page,
        'products': paginated_products,
        'filters': {
            'category': category_slug,
            'min_price': min_price,
            'max_price': max_price
        }
    })


@api_view(['GET'])
def autocomplete_suggestions(request):
    """
    অটোকমপ্লিট সুজেশন এন্ডপয়েন্ট
    """
    query = request.GET.get('q', '').strip().lower()
    
    if len(query) < 2:
        return Response({'suggestions': []})
    
    # পণ্যের নাম থেকে সুজেশন
    product_suggestions = Product.objects.filter(
        name__icontains=query,
        available=True
    ).values('name', 'slug', 'id')[:10]
    
    # ক্যাটাগরি থেকে সুজেশন
    category_suggestions = Category.objects.filter(
        name__icontains=query
    ).values('name', 'slug', 'id')[:5]
    
    # ইউনিক নাম সংগ্রহ
    suggestions = []
    seen_names = set()
    
    # পণ্য সুজেশন
    for product in product_suggestions:
        name = product['name']
        if name not in seen_names:
            suggestions.append({
                'type': 'product',
                'name': name,
                'slug': product['slug'],
                'id': product['id'],
                'url': f'/product/{product["id"]}'
            })
            seen_names.add(name)
    
    # ক্যাটাগরি সুজেশন
    for category in category_suggestions:
        name = category['name']
        if name not in seen_names:
            suggestions.append({
                'type': 'category',
                'name': name,
                'slug': category['slug'],
                'id': category['id'],
                'url': f'/category/{category["slug"]}'
            })
            seen_names.add(name)
    
    # জনপ্রিয় সার্চ টার্মস (স্ট্যাটিক বা ডাইনামিক)
    popular_searches = [
        'খেজুর', 'চেরি ফল', 'কাট বাদাম', 'দেশি বাদাম', 'মধু', 
        'কিচমিচ', 'আখরোট', 'হানি নাট'
    ]
    
    for term in popular_searches:
        if query in term.lower() and term not in seen_names:
            suggestions.append({
                'type': 'popular',
                'name': term,
                'slug': term.lower().replace(' ', '-'),
                'url': f'/search?q={term}'
            })
            seen_names.add(term)
    
    return Response({
        'query': query,
        'suggestions': suggestions[:15]  # সর্বোচ্চ ১৫টি
    })


@api_view(['GET'])
def search_statistics(request):
    """
    সার্চ স্ট্যাটিস্টিক্স এবং ট্রেন্ডিং প্রোডাক্টস
    """
    # ট্রেন্ডিং পণ্য (সর্বশিক ক্রয়কৃত/ভিউকৃত)
    trending_products = Product.objects.filter(
        available=True
    ).order_by('-created')[:10]
    
    # জনপ্রিয় ক্যাটাগরি
    popular_categories = Category.objects.annotate(
        product_count=models.Count('products')
    ).order_by('-product_count')[:8]
    
    trending_serializer = ProductSerializer(trending_products, many=True, context={'request': request})
    category_serializer = CategorySerializer(popular_categories, many=True)
    
    return Response({
        'trending_products': trending_serializer.data,
        'popular_categories': category_serializer.data,
        'popular_searches': [
            {'term': 'আজওয়া খেজুর', 'count': 125},
            {'term': 'পাহাড়ি মধু', 'count': 98},
            {'term': 'কিচমিচ', 'count': 76},
            {'term': 'আখরোট', 'count': 65},
            {'term': 'চেরি ফল', 'count': 54},
        ]
    })