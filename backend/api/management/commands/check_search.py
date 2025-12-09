# emarket/backend/api/management/commands/check_search.py

from django.core.management.base import BaseCommand
from api.models import Product


class Command(BaseCommand):
    help = 'Check search vector status'
    
    def handle(self, *args, **options):
        total = Product.objects.count()
        with_vectors = Product.objects.filter(search_vector__isnull=False).count()
        without_vectors = Product.objects.filter(search_vector__isnull=True).count()
        
        self.stdout.write('🔍 সার্চ ভেক্টর স্ট্যাটাস রিপোর্ট:')
        self.stdout.write('=' * 50)
        self.stdout.write(f'📊 মোট পণ্য: {total}')
        self.stdout.write(f'✅ সার্চ ভেক্টর আছে: {with_vectors}')
        self.stdout.write(f'❌ সার্চ ভেক্টর নেই: {without_vectors}')
        
        if without_vectors > 0:
            self.stdout.write(
                self.style.WARNING(
                    f'\n⚠️ {without_vectors} টি পণ্যের সার্চ ভেক্টর নেই। '
                    'আপডেট করতে: python manage.py update_search_vectors'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('\n🎉 সব পণ্যের সার্চ ভেক্টর আপডেটেড!')
            )