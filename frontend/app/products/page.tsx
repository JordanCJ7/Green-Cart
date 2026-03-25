import { Suspense } from "react";
import { ProductsClient } from "./products-client";

function ProductsLoading() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <p>Loading products...</p>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsClient />
    </Suspense>
  );
}
