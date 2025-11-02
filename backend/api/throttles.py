from rest_framework.throttling import UserRateThrottle as Base

class UserRateThrottle(Base):
    scope = "user"