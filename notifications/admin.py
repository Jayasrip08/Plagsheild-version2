from django.contrib import admin
from .models import SupportMessage, SupportTicket


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 0
    readonly_fields = ('sender', 'sender_role', 'body', 'created_at')
    can_delete = False


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'topic', 'user', 'status', 'last_message_at', 'created_at')
    list_filter = ('category', 'status', 'created_at')
    search_fields = ('topic', 'message', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at', 'last_message_at')
    inlines = [SupportMessageInline]


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'sender_role', 'sender', 'created_at')
    list_filter = ('sender_role', 'created_at')
    search_fields = ('body', 'ticket__topic', 'sender__username')
    readonly_fields = ('created_at',)
