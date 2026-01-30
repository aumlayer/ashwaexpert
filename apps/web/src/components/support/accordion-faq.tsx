"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, Filter } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/utils/cn";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
};

const categoryLabels: Record<string, string> = {
  all: "All Questions",
  general: "General",
  installation: "Installation",
  service: "Service & Maintenance",
  billing: "Billing & Payments",
};

export function AccordionFaq({ faqs }: { faqs: FAQItem[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(faqs.map((f) => f.category || "general"));
    return ["all", ...Array.from(cats)];
  }, [faqs]);

  const filtered = useMemo(() => {
    let result = faqs;
    
    // Filter by category
    if (activeCategory !== "all") {
      result = result.filter((f) => f.category === activeCategory);
    }
    
    // Filter by search query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }
    
    return result.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [faqs, query, activeCategory]);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="mt-8">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80 lg:w-72 flex-shrink-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-foreground-muted" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="bg-surface pl-10"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto w-full sm:flex-1 sm:w-auto sm:justify-end min-w-0 -mx-1 px-1 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-caption font-medium transition-all duration-200",
                activeCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-2 text-foreground-muted hover:bg-surface hover:text-foreground border border-border"
              )}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="mt-8 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body font-semibold text-foreground">
              No FAQs found
            </p>
            <p className="mt-2 text-body text-foreground-muted">
              Try a different search term or category
            </p>
          </div>
        ) : (
          filtered.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="border border-border rounded-card overflow-hidden bg-surface"
            >
              <button
                onClick={() => toggleExpanded(faq.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-2 transition-colors"
              >
                <span className="text-body font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: expandedId === faq.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-foreground-muted" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0">
                      <div className="pt-2 border-t border-border">
                        <p className="mt-4 text-body text-foreground-muted leading-relaxed">
                          {faq.answer}
                        </p>
                        {faq.category && (
                          <span className="mt-4 inline-block px-3 py-1 bg-primary/10 text-primary text-caption font-medium rounded-full">
                            {categoryLabels[faq.category] || faq.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* Still have questions CTA */}
      <div className="mt-10 p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-card border border-primary/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-h4 font-heading font-bold text-foreground">
              Still have questions?
            </h3>
            <p className="mt-1 text-body text-foreground-muted">
              Our support team is available 24/7 to help you
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="https://wa.me/919876543210?text=Hi%20Ashva%20Experts,%20I%20have%20a%20question"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-white font-semibold rounded-btn hover:bg-primary/90 transition-colors"
            >
              WhatsApp Us
            </a>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-primary text-primary font-semibold rounded-btn hover:bg-primary/5 transition-colors"
            >
              Call Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
