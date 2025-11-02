from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()

class Translation(models.Model):
    LEVEL_CHOICES = [(lvl, lvl) for lvl in ["A1", "A2", "B1", "B2"]]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="translations")
    input_text = models.TextField(max_length=500)
    output_text = models.TextField()
    level = models.CharField(max_length=2, choices=LEVEL_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class UserLoginLog(models.Model):
    """Stores each user login attempt (success or failure)."""

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "User Login Log"
        verbose_name_plural = "User Login Logs"

    def __str__(self):
        status = "Success" if self.success else "Failed"
        return f"{self.user or 'Unknown user'} – {status} @ {self.timestamp:%Y-%m-%d %H:%M:%S}"