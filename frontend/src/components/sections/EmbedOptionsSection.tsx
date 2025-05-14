import React from "react";
import { Container } from "@/components/ui/container";
import IframeEmbed from "@/components/embed/IframeEmbed";
import ChatWidgetWithConfig from "@/components/chat/ChatWidgetWithConfig";

export default function EmbedOptionsSection() {
  // Create a hardcoded default widget configuration to avoid API calls
  const defaultWidgetConfig = {
    initiallyOpen: false,
    contextMode: "restricted",
    contextName: "Website Assistance",
    title: "Chat Assistant",
    primaryColor: "#4f46e5",
    position: "bottom-right" as const,
    showOnMobile: true,
  };

  return (
    <section id="embed-options" className="py-24 bg-muted/50">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Embed Options</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose how to integrate our AI chat widget with your website or app.
            We offer multiple flexible embedding options.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-bold mb-6">Embed Code</h3>
            <IframeEmbed
              contextRuleId="default"
              title="AI Assistant"
              position="bottom-right"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-6">Widget Preview</h3>
            <div className="bg-card rounded-xl shadow-md p-6 border">
              <p className="mb-6 text-sm text-muted-foreground">
                This is a live preview of your chat widget with the current settings.
                It works offline without API calls by using an embedded configuration.
              </p>
              <div className="relative h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                {/* Using direct configuration instead of fetching from API */}
                <ChatWidgetWithConfig
                  config={defaultWidgetConfig}
                  previewMode={true}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-muted-foreground text-sm">
                    Widget will appear in the selected position
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
