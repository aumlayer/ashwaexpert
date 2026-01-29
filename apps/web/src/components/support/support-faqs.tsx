"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, Input } from "@/components/ui";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
};

export function SupportFaqs({ faqs }: { faqs: FAQItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => {
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
      );
    });
  }, [faqs, query]);

  return (
    <div>
      <div className="mt-8 max-w-xl">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-foreground-muted" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs"
            className="bg-surface pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10">
          <Card>
            <CardContent className="pt-6">
              <p className="text-body font-semibold text-foreground">No results found</p>
              <p className="mt-2 text-body text-foreground-muted">
                Try a different keyword (e.g., installation, filters, billing).
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((faq) => (
            <Card key={faq.id}>
              <CardContent className="pt-6">
                <p className="text-body font-semibold text-foreground">{faq.question}</p>
                <p className="mt-2 text-body text-foreground-muted">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
