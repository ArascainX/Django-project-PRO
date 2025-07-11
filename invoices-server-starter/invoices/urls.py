from django.urls import path, include

from .views.invoice_views import mark_invoice_paid
from .routers import SlashOptionalRouter
from .views import pdf_views, stripe_views
from .views.identification_views import SalesByIcoView, PurchasesByIcoView
from .views.invoice_views import InvoiceViewSet
from .views.person_views import PersonViewSet
from .views.registration_views import register_user
from .views.user_views import current_user
from .views.stripe_views import (
    stripe_webhook,
    create_checkout_session,
    check_subscription_status,
    subscription_status,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


router = SlashOptionalRouter()
router.register(r'persons', PersonViewSet)
router.register(r'invoices', InvoiceViewSet)

urlpatterns = [
    path('api/', include(router.urls)),

    # 📄 Faktury a PDF
    path('api/invoices/<str:invoice_number>/pdf/', pdf_views.generate_invoice_pdf, name='generate_invoice_pdf'),
    path('api/invoices/<str:invoice_number>/', InvoiceViewSet.as_view({'get': 'retrieve'}), name='invoice-detail'),
    path('api/invoices/<int:pk>/mark-paid/', mark_invoice_paid),

    # 🧾 Identifikace
    path('api/identification/<str:ico>/sales/', SalesByIcoView.as_view(), name='sales-by-ico'),
    path('api/identification/<str:ico>/purchases/', PurchasesByIcoView.as_view(), name='purchases-by-ico'),

    # 💳 Stripe – použij JEN tento endpoint pro create-checkout-session
    path('api/create-checkout-session/', create_checkout_session),
    path('api/stripe/webhook/', stripe_webhook, name='stripe-webhook'),
    path("api/cancel-subscription/", stripe_views.cancel_subscription),
    path("api/renew-subscription/", stripe_views.renew_subscription),

    # 🔐 Autentizace
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ✅ Stav předplatného
    path('api/status/<int:user_id>/', check_subscription_status, name='check_subscription_status'),
    path('api/status', subscription_status, name='subscription_status'),

   # Registrace
    path('api/register/', register_user, name='register'),
    path('api/me/', current_user, name='current_user'),

    # simulace předplatného pro testování
    path("api/simulate-subscription/", stripe_views.simulate_subscription),

]
