import React, { useEffect, useState, useRef } from "react";
import Header from "./layout/Header";
import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import EmbedOptionsSection from "./sections/EmbedOptionsSection";
import CTASection from "./sections/CTASection";
import Footer from "./layout/Footer";
import ChatWidgetWithConfig from "./chat/ChatWidgetWithConfig";
import logger from "@/utils/logger";

interface WidgetConfig {
  initiallyOpen: boolean;
  contextMode: "restricted" | "open" | "custom";
  contextName: string;
  title: string;
  primaryColor: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showOnMobile?: boolean;
}

const Home = () => {
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({
    initiallyOpen: false,
    contextMode: "restricted",
    contextName: "Website Assistance",
    title: "ChatEmbed Demo",
    primaryColor: "#4f46e5",
    position: "bottom-right",
    showOnMobile: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // Always use hardcoded config for demo purposes
    // No API call needed which avoids potential auth loops
    const defaultConfig: WidgetConfig = {
      initiallyOpen: false,
      contextMode: "restricted",
      contextName: "Website Assistance",
      title: "Chat Assistant",
      primaryColor: "#4f46e5",
      position: "bottom-right",
      showOnMobile: true,
    };

    setWidgetConfig(defaultConfig);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <EmbedOptionsSection />
        <CTASection />
      </main>
      <Footer />

      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-white p-4 rounded-md shadow-lg">
          {error}
        </div>
      )}

      {/* Chat Widget */}
      {!loading && (
        <ChatWidgetWithConfig
          config={{
            titleText: widgetConfig.title,
            primaryColor: widgetConfig.primaryColor,
            position: widgetConfig.position,
            initiallyOpen: widgetConfig.initiallyOpen
          }}
          previewMode={true} // Always use preview mode on home page to avoid API calls
        />
      )}
    </div>
  );
};

export default Home;
