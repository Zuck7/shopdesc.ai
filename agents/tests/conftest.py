import pytest


@pytest.fixture
def sample_product():
    return {
        "name": "Organic Cotton T-Shirt",
        "category": "Clothing",
        "features": ["100% organic cotton", "Breathable", "Machine washable"],
        "price": 29.99,
        "currency": "USD",
        "brand": "EcoWear",
    }
