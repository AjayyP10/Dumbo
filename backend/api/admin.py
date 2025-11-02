from django.contrib import admin
from .models import Translation, UserLoginLog

@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "input_text", "output_text", "level", "created_at")
    search_fields = ("user__username", "input_text", "output_text")
    list_filter = ("level", "created_at")
    readonly_fields = ("created_at",)

@admin.register(UserLoginLog)
class UserLoginLogAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "timestamp", "ip_address", "success")
    search_fields = ("user__username", "ip_address", "user_agent")
    list_filter = ("success", "timestamp")
    readonly_fields = ("timestamp",)