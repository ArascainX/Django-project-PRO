from django.urls import path, include
from .routers import SlashOptionalRouter
from .views.identification_views import SalesByIcoView, PurchasesByIcoView
from .views.invoice_views import InvoiceViewSet
from .views.person_views import PersonViewSet

router = SlashOptionalRouter()
router.register(r'persons', PersonViewSet)
router.register(r'invoices', InvoiceViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/identification/<str:ico>/sales/', SalesByIcoView.as_view(), name='sales-by-ico'),
    path('api/identification/<str:ico>/purchases/', PurchasesByIcoView.as_view(), name='purchases-by-ico'),
]
