from django.contrib.auth import get_user_model
from django.db import models

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