from django.contrib import admin
from invoices.models import Invoice, Person, Subscription

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoiceNumber", "seller", "buyer", "issued", "dueDate", "paid", "hidden")
    list_filter = ("paid", "issued", "dueDate", "hidden")
    search_fields = ("invoiceNumber", "seller__name", "buyer__name", "product")
    actions = ["mark_as_paid", "unhide_invoices"]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(hidden=False, user=request.user)

    @admin.action(description="✅ Označit jako zaplacené")
    def mark_as_paid(self, request, queryset):
        queryset.update(paid=True)

    @admin.action(description="👁️ Zobrazit skryté faktury")
    def unhide_invoices(self, request, queryset):
        queryset.update(hidden=False)


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("name", "identificationNumber", "mail", "city", "hidden")
    list_filter = ("hidden", "country")
    search_fields = ("name", "identificationNumber", "mail")
    actions = ["unhide_persons"]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs if request.user.is_superuser else qs.filter(hidden=False)

    @admin.action(description="👁️ Zobrazit skryté osoby")
    def unhide_persons(self, request, queryset):
        queryset.update(hidden=False)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "active", "cancelled", "current_period_end")
    list_filter = ("active", "cancelled")
    search_fields = ("user__username",)

    def get_queryset(self, request):
        return super().get_queryset(request)
