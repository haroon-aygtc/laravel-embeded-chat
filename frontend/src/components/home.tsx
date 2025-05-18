import React, { useEffect, useState, useRef } from "react";
import Header from "./layout/Header";
import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import EmbedOptionsSection from "./sections/EmbedOptionsSection";
import CTASection from "./sections/CTASection";
import Footer from "./layout/Footer";
import ChatWidgetWithConfig from "@/components/chat/ChatWidgetWithConfig";
import { widgetConfigService } from "@/services/widgetConfigService";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (!fetchAttempted.current) {
      fetchAttempted.current = true;
      fetchWidgetConfig();
    }
  }, []);

  const fetchWidgetConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the hardcoded widget config from EmbedOptionsSection instead of API call
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
    } catch (error) {
      console.error("Error setting widget config:", error);
      setError("An unexpected error occurred");
      // We'll use the default config defined in state instead
    } finally {
      setLoading(false);
    }
  };

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
            initialState: widgetConfig.initiallyOpen ? 'open' : 'closed'
          }}
          embedded={true}
        />
      )}
    </div>
  );
};

export default Home;
