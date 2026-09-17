import NewsPage from "@/app/page";

export default function FavoritesPage() {
  return <NewsPage initialFilters={{ isSaved: true }} />;
}