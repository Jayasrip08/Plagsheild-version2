from django.conf import settings
from django.db import models


class SupportTicket(models.Model):
    CATEGORY_CHOICES = (
        ('general', 'General Query'),
        ('payment', 'Payment Issue'),
        ('submission', 'Paper / Submission Issue'),
        ('report', 'Similarity Report Issue'),
    )
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_review', 'In review'),
        ('resolved', 'Resolved'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_tickets',
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    topic = models.CharField(max_length=160)
    message = models.TextField()
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        related_name='support_tickets',
        null=True,
        blank=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_category_display()} · {self.topic} (#{self.id})'
