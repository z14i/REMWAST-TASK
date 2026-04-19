import { BookingFlow } from "@/components/BookingFlow";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <BookingFlow />
    </main>
  );
}
