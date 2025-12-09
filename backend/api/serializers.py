from rest_framework import serializers
from .models import Category, Product, Order, OrderItem, Payment

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ProductSerializer(serializers.ModelSerializer):
    # For reading - shows category details
    category = CategorySerializer(read_only=True)
    
    # For writing - accepts category ID
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=True,
        help_text="Category ID (required)"
    )
    
    # Custom image URL field
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'slug', 
            'category', 
            'category_id', 
            'image', 
            'image_url',
            'price', 
            'description', 
            'stock', 
            'available',
            'featured',  # ✅ নতুন ফিল্ড যোগ করুন
            'created', 
            'updated'
        ]
        read_only_fields = ['created', 'updated', 'image_url']
        extra_kwargs = {
            'slug': {'required': False},
            'image': {'required': False},
        }
    
    def get_image_url(self, obj):
        """Return full URL for image"""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 
            'user', 
            'name', 
            'email', 
            'phone', 
            'address', 
            'total_price', 
            'created', 
            'paid', 
            'items'
        ]
        read_only_fields = ['created', 'total_price']


class PaymentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        source='order',
        write_only=True
    )
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_id', 'transaction_id', 
            'amount', 'payment_method', 'status',
            'mobile_number', 'created', 'updated'
        ]
        read_only_fields = ['transaction_id', 'created', 'updated']