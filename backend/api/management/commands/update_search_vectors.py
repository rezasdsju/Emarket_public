from django.core.management.base import BaseCommand
from django.contrib.postgres.search import SearchVector
from django.db.models import F, Value
from django.db import connection
from api.models import Product


class Command(BaseCommand):
    help = 'Update search vectors for all products'
    
    def handle(self, *args, **options):
        self.stdout.write('🔄 সার্চ ভেক্টর আপডেট শুরু হচ্ছে...')
        
        total = Product.objects.count()
        self.stdout.write(f'📊 মোট পণ্য: {total}')
        
        if total == 0:
            self.stdout.write(self.style.WARNING('⚠️ কোনো পণ্য পাওয়া যায়নি'))
            return
        
        try:
            # Method 1: Direct SQL (most reliable)
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE api_product p
                    SET search_vector = 
                        setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
                        setweight(to_tsvector('english', coalesce(p.description, '')), 'B') ||
                        setweight(to_tsvector('english', coalesce(c.name, '')), 'C')
                    FROM api_category c
                    WHERE p.category_id = c.id
                """)
            
            self.stdout.write(self.style.SUCCESS(
                f'✅ {total} টি পণ্যের সার্চ ভেক্টর আপডেট হয়েছে (Direct SQL)'
            ))
            
        except Exception as e:
            self.stdout.write(self.style.WARNING(
                f'⚠️ Direct SQL failed: {str(e)[:100]}'
            ))
            
            # Method 2: Loop through each product
            try:
                updated = 0
                for product in Product.objects.select_related('category').all():
                    # Create search text
                    search_text = f"{product.name} {product.description}"
                    if product.category:
                        search_text += f" {product.category.name}"
                    
                    # Update using Django ORM (simpler)
                    Product.objects.filter(pk=product.pk).update(
                        search_vector=SearchVector(
                            Value(product.name), 
                            Value(product.description),
                            Value(product.category.name if product.category else '')
                        )
                    )
                    updated += 1
                
                self.stdout.write(self.style.SUCCESS(
                    f'✅ {updated} টি পণ্যের সার্চ ভেক্টর আপডেট হয়েছে (Loop method)'
                ))
                
            except Exception as e2:
                self.stdout.write(self.style.ERROR(
                    f'❌ সার্চ ভেক্টর আপডেট ব্যর্থ: {str(e2)[:100]}'
                ))
                self.stdout.write(
                    self.style.WARNING(
                        '⚠️ Fallback: Using simple search without vectors'
                    )
                )