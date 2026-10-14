from locust import HttpUser, task, between


class ShopFlowProductBrowsingUser(HttpUser):
    # Each simulated user waits 1–3 seconds between requests.
    wait_time = between(1, 3)

    @task(5)
    def browse_products(self):
        with self.client.get(
            "/products/",
            name="/products/ - all products",
            catch_response=True,
        ) as response:
            if response.status_code != 200:
                response.failure(f"Unexpected status: {response.status_code}")
            else:
                try:
                    products = response.json()
                    if not isinstance(products, list):
                        response.failure("Expected a list of products")
                except ValueError:
                    response.failure("Response was not valid JSON")

    @task(1)
    def search_products(self):
        self.client.get(
            "/products/",
            params={"search": "Samsung"},
            name="/products/ - search",
        )

    @task(1)
    def filter_products(self):
        self.client.get(
            "/products/",
            params={"category": "Mobiles"},
            name="/products/ - category filter",
        )