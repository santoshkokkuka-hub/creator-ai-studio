import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProjectContext, retainProjectContext, useCurrentProject } from "./current-project-context";

afterEach(cleanup);

it("retains the provider context identity across module refreshes", () => {
  const hotData = {};
  const beforeRefresh = retainProjectContext(hotData);
  const afterRefresh = retainProjectContext(hotData);
  expect(afterRefresh).toBe(beforeRefresh);
  expect(retainProjectContext({})).not.toBe(beforeRefresh);
});

it("reads the active project through the shared context", () => {
  function Consumer() {
    const { project } = useCurrentProject();
    return <output>{project?.id}</output>;
  }
  render(<ProjectContext.Provider value={{ project: { id: "active-story-project" }, ready: true, storageError: null, setContent: vi.fn(), saveScript: vi.fn(), ensureProject: () => "active-story-project", saveNarration: vi.fn() }}><Consumer /></ProjectContext.Provider>);
  expect(screen.getByText("active-story-project")).toBeInTheDocument();
});