import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ToolRegistry } from '../src/tool-registry.js';

const mockClient = {
  getConfig: () => ({
    accessToken: 'test',
    baseUrl: 'https://test.leadconnectorhq.com',
    version: '2021-07-28',
    locationId: 'test_location_123',
  }),
  makeRequest: async () => ({ success: true, data: {} }),
};

describe('ToolRegistry GHL_TOOL_ALLOWLIST', () => {
  const previous = process.env.GHL_TOOL_ALLOWLIST;

  beforeEach(() => {
    delete process.env.GHL_TOOL_ALLOWLIST;
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.GHL_TOOL_ALLOWLIST;
    else process.env.GHL_TOOL_ALLOWLIST = previous;
  });

  it('exposes every tool when unset or blank', () => {
    const all = new ToolRegistry(mockClient as any).getToolCount();
    process.env.GHL_TOOL_ALLOWLIST = '  ';
    expect(new ToolRegistry(mockClient as any).getToolCount()).toBe(all);
  });

  it('lists only the allowlisted tools, ignoring whitespace', () => {
    process.env.GHL_TOOL_ALLOWLIST = ' search_contacts , update_contact ,,';
    const registry = new ToolRegistry(mockClient as any);

    expect(registry.getAllToolNames().sort()).toEqual(['search_contacts', 'update_contact']);
    expect(registry.getToolCount()).toBe(2);
  });

  it('refuses to call a tool outside the allowlist', async () => {
    process.env.GHL_TOOL_ALLOWLIST = 'search_contacts';
    const registry = new ToolRegistry(mockClient as any);

    expect(await registry.callTool('delete_contact', { contactId: 'c1' })).toBeUndefined();
    expect(await registry.callTool('send_sms', {})).toBeUndefined();
  });

  it('hides a tool whose name is mistyped instead of exposing another', () => {
    process.env.GHL_TOOL_ALLOWLIST = 'search_contact';
    expect(new ToolRegistry(mockClient as any).getAllToolNames()).toEqual([]);
  });
});
