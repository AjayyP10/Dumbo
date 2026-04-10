from django.contrib.auth import get_user_model
from social_django.models import UserSocialAuth

from .models import UserProfile


def associate_user_by_email(backend, strategy, details, user=None, *args, **kwargs):
    """
    Custom pipeline: Associate existing user by email match before creating new.
    Fixes AuthAlreadyAssociated by reusing user with same email.
    Sets UserProfile.display_name from Google 'name' or username fallback.

    Does NOT return early — lets the pipeline continue to associate_user
    which properly sets user.social_user.
    """
    uid = kwargs.get("uid")
    social_uid = uid or details.get("uid")

    if user:
        return None  # Let pipeline continue

    email = details.get("email")
    if email and social_uid:
        email = email.lower().strip()
        User = get_user_model()
        try:
            existing_user = User.objects.get(email=email)
            # Create/associate UserSocialAuth so associate_user step finds it
            UserSocialAuth.objects.get_or_create(
                user=existing_user,
                provider=backend.name,
                uid=social_uid,
                defaults={"extra_data": kwargs.get("extra_data", {})},
            )
            # Set UserProfile.display_name from Google details
            profile, _ = UserProfile.objects.get_or_create(user=existing_user)
            if not profile.display_name:
                display_name = (
                    details.get("fullname")
                    or details.get("name")
                    or details.get("username")
                    or email.split("@")[0]
                )[:150]
                profile.display_name = display_name[:150]
                profile.save()
            # Return user so subsequent pipeline steps use it
            return {"user": existing_user}
        except User.DoesNotExist:
            pass

    return None
