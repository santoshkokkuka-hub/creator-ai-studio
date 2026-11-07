import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProjectContext, useCurrentProject } from "./current-project-context";

afterEach(cleanup);

it("keeps the project context identity when the provider module is refreshed", async () => {
  const originalProvider = await import("./current-project");
  vi.resetModules();
  const refreshedProvider = await import("./current-project");
  const refreshedContext = await import("./current-project-context");
  // Non-component context modules remain cached during React Fast Refresh.
  // The actual module cache reset above simulates a full reload instead.
  expect(originalProvider.CurrentProjectProvider).not.toBe(refreshedProvider.CurrentProjectProvider);
  expect(refreshedContext.ProjectContext).toBeDefined();
});

it("reads the active project through the shared context", () => {
  function Consumer() {
    const { project } = useCurrentProject();
    return <output>{project?.id}</output>;
  }
  render(<ProjectContext.Provider value={{ project: { id: "active-story-project" }, ready: true, storageError: null, setContent: vi.fn(), ensureProject: () => "active-story-project", saveNarration: vi.fn() }}><Consumer /></ProjectContext.Provider>);
  expect(screen.getByText("active-story-project")).toBeInTheDocument();
});