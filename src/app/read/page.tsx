import { redirect } from "next/navigation";
import NewsPage from "@/app/page";

export default function ReadLaterPage() {
  // We use the same client component but pre-filter to unread
  return <NewsPage />;
}