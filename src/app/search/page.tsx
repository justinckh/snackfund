import { SearchView } from "@/components/search-view";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Search Snacks</h1>
        <p className="text-muted-foreground mt-1">
          Search over 3 million products from the OpenFoodFacts database.
        </p>
      </div>
      <SearchView />
    </div>
  );
}
