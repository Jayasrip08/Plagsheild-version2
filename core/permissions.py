from rest_framework import permissions

class IsAuthenticatedOrOptions(permissions.BasePermission):
    """
    Allows unauthenticated OPTIONS requests so CORS preflight checks succeed,
    while requiring authentication for all other HTTP methods (GET, POST, PUT, DELETE, etc.).
    """
    def has_permission(self, request, view):
        if request.method == 'OPTIONS':
            return True
        return bool(request.user and request.user.is_authenticated)
