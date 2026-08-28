// AfriLaunch AI — API Documentation page (Swagger UI)
'use client';

import { useEffect, useRef } from 'react';

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      if (containerRef.current && (window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          spec: getSpec(),
          dom: containerRef.current,
          presets: [(window as any).SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
          deepLinking: true,
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div ref={containerRef} />
    </div>
  );
}

function getSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'AfriLaunch AI API',
      version: '1.0.0',
      description: 'Plateforme IA tout-en-un pour entrepreneurs africains',
    },
    servers: [{ url: 'https://afrilaunchia.vercel.app' }],
    paths: {
      '/api/auth/register': {
        post: { summary: 'Register', tags: ['Auth'], responses: { '200': { description: 'OK' } } },
      },
      '/api/auth/login': {
        post: { summary: 'Login', tags: ['Auth'], responses: { '200': { description: 'OK' } } },
      },
      '/api/auth/me': {
        get: { summary: 'Get current user', tags: ['Auth'], responses: { '200': { description: 'OK' } } },
      },
      '/api/ai/generate-async': {
        post: { summary: 'Generate content (async)', tags: ['AI'], responses: { '200': { description: 'OK' } } },
        get: { summary: 'Poll job status', tags: ['AI'], responses: { '200': { description: 'OK' } } },
      },
      '/api/ai/voice': {
        post: { summary: 'Text-to-speech', tags: ['AI'], responses: { '200': { description: 'OK' } } },
      },
      '/api/organization': {
        get: { summary: 'Get organization', tags: ['Organization'], responses: { '200': { description: 'OK' } } },
        post: { summary: 'Create organization', tags: ['Organization'], responses: { '200': { description: 'OK' } } },
      },
      '/api/social/connect': {
        post: { summary: 'Connect social account', tags: ['Social'], responses: { '200': { description: 'OK' } } },
      },
      '/api/social/publish': {
        post: { summary: 'Publish content', tags: ['Social'], responses: { '200': { description: 'OK' } } },
      },
      '/api/payment-manual/create': {
        post: { summary: 'Create payment order (FCFA)', tags: ['Payment'], responses: { '200': { description: 'OK' } } },
      },
      '/api/whatsapp-agent/webhook': {
        post: { summary: 'Twilio WhatsApp webhook', tags: ['WhatsApp'], responses: { '200': { description: 'OK' } } },
      },
      '/api/admin/config': {
        get: { summary: 'Get config', tags: ['Admin'], responses: { '200': { description: 'OK' } } },
        put: { summary: 'Update config', tags: ['Admin'], responses: { '200': { description: 'OK' } } },
      },
      '/api/admin/metrics': {
        get: { summary: 'Get metrics', tags: ['Admin'], responses: { '200': { description: 'OK' } } },
      },
    },
  };
}
