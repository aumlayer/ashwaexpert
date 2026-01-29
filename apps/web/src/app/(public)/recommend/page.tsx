"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Droplets, Users, Home, Beaker } from "lucide-react";
import { Button, Card, CardContent } from "@/components/ui";
import { track } from "@/utils/analytics";

type QuizStep = "water_source" | "family_size" | "property_type" | "preferences" | "result";

interface QuizAnswers {
  waterSource: string;
  familySize: string;
  propertyType: string;
  preferences: string[];
}

const questions = {
  water_source: {
    title: "What's your primary water source?",
    icon: Droplets,
    options: [
      { id: "municipal", label: "Municipal/Corporation Water", description: "Treated city water supply" },
      { id: "borewell", label: "Borewell/Groundwater", description: "Underground water source" },
      { id: "tanker", label: "Tanker Water", description: "Water delivered by tanker" },
      { id: "mixed", label: "Mixed Sources", description: "Multiple water sources" },
    ],
  },
  family_size: {
    title: "How many people in your household?",
    icon: Users,
    options: [
      { id: "1-2", label: "1-2 People", description: "Small household" },
      { id: "3-4", label: "3-4 People", description: "Medium household" },
      { id: "5-6", label: "5-6 People", description: "Large household" },
      { id: "7+", label: "7+ People", description: "Very large household" },
    ],
  },
  property_type: {
    title: "What type of property do you live in?",
    icon: Home,
    options: [
      { id: "apartment", label: "Apartment", description: "Multi-story building" },
      { id: "independent", label: "Independent House", description: "Villa or bungalow" },
      { id: "office", label: "Office/Commercial", description: "Business premises" },
    ],
  },
  preferences: {
    title: "Any specific preferences?",
    icon: Beaker,
    options: [
      { id: "copper", label: "Copper Infusion", description: "Traditional health benefits" },
      { id: "alkaline", label: "Alkaline Water", description: "Higher pH for wellness" },
      { id: "mineral", label: "Mineral Retention", description: "Keep essential minerals" },
      { id: "none", label: "No Preference", description: "Just clean water" },
    ],
  },
};

const recommendations: Record<string, { planId: string; reason: string }> = {
  "municipal-basic": { planId: "basic-ro", reason: "Municipal water typically has lower TDS, making our Basic RO perfect for you." },
  "borewell-advanced": { planId: "advanced-ro-uv", reason: "Borewell water often has higher TDS and bacteria. Our RO+UV system handles both." },
  "tanker-advanced": { planId: "advanced-ro-uv", reason: "Tanker water quality varies. RO+UV ensures consistent purification." },
  "copper-premium": { planId: "premium-copper", reason: "You'll love our Premium Copper plan with copper infusion benefits." },
  "alkaline-alkaline": { planId: "alkaline-pro", reason: "Our Alkaline Pro is perfect for your pH-balanced water needs." },
  "default": { planId: "advanced-ro-uv", reason: "Based on your inputs, our Advanced RO+UV offers the best balance of features." },
};

export default function RecommendPage() {
  const router = useRouter();
  const [step, setStep] = useState<QuizStep>("water_source");
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({
    waterSource: "",
    familySize: "",
    propertyType: "",
    preferences: [],
  });

  const steps: QuizStep[] = ["water_source", "family_size", "property_type", "preferences", "result"];
  const currentIndex = steps.indexOf(step);

  const handleSelect = (value: string) => {
    if (!hasTrackedStart) {
      track("quiz_started", {});
      setHasTrackedStart(true);
    }

    const newAnswers = { ...answers };

    switch (step) {
      case "water_source":
        newAnswers.waterSource = value;
        break;
      case "family_size":
        newAnswers.familySize = value;
        break;
      case "property_type":
        newAnswers.propertyType = value;
        break;
      case "preferences":
        newAnswers.preferences = [value];
        break;
    }

    setAnswers(newAnswers);

    // Auto-advance after selection
    setTimeout(() => {
      if (currentIndex < steps.length - 2) {
        setStep(steps[currentIndex + 1]);
      } else {
        track("quiz_completed", {
          waterSource: newAnswers.waterSource,
          familySize: newAnswers.familySize,
          propertyType: newAnswers.propertyType,
          preferences: newAnswers.preferences.join(","),
        });
        setStep("result");
      }
    }, 300);
  };

  const getRecommendation = () => {
    if (answers.preferences.includes("copper")) {
      return recommendations["copper-premium"];
    }
    if (answers.preferences.includes("alkaline")) {
      return recommendations["alkaline-alkaline"];
    }
    if (answers.waterSource === "municipal") {
      return recommendations["municipal-basic"];
    }
    if (answers.waterSource === "borewell" || answers.waterSource === "tanker") {
      return recommendations["borewell-advanced"];
    }
    return recommendations["default"];
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  if (step === "result") {
    const rec = getRecommendation();
    return (
      <section className="py-18 lg:py-24 bg-surface-2 min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <Droplets className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-h2 font-heading font-bold text-foreground">
              We Found Your Perfect Match!
            </h1>
            <p className="mt-4 text-body-lg text-foreground-muted">
              {rec.reason}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push(`/checkout?plan=${rec.planId}`)}>
                Subscribe to Recommended Plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={() => router.push("/plans")}>
                View All Plans
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentQuestion = questions[step];
  const Icon = currentQuestion.icon;

  return (
    <section className="py-18 lg:py-24 bg-surface-2 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-small text-foreground-muted mb-2">
              <span>Question {currentIndex + 1} of {steps.length - 1}</span>
              <span>{Math.round(((currentIndex + 1) / (steps.length - 1)) * 100)}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-standard"
                style={{ width: `${((currentIndex + 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-h2 font-heading font-bold text-foreground">
              {currentQuestion.title}
            </h1>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option) => (
              <Card
                key={option.id}
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                onClick={() => handleSelect(option.id)}
              >
                <CardContent className="pt-6 text-center">
                  <p className="text-body font-semibold text-foreground">
                    {option.label}
                  </p>
                  <p className="text-small text-foreground-muted mt-1">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Back Button */}
          {currentIndex > 0 && (
            <div className="mt-8 text-center">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
