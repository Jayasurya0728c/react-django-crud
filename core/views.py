from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from rest_framework.exceptions import ValidationError


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def create(self, request, *args, **kwargs):
        if not request.data.get('name'):
            raise ValidationError('Name is Required')
        return  super().create(request,*args,**kwargs)
