import {
  FlythroughController,
  type FlythroughMap,
} from "./playback-controller";
import type { FlythroughWaypoint } from "./camera-path";

function createFakeMap() {
  let moveEndHandler: (() => void) | null = null;
  const map: FlythroughMap = {
    flyTo: jest.fn(),
    once: jest.fn((_event, handler) => {
      moveEndHandler = handler;
    }),
    stop: jest.fn(),
    remove: jest.fn(),
  };
  return {
    map,
    triggerMoveEnd: () => moveEndHandler?.(),
  };
}

const WAYPOINTS: FlythroughWaypoint[] = [
  { center: [1, 1], zoom: 10, pitch: 0, bearing: 0, duration: 1000 },
  {
    center: [2, 2],
    zoom: 12,
    pitch: 30,
    bearing: 90,
    duration: 1000,
    hold: 500,
  },
];

// A plain Promise microtask, not setImmediate/setTimeout — jest.useFakeTimers()
// (used below) mocks timers/macrotasks but never microtasks, so this keeps
// working even while fake timers are active.
const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve());

describe("FlythroughController", () => {
  const container = {} as HTMLElement;

  it("reduced motion: skips the flythrough entirely, never instantiates a map", async () => {
    const mapFactory = jest.fn();
    const onComplete = jest.fn();
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: true,
      mapFactory,
      onComplete,
    });

    await controller.play();

    expect(mapFactory).not.toHaveBeenCalled();
    expect(controller.getState()).toBe("skipped");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("plays through all waypoints in order, calling flyTo with the right options", async () => {
    const { map, triggerMoveEnd } = createFakeMap();
    const mapFactory = jest.fn().mockReturnValue(map);
    const onComplete = jest.fn();
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: false,
      mapFactory,
      onComplete,
    });

    const playPromise = controller.play();
    await flushMicrotasks();
    expect(mapFactory).toHaveBeenCalledWith(container);
    expect(controller.getState()).toBe("playing");
    expect(map.flyTo).toHaveBeenNthCalledWith(1, {
      center: [1, 1],
      zoom: 10,
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });

    triggerMoveEnd();
    await flushMicrotasks();
    expect(map.flyTo).toHaveBeenNthCalledWith(2, {
      center: [2, 2],
      zoom: 12,
      pitch: 30,
      bearing: 90,
      duration: 1000,
    });

    triggerMoveEnd();
    await playPromise;

    expect(controller.getState()).toBe("idle");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onWaypointChange with the waypoint and index as each one starts playing", async () => {
    const { map, triggerMoveEnd } = createFakeMap();
    const mapFactory = jest.fn().mockReturnValue(map);
    const onWaypointChange = jest.fn();
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: false,
      mapFactory,
      onWaypointChange,
    });

    const playPromise = controller.play();
    await flushMicrotasks();
    expect(onWaypointChange).toHaveBeenNthCalledWith(1, WAYPOINTS[0], 0);

    triggerMoveEnd();
    await flushMicrotasks();
    expect(onWaypointChange).toHaveBeenNthCalledWith(2, WAYPOINTS[1], 1);

    triggerMoveEnd();
    await playPromise;
    expect(onWaypointChange).toHaveBeenCalledTimes(2);
  });

  it("does not call onWaypointChange when reduced motion skips the flythrough", async () => {
    const onWaypointChange = jest.fn();
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: true,
      mapFactory: jest.fn(),
      onWaypointChange,
    });

    await controller.play();
    expect(onWaypointChange).not.toHaveBeenCalled();
  });

  it("waits the hold duration between a waypoint and the next", async () => {
    jest.useFakeTimers();
    const { map, triggerMoveEnd } = createFakeMap();
    const mapFactory = jest.fn().mockReturnValue(map);
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: false,
      mapFactory,
    });

    const playPromise = controller.play();
    await flushMicrotasks();
    triggerMoveEnd(); // waypoint 0 has no hold
    await flushMicrotasks();
    triggerMoveEnd(); // waypoint 1 arrives, now the 500ms hold should apply
    await flushMicrotasks();

    expect(controller.getState()).toBe("playing");
    jest.advanceTimersByTime(500);
    await playPromise;

    expect(controller.getState()).toBe("idle");
    jest.useRealTimers();
  });

  it("pause() stops the map and aborts the pending waypoint, resuming from the same index", async () => {
    const { map, triggerMoveEnd } = createFakeMap();
    const mapFactory = jest.fn().mockReturnValue(map);
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: false,
      mapFactory,
    });

    const playPromise = controller.play();
    await flushMicrotasks();
    controller.pause();
    await playPromise;

    expect(map.stop).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toBe("paused");
    expect(map.flyTo).toHaveBeenCalledTimes(1);

    // Resuming continues from waypoint 0 (never completed), not waypoint 1.
    const resumePromise = controller.play();
    await flushMicrotasks();
    expect(map.flyTo).toHaveBeenNthCalledWith(2, {
      center: [1, 1],
      zoom: 10,
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });
    triggerMoveEnd(); // waypoint 0 completes
    await flushMicrotasks();
    triggerMoveEnd(); // waypoint 1 completes; its 500ms hold follows in real time
    await resumePromise;
  });

  it("skip() stops playback immediately and calls onComplete", async () => {
    const { map } = createFakeMap();
    const mapFactory = jest.fn().mockReturnValue(map);
    const onComplete = jest.fn();
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: false,
      mapFactory,
      onComplete,
    });

    const playPromise = controller.play();
    await flushMicrotasks();
    controller.skip();
    await playPromise;

    expect(map.stop).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toBe("skipped");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("destroy() removes the map and prevents further playback", async () => {
    const { map } = createFakeMap();
    const mapFactory = jest.fn().mockReturnValue(map);
    const controller = new FlythroughController({
      container,
      waypoints: WAYPOINTS,
      reducedMotion: false,
      mapFactory,
    });

    const playPromise = controller.play();
    await flushMicrotasks();
    controller.destroy();
    await playPromise;

    expect(map.remove).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toBe("destroyed");

    const mapFactoryCallsBefore = mapFactory.mock.calls.length;
    await controller.play();
    expect(controller.getState()).toBe("destroyed");
    expect(mapFactory.mock.calls.length).toBe(mapFactoryCallsBefore);
  });
});
