import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Scissors className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-6xl font-bold text-teal-600 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
