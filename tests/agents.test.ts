// Tests unitaires — Agents IA
import { describe, it, expect } from 'vitest';
import { AGENTS, getAgentById, getAgentByCommand, routeMessage, getAgentsListText } from '../lib/agents';

describe('AGENTS', () => {
  it('should have 13 agents', () => {
    expect(AGENTS).toHaveLength(13);
  });

  it('each agent should have required fields', () => {
    for (const agent of AGENTS) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.command).toBeTruthy();
      expect(agent.systemPrompt).toBeTruthy();
      expect(agent.systemPrompt.length).toBeGreaterThan(100);
      expect(agent.color).toMatch(/^from-/);
    }
  });

  it('should have unique commands', () => {
    const commands = AGENTS.map((a) => a.command);
    expect(new Set(commands).size).toBe(commands.length);
  });

  it('should have unique IDs', () => {
    const ids = AGENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getAgentById', () => {
  it('should find agent by ID', () => {
    const agent = getAgentById('branding');
    expect(agent).toBeDefined();
    expect(agent?.name).toBe('Branding Agent');
  });

  it('should return undefined for unknown ID', () => {
    expect(getAgentById('unknown')).toBeUndefined();
  });
});

describe('getAgentByCommand', () => {
  it('should find agent by command', () => {
    const agent = getAgentByCommand('content');
    expect(agent).toBeDefined();
    expect(agent?.name).toBe('Content Agent');
  });

  it('should handle command with slash', () => {
    const agent = getAgentByCommand('/seo');
    expect(agent).toBeDefined();
    expect(agent?.name).toBe('SEO Agent');
  });
});

describe('routeMessage', () => {
  it('should route logo query to branding', () => {
    const agent = routeMessage('je veux un logo');
    expect(agent.id).toBe('branding');
  });

  it('should route SEO query to SEO agent', () => {
    const agent = routeMessage('améliorer mon référencement google');
    expect(agent.id).toBe('seo');
  });

  it('should route unknown to growth (default)', () => {
    const agent = routeMessage('xyz random text');
    expect(agent.id).toBe('growth');
  });
});

describe('getAgentsListText', () => {
  it('should contain all 13 agents', () => {
    const text = getAgentsListText();
    expect(text).toContain('13');
    expect(text).toContain('Branding Agent');
    expect(text).toContain('Growth Agent');
  });
});
