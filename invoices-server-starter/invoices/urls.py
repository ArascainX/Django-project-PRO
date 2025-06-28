from django.urls import path, include
from .routers import SlashOptionalRouter
from .views import pdf_views
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
    path('api/invoices/<str:invoice_number>/pdf/', pdf_views.generate_invoice_pdf, name='generate_invoice_pdf'),
    path('api/invoices/<str:invoice_number>/', InvoiceViewSet.as_view({'get': 'retrieve'}), name='invoice-detail'),
]