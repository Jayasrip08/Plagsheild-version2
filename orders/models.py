from django.db import models
from django.conf import settings

class Order(models.Model):
    STATUS_CHOICES = (
        ('Pending Payment', 'Pending Payment'),
        ('Submitted', 'Submitted'),
        ('Processing', 'Processing'),
        ('Report Ready', 'Report Ready'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )

    document = models.FileField(
        upload_to='documents/'
    )

    report_file = models.FileField(
        upload_to='reports/',
        blank=True,
        null=True
    )

    word_count = models.IntegerField(default=0)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    similarity_score = models.FloatField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='Pending Payment'
    )

    keywords = models.CharField(max_length=500, blank=True, default='')
    paper_title = models.CharField(max_length=500, blank=True, default='')
    paper_type = models.CharField(max_length=80, blank=True, default='')
    subject_area = models.CharField(max_length=80, blank=True, default='')
    purpose = models.CharField(max_length=80, blank=True, default='')

    author_name = models.CharField(max_length=255, blank=True, default='')
    author_email = models.EmailField(blank=True, default='')
    author_institution = models.CharField(max_length=255, blank=True, default='')
    author_country = models.CharField(max_length=100, blank=True, default='')
    co_authors = models.JSONField(default=list, blank=True)

    PACKAGE_CHOICES = (
        ('check', 'Check'),
        ('improve', 'Improve'),
        ('complete', 'Complete'),
    )
    package_tier = models.CharField(
        max_length=20,
        choices=PACKAGE_CHOICES,
        default='check'
    )

    # Express check option
    is_express = models.BooleanField(default=False)

    # Upsell option
    has_editing_suggestions = models.BooleanField(default=False)

    # B2B college metrics
    is_b2b = models.BooleanField(default=False)
    college = models.ForeignKey(
        'colleges.College',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    report_uploaded_at = models.DateTimeField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Order #{self.id} - {self.user.username} - {self.status}"


class PricingConfig(models.Model):
    per_word_rate = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=99.00
    )
    express_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=299.00
    )
    editing_suggestions_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=549.00
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Pricing Config (Check: ₹{self.per_word_rate}, Improve: ₹{self.express_fee}, Complete: ₹{self.editing_suggestions_fee})"