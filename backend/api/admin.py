from django.contrib import admin
from .models import Category, Product, Order, OrderItem, Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'order', 'amount', 'payment_method', 'status', 'created')
    list_filter = ('status', 'payment_method', 'created')
    search_fields = ('transaction_id', 'order__name', 'mobile_number')
    date_hierarchy = 'created'
    ordering = ('-created',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    raw_id_fields = ('product',)
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'available', 'featured', 'created')  # ✅ featured যোগ করুন
    list_filter = ('available', 'featured', 'created', 'category')  # ✅ featured যোগ করুন
    list_editable = ('price', 'stock', 'available', 'featured')  # ✅ featured যোগ করুন
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')
    raw_id_fields = ('category',)
    date_hierarchy = 'created'
    ordering = ('-created',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'phone', 'total_price', 'paid', 'created')
    list_filter = ('paid', 'created')
    search_fields = ('name', 'email', 'phone', 'address')
    inlines = [OrderItemInline]
    date_hierarchy = 'created'
    ordering = ('-created',)